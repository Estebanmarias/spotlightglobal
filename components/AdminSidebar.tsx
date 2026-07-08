'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  { icon: 'analytics',          label: 'Analytics',    href: '/admin/analytics',   page: 'analytics' },
  { icon: 'volunteer_activism', label: 'Giving',       href: '/admin/giving',      page: 'giving' },
  { icon: 'handshake',          label: 'Partners',     href: '/admin/partner',     page: 'partners' },
  { icon: 'campaign',           label: 'Messaging',    href: '/admin/messaging',   page: 'messaging' },
  { icon: 'settings',           label: 'Settings',     href: '/admin/settings' },
]

export default function AdminSidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()

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
        .select('role, permissions, is_ministry_leader')
        .eq('user_id', session.user.id)
        .single() as { data: { role: string; permissions: PageKey[]; is_ministry_leader: boolean } | null }

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
    return permissions.includes(page)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/admin')
  }

  const navigate = (href: string, allowed: boolean) => {
    if (!allowed) return
    router.push(href)
  }

  return (
    <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 z-50 bg-[#081534] flex-col">

      {/* Brand */}
      <div className="px-6 py-7 flex flex-col items-center border-b border-white/10">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"
          alt="Logo" className="w-16 h-16 object-contain mb-3"
        />
        <h1 className="text-[18px] font-black text-[#fdc425] tracking-tight">Admin Portal</h1>
        <p className="text-[12px] text-white/50 mt-0.5">Central Management</p>
      </div>

      {/* Nav */}
      <nav className="flex-grow py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active  = pathname === item.href || pathname.startsWith(item.href + '/')
          const allowed = !loaded || canAccess(item.page)

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.href, allowed)}
              disabled={!allowed}
              title={!allowed ? 'You don\'t have access to this page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left
                ${active && allowed
                  ? 'bg-[#fdc425] text-[#6d5200] font-bold shadow-sm'
                  : allowed
                  ? 'text-white/60 hover:bg-white/10 hover:text-white font-semibold cursor-pointer'
                  : 'text-white/20 cursor-not-allowed font-semibold'
                }`}>
              <span
                className="material-symbols-outlined text-[20px]"
                style={active && allowed ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="text-[13px] flex-1">{item.label}</span>
              {/* Lock icon for restricted pages */}
              {loaded && !allowed && (
                <span className="material-symbols-outlined text-[14px] text-white/20">lock</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        {canAccess('members') && (
          <button
            onClick={() => router.push('/admin/add-member')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left
              ${pathname === '/admin/add-member'
                ? 'bg-[#fdc425] text-[#6d5200] font-bold'
                : 'text-white/60 hover:bg-white/10 hover:text-white font-semibold'}`}>
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="text-[13px]">Add New Member</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all text-left font-semibold">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-[13px]">Logout</span>
        </button>
      </div>
    </aside>
  )
}