'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminAccess } from '@/lib/use-admin-permissions'

type Member = {
  id: string
  created_at: string
  first_name: string
  last_name: string
  email: string
  phone: string
  dob: string
  guest_status: string
}

const PAGE_SIZE = 12

const statusConfig: Record<string, { label: string; pill: string; dot: string; bar: string }> = {
  Member:      { label: 'Member',      pill: 'bg-[#fdc425]/20 text-[#785a00] border border-[#fdc425]/40', dot: 'bg-[#fdc425]',   bar: 'bg-[#fdc425]'   },
  Attending:   { label: 'Attending',   pill: 'bg-blue-50 text-blue-700 border border-blue-200',           dot: 'bg-blue-500',    bar: 'bg-blue-500'    },
  First_Timer: { label: 'First Timer', pill: 'bg-green-50 text-green-700 border border-green-200',        dot: 'bg-green-500',   bar: 'bg-green-500'   },
}

const statusOptions = ['All', 'First_Timer', 'Attending', 'Member']

const avatarColors = [
  'bg-[#081534]', 'bg-[#002960]', 'bg-[#1e2a4a]',
  'bg-purple-700', 'bg-blue-700', 'bg-green-700',
]
const avatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]

const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors'

// ── Member Detail Drawer ──────────────────────────────────────────────
function MemberDrawer({
  member, onClose, onEdit, onDeleted,
}: {
  member: Member
  onClose: () => void
  onEdit: (m: Member) => void
  onDeleted: () => void
}) {
  const supabase = getSupabaseClient()
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cfg = statusConfig[member.guest_status]
  const joinDate = new Date(member.created_at).toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const dob = member.dob
    ? new Date(member.dob).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const age = member.dob
    ? Math.floor((Date.now() - new Date(member.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('members').delete().eq('id', member.id)
    setDeleting(false)
    if (error) { alert('Error deleting member: ' + error.message); return }
    onDeleted()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"
      />

      <motion.aside
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="bg-[#081534] px-6 pt-8 pb-10 relative overflow-hidden shrink-0">
          <div className="absolute -right-8 -bottom-8 opacity-10">
            <span className="material-symbols-outlined text-[140px] text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-16 h-16 rounded-full ${avatarColor(member.first_name)} text-white flex items-center justify-center text-[22px] font-bold shrink-0`}>
              {member.first_name[0]}{member.last_name[0]}
            </div>
            <div>
              <h2 className="text-white text-[20px] font-bold leading-tight">
                {member.first_name} {member.last_name}
              </h2>
              <span className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg?.pill ?? 'bg-white/10 text-white border-white/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot ?? 'bg-white'}`} />
                {cfg?.label ?? member.guest_status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <div>
            <h3 className="text-[11px] font-bold text-[#45464e] uppercase tracking-widest mb-3">Contact Information</h3>
            <div className="space-y-3">
              {[
                { icon: 'mail', label: 'Email', value: member.email },
                { icon: 'call', label: 'Phone', value: member.phone || '—' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-3 bg-[#f7f9fb] rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-[#081534]/5 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#081534] text-[18px]">{item.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#45464e]">{item.label}</p>
                    <p className="text-[13px] font-semibold text-[#191c1e] break-all">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-[#45464e] uppercase tracking-widest mb-3">Personal Details</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'cake', label: 'Date of Birth', value: dob },
                { icon: 'person', label: 'Age', value: age ? `${age} years` : '—' },
                { icon: 'how_to_reg', label: 'Guest Status', value: cfg?.label ?? member.guest_status },
                { icon: 'schedule', label: 'Joined', value: new Date(member.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) },
              ].map(item => (
                <div key={item.label} className="p-3 bg-[#f7f9fb] rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[#45464e] text-[14px]">{item.icon}</span>
                    <p className="text-[10px] font-semibold text-[#45464e]">{item.label}</p>
                  </div>
                  <p className="text-[13px] font-bold text-[#191c1e]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-[#45464e] uppercase tracking-widest mb-3">Registration Timeline</h3>
            <div className="relative pl-5">
              <div className="absolute left-2 top-2 bottom-2 w-[2px] bg-[#f2f4f6]" />
              {[
                { icon: 'login', label: 'Registered', detail: joinDate, color: 'bg-green-500' },
                { icon: 'mail', label: 'Welcome email sent', detail: 'Via Brevo automation', color: 'bg-blue-500' },
                { icon: 'group', label: 'Added to congregation', detail: 'Spotlight Global family', color: 'bg-[#fdc425]' },
              ].map((t, i) => (
                <div key={i} className="relative flex items-start gap-3 mb-4 last:mb-0">
                  <div className={`absolute -left-3 w-4 h-4 rounded-full ${t.color} border-2 border-white flex items-center justify-center shrink-0`} />
                  <div className="pl-3">
                    <p className="text-[12px] font-bold text-[#191c1e]">{t.label}</p>
                    <p className="text-[11px] text-[#45464e]">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {confirmDelete && (
            <div className="p-4 bg-[#ffdad6] rounded-xl border border-[#ba1a1a]/20">
              <p className="text-[13px] font-bold text-[#ba1a1a] mb-1">Delete this member?</p>
              <p className="text-[12px] text-[#5a4300] mb-3">This permanently removes {member.first_name} {member.last_name} from the congregation list. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 border border-[#c6c6cf] rounded-lg text-[12px] font-semibold text-[#45464e] hover:bg-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2 bg-[#ba1a1a] text-white rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[#c6c6cf] p-4 flex gap-3 bg-white">
          <button onClick={() => onEdit(member)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#081534] text-white py-2.5 rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Member
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-2 bg-[#ffdad6] text-[#ba1a1a] px-4 py-2.5 rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </motion.aside>
    </>
  )
}

// ── Edit Member Modal ───────────────────────────────────────────────
function EditMemberModal({
  member, onClose, onSaved,
}: {
  member: Member
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = getSupabaseClient()
  const [form, setForm] = useState({
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone,
    dob: member.dob,
    guest_status: member.guest_status,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      setError('First name, last name, and email are required.')
      return
    }
    setSaving(true)
    setError('')
    const { error: updateError } = await (supabase
    .from('members') as any)
    .update(form)
    .eq('id', member.id)
    setSaving(false)
    if (updateError) {
      setError(updateError.code === '23505' ? 'This email is already in use.' : 'Error saving changes.')
      return
    }
    onSaved()
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#c6c6cf]">
            <h3 className="text-[18px] font-bold text-[#081534]">Edit Member</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6]">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="px-6 py-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">First Name</label>
                <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Last Name</label>
                <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Phone</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Date of Birth</label>
                <input type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Guest Status</label>
              <select value={form.guest_status} onChange={e => setForm(p => ({ ...p, guest_status: e.target.value }))} className={inputCls}>
                <option value="First_Timer">First Timer</option>
                <option value="Attending">Attending</option>
                <option value="Member">Member</option>
              </select>
            </div>
            {error && <p className="text-[#ba1a1a] text-[13px] font-medium">{error}</p>}
          </div>

          <div className="px-6 py-4 border-t border-[#c6c6cf] flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-[#c6c6cf] text-[#45464e] rounded-xl text-[13px] font-semibold hover:bg-[#f2f4f6]">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 bg-[#081534] text-white rounded-xl text-[13px] font-bold hover:opacity-90 disabled:opacity-40">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function MembersPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [members, setMembers]         = useState<Member[]>([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(0)
  const [search, setSearch]           = useState('')
  const [statusFilter, setFilter]     = useState('All')
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [view, setView]               = useState<'table' | 'grid'>('table')
  const [activeMember, setActive]     = useState<Member | null>(null)
  const [editTarget, setEditTarget]   = useState<Member | null>(null)
  const [toast, setToast]             = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const access = useAdminAccess('members')

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('members')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (search)
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      )
    if (statusFilter !== 'All')
      query = query.eq('guest_status', statusFilter)

    const { data, count } = await query
    setMembers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [page, search, statusFilter])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const toggleAll = () =>
    setSelected(selected.size === members.length ? new Set() : new Set(members.map(m => m.id)))

  const exportCSV = () => {
    const rows = selected.size > 0 ? members.filter(m => selected.has(m.id)) : members
    if (!rows.length) return
    const csv = [
      ['Date Joined', 'First Name', 'Last Name', 'Email', 'Phone', 'DOB', 'Status'],
      ...rows.map(m => [
        new Date(m.created_at).toLocaleDateString(),
        m.first_name, m.last_name, m.email, m.phone, m.dob, m.guest_status,
      ]),
    ].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `members-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleEditFromDrawer = (m: Member) => {
    setActive(null)
    setEditTarget(m)
  }

  const handleSaved = () => {
    setEditTarget(null)
    showToast('Member updated')
    fetchMembers()
  }

  const handleDeleted = () => {
    setActive(null)
    showToast('Member removed')
    fetchMembers()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const start = page * PAGE_SIZE + 1
  const end   = Math.min(page * PAGE_SIZE + members.length, total)

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf]">
        <div className="px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="pl-12 lg:pl-0">
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#081534]">Members</h2>
            <p className="text-[12px] text-[#45464e]">
              {loading ? 'Loading…' : `${total.toLocaleString()} people in the congregation`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => router.push('/admin/dashboard')}
              className="flex items-center gap-1.5 bg-white border border-[#c6c6cf] px-3 py-2 rounded-lg text-[12px] font-semibold text-[#45464e] hover:bg-[#eceef0] transition-all">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="flex bg-[#f2f4f6] rounded-lg p-1 gap-1">
              {(['table', 'grid'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all flex items-center gap-1.5
                    ${view === v ? 'bg-white text-[#081534] shadow-sm' : 'text-[#45464e]'}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {v === 'table' ? 'table_rows' : 'grid_view'}
                  </span>
                  <span className="hidden sm:inline capitalize">{v === 'table' ? 'Table' : 'Cards'}</span>
                </button>
              ))}
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 bg-white border border-[#c6c6cf] px-3 py-2 rounded-lg text-[12px] font-semibold text-[#45464e] hover:bg-[#eceef0] transition-all">
              <span className="material-symbols-outlined text-[16px]">download</span>
              {selected.size > 0 ? `Export (${selected.size})` : 'Export'}
            </button>
            <button onClick={() => router.push('/admin/add-member')}
              className="flex items-center gap-1.5 bg-[#081534] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Add Member
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="px-4 sm:px-8 pb-3 flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#76777f] text-[18px]">search</span>
            <input value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Search name, email or phone…"
              className="w-full pl-9 pr-4 py-2 bg-[#f2f4f6] border border-transparent focus:border-[#081534] focus:bg-white rounded-lg outline-none text-[13px] transition-all" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map(s => {
              const cfg = s !== 'All' ? statusConfig[s] : null
              const active = statusFilter === s
              return (
                <button key={s} onClick={() => { setFilter(s); setPage(0) }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all border
                    ${active ? 'bg-[#081534] text-white border-[#081534]' : 'bg-white text-[#45464e] border-[#c6c6cf] hover:border-[#081534]'}`}>
                  {cfg && !active && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                  {s === 'First_Timer' ? 'First Timer' : s}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">

        {/* Bulk action bar */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-4 bg-[#081534] text-white rounded-xl px-5 py-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold">{selected.size} member{selected.size > 1 ? 's' : ''} selected</span>
              <div className="flex gap-3">
                <button onClick={exportCSV}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all">
                  <span className="material-symbols-outlined text-[16px]">download</span> Export
                </button>
                <button onClick={() => setSelected(new Set())}
                  className="text-white/60 hover:text-white text-[12px] font-semibold transition-colors">
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABLE VIEW */}
        {view === 'table' && (
          <div className="bg-white border border-[#c6c6cf] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-[#f2f4f6] border-b border-[#c6c6cf]">
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox"
                        checked={members.length > 0 && selected.size === members.length}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded accent-[#081534]" />
                    </th>
                    {['Member', 'Contact', 'Date Joined', 'DOB', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold text-[#45464e] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f4f6]">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-4 py-3">
                          <div className="h-8 bg-[#f2f4f6] rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">manage_search</span>
                        <p className="text-[#45464e] font-bold text-[15px]">No members found</p>
                        <p className="text-[12px] text-[#76777f] mt-1">Try a different search or filter</p>
                      </td>
                    </tr>
                  ) : members.map((m, i) => {
                    const cfg = statusConfig[m.guest_status]
                    const isSelected = selected.has(m.id)
                    return (
                      <motion.tr key={m.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-[#fdc425]/5' : 'hover:bg-[#f7f9fb]'}`}>
                        <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelect(m.id) }}>
                          <input type="checkbox" checked={isSelected}
                            onChange={() => toggleSelect(m.id)}
                            className="w-4 h-4 rounded accent-[#081534]" />
                        </td>
                        <td className="px-4 py-3" onClick={() => setActive(m)}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${avatarColor(m.first_name)} text-white flex items-center justify-center text-[11px] font-bold shrink-0`}>
                              {m.first_name[0]}{m.last_name[0]}
                            </div>
                            <p className="text-[13px] font-bold text-[#081534] whitespace-nowrap">
                              {m.first_name} {m.last_name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={() => setActive(m)}>
                          <p className="text-[12px] text-[#45464e]">{m.email}</p>
                          <p className="text-[11px] text-[#76777f]">{m.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[#45464e] whitespace-nowrap" onClick={() => setActive(m)}>
                          {new Date(m.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[#45464e] whitespace-nowrap" onClick={() => setActive(m)}>
                          {m.dob ? new Date(m.dob).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3" onClick={() => setActive(m)}>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg?.pill ?? 'bg-[#eceef0] text-[#45464e] border-transparent'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot ?? 'bg-[#c6c6cf]'}`} />
                            {cfg?.label ?? m.guest_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setActive(m)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#45464e] hover:bg-[#f2f4f6] hover:text-[#081534] transition-all">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-[#f2f4f6] flex items-center justify-between bg-[#f7f9fb]">
              <span className="text-[12px] text-[#45464e]">
                {loading ? '—' : total === 0 ? 'No results' : `${start}–${end} of ${total}`}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="w-8 h-8 rounded-lg border border-[#c6c6cf] flex items-center justify-center text-[#45464e] hover:bg-white hover:text-[#081534] disabled:opacity-40 transition-all">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="text-[12px] font-semibold text-[#45464e] px-2">{page + 1} / {totalPages || 1}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="w-8 h-8 rounded-lg border border-[#c6c6cf] flex items-center justify-center text-[#45464e] hover:bg-white hover:text-[#081534] disabled:opacity-40 transition-all">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GRID / CARD VIEW */}
        {view === 'grid' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-[#c6c6cf] p-5 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-[#f2f4f6] mb-4" />
                    <div className="h-4 bg-[#f2f4f6] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#f2f4f6] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">manage_search</span>
                <p className="text-[#45464e] font-bold">No members found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map((m, i) => {
                  const cfg = statusConfig[m.guest_status]
                  const isSelected = selected.has(m.id)
                  return (
                    <motion.div key={m.id}
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className={`bg-white border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5
                        ${isSelected ? 'border-[#081534] ring-2 ring-[#081534]/10' : 'border-[#c6c6cf]'}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-full ${avatarColor(m.first_name)} text-white flex items-center justify-center text-[14px] font-bold`}
                          onClick={() => setActive(m)}>
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                        <div onClick={e => { e.stopPropagation(); toggleSelect(m.id) }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer
                            ${isSelected ? 'bg-[#081534] border-[#081534]' : 'border-[#c6c6cf]'}`}>
                          {isSelected && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                        </div>
                      </div>

                      <div onClick={() => setActive(m)}>
                        <p className="text-[14px] font-bold text-[#081534] mb-0.5">{m.first_name} {m.last_name}</p>
                        <p className="text-[11px] text-[#45464e] truncate mb-3">{m.email}</p>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg?.pill ?? 'bg-[#eceef0] text-[#45464e] border-transparent'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot ?? 'bg-[#c6c6cf]'}`} />
                            {cfg?.label ?? m.guest_status}
                          </span>
                          <span className="text-[10px] text-[#76777f]">
                            {new Date(m.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#c6c6cf] text-[13px] font-semibold text-[#45464e] hover:bg-white disabled:opacity-40 transition-all">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span> Prev
                </button>
                <span className="text-[13px] text-[#45464e]">{page + 1} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#c6c6cf] text-[13px] font-semibold text-[#45464e] hover:bg-white disabled:opacity-40 transition-all">
                  Next <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Member detail drawer */}
      <AnimatePresence>
        {activeMember && (
          <MemberDrawer
            member={activeMember}
            onClose={() => setActive(null)}
            onEdit={handleEditFromDrawer}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editTarget && (
          <EditMemberModal
            member={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={handleSaved}
          />
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