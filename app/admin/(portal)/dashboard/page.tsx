"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { useAdminAccess, ALL_PAGES, PageKey } from "@/lib/use-admin-permissions";

type Member = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  guest_status: string;
};

type StatusCounts = {
  First_Timer: number;
  Attending: number;
  Member: number;
};

function BirthdayWidget() {
  const supabase = getSupabaseClient()
  const [birthdays, setBirthdays] = useState<{ id: string; first_name: string; last_name: string; dob: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch_ = async () => {
      const { data } = await supabase
        .from('members')
        .select('id, first_name, last_name, dob')
        .not('dob', 'is', null) as { data: { id: string; first_name: string; last_name: string; dob: string }[] | null }

      const today = new Date()
      const upcoming = (data || []).filter(m => {
        const dob  = new Date(m.dob)
        const bday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        const diff = Math.ceil((bday.getTime() - today.getTime()) / 86400000)
        return diff >= 0 && diff <= 6
      }).map(m => {
        const dob  = new Date(m.dob)
        const bday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        const diff = Math.ceil((bday.getTime() - today.getTime()) / 86400000)
        return { ...m, daysUntil: diff }
      }).sort((a, b) => a.daysUntil - b.daysUntil)

      setBirthdays(upcoming as any)
      setLoading(false)
    }
    fetch_()
  }, [])

  const dayLabel = (days: number) => {
    if (days === 0) return { label: 'Today! 🎉', color: 'bg-[#fdc425] text-[#6d5200]' }
    if (days === 1) return { label: 'Tomorrow',  color: 'bg-[#d8e2ff] text-[#002960]' }
    const d = new Date()
    d.setDate(d.getDate() + days)
    return {
      label: d.toLocaleDateString('en-NG', { weekday: 'long' }),
      color: 'bg-[#f2f4f6] text-[#45464e]'
    }
  }

  if (!loading && birthdays.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#c6c6cf]">
        <div className="w-9 h-9 bg-[#fdc425]/20 text-[#785a00] rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}>cake</span>
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-[#081534]">Birthdays This Week</h3>
          <p className="text-[11px] text-[#45464e]">
            {loading ? 'Checking...' : `${birthdays.length} member${birthdays.length !== 1 ? 's' : ''} celebrating soon`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-2">
          {[1, 2].map(i => <div key={i} className="h-10 bg-[#f2f4f6] rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="divide-y divide-[#f2f4f6]">
          {birthdays.map((m: any) => {
            const { label, color } = dayLabel(m.daysUntil)
            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between px-5 py-3 hover:bg-[#f7f9fb] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#081534] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    {m.first_name[0]}{m.last_name[0]}
                  </div>
                  <p className="text-[13px] font-semibold text-[#081534]">
                    {m.first_name} {m.last_name}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${color}`}>
                  {label}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const access = useAdminAccess('dashboard');

  const [total, setTotal] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    First_Timer: 0, Attending: 0, Member: 0,
  });
  const [loading, setLoading] = useState(true);
  const [partnerCount, setPartnerCount] = useState(0);
  const [newPartnerCount, setNewPartnerCount] = useState(0);
  const [testimonies, setTestimonies] = useState<{ id: string; name: string; testimony: string; created_at: string }[]>([]);
  const [deletingTestimony, setDeletingTestimony] = useState<string | null>(null);

  useEffect(() => {
    if (access.loading) return;
    const load = async () => {
      setLoading(true);

      const { count: totalCount } = await supabase
        .from("members").select("id", { count: "exact", head: true });
      setTotal(totalCount || 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: weekCount } = await supabase
        .from("members").select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());
      setThisWeek(weekCount || 0);

      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const { count: monthCount } = await supabase
        .from("members").select("id", { count: "exact", head: true })
        .gte("created_at", monthAgo.toISOString());
      setThisMonth(monthCount || 0);

      const { data: recent } = await supabase
        .from("members")
        .select("id, created_at, first_name, last_name, guest_status")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentMembers(recent || []);

      const { data: all } = await supabase
        .from("members").select("guest_status") as { data: { guest_status: string }[] | null };
      const counts: StatusCounts = { First_Timer: 0, Attending: 0, Member: 0 };
      (all || []).forEach(m => {
        if (m.guest_status in counts) counts[m.guest_status as keyof StatusCounts]++;
      });
      setStatusCounts(counts);

      // Partners — Setman OR admin with 'partners' permission
      if (access.canAccess('partners')) {
        const { count: pTotal } = await (supabase.from('partner_submissions') as any)
          .select('id', { count: 'exact', head: true })
        setPartnerCount(pTotal || 0)

        const { count: pNew } = await (supabase.from('partner_submissions') as any)
          .select('id', { count: 'exact', head: true }).eq('status', 'new')
        setNewPartnerCount(pNew || 0)
      }

      // Testimonies — Setman only
      if (access.isSuperAdmin) {
        const { data: tData } = await (supabase.from('testimonies') as any)
          .select('id, name, testimony, created_at')
          .order('created_at', { ascending: false })
          .limit(50)
        setTestimonies(tData || [])
      }

      setLoading(false);
    };
    load();
  }, [access.loading]);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" :
    now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const today = now.toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const displayName = access.isSuperAdmin ? "Setman" : (access.fullName?.split(" ")[0] || access.email.split("@")[0]);

  const statusConfig = [
    { key: "First_Timer", label: "First Timers", color: "bg-green-500", light: "bg-green-50 text-green-700" },
    { key: "Attending",   label: "Attending",    color: "bg-blue-500",  light: "bg-blue-50 text-blue-700" },
    { key: "Member",      label: "Members",      color: "bg-[#fdc425]", light: "bg-[#fdc425]/20 text-[#785a00]" },
  ];

  const allQuickActions: { icon: string; label: string; desc: string; href: string; bg: string; text: string; page: PageKey }[] = [
    { icon: "person_add", label: "Add Member",  desc: "Register someone new",  href: "/admin/add-member",  bg: "bg-[#081534]", text: "text-white",        page: "members" },
    { icon: "group",      label: "View Members",desc: "Browse congregation",   href: "/admin/members",     bg: "bg-[#fdc425]", text: "text-[#6d5200]",   page: "members" },
    { icon: "fact_check", label: "Attendance",  desc: "Log Sunday headcount",  href: "/admin/attendance",  bg: "bg-white",     text: "text-[#081534]",   page: "attendance" },
    { icon: "church",     label: "Ministries",  desc: "Manage departments",    href: "/admin/ministries",  bg: "bg-white",     text: "text-[#081534]",   page: "ministries" },
  ];

  const quickActions = allQuickActions.filter(a => access.canAccess(a.page));
  const totalForBar = total || 1;

  const statusBadgeStyle = (status: string) => {
    if (status === "Member")   return "bg-[#fdc425]/20 text-[#785a00]";
    if (status === "Attending") return "bg-blue-50 text-blue-700";
    return "bg-green-50 text-green-700";
  };

  if (access.loading) {
    return <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center"><p className="text-[#45464e]">Loading...</p></div>;
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* ── Hero header ── */}
      <div className="bg-[#081534] px-4 sm:px-8 lg:px-10 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#fdc425] blur-[80px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white blur-[60px] -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative z-10 pl-12 lg:pl-0">
          <p className="text-[#fdc425] text-[12px] font-semibold uppercase tracking-widest mb-1">{today}</p>
          <h1 className="text-white text-[24px] sm:text-[30px] font-bold mb-1">
            {greeting}, <span className="text-[#fdc425]">{displayName}</span> 👋
          </h1>
          <p className="text-white/60 text-[12px] sm:text-[13px] flex items-center gap-2 flex-wrap">
            Here's what's happening at theSpotlightChurch today.
            {access.isSuperAdmin && <span className="px-2 py-0.5 bg-[#fdc425] text-[#6d5200] rounded-full text-[10px] font-bold uppercase shrink-0">Setman</span>}
          </p>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-3 gap-2 sm:gap-3 pl-12 lg:pl-0">
          {[
            { label: "Total Members", value: total,     icon: "group" },
            { label: "This Week",     value: thisWeek,  icon: "person_add" },
            { label: "This Month",    value: thisMonth, icon: "trending_up" },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 sm:p-4 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <span className="material-symbols-outlined text-[#fdc425] text-[14px] sm:text-[16px] shrink-0">{s.icon}</span>
                <span className="text-white/60 text-[9px] sm:text-[11px] font-semibold truncate">{s.label}</span>
              </div>
              <p className="text-white text-[18px] sm:text-[28px] font-bold">
                {loading ? "—" : s.value.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ── Quick Actions ── */}
        {quickActions.length > 0 && (
          <div>
            <h2 className="text-[13px] font-bold text-[#45464e] uppercase tracking-widest mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((a, i) => (
                <motion.button key={a.label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => router.push(a.href)}
                  className={`${a.bg} ${a.text} border border-[#c6c6cf] rounded-xl p-4 sm:p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group`}>
                  <span className="material-symbols-outlined text-[24px] mb-3 block"
                    style={{ fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                  <p className="font-bold text-[14px]">{a.label}</p>
                  <p className={`text-[11px] mt-0.5 ${a.bg === 'bg-[#081534]' ? 'text-white/60' : a.bg === 'bg-[#fdc425]' ? 'text-[#6d5200]/70' : 'text-[#45464e]'}`}>
                    {a.desc}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ── Middle row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Congregation breakdown */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-[#081534]">Congregation Breakdown</h3>
              {access.canAccess('members') && (
                <button onClick={() => router.push("/admin/members")}
                  className="text-[11px] font-semibold text-[#785a00] hover:underline">View all</button>
              )}
            </div>
            <div className="space-y-4">
              {statusConfig.map(s => {
                const count = statusCounts[s.key as keyof StatusCounts];
                const pct = total > 0 ? Math.round((count / totalForBar) * 100) : 0;
                return (
                  <div key={s.key}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] font-semibold text-[#191c1e]">{s.label}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.light}`}>
                        {loading ? "—" : count}
                      </span>
                    </div>
                    <div className="w-full bg-[#f2f4f6] rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className={`${s.color} h-2 rounded-full`} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-[#c6c6cf]">
              <p className="text-[11px] text-[#45464e] font-semibold uppercase tracking-wide mb-1">Total Registered</p>
              <p className="text-[28px] font-bold text-[#081534]">{loading ? "—" : total.toLocaleString()}</p>
            </div>
          </motion.div>

          {/* Recent sign-ups */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-[#081534]">Recent Sign-ups</h3>
              {access.canAccess('members') && (
                <button onClick={() => router.push("/admin/members")}
                  className="text-[11px] font-semibold text-[#785a00] hover:underline flex items-center gap-1">
                  See all <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[#f2f4f6] rounded-lg animate-pulse" />)}
              </div>
            ) : recentMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] mb-2">group_add</span>
                <p className="text-[#45464e] font-semibold text-[14px]">No members yet</p>
                {access.canAccess('members') && (
                  <button onClick={() => router.push("/admin/add-member")}
                    className="mt-4 px-4 py-2 bg-[#081534] text-white text-[12px] font-bold rounded-lg hover:opacity-90">
                    Add First Member
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {recentMembers.map((m, i) => (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f7f9fb] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#081534] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        {m.first_name[0]}{m.last_name[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#191c1e]">{m.first_name} {m.last_name}</p>
                        <p className="text-[11px] text-[#45464e]">
                          {new Date(m.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeStyle(m.guest_status)}`}>
                      {m.guest_status.replace("_", " ")}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {access.canAccess('ministries') && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => router.push("/admin/ministries")}
              className="bg-white border border-[#c6c6cf] rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="w-10 h-10 bg-[#002960] text-[#adc6ff] rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>church</span>
              </div>
              <h3 className="text-[15px] font-bold text-[#081534] mb-1">Ministries</h3>
              <p className="text-[12px] text-[#45464e] mb-4">Manage departments, leaders, and programs.</p>
              <div className="flex items-center gap-1 text-[#785a00] text-[12px] font-semibold group-hover:gap-2 transition-all">
                Open <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </div>
            </motion.div>
          )}

          {access.canAccess('analytics') && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              onClick={() => router.push("/admin/analytics")}
              className="bg-[#081534] rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-[100px] text-white">analytics</span>
              </div>
              <div className="w-10 h-10 bg-[#fdc425] text-[#6d5200] rounded-xl flex items-center justify-center mb-4 relative z-10">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              </div>
              <h3 className="text-[15px] font-bold text-white mb-1 relative z-10">Analytics</h3>
              <p className="text-[12px] text-white/60 mb-4 relative z-10">Growth trends, attendance & impact.</p>
              <div className="flex items-center gap-1 text-[#fdc425] text-[12px] font-semibold group-hover:gap-2 transition-all relative z-10">
                Open <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </div>
            </motion.div>
          )}

          {/* Giving — Setman OR admin with giving permission */}
          {access.canAccess('giving') && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={() => router.push("/admin/giving")}
              className="bg-[#fdc425] rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group relative overflow-hidden">
              <div className="w-10 h-10 bg-[#081534] text-[#fdc425] rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
              </div>
              <h3 className="text-[15px] font-bold text-[#081534] mb-1">Giving & Records</h3>
              <p className="text-[12px] text-[#6d5200] mb-4">Donations, tithes & giving records.</p>
              <div className="flex items-center gap-1 text-[#081534] text-[12px] font-semibold group-hover:gap-2 transition-all">
                Open <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </div>
            </motion.div>
          )}

          {/* Settings — only if no giving access (fills the slot) */}
          {!access.canAccess('giving') && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={() => router.push("/admin/settings")}
              className="bg-white border border-[#c6c6cf] rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="w-10 h-10 bg-[#fdc425]/20 text-[#785a00] rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
              </div>
              <h3 className="text-[15px] font-bold text-[#081534] mb-1">Settings</h3>
              <p className="text-[12px] text-[#45464e] mb-4">Account, password & team access.</p>
              <div className="flex items-center gap-1 text-[#785a00] text-[12px] font-semibold group-hover:gap-2 transition-all">
                Open <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Partners snapshot — Setman OR admin with partners permission ── */}
        {access.canAccess('partners') && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={() => router.push('/admin/partner')}
            className="bg-white border border-[#c6c6cf] rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-[#081534] text-[#fdc425] rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
              </div>
              {!loading && newPartnerCount > 0 && (
                <span className="px-2.5 py-1 bg-[#fdc425] text-[#6d5200] text-[11px] font-bold rounded-full">
                  {newPartnerCount} new
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-bold text-[#081534] mb-1">Partnership Submissions</h3>
            <p className="text-[12px] text-[#45464e] mb-3">
              {loading ? '—' : `${partnerCount} total submission${partnerCount !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-1 text-[#785a00] text-[12px] font-semibold group-hover:gap-2 transition-all">
              View all <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </motion.div>
        )}

        {/* ── Testimonies — Setman only ── */}
        {access.isSuperAdmin && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#c6c6cf]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#fdc425]/20 text-[#785a00] rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#081534]">Community Testimonies</h3>
                  <p className="text-[11px] text-[#45464e]">{testimonies.length} total — delete any harmful content</p>
                </div>
              </div>
            </div>
            {testimonies.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-[40px] text-[#c6c6cf] block mb-2">chat_bubble_outline</span>
                <p className="text-[13px] text-[#76777f]">No testimonies submitted yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f2f4f6] max-h-[400px] overflow-y-auto">
                {testimonies.map(t => (
                  <div key={t.id} className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-[#f7f9fb] transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#081534] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#081534]">{t.name}</p>
                        <p className="text-[12px] text-[#45464e] leading-relaxed mt-0.5 line-clamp-2">"{t.testimony}"</p>
                        <p className="text-[10px] text-[#76777f] mt-1">
                          {new Date(t.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <button
                      disabled={deletingTestimony === t.id}
                      onClick={async () => {
                        setDeletingTestimony(t.id)
                        await (supabase.from('testimonies') as any).delete().eq('id', t.id)
                        setTestimonies(prev => prev.filter(x => x.id !== t.id))
                        setDeletingTestimony(null)
                      }}
                      className="shrink-0 p-1.5 text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors disabled:opacity-40">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Birthday Widget ── */}
          <BirthdayWidget />

        {/* ── Footer note ── */}
        <div className="bg-[#ffdf9a] border border-[#fdc425] rounded-xl p-4 sm:p-5 flex items-start sm:items-center gap-4">
          <span className="material-symbols-outlined text-[#785a00] text-[24px] shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
          <div>
            <p className="text-[13px] font-bold text-[#081534]">Company of the Blessed</p>
            <p className="text-[12px] text-[#5a4300]">
              Every soul registered here is tracked, welcomed, and followed up with love. Keep growing the family. 🙏
            </p>
          </div>
          {access.canAccess('members') && (
            <button onClick={() => router.push("/admin/add-member")}
              className="ml-auto shrink-0 bg-[#081534] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity hidden sm:block">
              + Add Member
            </button>
          )}
        </div>
      </div>
    </div>
  );
}