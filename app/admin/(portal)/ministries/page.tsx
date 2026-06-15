'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ─────────────────────────────────────────────────────────────
type Ministry = {
  id: string
  name: string
  description: string
  leader: string
  memberCount: number
  meetingDay: string
  icon: string
  iconBg: string
  iconColor: string
  tag?: string
  tagColor?: string
  image?: string
}

type Review = {
  id: string
  name: string
  lead: string
  date: string
  status: 'Reviewing' | 'Draft'
  icon: string
}

// ── Seed data ─────────────────────────────────────────────────────────
const initialMinistries: Ministry[] = [
  {
    id: 'youth',
    name: 'Youth Ministry',
    description: 'Discipling the next generation through weekly gatherings, events, and mentorship.',
    leader: 'David Chen',
    memberCount: 342,
    meetingDay: 'Fridays',
    icon: 'child_care',
    iconBg: 'bg-[#081534]',
    iconColor: 'text-white',
    tag: 'High Impact',
    tagColor: 'bg-[#fdc425] text-[#6d5200]',
    image: 'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=1000&h=400&fit=crop',
  },
  {
    id: 'worship',
    name: 'Spotlight Worship',
    description: 'Choir, band, and technical production teams leading the congregation in praise.',
    leader: 'Sarah Jenkins',
    memberCount: 86,
    meetingDay: 'Wednesdays',
    icon: 'music_note',
    iconBg: 'bg-[#fdc425]',
    iconColor: 'text-[#6d5200]',
  },
  {
    id: 'welfare',
    name: 'Welfare & Program',
    description: 'Localised community gatherings and welfare support across the city.',
    leader: 'Adeola Bello',
    memberCount: 42,
    meetingDay: 'Saturdays',
    icon: 'groups_3',
    iconBg: 'bg-[#d8e2ff]',
    iconColor: 'text-[#002960]',
  },
  {
    id: 'outreach',
    name: 'Evangelism & Outreach',
    description: 'Supporting international mission partners and local city relief initiatives.',
    leader: 'Elena Rodriguez',
    memberCount: 215,
    meetingDay: 'Sundays',
    icon: 'volunteer_activism',
    iconBg: 'bg-[#002960]',
    iconColor: 'text-white',
    tag: 'Global',
    tagColor: 'bg-[#081534] text-white',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop',
  },
]

const initialReviews: Review[] = [
  { id: 'r1', name: 'Creative Arts Collective', lead: 'Jordan Smith',   date: 'Oct 12, 2023', status: 'Reviewing', icon: 'brush' },
  { id: 'r2', name: 'Theology Study Hub',       lead: 'Dr. Emily Watts', date: 'Oct 10, 2023', status: 'Draft',     icon: 'menu_book' },
]

const ICON_OPTIONS = [
  'church','group','music_note','child_care','volunteer_activism','groups_3',
  'menu_book','brush','handshake','public','campaign','favorite',
  'local_hospital','school','home','sports_basketball',
]

const BG_OPTIONS = [
  { bg: 'bg-[#081534]', color: 'text-white',      label: 'Navy' },
  { bg: 'bg-[#fdc425]', color: 'text-[#6d5200]',  label: 'Gold' },
  { bg: 'bg-[#002960]', color: 'text-white',       label: 'Deep Blue' },
  { bg: 'bg-[#d8e2ff]', color: 'text-[#002960]',   label: 'Light Blue' },
  { bg: 'bg-green-100', color: 'text-green-800',   label: 'Green' },
  { bg: 'bg-purple-100',color: 'text-purple-800',  label: 'Purple' },
]

const DAYS = ['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays']

const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors'

