import { useQuery } from '@tanstack/react-query'
import DataTable from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import StatCard from '../../components/admin/StatCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { adminRevenueService } from '../../services/admin-revenue.service'

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export default function AdminRevenuePage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'revenue', 'analytics'],
    queryFn: () => adminRevenueService.getAnalytics(),
  })

  if (isLoading) {
    return (
      <div className="admin-page">
        <PageHeader
          title="Doanh thu"
          description="Tổng quan hiệu quả các gói kim cương và giao dịch."
        />
        <LoadingState label="Đang tải dữ liệu doanh thu..." />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="admin-page">
        <PageHeader
          title="Doanh thu"
          description="Tổng quan hiệu quả các gói kim cương và giao dịch."
        />
        <ErrorState
          title="Không thể tải dữ liệu doanh thu"
          message={
            error instanceof Error
              ? error.message
              : 'Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại.'
          }
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Doanh thu"
        description="Tổng quan hiệu quả các gói kim cương và giao dịch."
      />

      <section className="admin-stat-grid" aria-label="Thống kê doanh thu">
        <StatCard
          label="Tổng doanh thu"
          value={formatVnd(data.summary.totalRevenue)}
          note="Toàn thời gian"
          tone="green"
        />
        <StatCard
          label="Doanh thu tháng này"
          value={formatVnd(data.summary.currentMonthRevenue)}
          note="Tháng hiện tại (VN)"
          tone="blue"
        />
        <StatCard
          label="Tổng lượt nạp"
          value={data.summary.totalPayments.toLocaleString('vi-VN')}
          note={`Thành công: ${data.summary.successfulPayments.toLocaleString('vi-VN')}`}
          tone="violet"
        />
        <StatCard
          label="Tỷ lệ hoàn tất"
          value={`${data.summary.completionRate.toFixed(1)}%`}
          note={`Đang chờ: ${data.summary.pendingPayments.toLocaleString('vi-VN')} | Thất bại: ${data.summary.failedPayments.toLocaleString('vi-VN')}`}
          tone="amber"
        />
      </section>

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2>Doanh thu gần đây</h2>
              <p>10 khoản thanh toán mới nhất.</p>
            </div>
          </div>
          {data.recentPayments.length === 0 ? (
            <EmptyState
              title="Chưa có giao dịch"
              description="Chưa có giao dịch thanh toán nào được ghi nhận trong hệ thống."
            />
          ) : (
            <DataTable
              headers={['Mã GD / Người dùng', 'Gói nạp', 'Số tiền', 'Trạng thái', 'Thời gian']}
              minWidth={550}
            >
              {data.recentPayments.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong className="admin-table__primary">{item.transactionCode}</strong>
                    <span className="admin-table__secondary">
                      {item.user
                        ? `${item.user.displayName} (${item.user.email})`
                        : 'Người dùng không tồn tại'}
                    </span>
                  </td>
                  <td>
                    <span>{item.packageName}</span>
                    <span className="admin-table__secondary">
                      +{item.diamondAmount.toLocaleString('vi-VN')} 💎
                    </span>
                  </td>
                  <td>
                    <strong>{formatVnd(item.amount)}</strong>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <span className="admin-table__secondary">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2>Top Diamond Packages</h2>
              <p>Hiệu quả bán hàng thực tế (Top 5 gói nạp thành công).</p>
            </div>
          </div>
          {data.topPackages.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu gói"
              description="Chưa có gói nạp nào phát sinh giao dịch thành công."
            />
          ) : (
            <DataTable
              headers={['Gói nạp', 'Lượt thành công', 'Tổng kim cương', 'Doanh thu', 'Tỷ trọng']}
              minWidth={500}
            >
              {data.topPackages.map((pkg) => (
                <tr key={pkg.packageCode}>
                  <td>
                    <strong className="admin-table__primary">{pkg.packageName}</strong>
                    <span className="admin-table__secondary">Mã: {pkg.packageCode}</span>
                  </td>
                  <td>
                    <span>{pkg.successfulPayments.toLocaleString('vi-VN')} lượt</span>
                  </td>
                  <td>
                    <span>{pkg.totalDiamonds.toLocaleString('vi-VN')} 💎</span>
                  </td>
                  <td>
                    <strong>{formatVnd(pkg.totalRevenue)}</strong>
                  </td>
                  <td>
                    <span className="admin-status admin-status--neutral admin-status--sm">
                      {pkg.revenueShare.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>
      </div>
    </div>
  )
}
