'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'
import MediaManagement from '@/components/MediaManagement'

type Ministry = {
  id: string
  name: string
  description: string
  leader: string
  member_count: number
  meeting_day: string
  icon: string
  icon_bg: string
  icon_color: string
  image?: string
}

type MinistryMember = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  whatsapp: string | null
  telegram: string | null
  guest_status: string
}

const isMediaMinistry = (name?: string) =>
  !!name && name.toLowerCase().includes('media')

const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors'

const waLink = (number: string, message: string) => {
  const clean = number.replace(/[^\d]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

const tgLink = (handle: string) => {
  const clean = handle.replace('@', '')
  return `https://t.me/${clean}`
}

const formatReminderDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })
}

const getNextWeekday = (weekdayName: string) => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const targetDay = days.indexOf(weekdayName.replace(/s$/, '').replace(/^./, c => c.toUpperCase()))
  if (targetDay === -1) return new Date().toISOString().split('T')[0]
  const today = new Date()
  const diff = (targetDay + 7 - today.getDay()) % 7
  const next = new Date(today)
  next.setDate(today.getDate() + (diff === 0 ? 7 : diff))
  return next.toISOString().split('T')[0]
}

// A "pure" ministry leader has no real general-admin permissions — same rule
// as lib/use-admin-permissions.ts. Used here to decide which empty-state and
// which back/sign-out control to show.
const isPermissionsEmpty = (perms: string[] | null | undefined) =>
  !perms || perms.length === 0 || (perms.length === 1 && perms[0] === 'dashboard')

function MinistryDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  const access = useAdminAccess()

  // ?ministry=<id> — set when Setman or an Admin jumps here from the Ministries page
  const requestedMinistryId = searchParams.get('ministry')

  const [myMinistries, setMyMinistries] = useState<Ministry[]>([])
  const [activeMinistry, setActiveMinistry] = useState<Ministry | null>(null)
  const [ministryMembers, setMinistryMembers] = useState<MinistryMember[]>([])
  const [allMembers, setAllMembers] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [addMemberSearch, setAddMemberSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<MinistryMember | null>(null)
  const [isPureLeader, setIsPureLeader] = useState(false)

  // Reminder state
  const [showReminderBar, setShowReminderBar] = useState(false)
  const [reminderDate, setReminderDate] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (access.loading) return

    const pureLeader = !access.isSuperAdmin && access.isMinistryLeader && isPermissionsEmpty(access.permissions)
    setIsPureLeader(pureLeader)

    loadMinistries(pureLeader)
  }, [access.loading, access.isSuperAdmin, access.isMinistryLeader, requestedMinistryId])

  const loadMinistries = async (pureLeader: boolean) => {
    setLoading(true)

    // ── Setman — can view ANY ministry freely, no restriction. ─────────
    if (access.isSuperAdmin) {
      if (requestedMinistryId) {
        const { data: ministry } = await supabase
          .from('ministries').select('*').eq('id', requestedMinistryId).single()
        if (ministry) {
          setMyMinistries([ministry])
          setActiveMinistry(ministry)
          setReminderDate(getNextWeekday(ministry.meeting_day || 'Sunday'))
          setLoading(false)
          return
        }
      }
      const { data: ministries } = await supabase
        .from('ministries').select('*').order('name', { ascending: true })
      setMyMinistries(ministries || [])
      if (ministries && ministries.length > 0) {
        setActiveMinistry(ministries[0])
        setReminderDate(getNextWeekday(ministries[0].meeting_day || 'Sunday'))
      }
      setLoading(false)
      return
    }

    // ── Everyone else (regular admins AND pure leaders) — only ministries
    // they are PERSONALLY listed as a leader for in ministry_leaders.
    // Having the general 'ministries' CRUD permission does NOT grant access
    // to other people's ministry dashboards — that stays Setman-only. ──
    const { data: links } = await supabase
      .from('ministry_leaders')
      .select('ministry_id')
      .eq('user_id', access.userId) as { data: { ministry_id: string }[] | null }

    if (!links || links.length === 0) {
      setMyMinistries([])
      setLoading(false)
      return
    }

    const ministryIds = links.map(l => l.ministry_id)

    // If they came in via ?ministry=<id>, only honor it if it's actually
    // one of their own ministries — otherwise fall back to their full list.
    if (requestedMinistryId && ministryIds.includes(requestedMinistryId)) {
      const { data: ministry } = await supabase
        .from('ministries').select('*').eq('id', requestedMinistryId).single()
      if (ministry) {
        setMyMinistries([ministry])
        setActiveMinistry(ministry)
        setReminderDate(getNextWeekday(ministry.meeting_day || 'Sunday'))
        setLoading(false)
        return
      }
    }

    const { data: ministries } = await supabase
      .from('ministries')
      .select('*')
      .in('id', ministryIds)

    setMyMinistries(ministries || [])
    if (ministries && ministries.length > 0) {
      setActiveMinistry(ministries[0])
      setReminderDate(getNextWeekday(ministries[0].meeting_day || 'Sunday'))
    }
    setLoading(false)
  }

  const loadMinistryMembers = async (ministryId: string) => {
    setLoadingMembers(true)
    const { data: links } = await supabase
      .from('ministry_members')
      .select('member_id')
      .eq('ministry_id', ministryId) as { data: { member_id: string }[] | null }

    if (!links || links.length === 0) {
      setMinistryMembers([])
      setLoadingMembers(false)
      return
    }

    const memberIds = links.map(l => l.member_id)
    const { data: members } = await supabase
      .from('members')
      .select('id, first_name, last_name, email, phone, whatsapp, telegram, guest_status')
      .in('id', memberIds)

    setMinistryMembers(members || [])
    setLoadingMembers(false)
  }

  useEffect(() => {
    if (activeMinistry) {
      loadMinistryMembers(activeMinistry.id)
      setReminderDate(getNextWeekday(activeMinistry.meeting_day || 'Sunday'))
    }
  }, [activeMinistry])

  const openAddMember = async () => {
    const { data } = await supabase.from('members').select('id, first_name, last_name').order('first_name')
    setAllMembers(data || [])
    setShowAddMember(true)
  }

  const handleAddMember = async (memberId: string) => {
    if (!activeMinistry) return
    setAdding(true)
    const { error } = await (supabase.from('ministry_members') as any).insert([{
      ministry_id: activeMinistry.id,
      member_id: memberId,
      added_by: access.userId,
    }])
    setAdding(false)
    if (error) {
      if (error.code === '23505') return showToast('This member is already in this ministry')
      return showToast('Error adding member')
    }
    showToast('Member added to ministry')
    setShowAddMember(false)
    setAddMemberSearch('')
    loadMinistryMembers(activeMinistry.id)
  }

  const handleRemoveMember = async () => {
    if (!removeTarget || !activeMinistry) return
    const { error } = await supabase
      .from('ministry_members')
      .delete()
      .eq('ministry_id', activeMinistry.id)
      .eq('member_id', removeTarget.id)
    if (error) return showToast('Error removing member')
    showToast('Member removed from ministry')
    setRemoveTarget(null)
    loadMinistryMembers(activeMinistry.id)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/admin')
  }

  const reminderMessage = (firstName: string) => {
    if (!activeMinistry || !reminderDate) return ''
    const dateLabel = formatReminderDate(reminderDate)
    return `Hello ${firstName}, this is a reminder that ${activeMinistry.name} has a meeting on ${dateLabel}. We look forward to seeing you there!`
  }

  const filteredAllMembers = allMembers.filter(m =>
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(addMemberSearch.toLowerCase()) &&
    !ministryMembers.some(mm => mm.id === m.id)
  )

  // Non-pure-leaders (Setman or Admins with ministries access) always have a
  // way back to the normal admin portal — never just Sign Out, since they DO
  // have a real dashboard to return to.
  const BackControl = () => (
    isPureLeader ? (
      <button onClick={handleSignOut}
        className="flex items-center gap-1.5 px-3 py-2 border border-[#c6c6cf] text-[#45464e] rounded-lg text-[12px] font-semibold hover:bg-[#f2f4f6] hover:text-[#ba1a1a] transition-colors">
        <span className="material-symbols-outlined text-[16px]">logout</span>
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    ) : (
      <button onClick={() => router.push(requestedMinistryId ? '/admin/ministries' : '/admin/dashboard')}
        className="flex items-center gap-1.5 px-3 py-2 border border-[#c6c6cf] text-[#45464e] rounded-lg text-[12px] font-semibold hover:bg-[#f2f4f6] transition-colors">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        <span className="hidden sm:inline">{requestedMinistryId ? 'Back to Ministries' : 'Back to Dashboard'}</span>
      </button>
    )
  )

  if (access.loading || loading) {
    return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center"><p className="text-[#45464e]">Loading...</p></div>
  }

  if (myMinistries.length === 0) {
    // Setman should structurally never hit this branch — they always have
    // every ministry available. This covers: pure leaders not yet linked,
    // AND regular admins who aren't a leader of anything (general ministries
    // CRUD permission does not grant ministry dashboard access by itself).
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">church</span>
          <h2 className="text-[18px] font-bold text-[#081534] mb-2">No Ministry Assigned</h2>
          <p className="text-[13px] text-[#45464e] mb-6">
            You haven't been assigned as a leader of any ministry yet. Contact Setman to get set up.
          </p>
          <div className="flex gap-3 justify-center">
            {isPureLeader ? (
              <button onClick={handleSignOut}
                className="px-6 py-2.5 border border-[#c6c6cf] text-[#45464e] rounded-lg text-[13px] font-bold hover:bg-white transition-colors">
                Sign Out
              </button>
            ) : (
              <button onClick={() => router.push('/admin/dashboard')}
                className="px-6 py-2.5 bg-[#081534] text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors">
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="">
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#081534]">
              Ministry Dashboard
              {!isPureLeader && (
                <span className="ml-2 text-[11px] font-bold text-[#785a00] bg-[#fdc425]/20 px-2 py-0.5 rounded-full align-middle">
                  {access.isSuperAdmin ? 'Setman View' : 'Admin View'}
                </span>
              )}
            </h2>
            <p className="text-[12px] text-[#45464e]">Manage your department's members and details.</p>
          </div>
          <div className="flex items-center gap-2">
            {myMinistries.length > 1 && (
              <select
                value={activeMinistry?.id}
                onChange={e => setActiveMinistry(myMinistries.find(m => m.id === e.target.value) || null)}
                className="bg-white border border-[#c6c6cf] rounded-lg px-3 py-2 text-[13px] font-semibold text-[#081534] focus:outline-none focus:border-[#081534]">
                {myMinistries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
            <BackControl />
          </div>
        </div>
      </div>

      {activeMinistry && (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Ministry header card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#081534] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {activeMinistry.icon}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-[24px] sm:text-[28px] font-bold mb-2">{activeMinistry.name}</h3>
              <p className="text-white/70 text-[14px] mb-4 max-w-xl">{activeMinistry.description}</p>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wide">Leader</p>
                  <p className="text-[14px] font-bold">{activeMinistry.leader}</p>
                </div>
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wide">Meeting Day</p>
                  <p className="text-[14px] font-bold">{activeMinistry.meeting_day}</p>
                </div>
                <div>
                  <p className="text-[11px] text-white/50 uppercase tracking-wide">Members</p>
                  <p className="text-[14px] font-bold">{ministryMembers.length}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Media ministry — Events & Gallery */}
          {isMediaMinistry(activeMinistry.name) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
              <MediaManagement viewerRole={access.isSuperAdmin ? 'super_admin' : isPureLeader ? 'ministry_leader' : 'admin'} />
            </motion.div>
          )}

          {/* Reminder bar */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="bg-white border border-[#fdc425] rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#785a00] text-[22px]">notifications_active</span>
                <div>
                  <p className="text-[14px] font-bold text-[#081534]">Send Meeting Reminders</p>
                  <p className="text-[12px] text-[#45464e]">Pick a date, then message each member individually.</p>
                </div>
              </div>
              <button onClick={() => setShowReminderBar(!showReminderBar)}
                className="px-4 py-2 bg-[#fdc425] text-[#6d5200] rounded-lg text-[12px] font-bold hover:brightness-105 transition-all">
                {showReminderBar ? 'Hide' : 'Set Up Reminder'}
              </button>
            </div>

            {showReminderBar && (
              <div className="mt-4 pt-4 border-t border-[#f2f4f6] flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
                  <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Meeting Date</label>
                  <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} className={inputCls} />
                </div>
                {reminderDate && (
                  <p className="text-[12px] text-[#785a00] font-semibold pb-3">
                    Reminders will mention: <span className="font-bold">{formatReminderDate(reminderDate)}</span>
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Members list */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] font-bold text-[#081534]">Department Members</h3>
              <button onClick={openAddMember}
                className="flex items-center gap-1.5 bg-[#081534] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[16px]">person_add</span> Add Member
              </button>
            </div>

            {loadingMembers ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-[#f2f4f6] rounded-xl animate-pulse" />)}</div>
            ) : ministryMembers.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-2">group_off</span>
                <p className="text-[#45464e] font-semibold text-[14px]">No members in this department yet</p>
                <p className="text-[12px] text-[#76777f] mt-1">Add members from the church congregation above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ministryMembers.map(m => (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-[#f7f9fb] rounded-xl gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#081534] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                        {m.first_name[0]}{m.last_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#191c1e] truncate">{m.first_name} {m.last_name}</p>
                        <p className="text-[11px] text-[#45464e] truncate">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:justify-end">
                      {(() => {
                        const waNumber = m.whatsapp || m.phone
                        return (
                          <>
                            {showReminderBar && reminderDate && waNumber && (
                              <a href={waLink(waNumber, reminderMessage(m.first_name))} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-[#fdc425]/20 text-[#785a00] hover:bg-[#fdc425]/30 transition-colors" title="Send reminder via WhatsApp">
                                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                              </a>
                            )}
                            {waNumber && (
                              <a href={waLink(waNumber, '')} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors" title={m.whatsapp ? 'Message on WhatsApp' : 'Message on WhatsApp (using phone number)'}>
                                <span className="material-symbols-outlined text-[18px]">chat</span>
                              </a>
                            )}
                            {m.telegram && (
                              <a href={tgLink(m.telegram)} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors" title="Message on Telegram">
                                <span className="material-symbols-outlined text-[18px]">send</span>
                              </a>
                            )}
                            {!waNumber && !m.telegram && (
                              <span className="text-[10px] text-[#76777f] italic px-2">No contact on file</span>
                            )}
                          </>
                        )
                      })()}
                      <button onClick={() => setRemoveTarget(m)}
                        className="p-2 rounded-lg text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors">
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Add member modal */}
      <AnimatePresence>
        {showAddMember && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowAddMember(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[440px] max-h-[70vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#c6c6cf]">
                  <h3 className="text-[18px] font-bold text-[#081534]">Add Member to {activeMinistry?.name}</h3>
                  <button onClick={() => setShowAddMember(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6]">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <div className="px-6 py-4">
                  <input value={addMemberSearch} onChange={e => setAddMemberSearch(e.target.value)}
                    placeholder="Search congregation..." className={inputCls} />
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
                  {filteredAllMembers.length === 0 ? (
                    <p className="text-[13px] text-[#76777f] text-center py-8">No matching members found</p>
                  ) : filteredAllMembers.map(m => (
                    <button key={m.id} onClick={() => handleAddMember(m.id)} disabled={adding}
                      className="w-full flex items-center justify-between p-3 bg-[#f7f9fb] rounded-lg hover:bg-[#f2f4f6] transition-colors disabled:opacity-50">
                      <span className="text-[13px] font-semibold text-[#191c1e]">{m.first_name} {m.last_name}</span>
                      <span className="material-symbols-outlined text-[18px] text-[#785a00]">add_circle</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Remove confirm */}
      <AnimatePresence>
        {removeTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setRemoveTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[380px] p-6 shadow-2xl">
                <h3 className="text-[16px] font-bold text-[#081534] text-center mb-2">Remove from Department?</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-6">
                  {removeTarget.first_name} {removeTarget.last_name} will be removed from {activeMinistry?.name}. This does not delete their church membership.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setRemoveTarget(null)}
                    className="flex-1 py-3 border border-[#c6c6cf] rounded-xl text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">
                    Cancel
                  </button>
                  <button onClick={handleRemoveMember}
                    className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-xl text-[13px] font-bold hover:opacity-90">
                    Remove
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

export default function MinistryDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <p className="text-[#45464e]">Loading...</p>
      </div>
    }>
      <MinistryDashboardContent />
    </Suspense>
  )
}