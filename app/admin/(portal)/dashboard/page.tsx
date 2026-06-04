"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { motion } from "framer-motion";

type Member = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  guest_status: string;
};

type StatusCounts = {
  First_Timer: number;
  Returning: number;
  Regular: number;
  Member: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [total, setTotal] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    First_Timer: 0, Returning: 0, Regular: 0, Member: 0,
  });
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace("/admin"); return; }
      const email = data.session.user.email ?? "";
      setAdminName(email.split("@")[0]);
    });
  }, [router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Total count
      const { count: totalCount } = await supabase
        .from("members").select("id", { count: "exact", head: true });
      setTotal(totalCount || 0);

      // This week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: weekCount } = await supabase
        .from("members").select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());
      setThisWeek(weekCount || 0);

      // This month
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const { count: monthCount } = await supabase
        .from("members").select("id", { count: "exact", head: true })
        .gte("created_at", monthAgo.toISOString());
      setThisMonth(monthCount || 0);

      // Recent 5 members
      const { data: recent } = await supabase
        .from("members")
        .select("id, created_at, first_name, last_name, guest_status")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentMembers(recent || []);

      // Status breakdown
      const { data: all } = await supabase
        .from("members").select("guest_status");
      const counts: StatusCounts = { First_Timer: 0, Returning: 0, Regular: 0, Member: 0 };
      (all || []).forEach(m => {
        if (m.guest_status in counts) counts[m.guest_status as keyof StatusCounts]++;
      });
      setStatusCounts(counts);

      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" :
    now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const today = now.toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const statusConfig = [
    { key: "First_Timer", label: "First Timers", color: "bg-green-500", light: "bg-green-50 text-green-700" },
    { key: "Returning", label: "Returning", color: "bg-purple-500", light: "bg-purple-50 text-purple-700" },
    { key: "Regular", label: "Regular", color: "bg-blue-500", light: "bg-blue-50 text-blue-700" },
    { key: "Member", label: "Members", color: "bg-[#fdc425]", light: "bg-[#fdc425]/20 text-[#785a00]" },
  ];

  const quickActions = [
    { icon: "person_add", label: "Add Member", desc: "Register someone new", href: "/admin/add-member", bg: "bg-[#081534]", text: "text-white" },
    { icon: "group", label: "View Members", desc: "Browse congregation", href: "/admin/members", bg: "bg-[#fdc425]", text: "text-[#6d5200]" },
    { icon: "church", label: "Ministries", desc: "Manage departments", href: "/admin/ministries", bg: "bg-white", text: "text-[#081534]" },
    { icon: "analytics", label: "Analytics", desc: "Growth & insights", href: "/admin/analytics", bg: "bg-white", text: "text-[#081534]" },
  ];

  const totalForBar = total || 1;

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* ── Hero header ── */}
      <div className="bg-[#081534] px-4 sm:px-8 lg:px-10 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#fdc425] blur-[80px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white blur-[60px] -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative z-10 pl-12 lg:pl-0">
          <p className="text-[#fdc425] text-[12px] font-semibold uppercase tracking-widest mb-1">{today}</p>
          <h1 className="text-white text-[24px] sm:text-[30px] font-bold mb-1">
            {greeting}, <span className="text-[#fdc425] capitalize">{adminName}</span> 👋
          </h1>
          <p className="text-white/60 text-[13px]">Here's what's happening at theSpotlightChurch today.</p>
        </div>

        {/* Stat pills in hero */}
        <div className="relative z-10 mt-6 grid grid-cols-3 gap-3 pl-12 lg:pl-0">
          {[
            { label: "Total Members", value: total, icon: "group" },
            { label: "This Week", value: thisWeek, icon: "person_add" },
            { label: "This Month", value: thisMonth, icon: "trending_up" },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#fdc425] text-[16px]">{s.icon}</span>
                <span className="text-white/60 text-[11px] font-semibold">{s.label}</span>
              </div>
              <p className="text-white text-[22px] sm:text-[28px] font-bold">
                {loading ? "—" : s.value.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ── Quick Actions ── */}
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

        {/* ── Middle row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Congregation breakdown */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-[#081534]">Congregation Breakdown</h3>
              <button onClick={() => router.push("/admin/members")}
                className="text-[11px] font-semibold text-[#785a00] hover:underline">
                View all
              </button>
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
                        className={`${s.color} h-2 rounded-full`}
                      />
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
              <button onClick={() => router.push("/admin/members")}
                className="text-[11px] font-semibold text-[#785a00] hover:underline flex items-center gap-1">
                See all <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-12 bg-[#f2f4f6] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] mb-2">group_add</span>
                <p className="text-[#45464e] font-semibold text-[14px]">No members yet</p>
                <p className="text-[12px] text-[#76777f] mt-1">Register your first member to get started</p>
                <button onClick={() => router.push("/admin/add-member")}
                  className="mt-4 px-4 py-2 bg-[#081534] text-white text-[12px] font-bold rounded-lg hover:opacity-90">
                  Add First Member
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMembers.map((m, i) => (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f7f9fb] transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#081534] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        {m.first_name[0]}{m.last_name[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#191c1e]">
                          {m.first_name} {m.last_name}
                        </p>
                        <p className="text-[11px] text-[#45464e]">
                          {new Date(m.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${m.guest_status === "Member" ? "bg-[#fdc425]/20 text-[#785a00]" :
                          m.guest_status === "Regular" ? "bg-blue-50 text-blue-700" :
                          m.guest_status === "Returning" ? "bg-purple-50 text-purple-700" :
                          "bg-green-50 text-green-700"}`}>
                        {m.guest_status.replace("_", " ")}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Bottom row — page links ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Ministries card */}
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

          {/* Analytics card */}
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
            <p className="text-[12px] text-white/60 mb-4 relative z-10">Growth trends, engagement & impact.</p>
            <div className="flex items-center gap-1 text-[#fdc425] text-[12px] font-semibold group-hover:gap-2 transition-all relative z-10">
              Open <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </motion.div>

          {/* Settings card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => router.push("/admin/settings")}
            className="bg-white border border-[#c6c6cf] rounded-xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="w-10 h-10 bg-[#fdc425]/20 text-[#785a00] rounded-xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
            </div>
            <h3 className="text-[15px] font-bold text-[#081534] mb-1">Settings</h3>
            <p className="text-[12px] text-[#45464e] mb-4">Profile, password, notifications & team.</p>
            <div className="flex items-center gap-1 text-[#785a00] text-[12px] font-semibold group-hover:gap-2 transition-all">
              Open <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </motion.div>
        </div>

        {/* ── Footer note ── */}
        <div className="bg-[#ffdf9a] border border-[#fdc425] rounded-xl p-4 sm:p-5 flex items-start sm:items-center gap-4">
          <span className="material-symbols-outlined text-[#785a00] text-[24px] shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
          <div>
            <p className="text-[13px] font-bold text-[#081534]">Company of the Blessed</p>
            <p className="text-[12px] text-[#5a4300]">
              Every soul registered here is tracked, welcomed, and followed up with love.
              Keep growing the family. 🙏
            </p>
          </div>
          <button onClick={() => router.push("/admin/add-member")}
            className="ml-auto shrink-0 bg-[#081534] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity hidden sm:block">
            + Add Member
          </button>
        </div>

      </div>
    </div>
  );
}