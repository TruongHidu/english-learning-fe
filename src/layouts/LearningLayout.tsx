import { NavLink, Outlet } from 'react-router-dom'
import HeartMenu from '../components/navigation/HeartMenu'
import MoreMenu from '../components/navigation/MoreMenu'
import SidebarIcon from '../components/navigation/SidebarIcon'
import type { SidebarIconName } from '../components/navigation/SidebarIcon'
import { useAuth } from '../hooks/useAuth'
import './LearningLayout.css'

interface NavigationItem {
  to: string
  label: string
  icon: SidebarIconName
}

const baseNavigationItems: NavigationItem[] = [
  { to: '/learn', label: 'HỌC', icon: 'learn' },
  { to: '/pronunciation', label: 'PHÁT ÂM', icon: 'pronunciation' },
  { to: '/leaderboard', label: 'BẢNG XẾP HẠNG', icon: 'leaderboard' },
  { to: '/quests', label: 'NHIỆM VỤ', icon: 'quests' },
  { to: '/shop', label: 'CỬA HÀNG', icon: 'shop' },
  { to: '/profile', label: 'HỒ SƠ', icon: 'profile' },
]

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.2 2.5c.5 4.2-3.8 5.5-3.1 9.1.2 1 .8 1.8 1.7 2.4-.1-2 .9-3.5 2.6-4.7 2.4 2 3.6 4.2 3.3 6.8-.3 3.5-2.8 5.6-6 5.4-3.9-.2-6.3-3-5.7-6.9.7-4.6 5-6.7 7.2-12.1Z" />
    </svg>
  )
}

function GemIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 3-4 5v9l9 5 9-5V8l-4-5H7Z" />
      <path d="m8 6-2 3v6l6 3.5 6-3.5V9l-2-3H8Z" />
    </svg>
  )
}

export default function LearningLayout() {
  const { logout, user } = useAuth()

  const items = user?.role === 'ADMIN'
    ? [...baseNavigationItems, { to: '/admin/courses', label: 'QUẢN TRỊ', icon: 'admin' as SidebarIconName }]
    : baseNavigationItems

  return (
    <div className="learning-shell">
      <aside className="learning-sidebar">
        <NavLink className="app-brand" to="/learn" aria-label="LingoFox - Học">
          lingofox
        </NavLink>

        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          {items.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
              to={item.to}
            >
              <span className={`sidebar-icon sidebar-icon--${item.icon}`}>
                <SidebarIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <MoreMenu onLogout={logout} />
        </nav>
      </aside>

      <div className="learning-workspace">
        <header className="stats-navbar" aria-label="Thông tin học tập">
          <div className="stats-navbar__inner">
            <div className="stat-item stat-item--language" title="Khóa học Tiếng Anh">
              <span className="language-flag" aria-hidden="true">🇺🇸</span>
              <span className="stat-label">TIẾNG ANH</span>
            </div>
            <div className="stat-item stat-item--streak" title="Chuỗi ngày học">
              <FlameIcon />
              <strong>{user?.stats.currentStreak ?? 0}</strong>
            </div>
            <div className="stat-item stat-item--diamond" title="Kim cương">
              <GemIcon />
              <strong>{user?.stats.diamond ?? 0}</strong>
            </div>
            <HeartMenu
              currentHeart={user?.stats.currentHeart ?? 0}
              maxHeart={user?.stats.maxHeart ?? 0}
            />
          </div>
        </header>

        <div className="learning-columns">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
