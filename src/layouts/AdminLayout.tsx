import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminHeader from '../components/admin/AdminHeader'
import AdminSidebar from '../components/admin/AdminSidebar'
import './AdminLayout.css'

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="admin-shell">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="admin-backdrop md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Workspace Area */}
      <div className="admin-workspace">
        <AdminHeader onToggleSidebar={toggleSidebar} />

        <main className="admin-main-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
