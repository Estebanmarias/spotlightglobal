'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type StatusCounts = {
  First_Timer: number
  Attending: number
  Member: number
}

type WeeklyData = {
  week: string
  count: number
}

type AttendanceWeek = {
  label: string
  male: number
  female: number
  children: number
  total: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [thisWeek, setThisWeek] = useState(0)
  const [thisMonth, setThisMonth] = useState(0)
  const [lastMonth, setLastMonth] = useState(0)
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ First_Timer: 0, Attending: 0, Member: 0 })
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [attendanceWeeks, setAttendanceWeeks] = useState<AttendanceWeek[]>([])
  const [lastAttendance, setLastAttendance] = useState<AttendanceWeek | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin')
    })
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const { count: totalCount } = await supabase
      .from('members').select('id', { count: 'exact', head: true })
    setTotal(totalCount || 0)

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: weekCount } = await supabase
      .from('members').select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())
    setThisWeek(weekCount || 0)

    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
    const { count: monthCount } = await supabase
      .from('members').select('id', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString())
    setThisMonth(monthCount || 0)

    const twoMonthsAgo = new Date(); twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60)
    const { count: lastMonthCount } = await supabase
      .from('members').select('id', { count: 'exact', head: true })
      .gte('created_at', twoMonthsAgo.toISOString())
      .lt('created_at', monthAgo.toISOString())
    setLastMonth(lastMonthCount || 0)

    const { data: allMembers } = await supabase.from('members').select('guest_status') as { data: { guest_status: string }[] | null }
    const counts: StatusCounts = { First_Timer: 0, Attending: 0, Member: 0 }
    ;(allMembers || []).forEach(m => {
      if (m.guest_status in counts) counts[m.guest_status as keyof StatusCounts]++
    })
    setStatusCounts(counts)

    // Weekly member registrations — last 8 weeks
    const weeks: WeeklyData[] = []
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - (i + 1) * 7)
      const end = new Date(); end.setDate(end.getDate() - i * 7)
      const { count } = await supabase
        .from('members').select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
      weeks.push({ week: `Wk ${8 - i}`, count: count || 0 })
    }
    setWeeklyData(weeks)

    // Attendance — last 8 recorded services
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('service_date, male_count, female_count, children_count, total_count')
      .order('service_date', { ascending: false })
      .limit(8) as { data: { service_date: string; male_count: number; female_count: number; children_count: number; total_count: number }[] | null }

    if (attendance && attendance.length > 0) {
      const formatted = attendance.reverse().map(a => ({
        label: new Date(a.service_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
        male: a.male_count,
        female: a.female_count,
        children: a.children_count,
        total: a.total_count,
      }))
      setAttendanceWeeks(formatted)
      setLastAttendance(formatted[formatted.length - 1])
    }

    setLoading(false)
  }

  const handleExport = async () => {
    const { data } = await supabase.from('members').select('*').order('created_at', { ascending: false })
    if (!data) return
    const headers = ['First Name','Last Name','Email','Phone','DOB','Guest Status','Registered']
    const rows = data.map(m => [
      m.first_name, m.last_name, m.email, m.phone, m.dob,
      m.guest_status, new Date(m.created_at).toLocaleDateString('en-NG')
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `spotlight-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const maxWeekly = Math.max(...weeklyData.map(w => w.count), 1)
  const maxAttendance = Math.max(...attendanceWeeks.map(w => w.total), 1)
  const monthGrowth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0
  const totalForBar = total || 1

  const statusConfig = [
    { key: 'First_Timer', label: 'First Timers', color: 'bg-green-500', light: 'bg-green-50 text-green-700' },
    { key: 'Attending',   label: 'Attending',    color: 'bg-blue-500',  light: 'bg-blue-50 text-blue-700' },
    { key: 'Member',      label: 'Members',      color: 'bg-[#fdc425]', light: 'bg-[#fdc425]/20 text-[#785a00]' },
  ]

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 lg:px-10 py-4 z-40">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="pl-12 lg:pl-0">
            <h2 className="text-[22px] sm:text-[26px] font-bold text-[#081534]">Analytics</h2>
            <p className="text-[13px] text-[#45464e]">Live data from members and attendance records.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadData}
              className="px-4 py-2 rounded-lg border border-[#c6c6cf] text-[13px] font-semibold text-[#191c1e] hover:bg-[#eceef0] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-[#081534] text-white text-[13px] font-semibold hover:opacity-90 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Top metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Members',  value: total,      icon: 'group',       sub: 'All time',          color: 'bg-[#081534]' },
            { label: 'This Week',      value: thisWeek,   icon: 'person_add',  sub: 'Last 7 days',       color: 'bg-[#fdc425]' },
            { label: 'This Month',     value: thisMonth,  icon: 'trending_up', sub: 'Last 30 days',      color: 'bg-[#002960]' },
            { label: 'Month Growth',   value: `${monthGrowth > 0 ? '+' : ''}${monthGrowth}%`, icon: 'analytics', sub: 'vs previous month', color: 'bg-[#1e2a4a]' },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-[#c6c6cf] p-4 sm:p-6 rounded-xl hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${m.color} text-white`}>
                  <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#45464e] font-semibold">{m.label}</p>
              <h3 className="text-[22px] sm:text-[28px] font-bold text-[#081534] mt-1">
                {loading ? '—' : m.value.toLocaleString()}
              </h3>
              <p className="text-[11px] text-[#45464e] mt-1">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Member growth + status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-8 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-8">
            <h4 className="text-[18px] font-bold text-[#081534] mb-1">Weekly Registrations</h4>
            <p className="text-[12px] text-[#45464e] mb-6">New members registered per week over the last 8 weeks.</p>
            {loading ? (
              <div className="h-40 bg-[#f2f4f6] rounded-lg animate-pulse" />
            ) : (
              <>
                <div className="relative h-40 sm:h-48 flex items-end gap-2 px-1">
                  {weeklyData.map((w, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] text-[#45464e] font-bold opacity-0 group-hover:opacity-100 transition-opacity">{w.count}</span>
                      <div className="w-full bg-[#f2f4f6] rounded-t overflow-hidden" style={{ height: '160px' }}>
                        <div className="w-full bg-[#fdc425] rounded-t transition-all group-hover:brightness-110"
                          style={{ height: `${(w.count / maxWeekly) * 100}%`, marginTop: `${100 - (w.count / maxWeekly) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 px-1 text-[11px] text-[#45464e] font-semibold">
                  {weeklyData.map(w => <span key={w.week}>{w.week}</span>)}
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-4 bg-[#081534] text-white rounded-xl p-5 sm:p-8">
            <h4 className="text-[18px] font-bold mb-1">Guest Status</h4>
            <p className="text-[12px] opacity-70 mb-6">Congregation breakdown by type.</p>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-white/10 rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-5">
                {statusConfig.map(s => {
                  const count = statusCounts[s.key as keyof StatusCounts]
                  const pct = Math.round((count / totalForBar) * 100)
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[13px] font-semibold text-white/90">{s.label}</span>
                        <span className="text-[12px] font-bold text-[#ffdf9a]">{count}</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className={`${s.color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-[11px] text-white/50 uppercase tracking-widest mb-1">Total Registered</p>
              <p className="text-[28px] font-bold">{loading ? '—' : total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Attendance trends */}
        <div className="bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
            <div>
              <h4 className="text-[18px] font-bold text-[#081534]">Sunday Attendance Trends</h4>
              <p className="text-[12px] text-[#45464e]">Last {attendanceWeeks.length} recorded services — male, female, children.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#4572ee]" /><span className="text-[12px] font-semibold">Male</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#fd25eb]" /><span className="text-[12px] font-semibold">Female</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ddec88]" /><span className="text-[12px] font-semibold">Children</span></div>
            </div>
          </div>

          {loading ? (
            <div className="h-48 bg-[#f2f4f6] rounded-lg animate-pulse" />
          ) : attendanceWeeks.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-2">fact_check</span>
              <p className="text-[#45464e] font-semibold text-[14px]">No attendance recorded yet</p>
              <p className="text-[12px] text-[#76777f] mt-1">Log your first Sunday headcount in the Attendance page</p>
            </div>
          ) : (
            <>
              <div className="relative h-48 flex items-end gap-3 px-1">
                {attendanceWeeks.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <span className="text-[10px] text-[#45464e] font-bold mb-1">{w.total}</span>
                    <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: '160px' }}>
                      <div className="bg-[#081534] group-hover:brightness-110 transition-all" style={{ height: `${(w.male / maxAttendance) * 100}%` }} />
                      <div className="bg-[#fdc425] group-hover:brightness-110 transition-all" style={{ height: `${(w.female / maxAttendance) * 100}%` }} />
                      <div className="bg-[#adc6ff] group-hover:brightness-110 transition-all" style={{ height: `${(w.children / maxAttendance) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 px-1 text-[11px] text-[#45464e] font-semibold">
                {attendanceWeeks.map((w, i) => <span key={i}>{w.label}</span>)}
              </div>
            </>
          )}

          {lastAttendance && (
            <div className="mt-6 pt-6 border-t border-[#c6c6cf] grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[20px] font-bold text-[#081534]">{lastAttendance.male}</p>
                <p className="text-[11px] text-[#45464e] font-semibold">Male</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-[#081534]">{lastAttendance.female}</p>
                <p className="text-[11px] text-[#45464e] font-semibold">Female</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-[#081534]">{lastAttendance.children}</p>
                <p className="text-[11px] text-[#45464e] font-semibold">Children</p>
              </div>
            </div>
          )}
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statusConfig.map((s, i) => {
            const count = statusCounts[s.key as keyof StatusCounts]
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <motion.div key={s.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="bg-white border border-[#c6c6cf] rounded-xl p-5">
                <div className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold mb-3 ${s.light}`}>
                  {s.label}
                </div>
                <p className="text-[28px] font-bold text-[#081534]">{loading ? '—' : count}</p>
                <p className="text-[12px] text-[#45464e] mt-1">{loading ? '' : `${pct}% of total`}</p>
              </motion.div>
            )
          })}
        </div>

      </div>
    </div>
  )
}