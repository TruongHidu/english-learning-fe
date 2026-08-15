import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../../components/admin/DataTable'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import SearchInput from '../../components/admin/SearchInput'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockUsers } from '../../mocks/admin.mock'

export default function AdminUserListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const users = useMemo(() => mockUsers.filter((user) => {
    const keyword = search.toLowerCase()
    return (user.name.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword)) && (!status || user.status === status)
  }), [search, status])

  return (
    <div className="admin-page">
      <PageHeader title="Người dùng" description="Theo dõi tài khoản và tình trạng học tập của người dùng." />
      <MockNotice />
      <div className="admin-filter-bar"><SearchInput value={search} onChange={setSearch} placeholder="Tìm email hoặc tên..." /><select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="LOCKED">Đã khóa</option><option value="BANNED">Đã cấm</option></select></div>
      <DataTable headers={['Người dùng', 'Email', 'Cấp độ', 'XP', 'Trạng thái', 'Thao tác']} caption="Danh sách người dùng">
        {users.map((user) => <tr key={user.id}><td className="admin-table__primary">{user.name}</td><td>{user.email}</td><td>Level {user.level}</td><td>{user.xp.toLocaleString('vi-VN')}</td><td><StatusBadge status={user.status} /></td><td><span className="admin-actions"><Link to={`/admin/users/${user.id}`} className="admin-button admin-button--secondary admin-button--small">Xem chi tiết</Link><button type="button" disabled className="admin-button admin-button--danger admin-button--small" title="Chờ API">{user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}</button></span></td></tr>)}
        {users.length === 0 ? <tr><td colSpan={6}>Không tìm thấy người dùng phù hợp.</td></tr> : null}
      </DataTable>
    </div>
  )
}