// ── Component ─────────────────────────────────────────────────────────
export default function MinistriesPage() {
  const [ministries, setMinistries]   = useState<Ministry[]>(initialMinistries)
  const [reviews, setReviews]         = useState<Review[]>(initialReviews)
  const [hovered, setHovered]         = useState<string | null>(null)
  const [detailMinistry, setDetail]   = useState<Ministry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ministry | null>(null)
  const [showAddModal, setShowAdd]    = useState(false)
  const [editMinistry, setEdit]       = useState<Ministry | null>(null)
  const [toast, setToast]             = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', description: '', leader: '',
    memberCount: '', meetingDay: 'Sundays',
    icon: 'church', iconBg: 'bg-[#081534]', iconColor: 'text-white',
    tag: '', tagColor: 'bg-[#fdc425] text-[#6d5200]',
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const openAdd = () => {
    setForm({ name:'', description:'', leader:'', memberCount:'', meetingDay:'Sundays', icon:'church', iconBg:'bg-[#081534]', iconColor:'text-white', tag:'', tagColor:'bg-[#fdc425] text-[#6d5200]' })
    setEdit(null)
    setShowAdd(true)
  }

  const openEdit = (m: Ministry) => {
    setForm({
      name: m.name, description: m.description, leader: m.leader,
      memberCount: String(m.memberCount), meetingDay: m.meetingDay,
      icon: m.icon, iconBg: m.iconBg, iconColor: m.iconColor,
      tag: m.tag ?? '', tagColor: m.tagColor ?? 'bg-[#fdc425] text-[#6d5200]',
    })
    setEdit(m)
    setShowAdd(true)
  }

  const handleSave = () => {
    if (!form.name || !form.leader) return
    const bgOpt = BG_OPTIONS.find(b => b.bg === form.iconBg) ?? BG_OPTIONS[0]
    if (editMinistry) {
      setMinistries(prev => prev.map(m => m.id === editMinistry.id
        ? { ...m, ...form, memberCount: Number(form.memberCount) || 0, iconColor: bgOpt.color }
        : m))
      showToast('Ministry updated successfully')
    } else {
      const newM: Ministry = {
        id: Date.now().toString(),
        name: form.name, description: form.description, leader: form.leader,
        memberCount: Number(form.memberCount) || 0, meetingDay: form.meetingDay,
        icon: form.icon, iconBg: form.iconBg, iconColor: bgOpt.color,
        tag: form.tag || undefined,
        tagColor: form.tag ? form.tagColor : undefined,
      }
      setMinistries(prev => [newM, ...prev])
      showToast('Ministry added successfully')
    }
    setShowAdd(false)
    setEdit(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setMinistries(prev => prev.filter(m => m.id !== deleteTarget.id))
    setDeleteTarget(null)
    if (detailMinistry?.id === deleteTarget.id) setDetail(null)
    showToast('Ministry removed')
  }

  const handleApprove = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id))
    showToast('Ministry approved and added')
  }

  const handleReject = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id))
    showToast('Request rejected')
  }

  const totalMembers = ministries.reduce((s, m) => s + m.memberCount, 0)

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="pl-12 lg:pl-0">
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#081534]">Ministries</h2>
            <p className="text-[12px] text-[#45464e]">
              {ministries.length} active ministries · {totalMembers.toLocaleString()} total participants
            </p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-[#081534] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-sm w-fit">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Ministry
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Ministries',  value: ministries.length,                  icon: 'church',    sub: `${ministries.length} departments` },
            { label: 'Total Participants',value: totalMembers.toLocaleString(),       icon: 'group',     sub: 'Across all ministries' },
            { label: 'Pending Reviews',   value: reviews.length,                     icon: 'pending',   sub: 'Awaiting approval' },
            { label: 'Global Reach',      value: '8',                                icon: 'public',    sub: 'Countries' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cf] hover:shadow-md transition-all">
              <p className="text-[10px] text-[#45464e] uppercase tracking-widest font-bold mb-2">{s.label}</p>
              <p className="text-[26px] sm:text-[30px] font-bold text-[#081534]">{s.value}</p>
              <p className="text-[11px] text-[#785a00] flex items-center gap-1 mt-2">
                <span className="material-symbols-outlined text-[14px]">{s.icon}</span>{s.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Ministry Grid ── */}
        {ministries.length === 0 ? (
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
                      <div className="relative h-44 sm:h-52 overflow-hidden">
                        <img src={m.image} alt={m.name}
                          className={`w-full h-full object-cover transition-transform duration-500 ${hovered === m.id ? 'scale-110' : 'scale-100'}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#081534]/80 to-transparent" />
                        <div className="absolute bottom-4 left-5">
                          {m.tag && (
                            <span className={`inline-block px-3 py-1 ${m.tagColor} rounded-full text-[10px] font-bold uppercase tracking-widest mb-2`}>
                              {m.tag}
                            </span>
                          )}
                          <h3 className="text-white text-[20px] sm:text-[22px] font-bold">{m.name}</h3>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div><p className="text-[10px] text-[#45464e] font-semibold">Lead Pastor</p><p className="text-[13px] text-[#081534] font-bold">{m.leader}</p></div>
                        <div><p className="text-[10px] text-[#45464e] font-semibold">Members</p><p className="text-[13px] text-[#081534] font-bold">{m.memberCount}</p></div>
                        <div><p className="text-[10px] text-[#45464e] font-semibold">Meeting</p><p className="text-[13px] text-[#081534] font-bold">{m.meetingDay}</p></div>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetail(m)}
                            className="p-2 text-[#45464e] hover:text-[#081534] hover:bg-[#f2f4f6] rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </button>
                          <button onClick={() => openEdit(m)}
                            className="p-2 text-[#45464e] hover:text-[#081534] hover:bg-[#f2f4f6] rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={() => setDeleteTarget(m)}
                            className="p-2 text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-5 sm:p-6 flex flex-col justify-between h-full min-h-[220px]">
                      <div>
                        <div className={`w-11 h-11 ${m.iconBg} ${m.iconColor} rounded-xl flex items-center justify-center mb-4`}>
                          <span className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
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
                            <span className="text-[12px] text-[#081534] font-bold">{m.memberCount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 flex gap-2">
                        <button onClick={() => setDetail(m)}
                          className="flex-1 bg-[#f2f4f6] text-[#081534] text-[12px] py-2.5 rounded-lg hover:bg-[#eceef0] transition-colors font-semibold">
                          View Details
                        </button>
                        <button onClick={() => openEdit(m)}
                          className="px-3 bg-[#f2f4f6] text-[#45464e] rounded-lg hover:bg-[#eceef0] transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setDeleteTarget(m)}
                          className="px-3 bg-[#f2f4f6] text-[#45464e] rounded-lg hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors">
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

        {/* ── Pending Reviews ── */}
        {reviews.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-[#081534]">
                Pending Reviews
                <span className="ml-2 px-2 py-0.5 bg-[#fdc425]/20 text-[#785a00] text-[12px] font-bold rounded-full">{reviews.length}</span>
              </h3>
            </div>
            <div className="bg-white border border-[#c6c6cf] rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[520px]">
                <thead className="bg-[#f2f4f6] border-b border-[#c6c6cf]">
                  <tr>
                    {['Ministry Name','Proposed Lead','Submitted','Status','Actions'].map(h => (
                      <th key={h} className="px-4 sm:px-6 py-3 text-[11px] font-bold text-[#45464e] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f4f6]">
                  {reviews.map(r => (
                    <tr key={r.id} className="hover:bg-[#f7f9fb] transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#002960] text-white rounded-lg flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">{r.icon}</span>
                          </div>
                          <span className="text-[13px] text-[#081534] font-semibold">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-[13px] text-[#45464e]">{r.lead}</td>
                      <td className="px-4 sm:px-6 py-4 text-[13px] text-[#45464e]">{r.date}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full
                          ${r.status === 'Reviewing' ? 'bg-[#ffdf9a] text-[#5a4300]' : 'bg-[#f2f4f6] text-[#45464e]'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApprove(r.id)}
                            className="px-3 py-1.5 bg-[#081534] text-white text-[12px] font-bold rounded-lg hover:opacity-90 transition-opacity">
                            Approve
                          </button>
                          <button onClick={() => handleReject(r.id)}
                            className="px-3 py-1.5 border border-[#c6c6cf] text-[#45464e] text-[12px] font-semibold rounded-lg hover:bg-[#ffdad6] hover:text-[#ba1a1a] hover:border-[#ba1a1a] transition-all">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          DETAIL DRAWER
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailMinistry && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setDetail(null)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl">

              {/* Drawer header */}
              <div className="bg-[#081534] px-6 py-6 relative">
                <button onClick={() => setDetail(null)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
                <div className={`w-12 h-12 ${detailMinistry.iconBg} ${detailMinistry.iconColor} rounded-xl flex items-center justify-center mb-4`}>
                  <span className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>{detailMinistry.icon}</span>
                </div>
                <h2 className="text-white text-[20px] font-bold">{detailMinistry.name}</h2>
                {detailMinistry.tag && (
                  <span className={`inline-block mt-2 px-3 py-0.5 ${detailMinistry.tagColor} rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                    {detailMinistry.tag}
                  </span>
                )}
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-widest mb-2">About</p>
                  <p className="text-[14px] text-[#191c1e]">{detailMinistry.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Leader', value: detailMinistry.leader, icon: 'person' },
                    { label: 'Members', value: detailMinistry.memberCount, icon: 'group' },
                    { label: 'Meeting Day', value: detailMinistry.meetingDay, icon: 'calendar_today' },
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

              {/* Drawer footer */}
              <div className="px-6 py-4 border-t border-[#c6c6cf] flex gap-3">
                <button onClick={() => { openEdit(detailMinistry); setDetail(null) }}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#081534] text-white py-3 rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity">
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

      {/* ══════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setShowAdd(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl">

                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#c6c6cf]">
                  <div>
                    <h3 className="text-[18px] font-bold text-[#081534]">
                      {editMinistry ? 'Edit Ministry' : 'Add New Ministry'}
                    </h3>
                    <p className="text-[12px] text-[#45464e] mt-0.5">
                      {editMinistry ? 'Update ministry information' : 'Create a new ministry department'}
                    </p>
                  </div>
                  <button onClick={() => setShowAdd(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Modal body */}
                <div className="px-6 py-6 space-y-5">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Ministry Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                      placeholder="e.g. Youth Ministry" className={inputCls} />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                      placeholder="Brief description of the ministry..." rows={3}
                      className={inputCls + ' resize-none'} />
                  </div>

                  {/* Leader + Members */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Leader *</label>
                      <input value={form.leader} onChange={e => setForm(p => ({...p, leader: e.target.value}))}
                        placeholder="e.g. Pastor John" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Member Count</label>
                      <input type="number" value={form.memberCount} onChange={e => setForm(p => ({...p, memberCount: e.target.value}))}
                        placeholder="0" className={inputCls} />
                    </div>
                  </div>

                  {/* Meeting day + Tag */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Meeting Day</label>
                      <select value={form.meetingDay} onChange={e => setForm(p => ({...p, meetingDay: e.target.value}))}
                        className={inputCls}>
                        {DAYS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Tag (optional)</label>
                      <input value={form.tag} onChange={e => setForm(p => ({...p, tag: e.target.value}))}
                        placeholder="e.g. High Impact" className={inputCls} />
                    </div>
                  </div>

                  {/* Icon picker */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map(ic => (
                        <button key={ic} type="button"
                          onClick={() => setForm(p => ({...p, icon: ic}))}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all
                            ${form.icon === ic ? 'bg-[#081534] text-white' : 'bg-[#f2f4f6] text-[#45464e] hover:bg-[#eceef0]'}`}>
                          <span className="material-symbols-outlined text-[18px]">{ic}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colour picker */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">Icon Background</label>
                    <div className="flex gap-3 flex-wrap">
                      {BG_OPTIONS.map(opt => (
                        <button key={opt.bg} type="button"
                          onClick={() => setForm(p => ({...p, iconBg: opt.bg, iconColor: opt.color}))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-[12px] font-semibold
                            ${form.iconBg === opt.bg ? 'border-[#081534] bg-[#f2f4f6]' : 'border-[#c6c6cf] hover:border-[#081534]'}`}>
                          <div className={`w-5 h-5 rounded ${opt.bg}`} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-[#f7f9fb] rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 ${form.iconBg} ${form.iconColor} rounded-xl flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[22px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}>{form.icon}</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#081534]">{form.name || 'Ministry Name'}</p>
                      <p className="text-[12px] text-[#45464e]">{form.leader || 'Leader name'} · {form.meetingDay}</p>
                    </div>
                  </div>
                </div>

                {/* Modal footer */}
                <div className="px-6 py-4 border-t border-[#c6c6cf] flex gap-3">
                  <button onClick={() => setShowAdd(false)}
                    className="flex-1 py-3 border border-[#c6c6cf] text-[#45464e] rounded-xl text-[13px] font-semibold hover:bg-[#f2f4f6] transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={!form.name || !form.leader}
                    className="flex-1 py-3 bg-[#081534] text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-40">
                    {editMinistry ? 'Save Changes' : 'Add Ministry'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[400px] p-6 shadow-2xl">
                <div className="w-12 h-12 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">delete</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#081534] text-center mb-2">Remove Ministry</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-6">
                  Are you sure you want to remove <span className="font-bold text-[#081534]">{deleteTarget.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-3 border border-[#c6c6cf] rounded-xl text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6] transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity">
                    Yes, Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
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