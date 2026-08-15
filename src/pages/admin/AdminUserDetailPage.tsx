import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DataTable from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import StatCard from '../../components/admin/StatCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockLearnedWords, mockPayments, mockUserProgress, mockUsers } from '../../mocks/admin.mock'

type UserTab = 'overview' | 'progress' | 'words' | 'payments'

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const [tab, setTab] = useState<UserTab>('overview')
  const user = mockUsers.find((item) => item.id === userId)
  if (!user) return <EmptyState title="Không tìm thấy người dùng" description="Tài khoản mẫu này không tồn tại." action={<Link to="/admin/users" className="admin-button admin-button--secondary">Quay lại danh sách</Link>} />

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Người dùng" title={user.name} description={user.email} action={<StatusBadge status={user.status} size="md" />} />
      <MockNotice />
      <div className="admin-tabs" role="tablist">{([['overview','Tổng quan'],['progress','Tiến độ học'],['words','Từ đã học'],['payments','Giao dịch']] as const).map(([value,label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{label}</button>)}</div>
      {tab === 'overview' ? <><section className="admin-card"><dl className="admin-detail-list"><div><dt>Display name</dt><dd>{user.name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Role</dt><dd>{user.role}</dd></div><div><dt>Trạng thái</dt><dd><StatusBadge status={user.status} /></dd></div></dl></section><section className="admin-stat-grid"><StatCard label="Trái tim" value={user.heart} tone="green" /><StatCard label="Kim cương" value={user.diamond} tone="blue" /><StatCard label="Cấp độ" value={user.level} tone="violet" /><StatCard label="XP / Streak" value={`${user.xp} / ${user.streak}`} tone="amber" /></section></> : null}
      {tab === 'progress' ? <DataTable headers={['Khóa học','Bài đã hoàn thành','Tiến độ']} caption="Tiến độ học"><>{mockUserProgress.map((item) => <tr key={item.course}><td className="admin-table__primary">{item.course}</td><td>{item.completed}</td><td><div className="admin-actions"><div className="admin-progress"><span style={{ width: `${item.progress}%` }} /></div><strong>{item.progress}%</strong></div></td></tr>)}</></DataTable> : null}
      {tab === 'words' ? <DataTable headers={['Từ','Nghĩa','Ngày học','Ôn gần nhất']} caption="Từ đã học"><>{mockLearnedWords.map((item) => <tr key={item.word}><td className="admin-table__primary">{item.word}</td><td>{item.meaning}</td><td>{item.learnedAt}</td><td>{item.reviewedAt}</td></tr>)}</></DataTable> : null}
      {tab === 'payments' ? <DataTable headers={['Mã','Gói','Số tiền','Ngày','Trạng thái']} caption="Giao dịch"><>{mockPayments.slice(0,2).map((item) => <tr key={item.id}><td className="admin-table__primary">{item.id}</td><td>{item.package}</td><td>{item.amount.toLocaleString('vi-VN')} ₫</td><td>{item.createdAt}</td><td><StatusBadge status={item.status} /></td></tr>)}</></DataTable> : null}
    </div>
  )
}
