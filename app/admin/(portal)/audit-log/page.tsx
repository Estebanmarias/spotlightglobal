"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLoader from "@/components/AdminLoader";
import Icon from "@/components/Icon";
import { getSupabaseClient } from "@/lib/supabase";
import { useAdminAccess } from "@/lib/use-admin-permissions";
import { AUDIT_GROUPS, describeAudit, type AuditTone } from "@/lib/audit-format";

type AuditLog = {
  id: string;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const TONE: Record<AuditTone, { icon: string; badge: string }> = {
  added: { icon: "add", badge: "bg-green-100 text-green-800" },
  changed: { icon: "edit", badge: "bg-[#fff4d6] text-[#785a00]" },
  removed: { icon: "delete", badge: "bg-[#ffdad6] text-[#ba1a1a]" },
  info: { icon: "info", badge: "bg-[#eceef0] text-[#45464e]" },
};

export default function AuditLogPage() {
  const router = useRouter();
  const access = useAdminAccess();
  const supabase = getSupabaseClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/admin");
      return;
    }
    const response = await fetch("/api/admin/audit-log", { headers: { Authorization: `Bearer ${token}` } });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) setError(json.error || "Could not load the activity log.");
    else setLogs(json.logs ?? []);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    if (access.loading) return;
    if (!access.isSuperAdmin) {
      router.replace("/admin/dashboard");
      return;
    }
    void load();
  }, [access.loading, access.isSuperAdmin, router, load]);

  const entries = useMemo(() => logs.map((log) => ({ log, d: describeAudit(log) })), [logs]);
  const groups = useMemo(() => AUDIT_GROUPS.filter((g) => entries.some((e) => e.d.group === g)), [entries]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(({ log, d }) => {
      if (group !== "all" && d.group !== group) return false;
      if (!q) return true;
      return `${d.summary} ${d.details.join(" ")} ${log.actor_email ?? ""}`.toLowerCase().includes(q);
    });
  }, [entries, query, group]);

  if (access.loading || loading) return <AdminLoader fullScreen label="Loading activity..." />;

  return (
    <main className="min-h-screen bg-[#f7f9fb] p-4 sm:p-8 lg:p-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <Icon name="fact_check" className="text-[26px] text-[#785a00]" />
          <div>
            <h1 className="text-[24px] font-bold text-[#081534] sm:text-[26px]">Activity log</h1>
            <p className="mt-1 text-[13px] text-[#45464e]">Who did what, most recent first.</p>
          </div>
        </div>

        {error ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-5 text-[13px] font-semibold text-[#ba1a1a]">
            <span>{error}</span>
            <button type="button" onClick={() => { setLoading(true); void load(); }}
              className="rounded-lg border border-[#ba1a1a]/40 px-3 py-1.5 text-[12px] font-bold">Retry</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c6c6cf] bg-white p-12 text-center text-[13px] text-[#76777f]">
            Nothing has been recorded yet.
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the activity log"
                placeholder="Search by name, email or what happened"
                className="min-h-10 flex-1 rounded-lg border border-[#c6c6cf] bg-white px-3 text-[13px] outline-none focus:border-[#081534]" />
              <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Filter by area"
                className="min-h-10 rounded-lg border border-[#c6c6cf] bg-white px-3 text-[13px]">
                <option value="all">Everything</option>
                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <p className="mb-3 text-[12px] text-[#76777f]">Showing {visible.length} of {logs.length}</p>

            <ul className="space-y-2">
              {visible.map(({ log, d }) => (
                <li key={log.id} className="rounded-xl border border-[#c6c6cf] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE[d.tone].badge}`}>
                      <Icon name={TONE[d.tone].icon} className="text-[16px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold leading-snug text-[#081534]">{d.summary}</p>
                      {d.details.map((line, i) => (
                        <p key={`${i}-${line}`} className="mt-0.5 text-[12px] leading-5 text-[#45464e]">{line}</p>
                      ))}
                      <p className="mt-1.5 text-[11px] text-[#76777f]" title={new Date(log.created_at).toLocaleString("en-NG")}>{d.when}</p>
                    </div>
                    <span className="hidden shrink-0 rounded-full bg-[#f2f4f6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#45464e] sm:inline">
                      {d.group}
                    </span>
                  </div>

                  <button type="button" aria-expanded={openId === log.id}
                    onClick={() => setOpenId(openId === log.id ? null : log.id)}
                    className="mt-3 min-h-8 text-[11px] font-semibold text-[#785a00] hover:underline">
                    {openId === log.id ? "Hide technical details" : "Show technical details"}
                  </button>
                  {openId === log.id && (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-[#f7f9fb] p-3 text-[11px] leading-5 text-[#45464e]">
                      {JSON.stringify(
                        { action: log.action, record_type: log.entity_type, record_id: log.entity_id, by: log.actor_email, details: log.metadata },
                        null,
                        2,
                      )}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
            {visible.length === 0 && <p className="mt-4 text-center text-[12px] text-[#76777f]">Nothing matches these filters.</p>}
          </>
        )}
      </div>
    </main>
  );
}