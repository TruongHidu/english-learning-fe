import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usePaymentStatus } from '../../hooks/usePaymentStatus'
import { queryClient } from '../../lib/queryClient'
import { shopService } from '../../services/shop.service'
import type { PaymentDetail, PaymentStatus } from '../../types/payment.types'
import { formatPaymentDate, formatVnd, isTerminalPaymentStatus, isValidPaymentId } from '../../utils/payment'
import { pendingPaymentStorage } from '../../utils/pending-payment'
import './PaymentPages.css'

const RESULT_CONTENT: Record<PaymentStatus, { icon: string; title: string; message: string }> = {
  PENDING: {
    icon: '⏳',
    title: 'Đang xác nhận thanh toán',
    message: 'VNPay đang gửi kết quả chính thức. Vui lòng giữ trang này mở trong giây lát.',
  },
  SUCCESS: {
    icon: '✓',
    title: 'Thanh toán thành công',
    message: 'Kim cương đã được cập nhật từ kết quả xác nhận của máy chủ.',
  },
  FAILED: {
    icon: '!',
    title: 'Thanh toán thất bại',
    message: 'Giao dịch chưa được thanh toán. Số dư kim cương của bạn không thay đổi.',
  },
  CANCELLED: {
    icon: '×',
    title: 'Giao dịch đã hủy',
    message: 'Bạn đã hủy giao dịch trên VNPay. Số dư kim cương của bạn không thay đổi.',
  },
  EXPIRED: {
    icon: '⌛',
    title: 'Giao dịch hết hạn',
    message: 'Thời gian thanh toán đã kết thúc. Bạn có thể tạo một giao dịch mới.',
  },
}

function PaymentSummary({ payment, balance }: { payment: PaymentDetail; balance: number | null }) {
  return (
    <dl className="payment-summary">
      <div><dt>Gói</dt><dd>{payment.packageName}</dd></div>
      <div><dt>Kim cương</dt><dd>{payment.diamondAmount.toLocaleString('vi-VN')} 💎</dd></div>
      {balance !== null && payment.status === 'SUCCESS' && (
        <div><dt>Số dư mới</dt><dd>{balance.toLocaleString('vi-VN')} 💎</dd></div>
      )}
      <div><dt>Số tiền</dt><dd>{formatVnd(payment.amount)}</dd></div>
      <div><dt>Mã giao dịch</dt><dd className="payment-summary__code">{payment.transactionCode}</dd></div>
      <div><dt>Thời gian tạo</dt><dd>{formatPaymentDate(payment.createdAt)}</dd></div>
      {payment.paidAt && <div><dt>Thanh toán lúc</dt><dd>{formatPaymentDate(payment.paidAt)}</dd></div>}
    </dl>
  )
}

