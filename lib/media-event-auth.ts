import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export type MediaManagerIdentity = {
  userId: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
};

export async function authorizeMediaEventManager(
  request: NextRequest,
): Promise<MediaManagerIdentity | null> {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!accessToken) return null;

  const supabase = getSupabaseAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authData.user) return null;

  const { data: role } = (await supabase
    .from("admin_roles")
    .select("role, status, full_name, email")
    .eq("user_id", authData.user.id)
    .single()) as {
    data: { role: string; status: string; full_name: string; email: string } | null;
  };

  if (!role || role.status !== "approved") return null;

  if (role.role === "super_admin") {
    return {
      userId: authData.user.id,
      email: role.email,
      fullName: role.full_name,
      isSuperAdmin: true,
    };
  }

  const { data: leaderLinks } = await supabase
    .from("ministry_leaders")
    .select("ministry_id")
    .eq("user_id", authData.user.id) as { data: { ministry_id: string }[] | null };

  const ministryIds = (leaderLinks ?? []).map((link) => link.ministry_id);
  if (ministryIds.length === 0) return null;

  const { data: mediaMinistry } = await supabase
    .from("ministries")
    .select("id")
    .in("id", ministryIds)
    .ilike("name", "%media%")
    .limit(1)
    .maybeSingle();

  if (!mediaMinistry) return null;

  return {
    userId: authData.user.id,
    email: role.email,
    fullName: role.full_name,
    isSuperAdmin: false,
  };
}

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

type EventEmailDetail = { label: string; value: string };

