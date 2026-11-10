"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLoader from "@/components/AdminLoader";
import Icon from "@/components/Icon";
import { getSupabaseClient } from "@/lib/supabase";
import { useAdminAccess } from "@/lib/use-admin-permissions";

type Backup = {
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
  size: number | null;
  downloadUrl: string;
};

const formatSize = (size: number | null) => {
  if (size === null) return "Size unavailable";
  if (size < 1024) return `${size} B`;
  return `${(size / 1024).toFixed(1)} KB`;
};

const backupIsStale = (createdAt: string | null) => !createdAt || Date.now() - Date.parse(createdAt) > 36 * 60 * 60 * 1000;

export default function BackupsPage() {
  const router = useRouter();
  const access = useAdminAccess();
  const supabase = getSupabaseClient();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requiresPin, setRequiresPin] = useState(false);
  const [pin, setPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);

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

      const response = await fetch("/api/admin/backups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json().catch(() => ({}));
      if (response.status === 401 && json.requiresPin) {
        setRequiresPin(true);
        setLoading(false);
        return;
      }
      if (!response.ok) {
        setError(json.error || "Could not load backups.");
      } else {
        setBackups(json.backups ?? []);
      }
      setLoading(false);
    };

    load();
  }, [access.loading, access.isSuperAdmin, router, supabase]);

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    setUnlocking(true);
    setError("");
    const { data } = await supabase.auth.getSession();
    const response = await fetch("/api/admin/backups", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ pin }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.error || "Could not unlock backups.");
      setPin("");
      setUnlocking(false);
      return;
    }
    setPin("");
    window.location.reload();
  };

  if (access.loading || loading) {
    return <AdminLoader fullScreen label="Loading backups..." />;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] p-4 sm:p-8 lg:p-12">
      <div className="mx-auto max-w-4xl">
        {requiresPin ? (
          <div className="mx-auto max-w-md rounded-2xl border border-[#c6c6cf] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#fdc425]/20 text-[#785a00]">
              <Icon name="lock" className="text-[24px]" />
            </div>
            <h1 className="text-[22px] font-bold text-[#081534]">Unlock database backups</h1>
            <p className="mt-2 text-[13px] leading-5 text-[#45464e]">Enter the separate 8-digit backup PIN. This unlock expires after 15 minutes.</p>
            <form onSubmit={unlock} autoComplete="off" className="mt-6 space-y-4">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#45464e]" htmlFor="backup-pin">Backup PIN</label>
              <input id="backup-pin" name="backup-access-code" type="password" inputMode="numeric" autoComplete="one-time-code" data-lpignore="true" data-1p-ignore data-bwignore spellCheck={false} pattern="[0-9]{8}" maxLength={8} required value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-[#c6c6cf] px-4 py-3 text-center text-[22px] tracking-[0.35em] outline-none focus:border-[#081534]" />
              {error && <p className="text-[12px] font-semibold text-[#ba1a1a]" role="alert">{error}</p>}
              <button type="submit" disabled={unlocking || pin.length !== 8} className="w-full rounded-xl bg-[#081534] py-3 text-[13px] font-bold text-white disabled:opacity-50">{unlocking ? "Unlocking..." : "Unlock backups"}</button>
            </form>
          </div>
        ) : (
          <>
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Icon name="database" className="text-[26px] text-[#785a00]" />
            <h1 className="text-[26px] font-bold text-[#081534]">Database backups</h1>
          </div>
          <p className="mt-2 text-[13px] text-[#45464e]">
            Daily application-data backups are kept in private storage for 30 days.
          </p>
          {backups.length > 0 && backupIsStale(backups[0].createdAt) && (
            <div className="mt-4 rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-4 text-[12px] text-[#ba1a1a]" role="alert">
              <p className="font-bold">Backup may be overdue</p>
              <p className="mt-1">The newest backup is older than 36 hours. Check the scheduled backup job and Vercel cron logs.</p>
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-5 text-[13px] text-[#ba1a1a]" role="alert">
            <p className="font-semibold">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-lg bg-[#ba1a1a] px-3 py-2 text-[12px] font-bold text-white hover:opacity-90">
              Try again
            </button>
          </div>
        ) : backups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c6c6cf] bg-white p-12 text-center">
            <Icon name="database" className="mx-auto text-[42px] text-[#c6c6cf]" />
            <p className="mt-3 text-[14px] font-bold text-[#081534]">No backups yet</p>
            <p className="mt-1 text-[12px] text-[#76777f]">The first backup will appear after the daily cron runs.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#c6c6cf] bg-white">
            {backups.map((backup) => (
              <div key={backup.name} className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e2e9] p-4 last:border-b-0">
                <div className="flex min-w-0 items-center gap-3">
                  <Icon name="description" className="text-[22px] text-[#785a00]" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-[#081534]">{backup.name}</p>
                    <p className="mt-1 text-[11px] text-[#76777f]">
                      {backup.createdAt ? new Date(backup.createdAt).toLocaleString("en-NG") : "Date unavailable"} · {formatSize(backup.size)}
                    </p>
                  </div>
                </div>
                <a
                  href={backup.downloadUrl}
                  download={backup.name}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#081534] px-3 py-2 text-[12px] font-bold text-white hover:opacity-90"
                >
                  <Icon name="download" className="text-[16px]" />
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </main>
  );
}
