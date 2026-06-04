"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { motion } from "framer-motion";

type Member = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  guest_status: string;
};

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  Member: "bg-[#fdc425]/20 text-[#785a00] border border-[#785a00]/30",
  Regular: "bg-blue-50 text-blue-700 border border-blue-200",
  Returning: "bg-purple-50 text-purple-700 border border-purple-200",
  First_Timer: "bg-green-50 text-green-700 border border-green-200",
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/admin");
    });
  }, [router]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("members")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, count } = await query;
    setMembers(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString())
      .then(({ count }) => setThisWeek(count || 0));
  }, []);

  const exportCSV = () => {
    if (!members.length) return;
    const headers = ["Date Joined", "First Name", "Last Name", "Email", "Phone", "DOB", "Status"];
    const rows = members.map((m) => [
      new Date(m.created_at).toLocaleDateString(),
      m.first_name, m.last_name, m.email, m.phone, m.dob, m.guest_status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-[#f7f9fb] min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="pl-12 lg:pl-0">
            <h2 className="text-[20px] sm:text-[26px] font-bold text-[#081534]">Member Directory</h2>
            <p className="text-[13px] text-[#45464e]">Manage your global congregation and community growth.</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-white border border-[#c6c6cf] px-4 py-2.5 rounded-lg text-[13px] font-semibold text-[#45464e] hover:bg-[#eceef0] transition-all w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#c6c6cf] rounded-xl p-4 sm:p-6 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-[12px] sm:text-[13px] font-semibold text-[#45464e]">Total Members</span>
              <div className="w-9 h-9 rounded-full bg-[#081534]/5 flex items-center justify-center text-[#081534]">
                <span className="material-symbols-outlined text-[18px]">people</span>
              </div>
            </div>
            <span className="text-[26px] sm:text-[32px] font-bold text-[#081534]">{total.toLocaleString()}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white border border-[#c6c6cf] rounded-xl p-4 sm:p-6 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-[12px] sm:text-[13px] font-semibold text-[#45464e]">New This Week</span>
              <div className="w-9 h-9 rounded-full bg-[#fdc425]/20 flex items-center justify-center text-[#785a00]">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
              </div>
            </div>
            <span className="text-[26px] sm:text-[32px] font-bold text-[#081534]">{thisWeek}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="col-span-2 bg-[#081534] text-white rounded-xl p-4 sm:p-6 flex flex-col justify-center relative overflow-hidden">
            <h3 className="text-[18px] sm:text-[22px] font-semibold mb-1">Spotlight Global</h3>
            <p className="text-white/70 text-[13px] sm:text-[14px]">Company of the Blessed — tracking every soul that joins the family.</p>
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <span className="material-symbols-outlined text-[120px] sm:text-[160px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#c6c6cf] rounded-xl shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="p-4 sm:p-5 border-b border-[#c6c6cf] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#f7f9fb]">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45464e] text-[18px]">search</span>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search name or email..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#c6c6cf] rounded-lg focus:border-[#081534] outline-none text-[14px]"
              />
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-[#45464e] whitespace-nowrap">
              {members.length} of {total} members
            </span>
          </div>

          {/* Table — scrolls horizontally on mobile */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#f2f4f6] border-b border-[#c6c6cf]">
                  {["Date Joined", "Name", "Email", "Phone", "Status", ""].map((h) => (
                    <th key={h} className="px-4 sm:px-6 py-3 text-[11px] font-semibold text-[#45464e] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]/50">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-[#45464e]">Loading...</td></tr>
                ) : members.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-[#45464e]">No members found.</td></tr>
                ) : (
                  members.map((m, i) => (
                    <motion.tr key={m.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-[#f7f9fb] transition-colors">
                      <td className="px-4 sm:px-6 py-3 text-[13px] text-[#45464e] whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#081534] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                            {m.first_name[0]}{m.last_name[0]}
                          </div>
                          <span className="text-[13px] font-semibold text-[#081534] whitespace-nowrap">
                            {m.first_name} {m.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-[13px] text-[#45464e]">{m.email}</td>
                      <td className="px-4 sm:px-6 py-3 text-[13px] text-[#45464e] whitespace-nowrap">{m.phone}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[m.guest_status] ?? "bg-[#e0e3e5] text-[#45464e]"}`}>
                          {m.guest_status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <button className="text-[#45464e] hover:text-[#081534] transition-colors">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 sm:px-6 py-4 border-t border-[#c6c6cf] flex items-center justify-between bg-[#f7f9fb]">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#45464e] hover:text-[#081534] transition-colors disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              Previous
            </button>
            <span className="text-[13px] text-[#45464e]">Page {page + 1} of {totalPages || 1}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#45464e] hover:text-[#081534] transition-colors disabled:opacity-40">
              Next
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}