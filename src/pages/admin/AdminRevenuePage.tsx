import DataTable from '../../components/admin/DataTable'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import StatCard from '../../components/admin/StatCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockDiamondPackages, mockPayments, mockRevenueStats } from '../../mocks/admin.mock'

export default function AdminRevenuePage() {
  return (
    <div className="admin-page">
      <PageHeader title="Doanh thu" description="Tổng quan hiệu quả các gói kim cương và giao dịch." />
      <MockNotice />
      <section className="admin-stat-grid">{mockRevenueStats.map((item) => <StatCard key={item.label} {...item} />)}</section>
      <div className="admin-grid-2">
        <section className="admin-card"><div className="admin-card__header"><div><h2>Doanh thu gần đây</h2><p>Các khoản thanh toán mới nhất.</p></div></div><DataTable headers={['Giao dịch','Số tiền','Trạng thái']} minWidth={430}>{mockPayments.map((item) => <tr key={item.id}><td><strong className="admin-table__primary">{item.id}</strong><span className="admin-table__secondary">{item.user}</span></td><td>{item.amount.toLocaleString('vi-VN')} ₫</td><td><StatusBadge status={item.status} /></td></tr>)}</DataTable></section>
        <section className="admin-card"><div className="admin-card__header"><div><h2>Top Diamond Packages</h2><p>Gói nổi bật theo doanh thu mẫu.</p></div></div><DataTable headers={['Gói','Kim cương','Giá']} minWidth={400}>{mockDiamondPackages.map((item) => <tr key={item.id}><td className="admin-table__primary">{item.name}</td><td>{item.diamonds} 💎</td><td>{item.price.toLocaleString('vi-VN')} ₫</td></tr>)}</DataTable></section>
      </div>
    </div>
  )
}
