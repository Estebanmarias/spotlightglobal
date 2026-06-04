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

const statusOptions = ["All", "First_Timer", "Returning", "Regular", "Member"];

export default function MembersPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }
    if (statusFilter !== "All") {
      query = query.eq("guest_status", statusFilter);
    }

    const { data, count } = await query;
    setMembers(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map(m => m.id)));
    }
  };

  const exportCSV = () => {
    const toExport = selected.size > 0
      ? members.filter(m => selected.has(m.id))
      : members;
    if (!toExport.length) return;
    const headers = ["Date Joined", "First Name", "Last Name", "Email", "Phone", "DOB", "Status"];
    const rows = toExport.map(m => [
      new Date(m.created_at).toLocaleDateString(),
      m.first_name, m.last_name, m.email, m.phone, m.dob, m.guest_status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
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
            <h2 className="text-[20px] sm:text-[26px] font-bold text-[#081534]">Members</h2>
            <p className="text-[13px] text-[#45464e]">
              {total.toLocaleString()} total members in the congregation
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-2 bg-white border border-[#c6c6cf] px-4 py-2.5 rounded-lg text-[13px] font-semibold text-[#45464e] hover:bg-[#eceef0] transition-all">
              <span className="material-symbols-outlined text-[18px]">download</span>
              {selected.size > 0 ? `Export (${selected.size})` : "Export CSV"}
            </button>
            <button onClick={() => router.push("/admin/add-member")}
              className="flex items-center gap-2 bg-[#081534] text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span className="hidden sm:inline">Add Member</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45464e] text-[18px]">search</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search name, email, phone..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cf] rounded-lg focus:border-[#081534] outline-none text-[14px]"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map(s => (
              <button key={s}
                onClick={() => { setStatusFilter(s); setPage(0); }}
                className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-all
                  ${statusFilter === s
                    ? 'bg-[#081534] text-white'
                    : 'bg-white border border-[#c6c6cf] text-[#45464e] hover:border-[#081534]'}`}>
                {s === "First_Timer" ? "First Timer" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#c6c6cf] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[#f2f4f6] border-b border-[#c6c6cf]">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox"
                      checked={members.length > 0 && selected.size === members.length}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded accent-[#081534]" />
                  </th>
                  {["Date Joined", "Member", "Email", "Phone", "DOB", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-[#45464e] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cf]/50">
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-[#45464e]">Loading...</td></tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-3">group_off</span>
                      <p className="text-[#45464e] font-semibold">No members found</p>
                      <p className="text-[13px] text-[#76777f] mt-1">Try adjusting your search or filter</p>
                    </td>
                  </tr>
                ) : (
                  members.map((m, i) => (
                    <motion.tr key={m.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`hover:bg-[#f7f9fb] transition-colors ${selected.has(m.id) ? 'bg-[#fdc425]/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox"
                          checked={selected.has(m.id)}
                          onChange={() => toggleSelect(m.id)}
                          className="w-4 h-4 rounded accent-[#081534]" />
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#45464e] whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#081534] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                            {m.first_name[0]}{m.last_name[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#081534] whitespace-nowrap">
                              {m.first_name} {m.last_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#45464e]">{m.email}</td>
                      <td className="px-4 py-3 text-[13px] text-[#45464e] whitespace-nowrap">{m.phone}</td>
                      <td className="px-4 py-3 text-[13px] text-[#45464e] whitespace-nowrap">
                        {m.dob ? new Date(m.dob).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusColors[m.guest_status] ?? "bg-[#e0e3e5] text-[#45464e]"}`}>
                          {m.guest_status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-[#45464e] hover:text-[#081534] transition-colors">
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
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
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#45464e] hover:text-[#081534] transition-colors disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span> Previous
            </button>
            <span className="text-[13px] text-[#45464e]">
              Page {page + 1} of {totalPages || 1} · {total} members
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#45464e] hover:text-[#081534] transition-colors disabled:opacity-40">
              Next <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}