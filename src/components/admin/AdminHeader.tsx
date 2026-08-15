import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface AdminHeaderProps {
  onToggleSidebar: () => void
}

const routeLabels: Array<{ test: (path: string) => boolean; title: string; parent?: string }> = [
  { test: (path) => path === '/admin', title: 'Dashboard' },
  { test: (path) => /^\/admin\/courses\/[^/]+/.test(path), title: 'Chi tiết khóa học', parent: 'Nội dung học' },
  { test: (path) => path === '/admin/courses', title: 'Nội dung học' },
  { test: (path) => path.startsWith('/admin/topics/'), title: 'Chi tiết chủ đề', parent: 'Nội dung học' },
  { test: (path) => path.startsWith('/admin/lessons/'), title: 'Chi tiết màn học', parent: 'Nội dung học' },
  { test: (path) => path === '/admin/questions', title: 'Ngân hàng câu hỏi' },
  { test: (path) => path === '/admin/ai-content', title: 'AI tạo nội dung' },
  { test: (path) => /^\/admin\/users\/[^/]+/.test(path), title: 'Chi tiết người dùng', parent: 'Người dùng' },
  { test: (path) => path === '/admin/users', title: 'Người dùng' },
  { test: (path) => path === '/admin/payments/packages', title: 'Gói kim cương', parent: 'Thanh toán' },
  { test: (path) => path === '/admin/payments', title: 'Giao dịch', parent: 'Thanh toán' },
  { test: (path) => path === '/admin/revenue', title: 'Doanh thu', parent: 'Thanh toán' },
]

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { logout, user } = useAuth()
  const { pathname } = useLocation()
  const [accountOpen, setAccountOpen] = useState(false)
  const current: { title: string; parent?: string } =
    routeLabels.find((route) => route.test(pathname)) ?? { title: 'Quản trị' }
  const initials = user?.displayName?.trim().charAt(0).toUpperCase() || 'A'

  return (
    <header className="admin-header" aria-label="Thanh công cụ quản trị">
      <div className="admin-header__left">
        <button type="button" className="admin-header__menu" onClick={onToggleSidebar} aria-label="Mở menu điều hướng">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <div className="admin-breadcrumb" aria-label="Breadcrumb">
          <Link to="/admin">Admin</Link>
          {current.parent ? <><span>/</span><span>{current.parent}</span></> : null}
          <span>/</span><strong>{current.title}</strong>
        </div>
      </div>

      <div className="admin-header__account">
        <button type="button" className="admin-account-button" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen}>
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="admin-avatar" /> : <span className="admin-avatar">{initials}</span>}
          <span className="admin-account-button__copy"><strong>{user?.displayName || 'Admin'}</strong><small>{user?.email}</small></span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
        </button>
        {accountOpen ? (
          <div className="admin-account-menu">
            <div><strong>{user?.displayName || 'Admin'}</strong><small>{user?.email}</small></div>
            <button type="button" onClick={logout}>Đăng xuất</button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
