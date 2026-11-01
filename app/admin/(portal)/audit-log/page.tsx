"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLoader from "@/components/AdminLoader";
import Icon from "@/components/Icon";
import { getSupabaseClient } from "@/lib/supabase";
import { useAdminAccess } from "@/lib/use-admin-permissions";

type AuditLog = {
  id: string;
  actor_name: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export default function AuditLogPage() {
  const router = useRouter();
  const access = useAdminAccess();
  const supabase = getSupabaseClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (access.loading) return;
    if (!access.isSuperAdmin) {
      router.replace("/admin/dashboard");
      return;
    }

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/admin");
        return;
      }
      const response = await fetch("/api/admin/audit-log", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) setError(json.error || "Could not load the audit log.");
      else setLogs(json.logs ?? []);
      setLoading(false);
    };
    load();
  }, [access.loading, access.isSuperAdmin, router, supabase]);

  if (access.loading || loading) return <AdminLoader fullScreen label="Loading audit log..." />;

  return (
    <main className="min-h-screen bg-[#f7f9fb] p-4 sm:p-8 lg:p-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <Icon name="fact_check" className="text-[26px] text-[#785a00]" />
          <div>
            <h1 className="text-[26px] font-bold text-[#081534]">Audit log</h1>
            <p className="mt-1 text-[13px] text-[#45464e]">Recent administrative actions and changes.</p>
          </div>
        </div>
        {error ? (
          <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-5 text-[13px] font-semibold text-[#ba1a1a]">{error}</div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c6c6cf] bg-white p-12 text-center text-[13px] text-[#76777f]">No administrative actions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#c6c6cf] bg-white">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-[#c6c6cf] bg-[#f2f4f6]">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#45464e]">When</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#45464e]">Actor</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#45464e]">Action</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#45464e]">Record</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#45464e]">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#e2e2e9] last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#45464e]">{new Date(log.created_at).toLocaleString("en-NG")}</td>
                    <td className="px-4 py-3"><p className="text-[12px] font-bold text-[#081534]">{log.actor_name}</p><p className="text-[11px] text-[#76777f]">{log.actor_email}</p></td>
                    <td className="px-4 py-3 text-[12px] font-bold text-[#081534]">{log.action}</td>
                    <td className="px-4 py-3 text-[12px] text-[#45464e]">{log.entity_type}{log.entity_id ? ` · ${log.entity_id}` : ""}</td>
                    <td className="max-w-[260px] px-4 py-3 text-[11px] text-[#76777f]">{Object.entries(log.metadata || {}).map(([key, value]) => `${key}: ${String(value)}`).join(" · ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
