'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'

type AttendanceRecord = {
  id: string
  service_date: string
  male_count: number
  female_count: number
  children_count: number
  total_count: number
  notes: string | null
}

export default function AttendancePage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<AttendanceRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(null)

  const getLastSunday = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? 0 : day
    d.setDate(d.getDate() - diff)
    return d.toISOString().split('T')[0]
  }

  const [form, setForm] = useState({
    service_date: getLastSunday(),
    male_count: '',
    female_count: '',
    children_count: '',
    notes: '',
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('service_date', { ascending: false })
      .limit(20)
    if (!error && data) setRecords(data)
    setLoading(false)
  }

  const access = useAdminAccess('attendance')

  useEffect(() => {
    if (!access.loading) fetchRecords()
  }, [access.loading])

  const resetForm = () => {
    setForm({ service_date: getLastSunday(), male_count: '', female_count: '', children_count: '', notes: '' })
    setEditTarget(null)
  }

  const openEdit = (r: AttendanceRecord) => {
    setForm({
      service_date: r.service_date,
      male_count: String(r.male_count),
      female_count: String(r.female_count),
      children_count: String(r.children_count),
      notes: r.notes ?? '',
    })
    setEditTarget(r)
  }

  const handleSave = async () => {
    if (!form.service_date) return showToast('Please select a service date')
    setSaving(true)

    const payload = {
      service_date: form.service_date,
      male_count: Number(form.male_count) || 0,
      female_count: Number(form.female_count) || 0,
      children_count: Number(form.children_count) || 0,
      notes: form.notes || null,
    }

    if (editTarget) {
      const { error } = await supabase.from('attendance_records').update(payload as any).eq('id', editTarget.id)
      setSaving(false)
      if (error) return showToast('Error updating record')
      showToast('Attendance updated')
    } else {
      const { error } = await supabase.from('attendance_records').insert([payload] as any)
      setSaving(false)
      if (error) {
        if (error.code === '23505') return showToast('A record for this date already exists — edit it instead')
        return showToast('Error saving record')
      }
      showToast('Attendance recorded')
    }

    resetForm()
    fetchRecords()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('attendance_records').delete().eq('id', deleteTarget.id)
    if (error) return showToast('Error deleting record')
    setDeleteTarget(null)
    showToast('Record removed')
    fetchRecords()
  }

  const last4 = records.slice(0, 4)
  const avgTotal = last4.length > 0 ? Math.round(last4.reduce((s, r) => s + r.total_count, 0) / last4.length) : 0
  const maxTotal = Math.max(...records.map(r => r.total_count), 1)

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/dashboard')}
            className="flex items-center justify-center w-9 h-9 border border-[#c6c6cf] text-[#45464e] rounded-lg hover:bg-[#f2f4f6] hover:text-[#081534] transition-colors shrink-0">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="pl-3 lg:pl-0">
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#081534]">Attendance</h2>
            <p className="text-[12px] text-[#45464e]">Log Sunday headcounts to track growth and trends over time.</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-[#c6c6cf] rounded-xl p-5">
            <p className="text-[10px] text-[#45464e] uppercase tracking-widest font-bold mb-2">Last Recorded</p>
            <p className="text-[28px] font-bold text-[#081534]">{loading ? '—' : (records[0]?.total_count ?? 0)}</p>
            <p className="text-[11px] text-[#785a00] mt-1">{loading ? '' : records[0] ? new Date(records[0].service_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No records yet'}</p>
          </div>
          <div className="bg-white border border-[#c6c6cf] rounded-xl p-5">
            <p className="text-[10px] text-[#45464e] uppercase tracking-widest font-bold mb-2">Avg. Last 4 Weeks</p>
            <p className="text-[28px] font-bold text-[#081534]">{loading ? '—' : avgTotal}</p>
            <p className="text-[11px] text-[#785a00] mt-1">Per service</p>
          </div>
          <div className="bg-white border border-[#c6c6cf] rounded-xl p-5 col-span-2 lg:col-span-1">
            <p className="text-[10px] text-[#45464e] uppercase tracking-widest font-bold mb-2">Total Services Logged</p>
            <p className="text-[28px] font-bold text-[#081534]">{loading ? '—' : records.length}</p>
            <p className="text-[11px] text-[#785a00] mt-1">Most recent 20</p>
          </div>
        </div>

        {/* Entry form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
          <h3 className="text-[16px] font-bold text-[#081534] mb-1">
            {editTarget ? 'Edit Attendance Record' : 'Record Sunday Attendance'}
          </h3>
          <p className="text-[13px] text-[#45464e] mb-6">Enter the headcount taken after the service.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Service Date</label>
              <input type="date" value={form.service_date}
                onChange={e => setForm(p => ({ ...p, service_date: e.target.value }))}
                className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Notes (optional)</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. Special program, holiday Sunday"
                className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5">
            {[
              { key: 'male_count', label: 'Male', icon: 'man' },
              { key: 'female_count', label: 'Female', icon: 'woman' },
              { key: 'children_count', label: 'Children', icon: 'child_care' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5 sm:gap-2">
                <label className="text-[10px] sm:text-[12px] font-bold text-[#45464e] uppercase tracking-wide flex items-center gap-1 sm:gap-1.5">
                  <span className="material-symbols-outlined text-[12px] sm:text-[14px]">{f.icon}</span>
                  <span className="truncate">{f.label}</span>
                </label>
                <input type="number" min="0"
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder="0"
                  className="bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-2 sm:px-4 py-3 rounded-t-lg text-[16px] sm:text-[20px] font-bold text-center transition-colors w-full" />
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 bg-[#f7f9fb] rounded-xl flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#45464e]">Total Attendance</span>
            <span className="text-[24px] font-bold text-[#081534]">
              {(Number(form.male_count) || 0) + (Number(form.female_count) || 0) + (Number(form.children_count) || 0)}
            </span>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            {editTarget && (
              <button onClick={resetForm}
                className="px-6 py-2.5 border border-[#c6c6cf] text-[#45464e] rounded-lg text-[13px] font-bold hover:bg-[#f2f4f6] transition-colors">
                Cancel
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              className="bg-[#081534] text-white px-6 py-2.5 rounded-lg text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
              {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Record Attendance'}
            </button>
          </div>
        </motion.div>

        {/* History */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#c6c6cf] rounded-xl p-6 sm:p-8">
          <h3 className="text-[16px] font-bold text-[#081534] mb-6">Attendance History</h3>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-[#f2f4f6] rounded-lg animate-pulse" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-2">fact_check</span>
              <p className="text-[#45464e] font-semibold text-[14px]">No attendance records yet</p>
              <p className="text-[12px] text-[#76777f] mt-1">Record your first Sunday headcount above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map(r => {
                const pct = Math.round((r.total_count / maxTotal) * 100)
                return (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 hover:bg-[#f7f9fb] rounded-lg transition-colors group">
                    <div className="flex items-center justify-between sm:contents">
                      <div className="w-20 sm:w-24 shrink-0">
                        <p className="text-[13px] font-bold text-[#081534]">
                          {new Date(r.service_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-[#45464e]">{new Date(r.service_date).getFullYear()}</p>
                      </div>
                      <div className="flex sm:hidden gap-1 shrink-0">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-[#45464e] hover:text-[#081534] hover:bg-[#f2f4f6] rounded">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="w-full bg-[#f2f4f6] rounded-full h-2">
                        <div className="bg-[#fdc425] h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex gap-3 text-[11px] text-[#45464e] shrink-0">
                        <span title="Male">M:{r.male_count}</span>
                        <span title="Female">F:{r.female_count}</span>
                        <span title="Children">C:{r.children_count}</span>
                      </div>
                      <div className="w-12 text-right shrink-0">
                        <span className="text-[16px] font-bold text-[#081534]">{r.total_count}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-[#45464e] hover:text-[#081534] hover:bg-[#f2f4f6] rounded">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

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
                <p className="text-[13px] text-[#45464e] text-center mb-6">
                  Remove attendance for {deleteTarget && new Date(deleteTarget.service_date).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })}?
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