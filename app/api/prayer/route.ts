import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function allowed(ip: string) {
  try {
    const limiter = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "spotlight:prayer" });
    return (await limiter.limit(ip)).success;
  } catch (error) {
    console.error("[PRAYER] rate limiter unavailable, allowing request:", error);
    return true;
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.");
  }

  // Hidden field that real visitors never fill
  if (typeof body.hp_field === "string" && body.hp_field.trim()) return NextResponse.json({ success: true });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  if (!(await allowed(ip))) return fail("Too many requests. Please try again a little later.", 429);

  const text = clean(body.request, 1000);
  const name = clean(body.name, 80) || null;
  const contact = clean(body.contact, 120) || null;
  const wantsReply = body.wantsReply === true;

  if (text.length < 5) return fail("Please share your prayer request in a few words.");
  if (wantsReply && !contact) return fail("Add a phone number or email so we can reach you.");

  const { error } = await getSupabaseAdminClient()
    .from("prayer_requests")
    .insert({ name, contact, request: text, wants_reply: wantsReply });
  if (error) {
    console.error("[PRAYER] insert failed:", error.message);
    return fail("We couldn't save your request. Please try again.", 500);
  }
  return NextResponse.json({ success: true });
}