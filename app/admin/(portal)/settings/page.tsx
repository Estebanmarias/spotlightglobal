'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

const ROLES = ['admin', 'super_admin']
const roleLabel = (r: string) => r === 'super_admin' ? 'Super Admin' : 'Admin'

type AdminRole = {
  id: string
  user_id: string | null
  email: string
  full_name: string
  role: string
}

const tabs = ['My Account', 'Team & Access']

export default function SettingsPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [activeTab, setActiveTab] = useState(0)
  const [adminEmail, setAdminEmail] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentRole, setCurrentRole] = useState('admin')
  const [team, setTeam] = useState<AdminRole[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // Password
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // Add team member (record only — actual Supabase Auth user must be created manually first)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [inviting, setInviting] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/admin'); return }
      setAdminEmail(data.session.user.email ?? '')
      setCurrentUserId(data.session.user.id)

      const { data: roleData } = await supabase
        .from('admin_roles').select('role').eq('user_id', data.session.user.id).single() as { data: { role: string } | null }
      if (roleData?.role) setCurrentRole(roleData.role)

      fetchTeam()
    })
  }, [])

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

  const handleAddTeamRecord = async () => {
    if (!inviteEmail || !inviteName) return showToast('Fill in name and email')
    setInviting(true)
    const { error } = await supabase.from('admin_roles').insert([{
      email: inviteEmail.toLowerCase().trim(),
      full_name: inviteName,
      role: inviteRole,
      invited_by: currentUserId,
    }] as any)
    setInviting(false)
    if (error) {
      if (error.code === '23505') return showToast('This email is already in the team list')
      return showToast('Error adding team member')
    }
    showToast('Team record added — create their Supabase Auth login next')
    setInviteEmail(''); setInviteName(''); setInviteRole('admin')
    fetchTeam()
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    const { error } = await supabase.from('admin_roles').update({ role: newRole } as any).eq('id', id)
    if (error) return showToast('Error updating role')
    showToast('Role updated')
    fetchTeam()
  }

  const handleRemove = async (id: string, userId: string | null) => {
    if (userId === currentUserId) return showToast("You can't remove your own access")
    const { error } = await supabase.from('admin_roles').delete().eq('id', id)
    if (error) return showToast('Error removing team member')
    showToast('Team member removed')
    fetchTeam()
  }

  const roleColor = (role: string) => role === 'super_admin' ? 'bg-[#081534] text-white' : 'bg-[#f2f4f6] text-[#45464e]'

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* Header */}
      <div className="bg-white border-b border-[#c6c6cf] px-4 sm:px-8 lg:px-10 py-6">
        <div className="pl-12 lg:pl-0">
          <h1 className="text-[24px] font-bold text-[#081534]">theSpotlightChurch — Settings</h1>
          <p className="text-[13px] text-[#45464e] mt-1">Manage your account, admin access, and team permissions.</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">

        {/* Tabs */}
        <div className="flex border-b border-[#c6c6cf] mb-8 gap-8">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`pb-3 text-[14px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors
                ${activeTab === i ? 'text-[#081534] border-[#081534]' : 'text-[#45464e] border-transparent hover:text-[#081534]'}`}>
              {tab}
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

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <h2 className="text-[16px] font-bold text-[#081534] mb-6">Access Levels</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#c6c6cf]">
                  <span className="inline-block px-3 py-1 rounded-full text-[12px] font-bold mb-3 bg-[#081534] text-white">Super Admin</span>
                  <p className="text-[13px] text-[#45464e]">Full access — members, settings, team management, and Giving & Partners records.</p>
                </div>
                <div className="p-4 rounded-xl border border-[#c6c6cf]">
                  <span className="inline-block px-3 py-1 rounded-full text-[12px] font-bold mb-3 bg-[#f2f4f6] text-[#45464e]">Admin</span>
                  <p className="text-[13px] text-[#45464e]">Manage members, ministries, and attendance. No access to giving records or team management.</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
              <h2 className="text-[16px] font-bold text-[#081534] mb-6">Current Team</h2>
              {loadingTeam ? (
                <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-[#f2f4f6] rounded-xl animate-pulse" />)}</div>
              ) : team.length === 0 ? (
                <p className="text-[13px] text-[#45464e]">No team records yet.</p>
              ) : (
                <div className="space-y-3">
                  {team.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 bg-[#f2f4f6] rounded-xl gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#081534] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                          {m.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#191c1e] truncate">
                            {m.full_name} {m.user_id === currentUserId && <span className="text-[11px] text-[#785a00]">(you)</span>}
                          </p>
                          <p className="text-[11px] text-[#45464e] truncate">{m.email}</p>
                          {!m.user_id && <p className="text-[10px] text-[#ba1a1a] mt-0.5">No Supabase Auth login linked yet</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                          className="text-[12px] font-bold bg-white border border-[#c6c6cf] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#081534]">
                          {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                        </select>
                        {m.user_id !== currentUserId && (
                          <button onClick={() => handleRemove(m.id, m.user_id)} className="text-[#45464e] hover:text-[#ba1a1a] transition-colors">
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
              <h2 className="text-[16px] font-bold text-[#081534] mb-2">Add Team Member</h2>
              <p className="text-[13px] text-[#45464e] mb-6">
                This adds them to the role list. They still need a Supabase Auth login created manually in the Supabase dashboard with this exact email before they can sign in.
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
              <div className="mt-6">
                <button onClick={handleAddTeamRecord} disabled={inviting}
                  className="bg-[#081534] text-white px-6 py-2.5 rounded-lg text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  {inviting ? 'Adding...' : 'Add to Team'}
                </button>
              </div>
            </motion.div>

          </div>
        )}
      </div>

      {toast && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#081534] text-white px-5 py-3 rounded-full text-[13px] font-semibold shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[#fdc425] text-[16px]">check_circle</span>
          {toast}
        </motion.div>
      )}
    </div>
  )
}