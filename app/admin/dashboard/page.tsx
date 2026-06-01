'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

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

const PAGE_SIZE = 10

export default function AdminDashboard() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [thisWeek, setThisWeek] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin')
    })
  }, [router])

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('members')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, count } = await query
    setMembers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  // This week count
  useEffect(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())
      .then(({ count }) => setThisWeek(count || 0))
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/admin')
  }

  const exportCSV = () => {
    if (!members.length) return
    const headers = ['Date Joined', 'First Name', 'Last Name', 'Email', 'Phone', 'DOB', 'Status']
    const rows = members.map(m => [
      new Date(m.created_at).toLocaleDateString(),
      m.first_name, m.last_name, m.email, m.phone, m.dob, m.guest_status,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex min-h-screen bg-[#f7f9fb]">
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#081534] flex flex-col py-2 z-50">
        <div className="px-6 py-8 flex flex-col items-center">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSu9ztjFXXL57HPmU2Tzxi3_L64jT6N2N-it5rvbfUfWfdXYJHE01o-8vaDbMMklLymKGFy1h8bgWMuq6cFCbsAWGpAlzRdnIlqlCNZGURQg-bl42EaVtpB0oh1Ad-gK8evCtIRS5ux11Sgpvn686W0Zv9ySUxOUssIE11jsJlK62yZPqSHl64xThPfeKXmVOT7T--wIzDqUmNxAViuDnvS5k1CKHkBHX3FGjpWOScub8kqDfinr_Tsn0ifKgyAVbp8f2XdxntkwI"
            alt="Logo" className="w-20 h-20 object-contain mb-4" />
          <h1 className="text-[24px] font-black text-[#fdc425]">Admin Portal</h1>
          <p className="text-[14px] text-white/70">Central Management</p>
        </div>

        <nav className="flex-grow mt-4 px-2">
          {[
            { icon: 'dashboard', label: 'Dashboard', active: false },
            { icon: 'group', label: 'Members', active: true },
            { icon: 'church', label: 'Ministries', active: false },
            { icon: 'analytics', label: 'Analytics', active: false },
            { icon: 'settings', label: 'Settings', active: false },
          ].map(item => (
            <div key={item.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 cursor-pointer transition-colors
                ${item.active
                  ? 'bg-[#fdc425] text-[#6d5200]'
                  : 'text-white/70 hover:bg-white/10'}`}>
              <span className="material-symbols-outlined"
                style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="text-[14px] font-semibold">{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-2">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-4 text-white/70 hover:bg-white/10 transition-colors w-full">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-[14px] font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow ml-64 p-16">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-[32px] font-bold text-[#081534] mb-2">Member Directory</h2>
            <p className="text-[16px] text-[#45464e]">Manage your global congregation and community growth.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={exportCSV}
              className="flex items-center gap-2 bg-white border border-[#c6c6cf] px-5 py-2.5 rounded-lg text-[14px] font-semibold text-[#45464e] hover:bg-[#eceef0] transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export to CSV
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#c6c6cf] rounded-xl p-6 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-[14px] font-semibold text-[#45464e]">Total Registrations</span>
              <div className="w-10 h-10 rounded-full bg-[#081534]/5 flex items-center justify-center text-[#081534]">
                <span className="material-symbols-outlined">people</span>
              </div>
            </div>
            <span className="text-[32px] font-bold text-[#081534]">{total.toLocaleString()}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white border border-[#c6c6cf] rounded-xl p-6 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-[14px] font-semibold text-[#45464e]">New This Week</span>
              <div className="w-10 h-10 rounded-full bg-[#fdc425]/20 flex items-center justify-center text-[#785a00]">
                <span className="material-symbols-outlined">person_add</span>
              </div>
            </div>
            <span className="text-[32px] font-bold text-[#081534]">{thisWeek}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-[#081534] text-white rounded-xl p-6 flex flex-col justify-center relative overflow-hidden md:col-span-2">
            <h3 className="text-[24px] font-semibold mb-2">Spotlight Global</h3>
            <p className="text-white/70 text-[16px]">Company of the Blessed — tracking every soul that joins the family.</p>
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <span className="material-symbols-outlined text-[160px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#c6c6cf] rounded-xl shadow-sm overflow-hidden">
          {/* Search */}
          <div className="p-6 border-b border-[#c6c6cf] flex justify-between items-center bg-[#f7f9fb]">
            <div className="relative w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45464e] text-[20px]">
                search
              </span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#c6c6cf] rounded-lg focus:border-[#081534] outline-none text-[16px]"
              />
            </div>
            <span className="text-[14px] font-semibold text-[#45464e]">
              Showing {members.length} of {total} members
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f2f4f6] border-b border-[#c6c6cf]">
                  {['Date Joined', 'Name', 'Email', 'Phone', 'Status', ''].map(h => (
                    <th key={h} className="px-6 py-4 text-[12px] font-semibold text-[#45464e] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-[#45464e]">Loading...</td></tr>
                ) : members.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-[#45464e]">No members found.</td></tr>
                ) : members.map((m, i) => (
                  <motion.tr key={m.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-[#f2f4f6]/50 transition-colors">
                    <td className="px-6 py-4 text-[16px] text-[#191c1e]">
                      {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#081534] text-white flex items-center justify-center text-xs font-bold">
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                        <span className="text-[14px] font-semibold text-[#081534]">
                          {m.first_name} {m.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[16px] text-[#45464e]">{m.email}</td>
                    <td className="px-6 py-4 text-[16px] text-[#45464e]">{m.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[12px] font-medium
                        ${m.guest_status === 'Member'
                          ? 'bg-[#fdc425]/20 text-[#785a00] border border-[#785a00]/30'
                          : 'bg-[#e0e3e5] text-[#45464e]'}`}>
                        {m.guest_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-[#45464e] hover:text-[#081534] transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#c6c6cf] flex items-center justify-between bg-[#f7f9fb]">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-2 text-[14px] font-semibold text-[#45464e] hover:text-[#081534] transition-colors disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              Previous
            </button>
            <span className="text-[14px] text-[#45464e]">Page {page + 1} of {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-2 text-[14px] font-semibold text-[#45464e] hover:text-[#081534] transition-colors disabled:opacity-40">
              Next
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}