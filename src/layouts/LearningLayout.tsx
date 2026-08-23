import React, { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import HeartMenu from '../components/navigation/HeartMenu'
import MoreMenu from '../components/navigation/MoreMenu'
import SidebarIcon from '../components/navigation/SidebarIcon'
import type { SidebarIconName } from '../components/navigation/SidebarIcon'
import { useAuth } from '../hooks/useAuth'
import { getLevelInfo } from '../utils/level-calculator'
import './LearningLayout.css'

interface NavigationItem {
  to: string
  label: string
  icon: SidebarIconName
  subItems?: { to: string; label: string }[]
}

const baseNavigationItems: NavigationItem[] = [
  {
    to: '/learn',
    label: 'HỌC',
    icon: 'learn',
    subItems: [{ to: '/vocabularies/learned', label: 'Từ vựng đã học' }],
  },
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

function XpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M13 2L3 14h7v8l10-12h-7V2z" />
    </svg>
  )
}

export default function LearningLayout() {
  const { logout, user } = useAuth()
  const location = useLocation()
  const isLearnActive = location.pathname.startsWith('/learn') || location.pathname.startsWith('/vocabularies/learned')

  // Initialize expandedNav based on current route
  const [expandedNav, setExpandedNav] = useState<string | null>(() => {
    if (location.pathname.startsWith('/vocabularies/learned')) return '/learn'
    return null
  })
  
  const isLessonRoute = location.pathname.startsWith('/learn/lessons/')

  const totalXp = user?.stats.totalXp ?? 0
  const levelInfo = getLevelInfo(totalXp)

  const toggleNav = (to: string, e: React.MouseEvent) => {
    const item = baseNavigationItems.find(i => i.to === to)
    if (item?.subItems) {
      // Don't prevent default, allow navigation to /learn, but toggle dropdown
      setExpandedNav(expandedNav === to ? null : to)
    }
  }

  const checkIsActive = (to: string) => {
    if (to === '/learn') return isLearnActive
    return location.pathname.startsWith(to)
  }

  return (
    <div className={`learning-shell${isLessonRoute ? ' learning-shell--lesson' : ''}`}>
      <aside className="learning-sidebar">
        <NavLink className="app-brand" to="/learn" aria-label="LingoFox - Học">
          lingofox
        </NavLink>

        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          {baseNavigationItems.map((item) => (
            <div key={item.to} className="relative flex flex-col">
              <NavLink
                onClick={(e) => toggleNav(item.to, e)}
                className={() => `sidebar-link${checkIsActive(item.to) ? ' sidebar-link--active' : ''}`}
                to={item.to}
              >
                <span className={`sidebar-icon sidebar-icon--${item.icon}`}>
                  <SidebarIcon name={item.icon} />
                </span>
                <span>{item.label}</span>
              </NavLink>
              
              {item.subItems && expandedNav === item.to && (
                <div className="flex flex-col ml-[20px] mt-2 mb-2 gap-2 transition-all">
                  {item.subItems.map((subItem) => (
                    <NavLink
                      key={subItem.to}
                      to={subItem.to}
                      className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
                      style={{ minHeight: '52px', padding: '8px 16px' }}
                    >
                       {/* A small dot or book icon for sub-item */}
                       <span className="sidebar-icon" style={{ width: 32, height: 32, flex: '0 0 32px' }}>
                          <svg viewBox="0 0 24 24" width="24" height="24" className="icon-outline"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                       </span>
                       <span style={{ fontSize: '14px' }}>{subItem.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
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
            <div
              className="stat-item stat-item--level"
              title={`Cấp độ ${levelInfo.level} • ${levelInfo.xpInCurrentLevel}/${levelInfo.xpRequiredForLevel} XP để lên Cấp ${levelInfo.level + 1}`}
            >
              <XpIcon />
              <div className="stat-level-info">
                <strong className="stat-level-num">Lv. {levelInfo.level}</strong>
                <span className="stat-level-xp">{levelInfo.xpInCurrentLevel}/{levelInfo.xpRequiredForLevel} XP</span>
              </div>
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
              nextHeartAt={user?.stats.nextHeartAt ?? null}
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
