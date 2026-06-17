'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'

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
  tag?: string
  tag_color?: string
  image?: string
}

const ICON_OPTIONS = [
  'church','group','music_note','child_care','volunteer_activism','groups_3',
  'menu_book','brush','handshake','public','campaign','favorite',
  'local_hospital','school','home','sports_basketball',
]

const BG_OPTIONS = [
  { bg: 'bg-[#081534]', color: 'text-white',      label: 'Navy' },
  { bg: 'bg-[#fdc425]', color: 'text-[#6d5200]',  label: 'Gold' },
  { bg: 'bg-[#002960]', color: 'text-white',       label: 'Deep Blue' },
  { bg: 'bg-[#d8e2ff]', color: 'text-[#002960]',  label: 'Light Blue' },
  { bg: 'bg-green-100', color: 'text-green-800',   label: 'Green' },
  { bg: 'bg-purple-100',color: 'text-purple-800',  label: 'Purple' },
]

const DAYS = ['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays']
const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors'

const emptyForm = {
  name: '', description: '', leader: '', member_count: '',
  meeting_day: 'Sundays', icon: 'church',
  icon_bg: 'bg-[#081534]', icon_color: 'text-white',
  tag: '', tag_color: 'bg-[#fdc425] text-[#6d5200]', image: '',
}

