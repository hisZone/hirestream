import { Outlet } from 'react-router-dom'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { useAdminRealtimeNotifications } from '@/hooks/useAdminRealtimeNotifications'

export default function AdminLayout() {
  // Initialize real-time push listener for admin popups
  useAdminRealtimeNotifications()

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-14 md:pt-0">
        <AdminHeader />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
