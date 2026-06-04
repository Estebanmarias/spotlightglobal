import AdminSidebar from '@/components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#f7f9fb] min-h-screen overflow-hidden">
      <AdminSidebar />
      {/* lg: offset by sidebar width; mobile: no offset (sidebar is a drawer) */}
      <div className="flex-1 lg:ml-64 overflow-y-auto min-h-screen">
        {children}
      </div>
    </div>
  )
}