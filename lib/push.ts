import * as webpush from "web-push";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

let ready = false;
function init() {
  if (ready) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY, subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
  ready = true;
  return true;
}

const lagosToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

export async function sendScheduledPush() {
  if (!init()) return { skipped: "VAPID keys missing" };
  const db = getSupabaseAdminClient() as any;

  const { data: due } = await db.from("push_messages").select("id")
    .eq("send_on", lagosToday()).is("sent_at", null).order("created_at", { ascending: true }).limit(3);
  if (!due?.length) return { skipped: "nothing scheduled today" };

  const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").limit(5000);
  const dead = new Set<string>();
  const summary: { id: string; sent: number }[] = [];

  for (const row of due) {
    // Claim first so a retry can never send the same message twice
    const { data: claimed } = await db.from("push_messages")
      .update({ sent_at: new Date().toISOString() }).eq("id", row.id).is("sent_at", null)
      .select("id, title, body, url").single();
    if (!claimed) continue;

    const payload = JSON.stringify({ title: claimed.title, body: claimed.body, url: claimed.url });
    let sent = 0;

    for (let i = 0; i < (subs?.length ?? 0); i += 50) {
      const chunk = subs!.slice(i, i + 50).filter((s: any) => !dead.has(s.id));
      const results = await Promise.allSettled(
        chunk.map((s: any) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12 })),
      );
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") sent++;
        else if ([404, 410].includes((r.reason as any)?.statusCode)) dead.add(chunk[idx].id);
      });
    }

    await db.from("push_messages").update({ sent_count: sent }).eq("id", claimed.id);
    summary.push({ id: claimed.id, sent });
  }

  if (dead.size) await db.from("push_subscriptions").delete().in("id", [...dead]);
  return { messages: summary, removed: dead.size };
}