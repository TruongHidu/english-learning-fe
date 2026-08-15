import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

type IconName = 'dashboard' | 'book' | 'question' | 'sparkles' | 'users' | 'card' | 'receipt' | 'diamond' | 'chart' | 'logout' | 'chevron'

function AdminIcon({ name }: { name: IconName }) {
  const content: Record<IconName, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h6" /></>,
    question: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 3.8 2c-1 .7-1.5 1.1-1.5 2.4M12 17h.01" /></>,
    sparkles: <><path d="m12 3 1.1 3.2L16 7.5l-2.9 1.3L12 12l-1.1-3.2L8 7.5l2.9-1.3zM18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8zM6 13l.8 2.2L9 16l-2.2.8L6 19l-.8-2.2L3 16l2.2-.8z" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M6 15h3" /></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    diamond: <><path d="m12 2 8 6-8 14L4 8zM4 8h16M9 2 7 8l5 14 5-14-2-6" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true">{content[name]}</svg>
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { logout, user } = useAuth()
  const location = useLocation()
  const paymentRouteActive = location.pathname.startsWith('/admin/payments') || location.pathname.startsWith('/admin/revenue')
  const [paymentsOpen, setPaymentsOpen] = useState(paymentRouteActive)

  useEffect(() => {
    if (paymentRouteActive) setPaymentsOpen(true)
  }, [paymentRouteActive])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`

  const initials = user?.displayName?.trim().charAt(0).toUpperCase() || 'A'

  return (
    <aside className={`admin-sidebar${isOpen ? ' admin-sidebar--open' : ''}`} aria-label="Điều hướng quản trị">
      <div className="admin-sidebar__brand">
        <NavLink to="/admin" className="admin-brand-link" onClick={onClose} aria-label="LingoFox Admin">
          <span className="admin-brand-mark">L</span>
          <span className="admin-brand-copy">
            <strong>lingofox</strong>
            <small>ADMIN PORTAL</small>
          </span>
        </NavLink>
        <button type="button" className="admin-sidebar__close" onClick={onClose} aria-label="Đóng menu">×</button>
      </div>

      <nav className="admin-sidebar__nav">
        <div className="admin-nav-group">
          <span className="admin-nav-group__label">Tổng quan</span>
          <NavLink to="/admin" end className={navLinkClass} onClick={onClose} title="Dashboard">
            <span className="admin-sidebar__icon"><AdminIcon name="dashboard" /></span>
            <span className="admin-sidebar__label">Dashboard</span>
          </NavLink>
        </div>

        <div className="admin-nav-group">
          <span className="admin-nav-group__label">Quản lý học tập</span>
          <NavLink to="/admin/courses" className={navLinkClass} onClick={onClose} title="Nội dung học">
            <span className="admin-sidebar__icon"><AdminIcon name="book" /></span>
            <span className="admin-sidebar__label">Nội dung học</span>
          </NavLink>
          <NavLink to="/admin/questions" className={navLinkClass} onClick={onClose} title="Ngân hàng câu hỏi">
            <span className="admin-sidebar__icon"><AdminIcon name="question" /></span>
            <span className="admin-sidebar__label">Ngân hàng câu hỏi</span>
          </NavLink>
          <NavLink to="/admin/ai-content" className={navLinkClass} onClick={onClose} title="AI tạo nội dung">
            <span className="admin-sidebar__icon"><AdminIcon name="sparkles" /></span>
            <span className="admin-sidebar__label">AI tạo nội dung</span>
          </NavLink>
        </div>

        <div className="admin-nav-group">
          <span className="admin-nav-group__label">Quản lý hệ thống</span>
          <NavLink to="/admin/users" className={navLinkClass} onClick={onClose} title="Người dùng">
            <span className="admin-sidebar__icon"><AdminIcon name="users" /></span>
            <span className="admin-sidebar__label">Người dùng</span>
          </NavLink>
          <button
            type="button"
            className={`admin-sidebar__link admin-sidebar__expand${paymentRouteActive ? ' admin-sidebar__link--active' : ''}`}
            onClick={() => setPaymentsOpen((open) => !open)}
            aria-expanded={paymentsOpen}
            title="Thanh toán"
          >
            <span className="admin-sidebar__icon"><AdminIcon name="card" /></span>
            <span className="admin-sidebar__label">Thanh toán</span>
            <span className={`admin-sidebar__chevron${paymentsOpen ? ' admin-sidebar__chevron--open' : ''}`}><AdminIcon name="chevron" /></span>
          </button>
          {paymentsOpen ? (
            <div className="admin-sidebar__submenu">
              <NavLink to="/admin/payments" end className={navLinkClass} onClick={onClose} title="Giao dịch">
                <span className="admin-sidebar__icon"><AdminIcon name="receipt" /></span><span className="admin-sidebar__label">Giao dịch</span>
              </NavLink>
              <NavLink to="/admin/payments/packages" className={navLinkClass} onClick={onClose} title="Gói kim cương">
                <span className="admin-sidebar__icon"><AdminIcon name="diamond" /></span><span className="admin-sidebar__label">Gói kim cương</span>
              </NavLink>
              <NavLink to="/admin/revenue" className={navLinkClass} onClick={onClose} title="Doanh thu">
                <span className="admin-sidebar__icon"><AdminIcon name="chart" /></span><span className="admin-sidebar__label">Doanh thu</span>
              </NavLink>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="admin-sidebar__footer">
        <div className="admin-sidebar__user">
          <span className="admin-avatar">{initials}</span>
          <span className="admin-sidebar__user-copy"><strong>{user?.displayName || 'Quản trị viên'}</strong><small>Quản trị viên</small></span>
        </div>
        <button type="button" className="admin-sidebar__link admin-sidebar__logout" onClick={logout} title="Đăng xuất">
          <span className="admin-sidebar__icon"><AdminIcon name="logout" /></span><span className="admin-sidebar__label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
