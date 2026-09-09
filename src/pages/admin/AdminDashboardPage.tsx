import { Link } from 'react-router-dom'
import DataTable from '../../components/admin/DataTable'
import PageHeader from '../../components/admin/PageHeader'
import StatCard from '../../components/admin/StatCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockAiQueue, mockRecentActivities } from '../../mocks/admin.mock'
import { useAdminLearningStats } from '../../hooks/useAdminLearningStats'

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminLearningStats()

  return (
    <div className="admin-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Dashboard"
          description="Theo dõi nhanh tình trạng nội dung, người dùng và học tập của hệ thống."
        />
        <Link
          to="/admin/learning-stats"
          className="admin-button admin-button--primary admin-button--small self-start sm:self-center"
        >
          Xem Thống kê học tập chi tiết →
        </Link>
      </div>

      <section className="admin-stat-grid" aria-label="Thống kê tổng quan">
        <StatCard
          label="Tổng học viên"
          value={isLoading ? '...' : (stats?.userSummary.totalUsers ?? 0).toLocaleString('vi-VN')}
          note={isLoading ? undefined : `Hôm nay: +${(stats?.userSummary.activeToday ?? 0).toLocaleString('vi-VN')}`}
          tone="blue"
        />
        <StatCard
          label="Bài học hoàn thành"
          value={isLoading ? '...' : (stats?.lessonSummary.completedLessons ?? 0).toLocaleString('vi-VN')}
          note={isLoading ? undefined : `Tổng phiên: ${(stats?.lessonSummary.completedSessions ?? 0).toLocaleString('vi-VN')}`}
          tone="green"
        />
        <StatCard
          label="Tỷ lệ đạt"
          value={isLoading ? '...' : `${(stats?.lessonSummary.passedRate ?? 0).toFixed(1)}%`}
          note={isLoading ? undefined : `Điểm TB: ${(stats?.lessonSummary.averageScore ?? 0).toFixed(1)}`}
          tone="amber"
        />
        <StatCard
          label="Học viên hoạt động"
          value={isLoading ? '...' : (stats?.userSummary.activeToday ?? 0).toLocaleString('vi-VN')}
          note={isLoading ? undefined : `7 ngày qua: ${(stats?.userSummary.activeLast7Days ?? 0).toLocaleString('vi-VN')}`}
          tone="violet"
        />
      </section>

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2>Hoạt động gần đây</h2>
              <p>Các thay đổi mới nhất trong hệ thống.</p>
            </div>
          </div>
          <DataTable headers={['Hoạt động', 'Phân hệ', 'Thời gian']} minWidth={520} caption="Hoạt động quản trị gần đây">
            {mockRecentActivities.map((activity) => (
              <tr key={activity.id}>
                <td className="admin-table__primary">{activity.title}</td>
                <td>{activity.type}</td>
                <td>{activity.time}</td>
              </tr>
            ))}
          </DataTable>
        </section>

        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2>Nội dung AI chờ xử lý</h2>
              <p>Yêu cầu tạo nội dung gần nhất.</p>
            </div>
            <Link className="admin-button admin-button--secondary admin-button--small" to="/admin/ai-content">
              Xem tất cả
            </Link>
          </div>
          <DataTable headers={['Chủ đề', 'Loại', 'Số lượng', 'Trạng thái']} minWidth={500} caption="Nội dung AI gần đây">
            {mockAiQueue.map((item) => (
              <tr key={item.id}>
                <td className="admin-table__primary">{item.topic}</td>
                <td>{item.type}</td>
                <td>{item.count}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </DataTable>
        </section>
      </div>
    </div>
  )
}
