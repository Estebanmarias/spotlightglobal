import webpush from "web-push";
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

  const { data: due } = await db.from("push_messages").select("id").eq("send_on", lagosToday()).is("sent_at", null).limit(1);
  if (!due?.length) return { skipped: "nothing scheduled today" };

  // Claim it first so a retry can never send twice
  const { data: claimed } = await db.from("push_messages")
    .update({ sent_at: new Date().toISOString() }).eq("id", due[0].id).is("sent_at", null)
    .select("id, title, body, url").single();
  if (!claimed) return { skipped: "already claimed" };

  const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").limit(5000);
  const payload = JSON.stringify({ title: claimed.title, body: claimed.body, url: claimed.url });
  let sent = 0;
  const dead: string[] = [];

  for (let i = 0; i < (subs?.length ?? 0); i += 50) {
    const chunk = subs!.slice(i, i + 50);
    const results = await Promise.allSettled(
      chunk.map((s: any) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12 })),
    );
    results.forEach((r, idx) => {
      if (r.status === "fulfilled") sent++;
      else if ([404, 410].includes((r.reason as any)?.statusCode)) dead.push(chunk[idx].id);
    });
  }

  if (dead.length) await db.from("push_subscriptions").delete().in("id", dead);
  await db.from("push_messages").update({ sent_count: sent }).eq("id", claimed.id);
  return { sent, removed: dead.length };
}