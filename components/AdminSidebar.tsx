'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { icon: 'group', label: 'Members', href: '/admin/members' },
  { icon: 'church', label: 'Ministries', href: '/admin/ministries' },
  { icon: 'analytics', label: 'Analytics', href: '/admin/analytics' },
  { icon: 'settings', label: 'Settings', href: '/admin/settings' },
]

interface SidebarProps {
  pathname: string
  navigate: (href: string) => void
  handleLogout: () => void
  onClose?: () => void
}

function SidebarContent({ pathname, navigate, handleLogout, onClose }: SidebarProps) {
  return (
    <aside className="h-full w-64 bg-[#081534] flex flex-col relative">
      {onClose && (
        <button onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white z-10"
          aria-label="Close menu">
          <span className="material-symbols-outlined">close</span>
        </button>
      )}

      <div className="px-6 py-7 flex flex-col items-center border-b border-white/10">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"
          alt="Logo"
          className="w-16 h-16 object-contain mb-3"
        />
        <h1 className="text-[18px] font-black text-[#fdc425] tracking-tight">Admin Portal</h1>
        <p className="text-[12px] text-white/50 mt-0.5">Central Management</p>
      </div>

      <nav className="flex-grow py-4 px-3 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left
                ${active
                  ? 'bg-[#fdc425] text-[#6d5200] font-bold shadow-sm'
                  : 'text-white/60 hover:bg-white/10 hover:text-white font-semibold'}`}
            >
              <span className="material-symbols-outlined text-[20px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="text-[13px]">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        <button
          onClick={() => navigate('/admin/add-member')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left
            ${pathname === '/admin/add-member'
              ? 'bg-[#fdc425] text-[#6d5200] font-bold'
              : 'text-white/60 hover:bg-white/10 hover:text-white font-semibold'}`}
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span className="text-[13px]">Add New Member</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all text-left font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-[13px]">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.replace('/admin')
  }

  const navigate = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  return (
    <>
      <div className="hidden lg:block h-screen w-64 fixed left-0 top-0 z-50">
        <SidebarContent pathname={pathname} navigate={navigate} handleLogout={handleLogout} />
      </div>

      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 w-9 h-9 bg-[#081534] text-white rounded-lg flex items-center justify-center shadow-lg"
        aria-label="Open menu">
        <span className="material-symbols-outlined text-[20px]">menu</span>
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <div className={`lg:hidden fixed top-0 left-0 h-full z-50 transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent pathname={pathname} navigate={navigate} handleLogout={handleLogout} onClose={() => setOpen(false)} />
      </div>
    </>
  )
}