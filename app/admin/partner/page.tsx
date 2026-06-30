'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'

type PartnerSubmission = {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  gender: string | null
  marital_status: string | null
  contact_prefs: string[] | null
  telegram_handle: string | null
  package: string | null
  other_amount: number | null
  extra_info: string | null
  status: string
}

const STATUSES = ['new', 'contacted', 'confirmed', 'inactive']

const statusStyle = (status: string) => {
  switch (status) {
    case 'new':       return 'bg-[#fdc425]/20 text-[#785a00]'
    case 'contacted': return 'bg-[#d8e2ff] text-[#002960]'
    case 'confirmed': return 'bg-green-100 text-green-800'
    case 'inactive':  return 'bg-[#f2f4f6] text-[#45464e]'
    default:          return 'bg-[#f2f4f6] text-[#45464e]'
  }
}

export default function PartnersAdminPage() {
  const router   = useRouter()
  const supabase = getSupabaseClient()
  const access   = useAdminAccess()

  const [submissions, setSubmissions] = useState<PartnerSubmission[]>([])
  const [loading, setLoading]         = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')
  const [selected, setSelected]       = useState<PartnerSubmission | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PartnerSubmission | null>(null)
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [updatingId, setUpdatingId]   = useState<string | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (access.loading) return
    if (access.isSuperAdmin) fetchSubmissions()
  }, [access.loading])

  const fetchSubmissions = async () => {
    setLoading(true)
    const { data, error } = await (supabase.from('partner_submissions') as any)
      .select('*').order('created_at', { ascending: false })
    if (!error && data) setSubmissions(data)
    setLoading(false)
  }

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id)
    const { error } = await (supabase.from('partner_submissions') as any)
      .update({ status }).eq('id', id)
    if (error) { showToast('Failed to update status', 'error') }
    else {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
      if (selected?.id === id) setSelected(s => s ? { ...s, status } : s)
      showToast('Status updated')
    }
    setUpdatingId(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await (supabase.from('partner_submissions') as any)
      .delete().eq('id', deleteTarget.id)
    if (error) { showToast('Failed to delete', 'error'); setDeleteTarget(null); return }
    setSubmissions(prev => prev.filter(s => s.id !== deleteTarget.id))
    if (selected?.id === deleteTarget.id) setSelected(null)
    setDeleteTarget(null)
    showToast('Submission removed')
  }

  const filtered = filterStatus === 'All'
    ? submissions
    : submissions.filter(s => s.status === filterStatus)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })

  const packageLabel = (s: PartnerSubmission) =>
    s.package ?? (s.other_amount ? `₦${Number(s.other_amount).toLocaleString()} (custom)` : '—')

  // Stats
  const totalCount     = submissions.length
  const newCount       = submissions.filter(s => s.status === 'new').length
  const confirmedCount = submissions.filter(s => s.status === 'confirmed').length
  const thisMonth      = submissions.filter(s => {
    const d = new Date(s.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // ── Access guard ───────────────────────────────────────────────
  if (access.loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <p className="text-[#45464e]">Loading...</p>
      </div>
    )
  }

  if (!access.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">lock</span>
          <h2 className="text-[18px] font-bold text-[#081534] mb-2">Restricted Access</h2>
          <p className="text-[13px] text-[#45464e] mb-6">Partner submissions are only visible to Super Admin accounts.</p>
          <button onClick={() => router.push('/admin/dashboard')}
            className="px-6 py-2.5 bg-[#081534] text-white rounded-lg text-[13px] font-bold hover:opacity-90">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 pl-12 lg:pl-0">
            <button onClick={() => router.push('/admin/dashboard')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 border border-[#c6c6cf] text-[#45464e] rounded-lg text-[13px] font-semibold hover:bg-[#f2f4f6] hover:text-[#081534] transition-colors shrink-0">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div>
              <h2 className="text-[20px] sm:text-[24px] font-bold text-[#081534]">Partnership Submissions</h2>
              <p className="text-[12px] text-[#45464e]">All partner form submissions from the public site.</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-[#c6c6cf] text-[#45464e] rounded-lg text-[12px] font-semibold hover:bg-[#f2f4f6] hover:text-[#081534] transition-colors w-fit">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Partners',  value: totalCount,     icon: 'handshake',        color: 'bg-[#081534]' },
            { label: 'New This Month',  value: thisMonth,      icon: 'calendar_today',   color: 'bg-[#fdc425]' },
            { label: 'Awaiting Contact',value: newCount,       icon: 'mark_email_unread', color: 'bg-[#002960]' },
            { label: 'Confirmed',       value: confirmedCount, icon: 'verified',          color: 'bg-green-700' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-[#c6c6cf] p-4 sm:p-5 rounded-xl hover:shadow-md transition-all">
              <div className={`p-2 rounded-lg ${s.color} text-white inline-block mb-3`}>
                <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
              </div>
              <p className="text-[10px] text-[#45464e] uppercase tracking-widest font-bold">{s.label}</p>
              <p className="text-[20px] sm:text-[24px] font-bold text-[#081534] mt-1">
                {loading ? '—' : s.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden">

          {/* Filter bar */}
          <div className="p-5 border-b border-[#c6c6cf] flex flex-wrap gap-2">
            {['All', ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-colors
                  ${filterStatus === s ? 'bg-[#081534] text-white' : 'bg-[#f2f4f6] text-[#45464e] hover:bg-[#eceef0]'}`}>
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-[#f2f4f6] rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-2">handshake</span>
              <p className="text-[#45464e] font-semibold text-[14px]">No submissions yet</p>
              <p className="text-[12px] text-[#76777f] mt-1">Partner form submissions will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-[#f2f4f6] border-b border-[#c6c6cf]">
                  <tr>
                    {['Name', 'Package', 'Contact', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-[11px] font-bold text-[#45464e] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f4f6]">
                  {filtered.map(s => (
                    <tr key={s.id}
                      className="hover:bg-[#f7f9fb] transition-colors cursor-pointer"
                      onClick={() => setSelected(s)}>
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-semibold text-[#081534]">{s.full_name}</p>
                        <p className="text-[11px] text-[#45464e]">{s.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-semibold text-[#081534]">{packageLabel(s)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[12px] text-[#45464e]">{s.phone}</p>
                        <p className="text-[11px] text-[#76777f]">{s.contact_prefs?.join(', ') || '—'}</p>
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={s.status}
                          disabled={updatingId === s.id}
                          onChange={e => handleStatusChange(s.id, e.target.value)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full border-0 cursor-pointer capitalize outline-none ${statusStyle(s.status)}`}>
                          {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#45464e]">{formatDate(s.created_at)}</td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setDeleteTarget(s)}
                          className="p-1.5 text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded transition-colors">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-white shadow-2xl overflow-y-auto">

              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#c6c6cf] sticky top-0 bg-white z-10">
                <h3 className="text-[16px] font-bold text-[#081534]">Partner Details</h3>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6]">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">

                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#081534] flex items-center justify-center shrink-0">
                    <span className="text-white text-[22px] font-bold">
                      {selected.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[17px] font-bold text-[#081534]">{selected.full_name}</p>
                    <p className="text-[12px] text-[#45464e]">{selected.gender || '—'} · {selected.marital_status || '—'}</p>
                  </div>
                </div>

                {/* Status changer */}
                <div className="p-4 bg-[#f7f9fb] rounded-xl border border-[#eceef0]">
                  <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(st => (
                      <button key={st} onClick={() => handleStatusChange(selected.id, st)}
                        disabled={updatingId === selected.id}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold capitalize transition-all
                          ${selected.status === st ? 'bg-[#081534] text-white' : 'bg-white border border-[#c6c6cf] text-[#45464e] hover:border-[#081534]'}`}>
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Contact</p>
                  {[
                    { icon: 'mail',  label: 'Email',   value: selected.email,   href: `mailto:${selected.email}` },
                    { icon: 'phone', label: 'Phone',   value: selected.phone,   href: `tel:${selected.phone}` },
                    { icon: 'send',  label: 'Telegram',value: selected.telegram_handle || '—', href: selected.telegram_handle ? `https://t.me/${selected.telegram_handle.replace('@','')}` : undefined },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-[#f7f9fb] rounded-lg border border-[#eceef0]">
                      <div className="w-8 h-8 rounded-lg bg-[#081534] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-[14px]">{item.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#76777f] uppercase tracking-wide">{item.label}</p>
                        {item.href && item.value !== '—' ? (
                          <a href={item.href} target="_blank" rel="noreferrer"
                            className="text-[13px] font-semibold text-[#081534] hover:text-[#fdc425] transition-colors truncate block">
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-[13px] font-semibold text-[#45464e]">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {selected.contact_prefs && selected.contact_prefs.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <p className="text-[11px] text-[#76777f] w-full">Preferred contact:</p>
                      {selected.contact_prefs.map(p => (
                        <span key={p} className="px-2.5 py-1 bg-[#f2f4f6] text-[#45464e] rounded-full text-[11px] font-semibold">{p}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Package */}
                <div className="p-4 bg-[#081534] rounded-xl text-center">
                  <p className="text-white/60 text-[11px] uppercase tracking-widest mb-1">Partnership Package</p>
                  <p className="text-[#fdc425] text-[18px] font-bold">{packageLabel(selected)}</p>
                </div>

                {/* Extra info */}
                {selected.extra_info && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Additional Info</p>
                    <p className="text-[13px] text-[#45464e] leading-relaxed bg-[#f7f9fb] p-4 rounded-lg border border-[#eceef0]">
                      {selected.extra_info}
                    </p>
                  </div>
                )}

                {/* Submitted date */}
                <p className="text-[11px] text-[#76777f] text-center">
                  Submitted {formatDate(selected.created_at)}
                </p>

                {/* Delete from drawer */}
                <button onClick={() => { setDeleteTarget(selected); setSelected(null) }}
                  className="w-full py-3 border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-xl text-[13px] font-semibold hover:bg-[#ffdad6] transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Remove Submission
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete confirm ─────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[400px] p-6 shadow-2xl">
                <div className="w-12 h-12 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">delete</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#081534] text-center mb-2">Remove Submission</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-6">
                  Remove <span className="font-bold text-[#081534]">{deleteTarget.full_name}</span>'s partnership submission? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-3 border border-[#c6c6cf] rounded-xl text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">
                    Cancel
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-xl text-[13px] font-bold hover:opacity-90">
                    Yes, Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-[13px] font-semibold shadow-lg flex items-center gap-2
              ${toast.type === 'error' ? 'bg-[#ba1a1a] text-white' : 'bg-[#081534] text-white'}`}>
            <span className="material-symbols-outlined text-[16px]">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}