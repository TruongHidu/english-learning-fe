import { useAuth } from '../../hooks/useAuth'

interface AdminHeaderProps {
  onToggleSidebar?: () => void
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { logout, user } = useAuth()

  return (
    <header className="admin-header" aria-label="Thanh công cụ quản trị">
      <div className="admin-header__left">
        {onToggleSidebar && (
          <button
            type="button"
            className="admin-header__toggle-btn md:hidden"
            onClick={onToggleSidebar}
            aria-label="Mở menu điều hướng"
          >
            <MenuIcon />
          </button>
        )}
        <div className="admin-header__title-group">
          <span className="admin-header__badge">HỆ THỐNG QUẢN TRỊ</span>
          <h2 className="admin-header__title">LingoFox Admin</h2>
        </div>
      </div>

      <div className="admin-header__right">
        <div className="admin-header__user-profile">
          <div className="admin-header__avatar">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="admin-header__meta hidden sm:flex">
            <span className="admin-header__user-name">{user?.displayName || 'Admin'}</span>
            <span className="admin-header__user-email">{user?.email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="admin-header__logout-btn"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogoutIcon />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  )
}
