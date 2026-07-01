'use client'

import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

const navItems = [
  { icon: 'dashboard',  label: 'Dashboard',   href: '/admin/dashboard' },
  { icon: 'group',      label: 'Members',      href: '/admin/members' },
  { icon: 'church',     label: 'Ministries',   href: '/admin/ministries' },
  { icon: 'analytics',  label: 'Analytics',    href: '/admin/analytics' },
  { icon: 'settings',   label: 'Settings',     href: '/admin/settings' },
]

export default function AdminSidebar() {
  const router   = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.replace('/admin')
  }

  const navigate = (href: string) => router.push(href)

  return (
    // Desktop only — hidden on mobile. Mobile nav is handled by AdminMobileTopBar.
    <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 z-50 bg-[#081534] flex-col">

      <div className="px-6 py-7 flex flex-col items-center border-b border-white/10">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"
          alt="Logo" className="w-16 h-16 object-contain mb-3"
        />
        <h1 className="text-[18px] font-black text-[#fdc425] tracking-tight">Admin Portal</h1>
        <p className="text-[12px] text-white/50 mt-0.5">Central Management</p>
      </div>

      <nav className="flex-grow py-4 px-3 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <button key={item.label} onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left
                ${active
                  ? 'bg-[#fdc425] text-[#6d5200] font-bold shadow-sm'
                  : 'text-white/60 hover:bg-white/10 hover:text-white font-semibold'}`}>
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
        <button onClick={() => navigate('/admin/add-member')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left
            ${pathname === '/admin/add-member'
              ? 'bg-[#fdc425] text-[#6d5200] font-bold'
              : 'text-white/60 hover:bg-white/10 hover:text-white font-semibold'}`}>
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span className="text-[13px]">Add New Member</span>
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all text-left font-semibold">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-[13px]">Logout</span>
        </button>
      </div>
    </aside>
  )
}