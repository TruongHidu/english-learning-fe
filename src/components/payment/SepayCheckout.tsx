import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useSepayPolling } from '../../hooks/useSepayPolling'
import { usePaymentDeadline } from '../../hooks/usePaymentDeadline'
import { shopService } from '../../services/shop.service'
import { paymentService } from '../../services/payment.service'
import type { SepayCheckoutData } from '../../types/payment.types'
import { formatVnd, PAYMENT_STATUS_LABELS } from '../../utils/payment'
import { getPaymentErrorMessage } from '../../utils/payment-errors'
import ConfirmModal from '../admin/ConfirmModal'
import './SepayCheckout.css'

export default function SepayCheckout({ checkout, onClose, onReturnToShop }: {
  checkout: SepayCheckoutData
  onClose(): void
  onReturnToShop?: () => void
}) {
  const { payment, error, busy, halted, refresh } = useSepayPolling(checkout.paymentId)
  const { updateCachedUser } = useAuth()
  const client = useQueryClient()
  const status = payment?.status ?? 'PENDING'
  const waiting = status === 'PENDING' && !halted
  const remaining = usePaymentDeadline(waiting ? checkout.paymentId : undefined,
    waiting ? payment?.expiresAt ?? checkout.expiresAt : undefined, refresh)
  const [imageState, setImageState] = useState('loading')
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState('')
  const [balanceError, setBalanceError] = useState('')
  const [balanceAttempt, setBalanceAttempt] = useState(0)
  const cancelLock = useRef(false)
  const cancelController = useRef<AbortController | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    return () => {
      cancelController.current?.abort()
      if (previous?.isConnected) previous.focus()
      else document.querySelector<HTMLElement>('.shop-pending-payment button')?.focus()
    }
  }, [])
  useEffect(() => {
    if (status === 'PENDING') return
    void client.invalidateQueries({ queryKey: ['payments'] })
    if (status !== 'SUCCESS') return
    const controller = new AbortController()
    setBalanceError('')
    void shopService.getShop(controller.signal).then(shop => {
      if (controller.signal.aborted) return
      client.setQueryData(['shop'], shop)
      updateCachedUser({ stats: shop.user })
    }).catch(() => { if (!controller.signal.aborted) setBalanceError('Chưa tải được số dư mới. Vui lòng thử lại.') })
    return () => { controller.abort() }
  }, [status, client, updateCachedUser, balanceAttempt])
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setNotice('Đã sao chép') }
    catch { setNotice('Không thể sao chép. Vui lòng chọn và sao chép thông tin bên dưới.') }
  }
  async function cancel() {
    if (cancelLock.current) return
    cancelLock.current = true
    const controller = new AbortController()
    cancelController.current = controller
    setCancelling(true)
    try { await paymentService.cancelPayment(checkout.paymentId, controller.signal); if (!controller.signal.aborted) refresh() }
    catch (cause) { if (!controller.signal.aborted) { setActionError(getPaymentErrorMessage(cause)); refresh() } }
    finally { if (!controller.signal.aborted) { cancelLock.current = false; setCancelling(false); setConfirm(false) } }
  }
  return <div className="sepay-overlay">
    <div className="sepay-dialog" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="sepay-title"
      onKeyDown={event => {
        if (confirm) return
        if (event.key === 'Escape' && !cancelling) closeRef.current()
        if (event.key !== 'Tab') return
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
        if (!buttons?.length) return
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }}>
      <h2 id="sepay-title">Thanh toán SePay</h2>
      <p role="status">{halted ? 'Không thể xác minh giao dịch' : status === 'PENDING' ? 'Đang chờ thanh toán' : PAYMENT_STATUS_LABELS[status]}</p>
      {error && <p role="alert">{error}</p>}
      {actionError && <p role="alert">{actionError}</p>}
      {waiting && <>
        <p>Thời gian còn lại: <strong>{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</strong></p>
        {remaining > 0 ? <>
          {imageState === 'loading' && <p role="status">Đang tải mã QR…</p>}
          {imageState === 'error' && <p role="alert">Không tải được QR. Bạn có thể chuyển khoản bằng thông tin bên dưới.</p>}
          <img className="sepay-qr" src={checkout.qrUrl} alt="Mã VietQR thanh toán gói kim cương qua SePay"
            onLoad={() => setImageState('loaded')} onError={() => setImageState('error')} hidden={imageState === 'error'} />
          <dl>
            <div><dt>Ngân hàng</dt><dd>{checkout.bankCode}</dd></div>
            <div><dt>Chủ tài khoản</dt><dd>{checkout.accountName}</dd></div>
            {[
              ['Số tài khoản', checkout.accountNumber, checkout.accountNumber],
              ['Số tiền', formatVnd(checkout.amount), String(checkout.amount)],
              ['Nội dung chuyển khoản', checkout.transferContent, checkout.transferContent],
            ].map(([label, display, value]) => <div key={label}><dt>{label}</dt><dd>{display}
              <button type="button" aria-label={`Sao chép ${label.toLowerCase()}`} onClick={() => void copy(value)}>Sao chép</button>
            </dd></div>)}
          </dl>
          <p>Chuyển đúng số tiền và nội dung để giao dịch được xác nhận tự động.</p>
        </> : <p>Đã hết thời gian chuyển khoản. Đang kiểm tra trạng thái thực tế từ máy chủ; vui lòng không chuyển thêm tiền.</p>}
        <button type="button" disabled={busy || cancelling} onClick={refresh}>Tôi đã chuyển khoản</button>
        <button type="button" disabled={cancelling} onClick={() => setConfirm(true)}>Hủy giao dịch</button>
      </>}
      {status === 'SUCCESS' && <p>Thanh toán thành công. Kim cương được cập nhật từ máy chủ.</p>}
      {balanceError && <p role="alert">{balanceError} <button onClick={() => setBalanceAttempt(value => value + 1)}>Tải lại số dư</button></p>}
      {notice && <p className="sepay-notice" role="status">{notice}</p>}
      <button type="button" disabled={cancelling} onClick={onClose}>Quay lại</button>
      {status !== 'PENDING' && onReturnToShop && <button type="button" onClick={onReturnToShop}>Trở về cửa hàng</button>}
      <ConfirmModal isOpen={confirm} title="Hủy giao dịch SePay?" message="Chỉ hủy nếu bạn chưa chuyển khoản. Bạn có chắc muốn hủy giao dịch này?"
        confirmLabel="Xác nhận hủy" cancelLabel="Tiếp tục chờ" isLoading={cancelling}
        onConfirm={() => void cancel()} onClose={() => { if (!cancelLock.current) setConfirm(false) }} />
    </div>
  </div>
}
