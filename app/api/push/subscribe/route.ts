import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: "spotlight:push" });
const ip = (r: NextRequest) => r.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? r.headers.get("x-real-ip") ?? "127.0.0.1";
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  if (!(await ratelimit.limit(ip(req))).success) return fail("Too many attempts.", 429);
  let b: any;
  try { b = await req.json(); } catch { return fail("Invalid request."); }
  const endpoint = b?.endpoint, p256dh = b?.keys?.p256dh, auth = b?.keys?.auth;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 600) return fail("Invalid subscription.");
  if (typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) return fail("Invalid subscription.");
  const { error } = await (getSupabaseAdminClient() as any).from("push_subscriptions").upsert({ endpoint, p256dh, auth }, { onConflict: "endpoint" });
  if (error) { console.error("[PUSH SUBSCRIBE]", error.message); return fail("Could not save.", 500); }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  let b: any;
  try { b = await req.json(); } catch { return fail("Invalid request."); }
  if (typeof b?.endpoint !== "string") return fail("Invalid request.");
  await (getSupabaseAdminClient() as any).from("push_subscriptions").delete().eq("endpoint", b.endpoint);
  return NextResponse.json({ success: true });
}