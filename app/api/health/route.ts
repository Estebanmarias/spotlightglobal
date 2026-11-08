import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

let last: { at: number; ok: boolean } | null = null;

const reply = (ok: boolean, ms?: number) =>
  NextResponse.json(ok ? { ok: true, ms } : { ok: false }, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });

export async function GET() {
  const now = Date.now();
  // However many checks arrive, hit the database at most once every 15 seconds
  if (last && now - last.at < 15_000) return reply(last.ok);

  try {
    const { error } = await getSupabaseAdminClient().from("members").select("id").limit(1);
    if (error) throw error;
    last = { at: now, ok: true };
    return reply(true, Date.now() - now);
  } catch (error) {
    console.error("[HEALTH] database check failed:", error);
    last = { at: now, ok: false };
    return reply(false);
  }
}