export function renderEventEmail(input: {
  preheader: string;
  eyebrow: string;
  title: string;
  greeting: string;
  paragraphs: string[];
  details?: EventEmailDetail[];
  notice?: { title: string; body: string };
  action?: { label: string; url: string };
  imageUrl?: string | null;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "");
  const logoUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBXeDcU5csODEcKXqqIPjuGTfXHuYsOy5Ejd9WYTgmrbkzeYRDODg-_n8ubDlCgtzlGhBD5xT7iYncWEzIKHqix5RIHOYte731k8w9y4C5Wq8hs5IowQbW7V-cDrQPHP9lOISuvV8hm63Dc_6nPaJKvnIqH7RoAhJ19PQEebQvA5T2Q1dw1YcD0XGdYN3uHrHBgL1lmzWZrWzyCcQVwkheCcuZNUl_xu6MPtTqfRW7O5RXqRXOr4XUWWJVjcZvTYmpgcqRpm6L2pbs";
  const formatLines = (value: string) => escapeEmailHtml(value).replace(/\r?\n/g, "<br>");
  const detailsHtml = input.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f6;border-radius:12px;margin:24px 0"><tr><td style="padding:20px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${input.details.map(detail => `<tr><td style="padding:5px 12px 5px 0;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:12px;color:#76777f;vertical-align:top">${escapeEmailHtml(detail.label)}</td><td style="padding:5px 0;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;font-weight:700;color:#081534;vertical-align:top">${formatLines(detail.value)}</td></tr>`).join("")}</table></td></tr></table>`
    : "";
  const noticeHtml = input.notice
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff9e8;border-left:3px solid #fdc425;margin:24px 0"><tr><td style="padding:16px 20px;font-family:'Plus Jakarta Sans',Arial,sans-serif"><div style="font-size:14px;font-weight:700;color:#081534;margin-bottom:6px">${escapeEmailHtml(input.notice.title)}</div><div style="font-size:13px;line-height:1.65;color:#45464e">${formatLines(input.notice.body)}</div></td></tr></table>`
    : "";
  const actionHtml = input.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0"><tr><td align="center" bgcolor="#fdc425" style="border-radius:999px"><a href="${escapeEmailHtml(input.action.url)}" style="display:block;padding:14px 30px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:14px;font-weight:700;color:#6d5200;text-decoration:none">${escapeEmailHtml(input.action.label)}</a></td></tr></table>`
    : "";
  const imageUrl = input.imageUrl
    ? (/^https?:\/\//i.test(input.imageUrl) ? input.imageUrl : `${siteUrl}/${input.imageUrl.replace(/^\//, "")}`)
    : null;
  const imageHtml = imageUrl
    ? `<tr><td><img src="${escapeEmailHtml(imageUrl)}" width="600" style="width:100%;max-width:600px;height:auto;display:block;border:0" alt="${escapeEmailHtml(input.title)}"/></td></tr>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeEmailHtml(input.title)}</title></head><body style="margin:0;padding:0;background:#f7f9fb;-webkit-font-smoothing:antialiased"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeEmailHtml(input.preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fb"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #c6c6cf;border-radius:16px;overflow:hidden"><tr><td style="background:#f7f9fb;border-bottom:1px solid #c6c6cf;padding:20px 28px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="48" style="padding-right:12px;vertical-align:middle"><img src="${logoUrl}" width="44" height="44" style="display:block;border-radius:50%;border:0" alt="theSpotlightChurch"/></td><td style="vertical-align:middle;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:18px;font-weight:800;color:#081534">theSpotlightChurch</td></tr></table></td></tr><tr><td style="background:#081534;padding:32px 28px"><div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#fdc425;text-transform:uppercase">${escapeEmailHtml(input.eyebrow)}</div><h1 style="margin:10px 0 0;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:26px;font-weight:800;line-height:1.3;color:#fff">${escapeEmailHtml(input.title)}</h1></td></tr>${imageHtml}<tr><td style="padding:30px 28px 34px;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#45464e"><p style="margin:0 0 14px;font-size:16px;font-weight:700;line-height:1.6;color:#081534">${formatLines(input.greeting)}</p>${input.paragraphs.map(paragraph => `<p style="margin:0 0 14px;font-size:14px;line-height:1.75;color:#45464e">${formatLines(paragraph)}</p>`).join("")}${detailsHtml}${noticeHtml}${actionHtml}</td></tr><tr><td style="border-top:1px solid #c6c6cf;background:#081534;padding:28px;text-align:center"><div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:15px;font-weight:800;color:#fff;margin-bottom:8px">theSpotlightChurch</div><div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:11px;line-height:1.7;color:#d5d8e1">Ado Guest House Event Centre, Ado Secretariat Junction,<br>Abuja-Keffi Road, Karu, FCT, Nigeria</div><div style="margin-top:14px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:11px"><a href="${siteUrl}/contact" style="color:#fdc425;text-decoration:underline">Contact Us</a>&nbsp;&nbsp; <a href="${siteUrl}/privacy-policy" style="color:#fdc425;text-decoration:underline">Privacy Policy</a></div><div style="margin-top:16px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:10px;color:#aeb5c4">© 2026 theSpotlightChurch. All rights reserved.</div></td></tr></table></td></tr></table></body></html>`;
}

export type EventEmailType =
  | "confirmation"
  | "payment_confirmed"
  | "reminder_7d"
  | "reminder_1d";

export async function reserveEventEmail(
  supabase: SupabaseClient<any, any, any>,
  registrationId: string,
  emailType: EventEmailType,
) {
  const now = new Date();
  const { data: existing, error: readError } = await supabase
    .from("event_email_log")
    .select("id, status, created_at")
    .eq("registration_id", registrationId)
    .eq("email_type", emailType)
    .maybeSingle();

  if (readError) return { id: null, error: readError.message };
  if (!existing) {
    const { data: inserted, error: insertError } = await supabase
      .from("event_email_log")
      .insert({ registration_id: registrationId, email_type: emailType, status: "pending" })
      .select("id")
      .single();
    if (insertError?.code === "23505") return { id: null, error: null };
    return { id: inserted?.id ?? null, error: insertError?.message ?? null };
  }

  if (existing.status === "sent") return { id: null, error: null };
  const stalePendingBefore = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  let retry = supabase.from("event_email_log").update({
    status: "pending",
    created_at: now.toISOString(),
    sent_at: null,
    provider_message_id: null,
    error_message: null,
  }).eq("id", existing.id).eq("status", existing.status);

  if (existing.status === "pending") {
    if (new Date(existing.created_at).getTime() > now.getTime() - 15 * 60 * 1000) {
      return { id: null, error: null };
    }
    retry = retry.lt("created_at", stalePendingBefore);
  }

  const { data: reserved, error: retryError } = await retry.select("id").maybeSingle();
  return { id: reserved?.id ?? null, error: retryError?.message ?? null };
}

export async function sendBrevoEmail(message: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { sent: false, error: "Brevo is not configured" };

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "theSpotlightChurch",
          email: process.env.BREVO_SENDER_EMAIL || "officialspotlightglobal@gmail.com",
        },
        ...message,
      }),
    });

    if (!response.ok) {
      return { sent: false, error: `Brevo returned ${response.status}` };
    }

    return {
      sent: true,
      messageId: response.headers.get("x-mailin-id"),
    };
  } catch (error) {
    console.error("[EVENT EMAIL] Brevo request failed:", error);
    return { sent: false, error: "Email provider request failed" };
  }
}