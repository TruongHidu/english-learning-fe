import { Link } from 'react-router-dom'
import DataTable from '../../components/admin/DataTable'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import StatCard from '../../components/admin/StatCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockAiQueue, mockDashboardStats, mockRecentActivities } from '../../mocks/admin.mock'

export default function AdminDashboardPage() {
  return (
    <div className="admin-page">
      <PageHeader title="Dashboard" description="Theo dõi nhanh tình trạng nội dung, người dùng và doanh thu của hệ thống." />
      <MockNotice />

      <section className="admin-stat-grid" aria-label="Thống kê tổng quan">
        {mockDashboardStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card__header">
            <div><h2>Hoạt động gần đây</h2><p>Các thay đổi mới nhất trong hệ thống.</p></div>
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
            <div><h2>Nội dung AI chờ xử lý</h2><p>Yêu cầu tạo nội dung gần nhất.</p></div>
            <Link className="admin-button admin-button--secondary admin-button--small" to="/admin/ai-content">Xem tất cả</Link>
          </div>
          <DataTable headers={['Chủ đề', 'Loại', 'Số lượng', 'Trạng thái']} minWidth={500} caption="Nội dung AI gần đây">
            {mockAiQueue.map((item) => (
              <tr key={item.id}>
                <td className="admin-table__primary">{item.topic}</td><td>{item.type}</td><td>{item.count}</td><td><StatusBadge status={item.status} /></td>
              </tr>
            ))}
          </DataTable>
        </section>
      </div>
    </div>
  )
}
