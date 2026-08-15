import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminHeader from '../components/admin/AdminHeader'
import AdminSidebar from '../components/admin/AdminSidebar'
import './AdminLayout.css'

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isSidebarOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isSidebarOpen])

  return (
    <div className="admin-shell">
      {isSidebarOpen ? <button type="button" className="admin-backdrop" onClick={() => setIsSidebarOpen(false)} aria-label="Đóng menu" /> : null}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="admin-workspace">
        <AdminHeader onToggleSidebar={() => setIsSidebarOpen((open) => !open)} />
        <main className="admin-main-container"><Outlet /></main>
      </div>
    </div>
  )
}
