// lib/use-admin-permissions.ts
// Reusable hook for checking the logged-in admin's role + page permissions.
// Place this file at lib/use-admin-permissions.ts

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

export type PageKey = 'dashboard' | 'members' | 'attendance' | 'ministries' | 'analytics' | 'giving' | 'settings'

export const ALL_PAGES: { key: PageKey; label: string; icon: string }[] = [
  { key: 'dashboard',  label: 'Dashboard',  icon: 'space_dashboard' },
  { key: 'members',    label: 'Members',    icon: 'group' },
  { key: 'attendance', label: 'Attendance', icon: 'fact_check' },
  { key: 'ministries', label: 'Ministries', icon: 'church' },
  { key: 'analytics',  label: 'Analytics',  icon: 'analytics' },
  { key: 'giving',     label: 'Giving & Partners', icon: 'volunteer_activism' },
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
  canAccess: (page: PageKey) => boolean
}

/**
 * Use this hook at the top of any /admin/* page.
 * - Redirects to /admin if not logged in.
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
        if (requirePage && !isSuper && !(roleData.permissions || []).includes(requirePage)) {
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

  return {
    loading,
    userId,
    email,
    fullName,
    role,
    isSuperAdmin: role === 'super_admin',
    permissions,
    isMinistryLeader,
    canAccess: (page: PageKey) => role === 'super_admin' || permissions.includes(page),
  }
}