export default function MinistriesPage() {
  const supabase = getSupabaseClient()
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)
  const [detailMinistry, setDetail] = useState<Ministry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ministry | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editMinistry, setEdit] = useState<Ministry | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Fetch ──
  const fetchMinistries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setMinistries(data)
    setLoading(false)
  }

  useEffect(() => { fetchMinistries() }, [])

  // ── Open modals ──
  const openAdd = () => {
    setForm(emptyForm)
    setEdit(null)
    setShowModal(true)
  }

  const openEdit = (m: Ministry) => {
    setForm({
      name: m.name, description: m.description ?? '',
      leader: m.leader, member_count: String(m.member_count),
      meeting_day: m.meeting_day ?? 'Sundays',
      icon: m.icon, icon_bg: m.icon_bg, icon_color: m.icon_color,
      tag: m.tag ?? '', tag_color: m.tag_color ?? 'bg-[#fdc425] text-[#6d5200]',
      image: m.image ?? '',
    })
    setEdit(m)
    setShowModal(true)
  }

  // ── Save ──
  const handleSave = async () => {
    if (!form.name || !form.leader) return
    setSaving(true)
    const bgOpt = BG_OPTIONS.find(b => b.bg === form.icon_bg) ?? BG_OPTIONS[0]
    const payload = {
      name: form.name,
      description: form.description,
      leader: form.leader,
      member_count: Number(form.member_count) || 0,
      meeting_day: form.meeting_day,
      icon: form.icon,
      icon_bg: form.icon_bg,
      icon_color: bgOpt.color,
      tag: form.tag || null,
      tag_color: form.tag ? form.tag_color : null,
      image: form.image || null,
    }

    if (editMinistry) {
      const { error } = await supabase.from('ministries').update(payload as any).eq('id', editMinistry.id)
      if (error) { showToast('Error updating ministry'); setSaving(false); return }
      showToast('Ministry updated')
    } else {
      const { error } = await supabase.from('ministries').insert([payload] as any)
      if (error) { showToast('Error adding ministry'); setSaving(false); return }
      showToast('Ministry added')
    }

    setSaving(false)
    setShowModal(false)
    setEdit(null)
    fetchMinistries()
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('ministries').delete().eq('id', deleteTarget.id)
    if (error) { showToast('Error deleting ministry'); return }
    setDeleteTarget(null)
    if (detailMinistry?.id === deleteTarget.id) setDetail(null)
    showToast('Ministry removed')
    fetchMinistries()
  }

  const totalMembers = ministries.reduce((s, m) => s + (m.member_count || 0), 0)

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="pl-12 lg:pl-0">
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#081534]">Ministries</h2>
            <p className="text-[12px] text-[#45464e]">
              {loading ? 'Loading...' : `${ministries.length} active ministries · ${totalMembers.toLocaleString()} total participants`}
            </p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-[#081534] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-sm w-fit">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Ministry
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Ministries',   value: ministries.length,             icon: 'church',   sub: 'Departments' },
            { label: 'Total Participants', value: totalMembers.toLocaleString(), icon: 'group',    sub: 'Across all ministries' },
            { label: 'Meeting This Week',  value: ministries.length,             icon: 'calendar_today', sub: 'Active gatherings' },
            { label: 'Leaders',            value: new Set(ministries.map(m => m.leader)).size, icon: 'person', sub: 'Ministry leaders' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cf] hover:shadow-md transition-all">
              <p className="text-[10px] text-[#45464e] uppercase tracking-widest font-bold mb-2">{s.label}</p>
              <p className="text-[26px] sm:text-[30px] font-bold text-[#081534]">{loading ? '—' : s.value}</p>
              <p className="text-[11px] text-[#785a00] flex items-center gap-1 mt-2">
                <span className="material-symbols-outlined text-[14px]">{s.icon}</span>{s.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Ministry Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-xl animate-pulse border border-[#c6c6cf]" />)}
          </div>
        ) : ministries.length === 0 ? (
          <div className="bg-white border border-[#c6c6cf] rounded-xl py-20 text-center mb-8">
            <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">church</span>
            <p className="text-[#45464e] font-bold text-[15px]">No ministries yet</p>
            <p className="text-[12px] text-[#76777f] mt-1 mb-6">Create your first ministry department to get started</p>
            <button onClick={openAdd}
              className="px-6 py-2.5 bg-[#081534] text-white rounded-lg text-[13px] font-bold hover:opacity-90">
              + Add First Ministry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
            {ministries.map((m, idx) => {
              const isWide = m.image && (idx === 0 || idx === ministries.length - 1)
              return (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className={`${isWide ? 'col-span-1 md:col-span-8' : 'col-span-1 md:col-span-4'} bg-white rounded-xl overflow-hidden border border-[#c6c6cf] hover:border-[#081534]/20 hover:shadow-lg transition-all`}
                  onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}>

                  {m.image ? (
                    <>
                      <div className="relative h-44 sm:h-52 overflow-hidden bg-[#eceef0]">
                        <img src={m.image} alt={m.name}
                          className={`w-full h-full object-cover object-center transition-transform duration-500 ${hovered === m.id ? 'scale-110' : 'scale-100'}`}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#081534]/80 to-transparent" />
                        <div className="absolute bottom-4 left-5">
                          {m.tag && (
                            <span className={`inline-block px-3 py-1 ${m.tag_color} rounded-full text-[10px] font-bold uppercase tracking-widest mb-2`}>
                              {m.tag}
                            </span>
                          )}
                          <h3 className="text-white text-[20px] font-bold">{m.name}</h3>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div><p className="text-[10px] text-[#45464e] font-semibold">Leader</p><p className="text-[13px] text-[#081534] font-bold truncate">{m.leader}</p></div>
                          <div><p className="text-[10px] text-[#45464e] font-semibold">Members</p><p className="text-[13px] text-[#081534] font-bold">{m.member_count}</p></div>
                          <div><p className="text-[10px] text-[#45464e] font-semibold">Meeting</p><p className="text-[13px] text-[#081534] font-bold truncate">{m.meeting_day}</p></div>
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-[#f2f4f6]">
                          <button onClick={() => setDetail(m)} className="p-2 text-[#45464e] hover:text-[#081534] hover:bg-[#f2f4f6] rounded-lg transition-all shrink-0">
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </button>
                          <button onClick={() => openEdit(m)} className="p-2 text-[#45464e] hover:text-[#081534] hover:bg-[#f2f4f6] rounded-lg transition-all shrink-0">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => setDeleteTarget(m)} className="p-2 text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-all shrink-0">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-5 sm:p-6 flex flex-col justify-between h-full min-h-[220px]">
                      <div>
                        <div className={`w-11 h-11 ${m.icon_bg} ${m.icon_color} rounded-xl flex items-center justify-center mb-4`}>
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                        </div>
                        <h3 className="text-[16px] sm:text-[18px] font-bold text-[#081534] mb-1">{m.name}</h3>
                        <p className="text-[12px] text-[#45464e] mb-4 line-clamp-2">{m.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                            <span className="text-[12px] text-[#45464e] font-semibold">Leader</span>
                            <span className="text-[12px] text-[#081534] font-bold">{m.leader}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-[12px] text-[#45464e] font-semibold">Members</span>
                            <span className="text-[12px] text-[#081534] font-bold">{m.member_count}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 flex gap-2">
                        <button onClick={() => setDetail(m)} className="flex-1 bg-[#f2f4f6] text-[#081534] text-[12px] py-2.5 rounded-lg hover:bg-[#eceef0] transition-colors font-semibold">
                          View Details
                        </button>
                        <button onClick={() => openEdit(m)} className="px-3 bg-[#f2f4f6] text-[#45464e] rounded-lg hover:bg-[#eceef0] transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setDeleteTarget(m)} className="px-3 bg-[#f2f4f6] text-[#45464e] rounded-lg hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {detailMinistry && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setDetail(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl">
              <div className="bg-[#081534] px-6 py-6 relative">
                <button onClick={() => setDetail(null)} className="absolute top-4 right-4 text-white/60 hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
                <div className={`w-12 h-12 ${detailMinistry.icon_bg} ${detailMinistry.icon_color} rounded-xl flex items-center justify-center mb-4`}>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{detailMinistry.icon}</span>
                </div>
                <h2 className="text-white text-[20px] font-bold">{detailMinistry.name}</h2>
                {detailMinistry.tag && (
                  <span className={`inline-block mt-2 px-3 py-0.5 ${detailMinistry.tag_color} rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                    {detailMinistry.tag}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-widest mb-2">About</p>
                  <p className="text-[14px] text-[#191c1e]">{detailMinistry.description || 'No description provided.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Leader', value: detailMinistry.leader, icon: 'person' },
                    { label: 'Members', value: detailMinistry.member_count, icon: 'group' },
                    { label: 'Meeting Day', value: detailMinistry.meeting_day || '—', icon: 'calendar_today' },
                    { label: 'Status', value: 'Active', icon: 'check_circle' },
                  ].map(f => (
                    <div key={f.label} className="bg-[#f7f9fb] rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-[14px] text-[#45464e]">{f.icon}</span>
                        <p className="text-[10px] font-bold text-[#45464e] uppercase tracking-wider">{f.label}</p>
                      </div>
                      <p className="text-[15px] font-bold text-[#081534]">{f.value}</p>
                    </div>
                  ))}
                </div>
                {detailMinistry.image && (
                  <div className="rounded-xl overflow-hidden h-40">
                    <img src={detailMinistry.image} alt={detailMinistry.name} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-[#c6c6cf] flex gap-3">
                <button onClick={() => { openEdit(detailMinistry); setDetail(null) }}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#081534] text-white py-3 rounded-xl text-[13px] font-bold hover:opacity-90">
                  <span className="material-symbols-outlined text-[18px]">edit</span> Edit Ministry
                </button>
                <button onClick={() => { setDeleteTarget(detailMinistry); setDetail(null) }}
                  className="px-4 py-3 border border-[#c6c6cf] text-[#ba1a1a] rounded-xl hover:bg-[#ffdad6] hover:border-[#ba1a1a] transition-all">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#c6c6cf]">
                  <div>
                    <h3 className="text-[18px] font-bold text-[#081534]">{editMinistry ? 'Edit Ministry' : 'Add New Ministry'}</h3>
                    <p className="text-[12px] text-[#45464e] mt-0.5">{editMinistry ? 'Update ministry information' : 'Create a new ministry department'}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6]">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <div className="px-6 py-6 space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Ministry Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                      placeholder="e.g. Youth Ministry" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                      placeholder="Brief description..." rows={3} className={inputCls + ' resize-none'} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Leader *</label>
                      <input value={form.leader} onChange={e => setForm(p => ({...p, leader: e.target.value}))}
                        placeholder="e.g. Pastor John" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Member Count</label>
                      <input type="number" value={form.member_count} onChange={e => setForm(p => ({...p, member_count: e.target.value}))}
                        placeholder="0" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Meeting Day</label>
                      <select value={form.meeting_day} onChange={e => setForm(p => ({...p, meeting_day: e.target.value}))} className={inputCls}>
                        {DAYS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Tag (optional)</label>
                      <input value={form.tag} onChange={e => setForm(p => ({...p, tag: e.target.value}))}
                        placeholder="e.g. High Impact" className={inputCls} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Image URL (optional)</label>
                    <input value={form.image} onChange={e => setForm(p => ({...p, image: e.target.value}))}
                      placeholder="https://..." className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map(ic => (
                        <button key={ic} type="button" onClick={() => setForm(p => ({...p, icon: ic}))}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${form.icon === ic ? 'bg-[#081534] text-white' : 'bg-[#f2f4f6] text-[#45464e] hover:bg-[#eceef0]'}`}>
                          <span className="material-symbols-outlined text-[18px]">{ic}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Icon Background</label>
                    <div className="flex gap-3 flex-wrap">
                      {BG_OPTIONS.map(opt => (
                        <button key={opt.bg} type="button" onClick={() => setForm(p => ({...p, icon_bg: opt.bg, icon_color: opt.color}))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-[12px] font-semibold ${form.icon_bg === opt.bg ? 'border-[#081534] bg-[#f2f4f6]' : 'border-[#c6c6cf] hover:border-[#081534]'}`}>
                          <div className={`w-5 h-5 rounded ${opt.bg}`} />{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#f7f9fb] rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 ${form.icon_bg} ${form.icon_color} rounded-xl flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{form.icon}</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#081534]">{form.name || 'Ministry Name'}</p>
                      <p className="text-[12px] text-[#45464e]">{form.leader || 'Leader name'} · {form.meeting_day}</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-[#c6c6cf] flex gap-3">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-[#c6c6cf] text-[#45464e] rounded-xl text-[13px] font-semibold hover:bg-[#f2f4f6]">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={!form.name || !form.leader || saving}
                    className="flex-1 py-3 bg-[#081534] text-white rounded-xl text-[13px] font-bold hover:opacity-90 disabled:opacity-40">
                    {saving ? 'Saving...' : editMinistry ? 'Save Changes' : 'Add Ministry'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
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
                <h3 className="text-[18px] font-bold text-[#081534] text-center mb-2">Remove Ministry</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-6">
                  Are you sure you want to remove <span className="font-bold text-[#081534]">{deleteTarget.name}</span>? This cannot be undone.
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