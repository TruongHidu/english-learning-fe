import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paymentService } from '../../services/payment.service'
import { formatPaymentDate, formatVnd, PAYMENT_STATUS_LABELS } from '../../utils/payment'
import { getPaymentErrorMessage } from '../../utils/payment-errors'
import './PaymentPages.css'

const PAGE_SIZE = 20

export default function PaymentHistoryPage() {
  const [page, setPage] = useState(1)
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['payments', 'me', page, PAGE_SIZE],
    queryFn: ({ signal }) => paymentService.getHistory(page, PAGE_SIZE, signal),
    placeholderData: keepPreviousData,
  })

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
