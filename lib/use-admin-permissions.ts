// lib/use-admin-permissions.ts
// Reusable hook for checking the logged-in admin's role + page permissions.
// Place this file at lib/use-admin-permissions.ts

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export type PageKey = 'dashboard' | 'members' | 'attendance' | 'ministries' | 'analytics' | 'giving' | 'partners' | 'settings'

export const ALL_PAGES: { key: PageKey; label: string; icon: string }[] = [
  { key: 'dashboard',  label: 'Dashboard',         icon: 'space_dashboard' },
  { key: 'members',    label: 'Members',            icon: 'group' },
  { key: 'attendance', label: 'Attendance',         icon: 'fact_check' },
  { key: 'ministries', label: 'Ministries',         icon: 'church' },
  { key: 'analytics',  label: 'Analytics',          icon: 'analytics' },
  { key: 'giving',     label: 'Giving Records',     icon: 'volunteer_activism' },
  { key: 'partners',   label: 'Partner Submissions',icon: 'handshake' },
]

type AdminAccess = {
  loading: boolean
  userId: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin' | ''
  isSuperAdmin: boolean
  permissions: PageKey[]
  isMinistryLeader: boolean
  isPureMinistryLeader: boolean
  canAccess: (page: PageKey) => boolean
}

// A "pure" ministry leader is someone flagged is_ministry_leader = true who was never
// given real general-admin permissions by Setman — their permissions array is empty or
// just the default placeholder. These users get locked to /admin/ministry-dashboard only,
// and should never be aware the general admin portal exists.
const isPermissionsEmpty = (perms: PageKey[]) =>
  !perms || perms.length === 0 || (perms.length === 1 && perms[0] === 'dashboard')

/**
 * Use this hook at the top of any /admin/* page.
 * - Redirects to /admin if not logged in.
 * - If the user is a "pure" ministry leader (leader-only, no general admin permissions),
 *   they are locked to /admin/ministry-dashboard and redirected away from every other page,
 *   including this hook's own host page if it isn't ministry-dashboard itself.
 * - If `requirePage` is given and the admin lacks that permission (and isn't super_admin),
 *   redirects to /admin/dashboard.
 */
export function useAdminAccess(requirePage?: PageKey): AdminAccess {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'super_admin' | ''>('')
  const [permissions, setPermissions] = useState<PageKey[]>([])
  const [isMinistryLeader, setIsMinistryLeader] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/admin'); return }
      setUserId(data.session.user.id)
      setEmail(data.session.user.email ?? '')

      const { data: roleData } = await supabase
        .from('admin_roles')
        .select('role, full_name, permissions, is_ministry_leader')
        .eq('user_id', data.session.user.id)
        .single() as { data: { role: 'admin' | 'super_admin'; full_name: string; permissions: PageKey[]; is_ministry_leader: boolean } | null }

      if (roleData) {
        setRole(roleData.role)
        setFullName(roleData.full_name)
        setPermissions(roleData.permissions || [])
        setIsMinistryLeader(roleData.is_ministry_leader || false)

        const isSuper = roleData.role === 'super_admin'
        const pureLeader = !isSuper && roleData.is_ministry_leader && isPermissionsEmpty(roleData.permissions || [])

        // Pure ministry leaders are locked to /admin/ministry-dashboard, full stop.
        // Any page guarded by this hook (other than ministry-dashboard itself, which
        // never passes a requirePage of a general PageKey) redirects them away.
        if (pureLeader && requirePage) {
          router.replace('/admin/ministry-dashboard')
          return
        }

        if (requirePage && !isSuper && !pureLeader && !(roleData.permissions || []).includes(requirePage)) {
          router.replace('/admin/dashboard')
          return
        }
      } else {
        // No admin_roles record at all — block access entirely
        router.replace('/admin')
        return
      }

      setLoading(false)
    })
  }, [])

  const pureMinistryLeader = role !== 'super_admin' && isMinistryLeader && isPermissionsEmpty(permissions)

  return {
    loading,
    userId,
    email,
    fullName,
    role,
    isSuperAdmin: role === 'super_admin',
    permissions,
    isMinistryLeader,
    isPureMinistryLeader: pureMinistryLeader,
    canAccess: (page: PageKey) => role === 'super_admin' || (!pureMinistryLeader && permissions.includes(page)),
  }
}