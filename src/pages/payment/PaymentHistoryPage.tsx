import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { paymentService } from '../../services/payment.service'
import { formatPaymentDate, formatVnd, PAYMENT_STATUS_LABELS } from '../../utils/payment'
import { getPaymentErrorMessage } from '../../utils/payment-errors'
import './PaymentPages.css'
import ConfirmModal from '../../components/admin/ConfirmModal'
import type { PaymentDetail } from '../../types/payment.types'
import { pendingPaymentStorage } from '../../utils/pending-payment'
import { browserNavigation } from '../../utils/browser-navigation'
import { usePaymentDeadline } from '../../hooks/usePaymentDeadline'

const PAGE_SIZE = 20

export default function PaymentHistoryPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [cancelTarget, setCancelTarget] = useState<PaymentDetail | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const inFlight = useRef(false)
  const [notice, setNotice] = useState(() => typeof location.state?.paymentNotice === 'string' ? location.state.paymentNotice : '')
  const [actionError, setActionError] = useState('')
  const [page, setPage] = useState(1)
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['payments', 'me', page, PAGE_SIZE],
    queryFn: ({ signal }) => paymentService.getHistory(page, PAGE_SIZE, signal),
    placeholderData: keepPreviousData,
  })
  const pending = data?.payments.find(payment => payment.status === 'PENDING')
  useEffect(() => {
    for (const payment of data?.payments ?? []) {
      if (payment.status !== 'PENDING') pendingPaymentStorage.clearIfMatches(payment.paymentId)
    }
  }, [data])
  useEffect(() => {
    const reset = () => { inFlight.current = false; setBusyId(null); void refetch() }
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [refetch])
  const remaining = usePaymentDeadline(pending?.paymentId, pending?.expiresAt, () => {
    void queryClient.invalidateQueries({ queryKey: ['payments'] })
  })

  async function refreshPayments() {
    await queryClient.invalidateQueries({ queryKey: ['payments'] })
  }
  async function retryPayment(payment: PaymentDetail) {
    if (inFlight.current) return
    inFlight.current = true
    setBusyId(payment.paymentId)
    setActionError('')
    setNotice('')
    let redirected = false
    try {
      const result = await paymentService.retryPayment(payment.paymentId)
      pendingPaymentStorage.save({ paymentId: result.paymentId, transactionCode: result.transactionCode,
        createdAt: payment.createdAt })
      await refreshPayments()
      browserNavigation.assign(result.paymentUrl)
      redirected = true
    } catch (error) {
      setActionError(getPaymentErrorMessage(error))
      await refreshPayments()
    } finally {
      if (!redirected) { inFlight.current = false; setBusyId(null) }
    }
  }
  async function cancelPayment() {
    if (!cancelTarget || inFlight.current) return
    inFlight.current = true
    setBusyId(cancelTarget.paymentId)
    setActionError('')
    setNotice('')
    try {
      const result = await paymentService.cancelPayment(cancelTarget.paymentId)
      pendingPaymentStorage.clearIfMatches(result.paymentId)
      setNotice(result.status === 'EXPIRED' ? 'Giao dịch đã hết hạn' : 'Đã hủy giao dịch')
      setCancelTarget(null)
      await refreshPayments()
    } catch (error) {
      setActionError(getPaymentErrorMessage(error))
      setCancelTarget(null)
      await refreshPayments()
    } finally { inFlight.current = false; setBusyId(null) }
  }

  return (
    <main className="payment-history-page">
      <header className="payment-history-header">
        <div>
          <span>VNPAY SANDBOX</span>
          <h1>Lịch sử thanh toán</h1>
          <p>Theo dõi các lần mua gói kim cương và trạng thái xác nhận từ máy chủ.</p>
        </div>
        <Link to="/shop" className="payment-primary-button">Mua kim cương</Link>
      </header>
      {notice && <p role="status" aria-live="polite">{notice}</p>}
      {actionError && <p role="alert">{actionError}</p>}
      <ConfirmModal isOpen={Boolean(cancelTarget)} title="Hủy giao dịch?"
        message={`Hủy giao dịch ${cancelTarget?.transactionCode ?? ''}? Bạn sẽ phải tạo giao dịch mới nếu muốn mua lại. Nếu bạn đã hoàn tất thanh toán trên VNPay, hãy quay về trang kết quả trước.`}
        confirmLabel="Xác nhận hủy" cancelLabel="Quay lại" isLoading={busyId !== null}
        onConfirm={() => void cancelPayment()} onClose={() => { if (!inFlight.current) setCancelTarget(null) }} />

      {isLoading ? (
        <div className="payment-list-state" role="status">
          <span className="payment-spinner" aria-hidden="true" />
          Đang tải lịch sử thanh toán…
        </div>
      ) : error ? (
        <div className="payment-list-state payment-list-state--error" role="alert">
          <p>{getPaymentErrorMessage(error, 'Không thể tải lịch sử thanh toán.')}</p>
          <button type="button" className="payment-primary-button" onClick={() => void refetch()}>
            Thử lại
          </button>
        </div>
      ) : !data || data.payments.length === 0 ? (
        <div className="payment-list-state">
          <div className="payment-empty-icon" aria-hidden="true">◇</div>
          <h2>Chưa có giao dịch</h2>
          <p>Các giao dịch mua kim cương của bạn sẽ xuất hiện tại đây.</p>
          <Link to="/shop" className="payment-primary-button">Đến cửa hàng</Link>
        </div>
      ) : (
        <>
          <div className="payment-table-card" aria-busy={isFetching}>
            <div className="payment-table-scroll">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>Gói / giao dịch</th>
                    <th>Kim cương</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th><span className="sr-only">Chi tiết</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.paymentId}>
                      <td>
                        <strong>{payment.packageName}</strong>
                        <span className="payment-table__secondary">{payment.transactionCode}</span>
                      </td>
                      <td>{payment.diamondAmount.toLocaleString('vi-VN')} 💎</td>
                      <td>{formatVnd(payment.amount)}</td>
                      <td>{payment.paymentMethod}</td>
                      <td>
                        <span>{formatPaymentDate(payment.createdAt)}</span>
                        {payment.paidAt && (
                          <span className="payment-table__secondary">Đã trả: {formatPaymentDate(payment.paidAt)}</span>
                        )}
                      </td>
                      <td>
                        <span className={`payment-status-badge payment-status-badge--${payment.status.toLowerCase()}`}>
                          {PAYMENT_STATUS_LABELS[payment.status]}
                        </span>
                      </td>
                      <td>
                        {payment.status === 'PENDING' && (
                          <div className="payment-pending-actions" aria-busy={busyId === payment.paymentId}>
                            <span>Hết hạn: {formatPaymentDate(payment.expiresAt)}</span>
                            <span>Còn lại: {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span>
                            <button type="button" className="payment-primary-button"
                              aria-label={`Thanh toán lại ${payment.transactionCode}`}
                              disabled={busyId !== null || remaining <= 0 || isFetching}
                              onClick={() => void retryPayment(payment)}>Thanh toán lại</button>
                            <button type="button" className="payment-secondary-button"
                              aria-label={`Hủy giao dịch ${payment.transactionCode}`}
                              disabled={busyId !== null || isFetching}
                              onClick={() => setCancelTarget(payment)}>Hủy giao dịch</button>
                          </div>
                        )}
                        <Link className="payment-detail-link" to={`/payments/${payment.paymentId}`}>
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <nav className="payment-pagination" aria-label="Phân trang lịch sử thanh toán">
            <button
              type="button"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Trang trước
            </button>
            <span>Trang {data.page} / {Math.max(1, data.totalPages)} · {data.total} giao dịch</span>
            <button
              type="button"
              disabled={page >= data.totalPages || isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Trang sau
            </button>
          </nav>
        </>
      )}
    </main>
  )
}
