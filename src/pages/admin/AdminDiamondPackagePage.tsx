import { useState } from 'react'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockDiamondPackages } from '../../mocks/admin.mock'

export default function AdminDiamondPackagePage() {
  const [message, setMessage] = useState('')
  const showTodo = () => setMessage('CRUD gói kim cương sẽ được kết nối khi backend sẵn sàng.')

  return (
    <div className="admin-page">
      <PageHeader title="Gói kim cương" description="Thiết lập các gói kim cương hiển thị cho người học." action={<button type="button" className="admin-button admin-button--primary" onClick={showTodo}>+ Thêm gói</button>} />
      <MockNotice />
      {message ? <div className="admin-notification admin-notification--success"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div> : null}
      <section className="admin-stat-grid">
        {mockDiamondPackages.map((item) => (
          <article className="admin-card" key={item.id}>
            <div className="admin-card__header"><div><h2>{item.name}</h2><p>{item.popular ? 'Được mua nhiều nhất' : 'Gói tiêu chuẩn'}</p></div><StatusBadge status={item.status} /></div>
            <div style={{ marginBottom: 18 }}><strong style={{ display: 'block', color: '#2667b7', fontSize: 26 }}>{item.diamonds.toLocaleString('vi-VN')} 💎</strong><span style={{ color: '#6f7b8f', fontSize: 13 }}>{item.price.toLocaleString('vi-VN')} VNĐ</span></div>
            <button type="button" className="admin-button admin-button--secondary admin-button--small" onClick={showTodo}>Chỉnh sửa</button>
          </article>
        ))}
      </section>
    </div>
  )
}
