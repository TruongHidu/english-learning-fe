import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

function CourseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { logout, user } = useAuth()

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  const handleLogout = () => {
    if (onClose) onClose()
    logout()
  }

  return (
    <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`} aria-label="Điều hướng quản trị">
      <div className="admin-sidebar__brand">
        <NavLink to="/admin" className="admin-brand-link" onClick={handleLinkClick}>
          <span className="admin-brand-logo">lingofox</span>
          <span className="admin-brand-badge">ADMIN</span>
        </NavLink>
        {onClose && (
          <button
            type="button"
            className="admin-sidebar__close-btn md:hidden"
            onClick={onClose}
            aria-label="Đóng menu"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="admin-sidebar__nav">
        <NavLink
          to="/admin"
          end
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
        >
          <span className="admin-sidebar__icon">
            <DashboardIcon />
          </span>
          <span className="admin-sidebar__label">Tổng quan</span>
        </NavLink>

        <NavLink
          to="/admin/courses"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
        >
          <span className="admin-sidebar__icon">
            <CourseIcon />
          </span>
          <span className="admin-sidebar__label">Quản lý khóa học</span>
        </NavLink>
      </nav>

      <div className="admin-sidebar__footer">
        <div className="admin-user-card">
          <div className="admin-user-avatar">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.displayName || 'Quản trị viên'}</span>
            <span className="admin-user-role">Quản trị viên</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-sidebar__link admin-sidebar__logout-btn"
          onClick={handleLogout}
        >
          <span className="admin-sidebar__icon">
            <LogoutIcon />
          </span>
          <span className="admin-sidebar__label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
