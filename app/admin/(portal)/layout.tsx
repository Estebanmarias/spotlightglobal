import AdminSidebar from '@/components/AdminSidebar'
import AdminMobileTopBar from '@/components/AdminMobileTopBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#f7f9fb] min-h-screen overflow-hidden">
      {/* Desktop sidebar — fixed, only visible lg+ */}
      <AdminSidebar />
      {/* Main content — offset by sidebar on desktop, full width on mobile */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col overflow-hidden">
        {/* Mobile top bar — only visible below lg, sits above page content */}
        <AdminMobileTopBar />
        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}