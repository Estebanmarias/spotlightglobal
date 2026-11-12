import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeAdminPage } from "@/lib/admin-auth";

const UUID = /^[0-9a-f-]{36}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const lagosToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const db = () => getSupabaseAdminClient() as any;

function clean(b: any, partial: boolean) {
  const out: Record<string, string> = {};
  const rules: [string, number, (v: string) => boolean][] = [
    ["title", 60, v => v.length > 0],
    ["body", 180, v => v.length > 0],
    ["url", 200, v => v.startsWith("/") || v.startsWith("https://")],
    ["send_on", 10, v => DATE.test(v) && v >= lagosToday()],
  ];
  for (const [key, max, ok] of rules) {
    if (b[key] === undefined) { if (partial) continue; return { error: `Missing ${key}.` }; }
    if (typeof b[key] !== "string") return { error: `Invalid ${key}.` };
    const v = b[key].trim();
    if (v.length > max || !ok(v)) return { error: `Invalid ${key}.` };
    out[key] = v;
  }
  return { value: out };
}

async function dateTaken(sendOn: string, exceptId?: string) {
  let q = db().from("push_messages").select("id").eq("send_on", sendOn);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q.limit(1);
  return !!data?.length;
}

export async function GET(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "notifications"))) return fail("Not authorized.", 403);
  const [msgs, subs] = await Promise.all([
    db().from("push_messages").select("id, title, body, url, send_on, sent_at, sent_count").order("send_on", { ascending: false }).limit(300),
    db().from("push_subscriptions").select("id", { count: "exact", head: true }),
  ]);
  if (msgs.error) { console.error("[ADMIN NOTIFICATIONS] load failed:", msgs.error.message); return fail("Could not load notifications.", 500); }
  return NextResponse.json({ messages: msgs.data ?? [], subscribers: subs.count ?? 0 });
}

export async function POST(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "notifications"))) return fail("Not authorized.", 403);
  let body: any;
  try { body = await request.json(); } catch { return fail("Invalid request."); }
  const parsed = clean(body, false);
  if (parsed.error) return fail(parsed.error);
  if (await dateTaken(parsed.value!.send_on)) return fail("A message is already scheduled for that date.", 409);
  const { error } = await db().from("push_messages").insert([parsed.value]);
  if (error) { console.error("[ADMIN NOTIFICATIONS] create failed:", error.message); return fail("Could not save the message.", 500); }
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "notifications"))) return fail("Not authorized.", 403);
  let body: any;
  try { body = await request.json(); } catch { return fail("Invalid request."); }
  if (typeof body.id !== "string" || !UUID.test(body.id)) return fail("Invalid request.");
  const parsed = clean(body, true);
  if (parsed.error) return fail(parsed.error);
  if (!Object.keys(parsed.value!).length) return fail("Nothing to update.");
  if (parsed.value!.send_on && (await dateTaken(parsed.value!.send_on, body.id))) return fail("A message is already scheduled for that date.", 409);
  const { data, error } = await db().from("push_messages").update(parsed.value).eq("id", body.id).is("sent_at", null).select("id");
  if (error) { console.error("[ADMIN NOTIFICATIONS] update failed:", error.message); return fail("Could not update the message.", 500); }
  if (!data?.length) return fail("That message has already been sent.", 409);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "notifications"))) return fail("Not authorized.", 403);
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!UUID.test(id)) return fail("Invalid request.");
  const { error } = await db().from("push_messages").delete().eq("id", id).is("sent_at", null);
  if (error) { console.error("[ADMIN NOTIFICATIONS] delete failed:", error.message); return fail("Could not delete the message.", 500); }
  return NextResponse.json({ success: true });
}