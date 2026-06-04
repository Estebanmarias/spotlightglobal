'use client'

import { motion } from 'framer-motion'

const metrics = [
  { label: 'Total Members', value: '2,845', trend: '+12%', icon: 'group', color: 'bg-[#1e2a4a]' },
  { label: 'Avg. Attendance', value: '1,920', trend: '+5.2%', icon: 'how_to_reg', color: 'bg-[#fdc425]' },
  { label: 'Engagement Rate', value: '68%', trend: '0%', icon: 'favorite', color: 'bg-[#002960]' },
  { label: 'New Giving', value: '$42.3k', trend: '+8.4%', icon: 'volunteer_activism', color: 'bg-[#f7be1d]' },
]

const engagementData = [
  { age: 'Youth (13-24)', rate: 82 },
  { age: 'Young Adults (25-40)', rate: 65 },
  { age: 'Families (40+)', rate: 91 },
]

const milestones = [
  { icon: 'campaign', title: 'Community Outreach Goal Met', desc: '500+ participants in "Hope for All" mission.', time: '2 hours ago', color: 'bg-green-100 text-green-700' },
  { icon: 'person_add', title: 'New Ministry Launch', desc: '"Global Tech Mission" added to Dashboard.', time: 'Yesterday', color: 'bg-blue-100 text-blue-700' },
  { icon: 'analytics', title: 'Quarterly Insight Ready', desc: 'Download the detailed mission impact report.', time: '2 days ago', color: 'bg-amber-100 text-amber-700' },
]

const barHeights = [4, 3, 5, 2, 3, 6, 2, 4]
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

export default function AnalyticsPage() {
  return (
    <main className="bg-[#f7f9fb]">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 lg:px-12 py-4 z-40">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-[22px] sm:text-[28px] font-bold text-[#081534] mb-0.5">Analytics Dashboard</h2>
            <p className="text-[13px] sm:text-[15px] text-[#45464e]">Monitoring growth and engagement across the global mission.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 rounded-lg border border-[#c6c6cf] text-[13px] font-semibold text-[#191c1e] hover:bg-[#eceef0] transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              <span className="hidden sm:inline">Last 30 Days</span>
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#081534] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 lg:p-12">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-[#c6c6cf] p-4 sm:p-6 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${m.color} text-white`}>
                  <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                </div>
                <span className="text-green-600 text-[11px] font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>{m.trend}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#45464e] font-semibold">{m.label}</p>
              <h3 className="text-[22px] sm:text-[28px] font-bold text-[#081534] mt-1">{m.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
          {/* Bar chart */}
          <div className="lg:col-span-8 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
              <div>
                <h4 className="text-[18px] sm:text-[22px] font-bold text-[#081534]">Member Growth Trends</h4>
                <p className="text-[12px] text-[#45464e]">Monthly registrations comparison.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#fdc425]" /><span className="text-[13px] font-semibold">2025</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#081534]/20" /><span className="text-[13px] font-semibold">2024</span></div>
              </div>
            </div>
            <div className="relative h-40 sm:h-48 flex items-end gap-1 sm:gap-2 px-1">
              {barHeights.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="w-full bg-[#081534]/10 rounded-t overflow-hidden h-40 sm:h-48 flex flex-col-reverse">
                    <div className="bg-[#fdc425] rounded-t transition-all group-hover:brightness-110"
                      style={{ height: `${(h / 6) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 px-1 text-[11px] text-[#45464e] font-semibold">
              {months.map(m => <span key={m}>{m}</span>)}
            </div>
          </div>

          {/* Engagement depth */}
          <div className="lg:col-span-4 bg-[#081534] text-white rounded-xl p-5 sm:p-8">
            <h4 className="text-[18px] sm:text-[22px] font-bold mb-1">Engagement Depth</h4>
            <p className="text-[13px] opacity-70 mb-6">Ministry involvement by age group.</p>
            <div className="space-y-5">
              {engagementData.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span>{item.age}</span><span>{item.rate}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#ffdf9a] h-full" style={{ width: `${item.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-8">
            <h4 className="text-[18px] sm:text-[22px] font-bold text-[#081534] mb-5">Recent Milestones</h4>
            <div className="space-y-5">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`h-10 w-10 shrink-0 rounded-full ${m.color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#191c1e]">{m.title}</p>
                    <p className="text-[12px] text-[#45464e]">{m.desc}</p>
                    <span className="text-[10px] text-[#76777f] block mt-1">{m.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 border border-[#c6c6cf] rounded-lg text-[14px] font-semibold text-[#081534] hover:bg-[#eceef0] transition-colors">
              View All Activity
            </button>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#c6c6cf] rounded-xl overflow-hidden flex flex-col min-h-[280px]">
            <div className="p-5 sm:p-8 pb-4">
              <h4 className="text-[18px] sm:text-[22px] font-bold text-[#081534]">Global Influence</h4>
              <p className="text-[12px] text-[#45464e]">Live engagement distribution across global campuses.</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-[#eceef0] to-[#d8dadc] flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-[64px] text-[#081534]/20 block">public</span>
                <p className="text-[14px] text-[#45464e] mt-4">Global reach visualization</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}