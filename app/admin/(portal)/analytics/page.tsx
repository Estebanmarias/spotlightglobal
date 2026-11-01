"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase";
import { useAdminAccess } from "@/lib/use-admin-permissions";
import AdminLoader from "@/components/AdminLoader";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Icon from '@/components/Icon'
import { attendanceChange, percentageChange } from "@/lib/analytics-metrics";
import { buildCsv } from "@/lib/csv";

type StatusCounts = {
  First_Timer: number;
  Attending: number;
  Member: number;
};

type WeeklyData = {
  week: string;
  count: number;
};

type AttendanceWeek = {
  label: string;
  male: number;
  female: number;
  children: number;
  total: number;
};

type GivingMonth = {
  month: string;
  total: number;
};

type GivingTypeSlice = {
  name: string;
  value: number;
};

const GIVING_COLORS = [
  "#fdc425",
  "#081534",
  "#002960",
  "#785a00",
  "#adc6ff",
  "#c6c6cf",
];

export default function AnalyticsPage() {
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeRange, setActiveRange] = useState<"8" | "12">("8");
  const [total, setTotal] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [lastMonth, setLastMonth] = useState(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    First_Timer: 0,
    Attending: 0,
    Member: 0,
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [attendanceWeeks, setAttendanceWeeks] = useState<AttendanceWeek[]>([]);
  const [lastAttendance, setLastAttendance] = useState<AttendanceWeek | null>(
    null,
  );

  const [givingLoading, setGivingLoading] = useState(true);
  const [givingByMonth, setGivingByMonth] = useState<GivingMonth[]>([]);
  const [givingByType, setGivingByType] = useState<GivingTypeSlice[]>([]);
  const [givingTotal, setGivingTotal] = useState(0);

  const access = useAdminAccess("analytics");
  const canViewGiving =
    access.isSuperAdmin || access.permissions.includes("giving");

  const loadData = async () => {
    setLoading(true);
    setLoadError("");

    const { count: totalCount, error: totalError } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true });
    if (totalError) {
      setLoadError("Analytics data could not be loaded. Check your connection and try again.");
      setLoading(false);
      return;
    }
    setTotal(totalCount || 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: weekCount } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());
    setThisWeek(weekCount || 0);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const { count: monthCount } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthAgo.toISOString());
    setThisMonth(monthCount || 0);

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const { count: lastMonthCount } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .gte("created_at", twoMonthsAgo.toISOString())
      .lt("created_at", monthAgo.toISOString());
    setLastMonth(lastMonthCount || 0);

    const { data: allMembers } = (await supabase
      .from("members")
      .select("guest_status")) as { data: { guest_status: string }[] | null };
    const counts: StatusCounts = { First_Timer: 0, Attending: 0, Member: 0 };
    (allMembers || []).forEach((m) => {
      if (m.guest_status in counts)
        counts[m.guest_status as keyof StatusCounts]++;
    });
    setStatusCounts(counts);

    // Weekly member registrations — last 8 or 12 weeks
    const weeks: WeeklyData[] = [];
    const range = Number(activeRange);
    for (let i = range - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const { count } = await supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
      weeks.push({ week: `Wk ${range - i}`, count: count || 0 });
    }
    setWeeklyData(weeks);

    // Attendance — last 8 recorded services
    const { data: attendance } = (await supabase
      .from("attendance_records")
      .select(
        "service_date, male_count, female_count, children_count, total_count",
      )
      .order("service_date", { ascending: false })
      .limit(8)) as {
      data:
        | {
            service_date: string;
            male_count: number;
            female_count: number;
            children_count: number;
            total_count: number;
          }[]
        | null;
    };

    if (attendance && attendance.length > 0) {
      const formatted = attendance.reverse().map((a) => ({
        label: new Date(a.service_date).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
        }),
        male: a.male_count,
        female: a.female_count,
        children: a.children_count,
        total: a.total_count,
      }));
      setAttendanceWeeks(formatted);
      setLastAttendance(formatted[formatted.length - 1]);
    }

    setLoading(false);
  };

  const loadGivingData = async () => {
    setGivingLoading(true);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const { data } = (await supabase
      .from("giving_records")
      .select("amount, giving_type, created_at")
      .gte("created_at", sixMonthsAgo.toISOString())) as {
      data:
        | { amount: number; giving_type: string; created_at: string }[]
        | null;
    };

    const records = data || [];

    // Build last 6 calendar months, oldest to newest
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-NG", { month: "short" }),
      });
    }

    const monthTotals: Record<string, number> = {};
    months.forEach((m) => {
      monthTotals[m.key] = 0;
    });

    const typeTotals: Record<string, number> = {};
    let sum = 0;

    records.forEach((r) => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in monthTotals) monthTotals[key] += Number(r.amount) || 0;
      const type = r.giving_type || "General";
      typeTotals[type] = (typeTotals[type] || 0) + (Number(r.amount) || 0);
      sum += Number(r.amount) || 0;
    });

    setGivingByMonth(
      months.map((m) => ({ month: m.label, total: monthTotals[m.key] })),
    );
    setGivingByType(
      Object.entries(typeTotals).map(([name, value]) => ({ name, value })),
    );
    setGivingTotal(sum);
    setGivingLoading(false);
  };

  useEffect(() => {
    if (!access.loading) {
      loadData();
      if (canViewGiving) loadGivingData();
    }
  }, [access.loading, activeRange]);

  const handleExport = async () => {
    const { data } = (await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false })) as { data: any[] | null };
    if (!data) return;
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "DOB",
      "Guest Status",
      "Registered",
    ];
    const rows = data.map((m) => [
      m.first_name,
      m.last_name,
      m.email,
      m.phone,
      m.dob,
      m.guest_status,
      new Date(m.created_at).toLocaleDateString("en-NG"),
    ]);
    const csv = buildCsv([headers, ...rows]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spotlight-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthGrowth = percentageChange(thisMonth, lastMonth);
  const totalForBar = total || 1;
  const latestAttendanceChange = attendanceChange(
    lastAttendance?.total ?? 0,
    attendanceWeeks.length > 1 ? attendanceWeeks[attendanceWeeks.length - 2].total : null,
  );

  const statusConfig = [
    {
      key: "First_Timer",
      label: "First Timers",
      color: "bg-green-500",
      light: "bg-green-50 text-green-700",
    },
    {
      key: "Attending",
      label: "Attending",
      color: "bg-blue-500",
      light: "bg-blue-50 text-blue-700",
    },
    {
      key: "Member",
      label: "Members",
      color: "bg-[#fdc425]",
      light: "bg-[#fdc425]/20 text-[#785a00]",
    },
  ];

  const formatNaira = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <div className="bg-[#f7f9fb] min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 lg:px-10 py-4 z-40">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-[22px] sm:text-[26px] font-bold text-[#081534]">
              Analytics
            </h2>
            <p className="text-[13px] text-[#45464e]">
              A clear view of congregation growth, attendance, and giving.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-lg border border-[#c6c6cf] text-[13px] font-semibold text-[#191c1e] hover:bg-[#eceef0] flex items-center gap-1.5"
            >
              <Icon name="refresh" className="text-[16px]" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-[#081534] text-white text-[13px] font-semibold hover:opacity-90 flex items-center gap-1.5"
            >
              <Icon name="download" className="text-[16px]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {loadError && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] px-4 py-3 text-[13px] text-[#5a1a16]" role="alert">
            <div className="flex items-start gap-2">
              <Icon name="warning" className="mt-0.5 text-[18px]" />
              <span>{loadError}</span>
            </div>
            <button type="button" onClick={loadData} className="shrink-0 font-bold underline">Retry</button>
          </div>
        )}
        {/* Top metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Members",
              value: total,
              icon: "group",
              sub: "All time",
              color: "bg-[#081534]",
            },
            {
              label: "This Week",
              value: thisWeek,
              icon: "person_add",
              sub: "Last 7 days",
              color: "bg-[#fdc425]",
            },
            {
              label: "This Month",
              value: thisMonth,
              icon: "trending_up",
              sub: "Last 30 days",
              color: "bg-[#002960]",
            },
            {
              label: "Month Growth",
              value: `${monthGrowth > 0 ? "+" : ""}${monthGrowth}%`,
              icon: "analytics",
              sub: "vs previous month",
              color: "bg-[#1e2a4a]",
            },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-[#c6c6cf] p-4 sm:p-6 rounded-xl hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${m.color} text-white`}>
                  <Icon name={m.icon} className="text-[18px]" />
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#45464e] font-semibold">
                {m.label}
              </p>
              <h3 className="text-[22px] sm:text-[28px] font-bold text-[#081534] mt-1">
                {loading ? "—" : m.value.toLocaleString()}
              </h3>
              <p className="text-[11px] text-[#45464e] mt-1">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Member growth + status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section aria-labelledby="registration-chart-title" className="lg:col-span-8 bg-white border border-[#c6c6cf] rounded-2xl p-5 sm:p-8 shadow-[0_8px_30px_rgba(8,21,52,0.04)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 id="registration-chart-title" className="text-[18px] font-bold text-[#081534] mb-1">Weekly Registrations</h4>
              <p className="text-[12px] text-[#45464e]">New members joining your congregation.</p>
            </div>
            <div className="flex rounded-lg bg-[#f2f4f6] p-1" role="group" aria-label="Registration chart range">
              {(["8", "12"] as const).map((range) => (
                <button key={range} type="button" onClick={() => setActiveRange(range)}
                  className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition-colors ${activeRange === range ? "bg-white text-[#081534] shadow-sm" : "text-[#76777f]"}`}>
                  {range} weeks
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <AdminLoader label="Loading registrations..." />
            </div>
          ) : (
            <div className="mt-5 h-56" role="img" aria-label={`New member registrations over the last ${activeRange} weeks`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="memberGrowthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fdc425" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#fdc425" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#eef0f3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#76777f" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#76777f" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e4e8", fontSize: 12 }} cursor={{ stroke: "#fdc425", strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="count" name="New members" stroke="#fdc425" strokeWidth={3} fill="url(#memberGrowthFill)" activeDot={{ r: 6, fill: "#081534", stroke: "#fdc425", strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          </section>

          <div className="lg:col-span-4 bg-[#081534] text-white rounded-2xl p-5 sm:p-8 shadow-[0_8px_30px_rgba(8,21,52,0.12)]">
            <h4 className="text-[18px] font-bold mb-1">Guest Status</h4>
            <p className="text-[12px] opacity-70 mb-6">
              Congregation breakdown by type.
            </p>
            {loading ? (
              <AdminLoader label="Loading status..." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {statusConfig.map((s) => {
                  const count = statusCounts[s.key as keyof StatusCounts];
                  const pct = Math.round((count / totalForBar) * 100);
                  return (
                    <div key={s.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className={`mb-2 h-2 w-2 rounded-full ${s.color}`} />
                      <p className="text-[11px] text-white/65">{s.label}</p>
                      <p className="mt-1 text-[22px] font-bold text-white">{count.toLocaleString()}</p>
                      <p className="text-[10px] font-semibold text-[#ffdf9a]">{pct}% of total</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-[11px] text-white/50 uppercase tracking-widest mb-1">
                Total Registered
              </p>
              <p className="text-[28px] font-bold">
                {loading ? "—" : total.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance trends */}
        <section aria-labelledby="attendance-trends-title" className="overflow-hidden rounded-2xl border border-[#c6c6cf] bg-white shadow-[0_8px_30px_rgba(8,21,52,0.04)]">
          <div className="border-b border-[#e2e4e8] bg-[#f7f9fb] px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#081534] text-[#fdc425]">
                    <Icon name="groups" className="text-[19px]" />
                  </div>
                  <div>
                    <h4 id="attendance-trends-title" className="text-[18px] font-bold text-[#081534]">
                      Sunday Attendance
                    </h4>
                    <p className="text-[12px] text-[#45464e]">
                      Headcount recorded for your most recent services.
                    </p>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-[12px] leading-5 text-[#76777f]">
                  This shows how many men, women, and children attended each service. Use it to spot changes in weekly attendance and plan seating, children&apos;s ministry, and volunteers.
                </p>
              </div>
              {lastAttendance && (
                <div className="min-w-[190px] rounded-xl bg-[#081534] px-4 py-3 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">Latest service</p>
                  <p className="mt-1 text-[26px] font-bold">{lastAttendance.total.toLocaleString()}</p>
                  <p className="text-[11px] text-white/65">
                    total attendees
                    {latestAttendanceChange !== null && (
                      <span className={latestAttendanceChange >= 0 ? "ml-2 text-[#fdc425]" : "ml-2 text-[#ffb4ab]"}>
                        {latestAttendanceChange >= 0 ? "+" : ""}{latestAttendanceChange} vs previous
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="p-5 sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h5 className="text-[14px] font-bold text-[#081534]">Attendance by service</h5>
              <p className="text-[12px] text-[#76777f]">Stacked bars show the total headcount and its breakdown.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#081534]" />
                <span className="text-[11px] font-semibold text-[#45464e]">Men</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#fdc425]" />
                <span className="text-[11px] font-semibold text-[#45464e]">Women</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#adc6ff]" />
                <span className="text-[11px] font-semibold text-[#45464e]">Children</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <AdminLoader label="Loading attendance..." />
            </div>
          ) : attendanceWeeks.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="fact_check" className="text-[48px] text-[#c6c6cf] block mb-2" />
              <p className="text-[#45464e] font-semibold text-[14px]">
                No service attendance has been recorded yet
              </p>
              <p className="text-[12px] text-[#76777f] mt-1">
                Add a service headcount in the Attendance page to see trends here.
              </p>
            </div>
          ) : (
            <div className="h-72 rounded-2xl bg-[#f7f9fb] p-3 sm:p-5" role="img" aria-label="Attendance trend showing total attendance and demographic lines">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={attendanceWeeks}
                  margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="attendanceTotalFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#081534" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#081534" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e8ebef" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#76777f" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#76777f" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 14, border: "1px solid #dfe3e8", boxShadow: "0 10px 24px rgba(8,21,52,0.12)", fontSize: 12 }}
                    labelStyle={{ color: "#081534", fontWeight: 700, marginBottom: 6 }}
                    formatter={(value: string | number | readonly (string | number)[] | undefined, name: string | number | undefined) => [
                      value ?? 0,
                      typeof name === "string" ? name : String(name ?? ""),
                    ]}
                  />
                  <Area type="monotone" dataKey="total" name="Total attendance" stroke="#081534" strokeWidth={2.5} fill="url(#attendanceTotalFill)" activeDot={{ r: 6, fill: "#fdc425", stroke: "#081534", strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="male" name="Men" stroke="#002960" strokeWidth={2} dot={{ r: 2.5, fill: "#002960", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="female" name="Women" stroke="#c28e00" strokeWidth={2} dot={{ r: 2.5, fill: "#c28e00", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="children" name="Children" stroke="#7296d4" strokeWidth={2} dot={{ r: 2.5, fill: "#7296d4", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {lastAttendance && (
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#e2e4e8] pt-6 text-center">
              <div>
                <p className="text-[20px] font-bold text-[#081534]">
                  {lastAttendance.male}
                </p>
                <p className="text-[11px] text-[#76777f] font-semibold">Men</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-[#081534]">
                  {lastAttendance.female}
                </p>
                <p className="text-[11px] text-[#76777f] font-semibold">
                  Women
                </p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-[#081534]">
                  {lastAttendance.children}
                </p>
                <p className="text-[11px] text-[#76777f] font-semibold">
                  Children
                </p>
              </div>
            </div>
          )}
          </div>
        </section>

        {/* Giving — only visible to Setman or admins with the 'giving' permission,
            since giving_records RLS only allows reads for that permission anyway */}
        {canViewGiving && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-8">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-[18px] font-bold text-[#081534]">
                  Giving Trend
                </h4>
              </div>
              <p className="text-[12px] text-[#45464e] mb-6">
                Total recorded giving per month, last 6 months.
              </p>
              {givingLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <AdminLoader label="Loading giving data..." />
                </div>
              ) : givingTotal === 0 ? (
                <div className="text-center py-12">
                  <Icon name="volunteer_activism" className="text-[48px] text-[#c6c6cf] block mb-2" />
                  <p className="text-[#45464e] font-semibold text-[14px]">
                    No giving recorded yet
                  </p>
                  <p className="text-[12px] text-[#76777f] mt-1">
                    Log entries in the Giving page to see trends here
                  </p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={givingByMonth}
                      margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f6" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#45464e" }}
                        axisLine={{ stroke: "#c6c6cf" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#45464e" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`
                        }
                      />
                      <Tooltip
                        formatter={(
                          v:
                            | string
                            | number
                            | readonly (string | number)[]
                            | undefined,
                        ) => {
                          const numericValue =
                            typeof v === "number"
                              ? v
                              : typeof v === "string"
                                ? Number(v)
                                : Array.isArray(v)
                                  ? Number(v[0])
                                  : 0;
                          return [formatNaira(numericValue), "Total"];
                        }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #c6c6cf",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#fdc425"
                        strokeWidth={3}
                        dot={{ fill: "#081534", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white border border-[#c6c6cf] rounded-xl p-5 sm:p-8">
              <h4 className="text-[18px] font-bold text-[#081534] mb-1">
                Giving Breakdown
              </h4>
              <p className="text-[12px] text-[#45464e] mb-6">
                By type, last 6 months.
              </p>
              {givingLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <AdminLoader label="Loading breakdown..." />
                </div>
              ) : givingByType.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#76777f] text-[13px]">No data yet</p>
                </div>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={givingByType}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {givingByType.map((_, i) => (
                            <Cell
                              key={i}
                              fill={GIVING_COLORS[i % GIVING_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(
                            v:
                              | string
                              | number
                              | readonly (string | number)[]
                              | undefined,
                          ) => {
                            const numericValue =
                              typeof v === "number"
                                ? v
                                : typeof v === "string"
                                  ? Number(v)
                                  : Array.isArray(v)
                                    ? Number(v[0])
                                    : 0;
                            return formatNaira(numericValue);
                          }}
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #c6c6cf",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {givingByType.map((t, i) => (
                      <div
                        key={t.name}
                        className="flex items-center justify-between text-[12px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              background:
                                GIVING_COLORS[i % GIVING_COLORS.length],
                            }}
                          />
                          <span className="text-[#45464e] truncate">
                            {t.name}
                          </span>
                        </div>
                        <span className="font-bold text-[#081534] shrink-0 ml-2">
                          {formatNaira(t.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-6 pt-4 border-t border-[#f2f4f6]">
                <p className="text-[10px] text-[#45464e] uppercase tracking-widest font-bold mb-1">
                  Total (6 months)
                </p>
                <p className="text-[22px] font-bold text-[#081534]">
                  {givingLoading ? "—" : formatNaira(givingTotal)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statusConfig.map((s, i) => {
            const count = statusCounts[s.key as keyof StatusCounts];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="bg-white border border-[#c6c6cf] rounded-xl p-5"
              >
                <div
                  className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold mb-3 ${s.light}`}
                >
                  {s.label}
                </div>
                <p className="text-[28px] font-bold text-[#081534]">
                  {loading ? "—" : count}
                </p>
                <p className="text-[12px] text-[#45464e] mt-1">
                  {loading ? "" : `${pct}% of total`}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