export default function PaymentResultPage() {
  const { paymentId: routePaymentId } = useParams()
  const [searchParams] = useSearchParams()
  const { updateCachedUser } = useAuth()
  const pendingPayment = useMemo(() => pendingPaymentStorage.get(), [])
  const signatureValue = searchParams.get('signatureValid')
  const returnTransactionCode = searchParams.get('transactionCode')
  const isReturnRoute = !routePaymentId
  const hasInvalidSignature = isReturnRoute && signatureValue === 'false'
  const urlPaymentId = searchParams.get('paymentId')
  const paymentId = useMemo(() => {
    if (isValidPaymentId(routePaymentId)) return routePaymentId
    if (signatureValue === 'true' && isValidPaymentId(urlPaymentId)) return urlPaymentId
    return pendingPayment?.paymentId ?? null
  }, [pendingPayment?.paymentId, routePaymentId, signatureValue, urlPaymentId])
  const { payment, isLoading, isChecking, isTimedOut, isNotFound, error, retry } =
    usePaymentStatus(paymentId)
  const refreshedPaymentsRef = useRef(new Set<string>())
  const [newBalance, setNewBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!payment || !isTerminalPaymentStatus(payment.status)) return
    pendingPaymentStorage.clearIfMatches(payment.paymentId)
  }, [payment])

  useEffect(() => {
    if (payment?.status !== 'SUCCESS') return
    if (refreshedPaymentsRef.current.has(payment.paymentId)) return
    refreshedPaymentsRef.current.add(payment.paymentId)

    void shopService
      .getShop()
      .then((shop) => {
        queryClient.setQueryData(['shop'], shop)
        updateCachedUser({
          stats: {
            diamond: shop.user.diamond,
            currentHeart: shop.user.currentHeart,
            maxHeart: shop.user.maxHeart,
            nextHeartAt: shop.user.nextHeartAt,
          },
        })
        setNewBalance(shop.user.diamond)
      })
      .catch(() => {
        void queryClient.invalidateQueries({ queryKey: ['shop'] })
      })
  }, [payment, updateCachedUser])

  const content = payment ? RESULT_CONTENT[payment.status] : null
  const transactionCodeMismatch = Boolean(
    signatureValue === 'true' &&
    returnTransactionCode &&
    payment &&
    returnTransactionCode !== payment.transactionCode,
  )

  return (
    <main className="payment-page">
      <section className="payment-result-card" aria-live="polite">
        {hasInvalidSignature && (
          <div className="payment-warning" role="alert">
            Dữ liệu chuyển hướng từ VNPay không hợp lệ. Trang này chỉ hiển thị kết quả lấy trực tiếp từ máy chủ.
          </div>
        )}
        {transactionCodeMismatch && (
          <div className="payment-warning" role="alert">
            Mã giao dịch trong đường dẫn không khớp. Kết quả bên dưới là dữ liệu chính thức từ máy chủ.
          </div>
        )}

        {!paymentId ? (
          <>
            <div className="payment-result-icon payment-result-icon--missing" aria-hidden="true">?</div>
            <h1>Không tìm thấy giao dịch</h1>
            <p>Không có mã giao dịch hợp lệ trong đường dẫn hoặc phiên trình duyệt này.</p>
          </>
        ) : isLoading && !payment ? (
          <div className="payment-loading" role="status">
            <span className="payment-spinner" aria-hidden="true" />
            <h1>Đang kiểm tra giao dịch</h1>
            <p>Thông tin chính thức đang được lấy từ máy chủ…</p>
          </div>
        ) : isNotFound ? (
          <>
            <div className="payment-result-icon payment-result-icon--missing" aria-hidden="true">?</div>
            <h1>Không tìm thấy giao dịch</h1>
            <p>{error}</p>
          </>
        ) : payment && content ? (
          <>
            <div className={`payment-result-icon payment-result-icon--${payment.status.toLowerCase()}`} aria-hidden="true">
              {content.icon}
            </div>
            <h1>{content.title}</h1>
            <p>{content.message}</p>
            {isChecking && <p className="payment-live-status" role="status">Đang tự động kiểm tra lại mỗi 2 giây…</p>}
            {isTimedOut && (
              <div className="payment-timeout" role="status">
                VNPay đang xác nhận giao dịch. Bạn có thể thử kiểm tra lại hoặc xem trong lịch sử thanh toán.
              </div>
            )}
            {error && !isTimedOut && <div className="payment-warning" role="status">{error}</div>}
            <PaymentSummary payment={payment} balance={newBalance} />
          </>
        ) : null}

        <div className="payment-page-actions">
          {(isTimedOut || (error && !isNotFound)) && (
            <button type="button" className="payment-primary-button" onClick={retry}>
              Kiểm tra lại
            </button>
          )}
          <Link className="payment-secondary-button" to="/shop">Trở về cửa hàng</Link>
          <Link className="payment-secondary-button" to="/payments/history">Xem lịch sử</Link>
        </div>
      </section>
    </main>
  )
}
