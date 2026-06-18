'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ALL_PAGES, PageKey, useAdminAccess } from '@/lib/use-admin-permissions'

const ROLES = ['admin'] // Only one Setman (super_admin) can ever exist — not creatable from this form
const roleLabel = (r: string) => r === 'super_admin' ? 'Setman' : 'Admin'

type AdminRole = {
  id: string
  user_id: string | null
  email: string
  full_name: string
  role: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  permissions: PageKey[]
}

const tabs = ['My Account', 'Team & Access']

export default function SettingsPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [activeTab, setActiveTab] = useState(0)
  const [adminEmail, setAdminEmail] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentRole, setCurrentRole] = useState('admin')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [team, setTeam] = useState<AdminRole[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // Password
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // Add team member request
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [invitePermissions, setInvitePermissions] = useState<PageKey[]>(['dashboard'])
  const [inviting, setInviting] = useState(false)

  // Editing permissions for an existing team member
  const [editingPermsFor, setEditingPermsFor] = useState<AdminRole | null>(null)
  const [editPermissions, setEditPermissions] = useState<PageKey[]>([])
  const [savingPerms, setSavingPerms] = useState(false)

  // Approval result modal
  const [approvalResult, setApprovalResult] = useState<{ email: string; password: string } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<AdminRole | null>(null)
  const [removing, setRemoving] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

  // Settings is open to every real admin (for their own account/password) — only
  // pure ministry leaders are blocked here, handled by passing no requirePage and
  // checking isPureMinistryLeader directly instead of gating on a 'settings' permission
  // that's intentionally never assignable via the checkbox list.
  const access = useAdminAccess()

  useEffect(() => {
    if (access.loading) return
    if (access.isPureMinistryLeader) { router.replace('/admin/ministry-dashboard'); return }
    setAdminEmail(access.email)
    setCurrentUserId(access.userId)
    setCurrentRole(access.role || 'admin')
    setIsSuperAdmin(access.isSuperAdmin)
    fetchTeam()
  }, [access.loading])

  const fetchTeam = async () => {
    setLoadingTeam(true)
    const { data, error } = await supabase.from('admin_roles').select('*').order('created_at', { ascending: true })
    if (!error && data) setTeam(data)
    setLoadingTeam(false)
  }

  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess(false)
    if (!pwForm.next || !pwForm.confirm) return setPwError('Fill in all fields.')
    if (pwForm.next !== pwForm.confirm) return setPwError('New passwords do not match.')
    if (pwForm.next.length < 8) return setPwError('Password must be at least 8 characters.')
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    setPwLoading(false)
    if (error) return setPwError(error.message)
    setPwSuccess(true)
    setPwForm({ current: '', next: '', confirm: '' })
  }

  // Anyone with admin access can submit a request — it goes in as 'pending' until Setman approves
  const handleRequestTeamMember = async () => {
    if (!inviteEmail || !inviteName) return showToast('Fill in name and email')
    if (invitePermissions.length === 0) return showToast('Select at least one page they can access')
    setInviting(true)
    const { error } = await (supabase.from('admin_roles') as any).insert([{
      email: inviteEmail.toLowerCase().trim(),
      full_name: inviteName,
      role: inviteRole,
      status: 'pending',
      permissions: invitePermissions,
      invited_by: currentUserId,
    }])
    setInviting(false)
    if (error) {
      if (error.code === '23505') return showToast('This email already has a request or account')
      return showToast('Error submitting request')
    }
    showToast(isSuperAdmin ? 'Request submitted — approve it below' : 'Request sent to Setman for approval')
    setInviteEmail(''); setInviteName(''); setInviteRole('admin'); setInvitePermissions(['dashboard'])
    fetchTeam()
  }

  const togglePermission = (page: PageKey, current: PageKey[], setter: (p: PageKey[]) => void) => {
    if (current.includes(page)) {
      setter(current.filter(p => p !== page))
    } else {
      setter([...current, page])
    }
  }

  const openEditPermissions = (member: AdminRole) => {
    setEditingPermsFor(member)
    setEditPermissions(member.permissions || ['dashboard'])
  }

  const saveEditedPermissions = async () => {
    if (!editingPermsFor) return
    if (editPermissions.length === 0) return showToast('Select at least one page')
    setSavingPerms(true)
    const { error } = await (supabase.from('admin_roles') as any).update({ permissions: editPermissions }).eq('id', editingPermsFor.id)
    setSavingPerms(false)
    if (error) return showToast('Error updating permissions')
    showToast(`${editingPermsFor.full_name}'s access updated`)
    setEditingPermsFor(null)
    fetchTeam()
  }

 const handleRoleChange = async (id: string, newRole: string) => {
  const { error } = await (supabase
    .from('admin_roles') as any)
    .update({ role: newRole })
    .eq('id', id)
  if (error) return showToast('Error updating role')
  showToast('Role updated')
  fetchTeam()
}

  const handleRemove = async (member: AdminRole) => {
    if (member.user_id === currentUserId) return showToast("You can't remove your own access")
    setRemoveTarget(member)
  }

  const confirmRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      const res = await fetch('/api/admin/remove-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_role_id: removeTarget.id, approver_user_id: currentUserId }),
      })
      const data = await res.json()
      setRemoving(false)
      if (!res.ok) {
        showToast(data.error || 'Error removing team member')
        return
      }
      showToast(`${removeTarget.full_name} removed — login deleted`)
      setRemoveTarget(null)
      fetchTeam()
    } catch {
      setRemoving(false)
      showToast('Network error — please try again')
    }
  }

  const handleApproveReject = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_role_id: id, action, approver_user_id: currentUserId }),
      })
      const data = await res.json()
      setProcessingId(null)

      if (!res.ok) return showToast(data.error || 'Something went wrong')

      if (action === 'approve') {
        setApprovalResult({ email: data.email, password: data.temp_password })
        showToast('Admin approved and login created')
      } else {
        showToast('Request rejected')
      }
      fetchTeam()
    } catch {
      setProcessingId(null)
      showToast('Network error — please try again')
    }
  }

  const roleColor = (role: string) => role === 'super_admin' ? 'bg-[#081534] text-white' : 'bg-[#f2f4f6] text-[#45464e]'
  const pendingRequests = team.filter(t => t.status === 'pending')
  const activeTeam = team.filter(t => t.status === 'approved')

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* Header */}
      <div className="bg-white border-b border-[#c6c6cf] px-4 sm:px-8 lg:px-10 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-[24px] font-bold text-[#081534]">Settings</h1>
            <p className="text-[13px] text-[#45464e] mt-1">Manage your account, admin access, and team permissions.</p>
          </div>
          {isSuperAdmin && pendingRequests.length > 0 && (
            <button onClick={() => setActiveTab(1)}
              className="relative flex items-center gap-2 bg-[#fdc425] text-[#6d5200] px-4 py-2.5 rounded-xl text-[13px] font-bold hover:brightness-105 transition-all shrink-0">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="hidden sm:inline">Pending Requests</span>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#ba1a1a] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {pendingRequests.length}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">

        {/* Tabs */}
        <div className="flex border-b border-[#c6c6cf] mb-8 gap-8">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`pb-3 text-[14px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-2
                ${activeTab === i ? 'text-[#081534] border-[#081534]' : 'text-[#45464e] border-transparent hover:text-[#081534]'}`}>
              {tab}
              {tab === 'Team & Access' && isSuperAdmin && pendingRequests.length > 0 && (
                <span className="w-5 h-5 bg-[#ba1a1a] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── MY ACCOUNT ── */}
        {activeTab === 0 && (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <h2 className="text-[16px] font-bold text-[#081534] mb-6">Admin Account</h2>
              <div className="flex items-center gap-4 p-4 bg-[#f2f4f6] rounded-xl">
                <div className="w-14 h-14 rounded-full bg-[#081534] text-white flex items-center justify-center text-[18px] font-bold shrink-0">
                  {adminEmail ? adminEmail[0].toUpperCase() : 'A'}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#081534]">{adminEmail || 'Loading...'}</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full ${roleColor(currentRole)}`}>
                    {roleLabel(currentRole)}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-[#45464e] mt-4">
                This is your admin account for theSpotlightChurch portal, managed via Supabase Auth.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <h2 className="text-[16px] font-bold text-[#081534] mb-2">Change Password</h2>
              <p className="text-[13px] text-[#45464e] mb-6">Update your admin login password. Must be at least 8 characters.</p>
              <div className="space-y-4 max-w-md">
                {[
                  { key: 'current', label: 'Current Password' },
                  { key: 'next', label: 'New Password' },
                  { key: 'confirm', label: 'Confirm New Password' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-2">{f.label}</label>
                    <input type="password" value={pwForm[f.key as keyof typeof pwForm]}
                      onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors" />
                  </div>
                ))}
              </div>
              {pwError && <p className="mt-4 text-[#ba1a1a] text-[13px] font-medium flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">error</span>{pwError}</p>}
              {pwSuccess && <p className="mt-4 text-green-600 text-[13px] font-medium flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">check_circle</span> Password updated successfully.</p>}
              <div className="mt-6">
                <button onClick={handleChangePassword} disabled={pwLoading}
                  className="bg-[#fdc425] text-[#6d5200] px-6 py-2.5 rounded-lg text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <h2 className="text-[16px] font-bold text-[#081534] mb-2">Sign Out</h2>
              <p className="text-[13px] text-[#45464e] mb-6">Sign out of the admin portal on this device.</p>
              <button onClick={async () => { await supabase.auth.signOut(); router.replace('/admin') }}
                className="px-6 py-2.5 border border-[#c6c6cf] text-[#45464e] rounded-lg text-[13px] font-bold hover:border-[#081534] hover:text-[#081534] transition-colors">
                Sign Out
              </button>
            </motion.div>
          </div>
        )}

        {/* ── TEAM & ACCESS ── */}
        {activeTab === 1 && (
          <div className="space-y-6">

            {/* Pending requests — Setman only */}
            {isSuperAdmin && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#fdc425] rounded-xl p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-[#785a00] text-[20px]">notifications_active</span>
                  <h2 className="text-[16px] font-bold text-[#081534]">Pending Admin Requests</h2>
                  {pendingRequests.length > 0 && (
                    <span className="px-2 py-0.5 bg-[#ba1a1a] text-white rounded-full text-[11px] font-bold">{pendingRequests.length}</span>
                  )}
                </div>

                {pendingRequests.length === 0 ? (
                  <p className="text-[13px] text-[#45464e]">No pending requests right now.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map(r => (
                      <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#ffdf9a]/30 border border-[#fdc425]/40 rounded-xl">
                        <div>
                          <p className="text-[14px] font-bold text-[#081534]">{r.full_name}</p>
                          <p className="text-[12px] text-[#5a4300]">{r.email} · Requesting {roleLabel(r.role)} access</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleApproveReject(r.id, 'reject')} disabled={processingId === r.id}
                            className="px-4 py-2 border border-[#c6c6cf] text-[#45464e] rounded-lg text-[12px] font-bold hover:bg-white transition-colors disabled:opacity-50">
                            Reject
                          </button>
                          <button onClick={() => handleApproveReject(r.id, 'approve')} disabled={processingId === r.id}
                            className="px-4 py-2 bg-[#081534] text-white rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                            {processingId === r.id ? 'Approving...' : 'Approve'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {isSuperAdmin && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
                <h2 className="text-[16px] font-bold text-[#081534] mb-6">Access Levels</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[#c6c6cf]">
                    <span className="inline-block px-3 py-1 rounded-full text-[12px] font-bold mb-3 bg-[#081534] text-white">Setman</span>
                    <p className="text-[13px] text-[#45464e]">Full access — members, settings, team approval, and Giving & Partners records.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[#c6c6cf]">
                    <span className="inline-block px-3 py-1 rounded-full text-[12px] font-bold mb-3 bg-[#f2f4f6] text-[#45464e]">Admin</span>
                    <p className="text-[13px] text-[#45464e]">Manage members, ministries, and attendance. Cannot access giving records or approve new admins.</p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <h2 className="text-[16px] font-bold text-[#081534] mb-6">Current Team</h2>
              {loadingTeam ? (
                <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-[#f2f4f6] rounded-xl animate-pulse" />)}</div>
              ) : activeTeam.length === 0 ? (
                <p className="text-[13px] text-[#45464e]">No approved team members yet.</p>
              ) : (
                <div className="space-y-3">
                  {activeTeam.map(m => (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f2f4f6] rounded-xl gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#081534] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                          {m.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#191c1e] truncate">
                            {m.full_name} {m.user_id === currentUserId && <span className="text-[11px] text-[#785a00]">(you)</span>}
                          </p>
                          <p className="text-[11px] text-[#45464e] truncate">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0">
                        {m.role === 'admin' && (
                          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#f2f4f6] text-[#45464e]">
                            {(m.permissions || []).length} page{(m.permissions || []).length === 1 ? '' : 's'}
                          </span>
                        )}
                        {isSuperAdmin && m.role === 'admin' && (
                          <button onClick={() => openEditPermissions(m)}
                            className="text-[11px] font-bold text-[#785a00] hover:underline">
                            Manage Access
                          </button>
                        )}
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${roleColor(m.role)}`}>{roleLabel(m.role)}</span>
                        {isSuperAdmin && m.user_id !== currentUserId && (
                          <button onClick={() => handleRemove(m)} className="text-[#45464e] hover:text-[#ba1a1a] transition-colors">
                            <span className="material-symbols-outlined text-[20px]">person_remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <h2 className="text-[16px] font-bold text-[#081534] mb-2">
                {isSuperAdmin ? 'Add Team Member' : 'Request New Team Member'}
              </h2>
              <p className="text-[13px] text-[#45464e] mb-6">
                {isSuperAdmin
                  ? 'Submit a request — it will appear above for your approval. Approving it creates their login automatically and emails their credentials.'
                  : 'This sends a request to Setman for approval. They will create the login and share the credentials once approved.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Full Name</label>
                  <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="e.g. Pastor John"
                    className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Email Address</label>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="staff@thespotlightchurch.org"
                    className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Role</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors">
                    {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                  </select>
                </div>
              </div>

              {inviteRole === 'admin' && (
                <div className="mt-5">
                  <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-2 block">Page Access</label>
                  <p className="text-[12px] text-[#76777f] mb-3">Choose which pages this admin can see and use.</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PAGES.filter(p => p.key !== 'giving').map(p => {
                      const active = invitePermissions.includes(p.key)
                      return (
                        <button key={p.key} type="button"
                          onClick={() => togglePermission(p.key, invitePermissions, setInvitePermissions)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all
                            ${active ? 'bg-[#081534] text-white border-[#081534]' : 'bg-white text-[#45464e] border-[#c6c6cf] hover:border-[#081534]'}`}>
                          <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <button onClick={handleRequestTeamMember} disabled={inviting}
                  className="bg-[#081534] text-white px-6 py-2.5 rounded-lg text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  {inviting ? 'Submitting...' : isSuperAdmin ? 'Submit & Review' : 'Send Request'}
                </button>
              </div>
            </motion.div>

          </div>
        )}
      </div>

      {/* Approval result modal — shows temp password */}
      <AnimatePresence>
        {approvalResult && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setApprovalResult(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[440px] p-6 sm:p-8 shadow-2xl">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-green-700 text-[24px]">check_circle</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#081534] text-center mb-2">Admin Approved</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-6">
                  Login created and credentials emailed to {approvalResult.email}. Here's a backup copy:
                </p>
                <div className="bg-[#f2f4f6] rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Email</p>
                    <p className="text-[14px] font-bold text-[#081534]">{approvalResult.email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Temporary Password</p>
                    <p className="text-[16px] font-bold text-[#081534] font-mono">{approvalResult.password}</p>
                  </div>
                </div>
                <p className="text-[11px] text-[#76777f] text-center mt-4">They should change this password after first login.</p>
                <button onClick={() => setApprovalResult(null)}
                  className="w-full mt-6 py-3 bg-[#081534] text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity">
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manage access (permissions) modal */}
      <AnimatePresence>
        {editingPermsFor && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setEditingPermsFor(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#c6c6cf]">
                  <div>
                    <h3 className="text-[18px] font-bold text-[#081534]">Manage Access</h3>
                    <p className="text-[12px] text-[#45464e] mt-0.5">{editingPermsFor.full_name} · {editingPermsFor.email}</p>
                  </div>
                  <button onClick={() => setEditingPermsFor(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6]">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <div className="px-6 py-6">
                  <p className="text-[12px] text-[#76777f] mb-4">Choose which pages this admin can see and use.</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PAGES.filter(p => p.key !== 'giving').map(p => {
                      const active = editPermissions.includes(p.key)
                      return (
                        <button key={p.key} type="button"
                          onClick={() => togglePermission(p.key, editPermissions, setEditPermissions)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all
                            ${active ? 'bg-[#081534] text-white border-[#081534]' : 'bg-white text-[#45464e] border-[#c6c6cf] hover:border-[#081534]'}`}>
                          <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-[#c6c6cf] flex gap-3">
                  <button onClick={() => setEditingPermsFor(null)}
                    className="flex-1 py-3 border border-[#c6c6cf] text-[#45464e] rounded-xl text-[13px] font-semibold hover:bg-[#f2f4f6]">
                    Cancel
                  </button>
                  <button onClick={saveEditedPermissions} disabled={savingPerms}
                    className="flex-1 py-3 bg-[#081534] text-white rounded-xl text-[13px] font-bold hover:opacity-90 disabled:opacity-40">
                    {savingPerms ? 'Saving...' : 'Save Access'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Remove confirm modal */}
      <AnimatePresence>
        {removeTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setRemoveTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[400px] p-6 shadow-2xl">
                <div className="w-12 h-12 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">person_remove</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#081534] text-center mb-2">Remove Team Access</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-6">
                  This will permanently remove <span className="font-bold text-[#081534]">{removeTarget.full_name}</span>'s access to the admin portal. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setRemoveTarget(null)}
                    className="flex-1 py-3 border border-[#c6c6cf] rounded-xl text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6] transition-colors">
                    Cancel
                  </button>
                  <button onClick={confirmRemove} disabled={removing}
                    className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
                    {removing ? 'Removing...' : 'Yes, Remove'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#081534] text-white px-5 py-3 rounded-full text-[13px] font-semibold shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fdc425] text-[16px]">check_circle</span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}