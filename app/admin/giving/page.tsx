'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'

type GivingRecord = {
  id: string
  created_at: string
  donor_name: string | null
  donor_email: string | null
  amount: number
  currency: string
  giving_type: string
  payment_method: string
  notes: string | null
}

const GIVING_TYPES = ['General', 'Tithe', 'Missions', 'Building Fund', 'Partnership', 'Other']
const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Card', 'Online', 'Other']

const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors'

const emptyForm = {
  donor_name: '', donor_email: '', amount: '', currency: 'NGN',
  giving_type: 'General', payment_method: 'Bank Transfer', notes: '',
}

const typeColor = (type: string) => {
  switch (type) {
    case 'Tithe': return 'bg-[#fdc425]/20 text-[#785a00]'
    case 'Missions': return 'bg-[#d8e2ff] text-[#002960]'
    case 'Building Fund': return 'bg-purple-100 text-purple-800'
    case 'Partnership': return 'bg-green-100 text-green-800'
    default: return 'bg-[#f2f4f6] text-[#45464e]'
  }
}

export default function GivingPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [authChecked, setAuthChecked] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [records, setRecords] = useState<GivingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GivingRecord | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('All')
  const [form, setForm] = useState(emptyForm)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/admin'); return }
      const { data: roleData } = await supabase
        .from('admin_roles').select('role').eq('user_id', data.session.user.id).single() as { data: { role: string } | null }
      if (roleData?.role === 'super_admin') {
        setIsSuperAdmin(true)
        fetchRecords()
      }
      setAuthChecked(true)
    })
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('giving_records').select('*').order('created_at', { ascending: false })
    if (!error && data) setRecords(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) return showToast('Enter a valid amount')
    setSaving(true)
    const payload = {
      donor_name: form.donor_name || null,
      donor_email: form.donor_email || null,
      amount: Number(form.amount),
      currency: form.currency,
      giving_type: form.giving_type,
      payment_method: form.payment_method,
      notes: form.notes || null,
    }
    const { error } = await supabase.from('giving_records').insert([payload] as any)
    setSaving(false)
    if (error) return showToast('Error saving record')
    showToast('Giving record added')
    setForm(emptyForm)
    setShowModal(false)
    fetchRecords()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('giving_records').delete().eq('id', deleteTarget.id)
    if (error) return showToast('Error deleting record')
    setDeleteTarget(null)
    showToast('Record removed')
    fetchRecords()
  }

  const filtered = filterType === 'All' ? records : records.filter(r => r.giving_type === filterType)

  const totalAll = records.reduce((s, r) => s + r.amount, 0)
  const thisMonthTotal = records
    .filter(r => new Date(r.created_at).getMonth() === new Date().getMonth() && new Date(r.created_at).getFullYear() === new Date().getFullYear())
    .reduce((s, r) => s + r.amount, 0)
  const partnerCount = new Set(records.filter(r => r.giving_type === 'Partnership' && r.donor_name).map(r => r.donor_name)).size

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN', maximumFractionDigits: 0 }).format(amount)

  if (!authChecked) {
    return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center"><p className="text-[#45464e]">Loading...</p></div>
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">lock</span>
          <h2 className="text-[18px] font-bold text-[#081534] mb-2">Restricted Access</h2>
          <p className="text-[13px] text-[#45464e] mb-6">Giving and donation records are only visible to Super Admin accounts.</p>
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

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="pl-12 lg:pl-0">
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#081534]">Giving & Partners</h2>
            <p className="text-[12px] text-[#45464e]">Track donations, tithes, and partnership contributions.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#081534] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-sm w-fit">
            <span className="material-symbols-outlined text-[18px]">add</span> Record Giving
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Recorded', value: formatCurrency(totalAll, 'NGN'), icon: 'volunteer_activism', color: 'bg-[#081534]' },
            { label: 'This Month',     value: formatCurrency(thisMonthTotal, 'NGN'), icon: 'calendar_today', color: 'bg-[#fdc425]' },
            { label: 'Total Entries',  value: records.length, icon: 'receipt_long', color: 'bg-[#002960]' },
            { label: 'Active Partners', value: partnerCount, icon: 'handshake', color: 'bg-[#1e2a4a]' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-[#c6c6cf] p-4 sm:p-5 rounded-xl hover:shadow-md transition-all">
              <div className={`p-2 rounded-lg ${s.color} text-white inline-block mb-3`}>
                <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
              </div>
              <p className="text-[10px] text-[#45464e] uppercase tracking-widest font-bold">{s.label}</p>
              <p className="text-[20px] sm:text-[24px] font-bold text-[#081534] mt-1">{loading ? '—' : s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter + table */}
        <div className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#c6c6cf] flex flex-wrap gap-2">
            {['All', ...GIVING_TYPES].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors
                  ${filterType === t ? 'bg-[#081534] text-white' : 'bg-[#f2f4f6] text-[#45464e] hover:bg-[#eceef0]'}`}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-[#f2f4f6] rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-2">receipt_long</span>
              <p className="text-[#45464e] font-semibold text-[14px]">No giving records yet</p>
              <p className="text-[12px] text-[#76777f] mt-1">Record your first donation or tithe above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead className="bg-[#f2f4f6] border-b border-[#c6c6cf]">
                  <tr>
                    {['Donor', 'Type', 'Amount', 'Method', 'Date', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-[11px] font-bold text-[#45464e] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f4f6]">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-[#f7f9fb] transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-semibold text-[#081534]">{r.donor_name || 'Anonymous'}</p>
                        {r.donor_email && <p className="text-[11px] text-[#45464e]">{r.donor_email}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${typeColor(r.giving_type)}`}>{r.giving_type}</span>
                      </td>
                      <td className="px-5 py-4 text-[14px] font-bold text-[#081534]">{formatCurrency(r.amount, r.currency)}</td>
                      <td className="px-5 py-4 text-[13px] text-[#45464e]">{r.payment_method}</td>
                      <td className="px-5 py-4 text-[13px] text-[#45464e]">
                        {new Date(r.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded transition-colors">
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

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#c6c6cf]">
                  <div>
                    <h3 className="text-[18px] font-bold text-[#081534]">Record Giving</h3>
                    <p className="text-[12px] text-[#45464e] mt-0.5">Log a donation, tithe, or partnership contribution</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6]">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <div className="px-6 py-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Donor Name</label>
                      <input value={form.donor_name} onChange={e => setForm(p => ({...p, donor_name: e.target.value}))}
                        placeholder="Optional" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Donor Email</label>
                      <input value={form.donor_email} onChange={e => setForm(p => ({...p, donor_email: e.target.value}))}
                        placeholder="Optional" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Amount *</label>
                      <input type="number" min="0" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))}
                        placeholder="0" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Currency</label>
                      <select value={form.currency} onChange={e => setForm(p => ({...p, currency: e.target.value}))} className={inputCls}>
                        <option value="NGN">NGN</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Giving Type</label>
                      <select value={form.giving_type} onChange={e => setForm(p => ({...p, giving_type: e.target.value}))} className={inputCls}>
                        {GIVING_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Payment Method</label>
                      <select value={form.payment_method} onChange={e => setForm(p => ({...p, payment_method: e.target.value}))} className={inputCls}>
                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                      rows={2} placeholder="Optional context..." className={inputCls + ' resize-none'} />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-[#c6c6cf] flex gap-3">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-[#c6c6cf] text-[#45464e] rounded-xl text-[13px] font-semibold hover:bg-[#f2f4f6]">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-3 bg-[#081534] text-white rounded-xl text-[13px] font-bold hover:opacity-90 disabled:opacity-40">
                    {saving ? 'Saving...' : 'Save Record'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[400px] p-6 shadow-2xl">
                <div className="w-12 h-12 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">delete</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#081534] text-center mb-2">Remove Record</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-6">This giving record will be permanently deleted.</p>
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