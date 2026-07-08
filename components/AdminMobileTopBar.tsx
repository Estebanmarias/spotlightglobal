'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { PageKey } from '@/lib/use-admin-permissions'

type NavItem = {
  icon: string
  label: string
  href: string
  page?: PageKey
}

const navItems: NavItem[] = [
  { icon: 'dashboard',          label: 'Dashboard',    href: '/admin/dashboard',   page: 'dashboard' },
  { icon: 'group',              label: 'Members',      href: '/admin/members',     page: 'members' },
  { icon: 'fact_check',         label: 'Attendance',   href: '/admin/attendance',  page: 'attendance' },
  { icon: 'church',             label: 'Ministries',   href: '/admin/ministries',  page: 'ministries' },
  // { icon: 'groups',             label: 'My Ministry', href: '/admin/ministry-dashboard', page: 'ministries' },
  { icon: 'analytics',          label: 'Analytics',    href: '/admin/analytics',   page: 'analytics' },
  { icon: 'volunteer_activism', label: 'Giving',       href: '/admin/giving',      page: 'giving' },
  { icon: 'handshake',          label: 'Partners',     href: '/admin/partners',    page: 'partners' },
  { icon: 'settings',           label: 'Settings',     href: '/admin/settings' },
  { icon: 'person_add',         label: 'Add Member',   href: '/admin/add-member',  page: 'members' },
]

const pageTitle = (pathname: string): string => {
  const match = navItems.find(item => pathname === item.href)
  if (match) return match.label
  if (pathname === '/admin/attendance')                  return 'Attendance'
  if (pathname === '/admin/giving')                      return 'Giving'
  if (pathname === '/admin/partners')                    return 'Partnerships'
  if (pathname.startsWith('/admin/ministry-dashboard')) return 'Ministry Dashboard'
  return 'Admin Portal'
}

export default function AdminMobileTopBar() {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const [open, setOpen] = useState(false)

  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [permissions, setPermissions]   = useState<PageKey[]>([])
  const [isMinistryLeader, setIsMinistryLeader] = useState(false)
  const [loaded, setLoaded]             = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('admin_roles')
        .select('role, permissions')
        .eq('user_id', session.user.id)
        .single() as { data: { role: string; permissions: PageKey[] } | null }
      if (data) {
        setIsSuperAdmin(data.role === 'super_admin')
        setIsMinistryLeader(data.is_ministry_leader ?? false)
        setPermissions(data.permissions || [])
      }
      setLoaded(true)
    }
    load()
  }, [])

  const canAccess = (page?: PageKey) => {
  if (!page) return true
  if (isSuperAdmin) return true
  if (page === 'ministries' && isMinistryLeader) return true
  if (page === 'ministries' && isMinistryLeader) return true
return permissions.includes(page)
}

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/admin')
    setOpen(false)
  }

  const navigate = (href: string, allowed: boolean) => {
    if (!allowed) return
    router.push(href)
    setOpen(false)
  }

  return (
    <div className="lg:hidden">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#c6c6cf] px-4 py-3 flex items-center gap-3">
        <button onClick={() => setOpen(true)}
          className="w-9 h-9 bg-[#081534] text-white rounded-lg flex items-center justify-center shrink-0"
          aria-label="Open menu">
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
        <span className="text-[15px] font-bold text-[#081534] truncate">
          {pageTitle(pathname)}
        </span>
      </div>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#081534] z-50 flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Close */}
        <button onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
          aria-label="Close menu">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Brand */}
        <div className="px-6 py-7 flex flex-col items-center border-b border-white/10">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"
            alt="Logo" className="w-14 h-14 object-contain mb-3"
          />
          <h1 className="text-[17px] font-black text-[#fdc425] tracking-tight">Admin Portal</h1>
        </div>

        {/* Nav */}
        <nav className="flex-grow py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active  = pathname === item.href
            const allowed = !loaded || canAccess(item.page)

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.href, allowed)}
                disabled={!allowed}
                title={!allowed ? "You don't have access to this page" : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left
                  ${active && allowed
                    ? 'bg-[#fdc425] text-[#6d5200] font-bold'
                    : allowed
                    ? 'text-white/60 hover:bg-white/10 hover:text-white font-semibold cursor-pointer'
                    : 'text-white/20 cursor-not-allowed font-semibold'
                  }`}>
                <span className="material-symbols-outlined text-[20px]"
                  style={active && allowed ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="text-[13px] flex-1">{item.label}</span>
                {loaded && !allowed && (
                  <span className="material-symbols-outlined text-[14px] text-white/20">lock</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 px-3 py-3">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all text-left font-semibold">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-[13px]">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}