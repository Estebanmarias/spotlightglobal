'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const stats = [
  { label: 'Total Ministries', value: '14', icon: 'church', sub: '+2 this quarter' },
  { label: 'Active Members', value: '1,248', icon: 'group', sub: '84% engagement' },
  { label: 'Global Reach', value: '8', icon: 'public', sub: 'Countries' },
  { label: 'Budget Allocation', value: '72%', icon: 'payments', sub: 'Within limits' },
]

const reviews = [
  { name: 'Creative Arts Collective', lead: 'Jordan Smith', date: 'Oct 12, 2023', status: 'Reviewing', icon: 'brush' },
  { name: 'Theology Study Hub', lead: 'Dr. Emily Watts', date: 'Oct 10, 2023', status: 'Draft', icon: 'menu_book' },
]

export default function MinistriesPage() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <main className="bg-[#f7f9fb]">
      <div className="p-4 sm:p-8 lg:p-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-[22px] sm:text-[28px] font-bold text-[#081534] mb-1">Ministries Management</h2>
            <p className="text-[14px] sm:text-[15px] text-[#45464e]">Oversee, track, and empower the diverse communities within our church.</p>
          </div>
          <button className="flex items-center gap-2 bg-[#081534] text-white px-5 py-3 rounded-xl text-[14px] font-semibold hover:opacity-90 transition-opacity shadow-lg w-fit">
            <span className="material-symbols-outlined">add</span> Add Ministry
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-4 sm:p-6 rounded-xl border border-[#c6c6cf] hover:shadow-lg transition-all">
              <p className="text-[10px] sm:text-[11px] text-[#45464e] uppercase tracking-widest font-semibold">{s.label}</p>
              <p className="text-[24px] sm:text-[30px] font-bold text-[#081534] mt-2">{s.value}</p>
              <p className="text-[11px] sm:text-[12px] text-[#785a00] flex items-center gap-1 mt-3">
                <span className="material-symbols-outlined text-[15px]">{s.icon}</span> {s.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Ministry cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          {/* Youth — large */}
          <motion.div
            className="col-span-1 md:col-span-8 bg-white rounded-xl overflow-hidden border border-[#c6c6cf] hover:border-[#081534]/30 hover:shadow-lg transition-all"
            onMouseEnter={() => setHovered('youth')} onMouseLeave={() => setHovered(null)}>
            <div className="relative h-44 sm:h-52 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=1000&h=400&fit=crop"
                alt="Youth" className={`w-full h-full object-cover transition-transform duration-500 ${hovered === 'youth' ? 'scale-110' : 'scale-100'}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081534]/80 to-transparent" />
              <div className="absolute bottom-4 left-5">
                <span className="inline-block px-3 py-1 bg-[#fdc425] text-[#6d5200] rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">High Impact</span>
                <h3 className="text-white text-[20px] sm:text-[24px] font-bold">Youth Ministry</h3>
              </div>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><p className="text-[11px] text-[#45464e] font-semibold">Lead Pastor</p><p className="text-[14px] sm:text-[16px] text-[#081534] font-bold">David Chen</p></div>
              <div><p className="text-[11px] text-[#45464e] font-semibold">Member Count</p><p className="text-[14px] sm:text-[16px] text-[#081534] font-bold">342</p></div>
              <div><p className="text-[11px] text-[#45464e] font-semibold">Meeting Day</p><p className="text-[14px] sm:text-[16px] text-[#081534] font-bold">Fridays</p></div>
              <div className="flex items-center justify-end gap-2">
                <button className="p-2 text-[#45464e] hover:text-[#081534] hover:bg-[#eceef0] rounded-lg transition-all">
                  <span className="material-symbols-outlined">edit</span></button>
                <button className="p-2 text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-all">
                  <span className="material-symbols-outlined">delete</span></button>
              </div>
            </div>
          </motion.div>

          {/* Worship Arts */}
          <motion.div className="col-span-1 md:col-span-4 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
              <div className="w-11 h-11 bg-[#fdc425] text-[#6d5200] rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>music_note</span>
              </div>
              <h3 className="text-[20px] sm:text-[22px] font-bold text-[#081534] mb-2">Spotlight Worship</h3>
              <p className="text-[14px] text-[#45464e] mb-5">Choir, band, and technical production teams.</p>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[#c6c6cf]/30">
                  <span className="text-[13px] text-[#45464e] font-semibold">Leader</span>
                  <span className="text-[13px] text-[#081534] font-bold">Sarah Jenkins</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[13px] text-[#45464e] font-semibold">Volunteers</span>
                  <span className="text-[13px] text-[#081534] font-bold">86</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="flex-1 bg-[#eceef0] text-[#081534] text-[13px] py-2.5 rounded-lg hover:bg-[#d8dadc] transition-colors font-semibold">Details</button>
              <button className="px-3 bg-[#eceef0] text-[#45464e] rounded-lg hover:bg-[#d8dadc] transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_vert</span></button>
            </div>
          </motion.div>

          {/* Small Groups */}
          <motion.div className="col-span-1 md:col-span-4 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-lg transition-all">
            <div>
              <div className="w-11 h-11 bg-[#d8e2ff] text-[#002960] rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups_3</span>
              </div>
              <h3 className="text-[20px] sm:text-[22px] font-bold text-[#081534] mb-2">Welfare & Program</h3>
              <p className="text-[14px] text-[#45464e] mb-5">Localized community gatherings across the city.</p>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[#c6c6cf]/30">
                  <span className="text-[13px] text-[#45464e] font-semibold">Total Groups</span>
                  <span className="text-[13px] text-[#081534] font-bold">42</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[13px] text-[#45464e] font-semibold">Growth Rate</span>
                  <span className="text-[13px] text-[#785a00] font-bold">+12%</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="flex-1 bg-[#eceef0] text-[#081534] text-[13px] py-2.5 rounded-lg hover:bg-[#d8dadc] transition-colors font-semibold">Manage</button>
              <button className="px-3 bg-[#eceef0] text-[#45464e] rounded-lg hover:bg-[#d8dadc] transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_vert</span></button>
            </div>
          </motion.div>

          {/* Global Outreach */}
          <motion.div className="col-span-1 md:col-span-8 bg-white border border-[#c6c6cf] rounded-xl overflow-hidden hover:shadow-lg transition-all">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-2/5 h-44 md:h-auto overflow-hidden">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop"
                  alt="Outreach" className="w-full h-full object-cover transition-all duration-500" />
              </div>
              <div className="flex-1 p-5 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[18px] sm:text-[22px] font-bold text-[#081534]">Evangelism & Outreach</h3>
                    <span className="px-3 py-1 bg-[#081534] text-white text-[10px] rounded-full uppercase font-bold tracking-widest">Global</span>
                  </div>
                  <p className="text-[14px] text-[#45464e] mb-5">Supporting international mission partners and local city relief initiatives.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f2f4f6] p-4 rounded-lg">
                      <p className="text-[11px] text-[#45464e] font-semibold">Lead Coordinator</p>
                      <p className="text-[14px] text-[#081534] font-bold">Elena Rodriguez</p>
                    </div>
                    <div className="bg-[#f2f4f6] p-4 rounded-lg">
                      <p className="text-[11px] text-[#45464e] font-semibold">Active Projects</p>
                      <p className="text-[14px] text-[#081534] font-bold">18 Global</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(n => (
                      <img key={n} src={`https://i.pravatar.cc/32?img=${n}`} alt="Volunteer"
                        className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#fdc425] text-[#6d5200] flex items-center justify-center text-[10px] font-bold">+12</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-[#45464e] hover:text-[#081534] transition-colors"><span className="material-symbols-outlined">share</span></button>
                    <button className="p-2 text-[#45464e] hover:text-[#081534] transition-colors"><span className="material-symbols-outlined">edit</span></button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pending Reviews */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[20px] sm:text-[22px] font-bold text-[#081534]">Pending Reviews</h3>
            <a href="#" className="text-[#785a00] text-[14px] font-semibold hover:underline">View All</a>
          </div>
          <div className="bg-white border border-[#c6c6cf] rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[520px]">
              <thead className="bg-[#f2f4f6] border-b border-[#c6c6cf]">
                <tr>
                  {['Ministry Name', 'Proposed Lead', 'Submission Date', 'Status', ''].map(h => (
                    <th key={h} className="px-4 sm:px-6 py-4 text-[13px] font-bold text-[#081534]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]/30">
                {reviews.map((r, i) => (
                  <tr key={i} className="hover:bg-[#f2f4f6] transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#002960] text-white rounded flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
                        </div>
                        <span className="text-[14px] text-[#081534] font-semibold">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-[14px] text-[#45464e]">{r.lead}</td>
                    <td className="px-4 sm:px-6 py-4 text-[14px] text-[#45464e]">{r.date}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`px-2.5 py-1 text-[12px] font-bold rounded-full ${r.status === 'Reviewing' ? 'bg-[#ffdf9a] text-[#5a4300]' : 'bg-[#eceef0] text-[#45464e]'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <button className="text-[#081534] hover:text-[#785a00] text-[14px] font-semibold transition-colors">Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}