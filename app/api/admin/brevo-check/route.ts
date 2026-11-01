import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminPage } from "@/lib/admin-auth";
import { SITE_CONFIG } from "@/lib/site-config";

type Probe = { ok: boolean; status: number; data: unknown };

async function brevo(path: string, init?: { method?: string; body?: string }): Promise<Probe> {
  try {
    const res = await fetch(`https://api.brevo.com/v3${path}`, {
      method: init?.method ?? "GET",
      body: init?.body,
      headers: { accept: "application/json", "content-type": "application/json", "api-key": process.env.BREVO_API_KEY ?? "" },
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown = text;
    try { data = JSON.parse(text); } catch { /* keep the raw text */ }
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: String(error) };
  }
}

const message = (data: unknown) =>
  typeof data === "object" && data && "message" in data ? String((data as { message: unknown }).message) : String(data).slice(0, 200);

export async function POST(request: NextRequest) {
  // No admin has a "brevo-check" permission, so only Setman gets through
  const admin = await authorizeAdminPage(request, "brevo-check");
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  let body: { email?: unknown; sendTest?: unknown } = {};
  try { body = await request.json(); } catch { /* defaults */ }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  const findings: string[] = [];
  const env = Object.fromEntries(
    ["BREVO_API_KEY", "BREVO_LIST_ID", "BREVO_LIST_ID_ATTENDING", "BREVO_LIST_ID_MEMBER", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME"]
      .map((k) => [k, Boolean(process.env[k])]),
  );

  if (!env.BREVO_API_KEY) {
    findings.push("BREVO_API_KEY is not set where this server runs, so nothing can send.");
    return NextResponse.json({ findings, env });
  }
  if (!env.BREVO_LIST_ID) findings.push("BREVO_LIST_ID is not set, so new registrations never join your main list and the welcome automation can’t start.");
  if (!env.BREVO_LIST_ID_ATTENDING) findings.push("BREVO_LIST_ID_ATTENDING is not set, so the Attending list is skipped.");

  const account = await brevo("/account");
  if (!account.ok) {
    findings.push(`Brevo rejected the API key (HTTP ${account.status}): ${message(account.data)}`);
    return NextResponse.json({ findings, env, account });
  }
  const plans = ((account.data as { plan?: { type?: string; credits?: number; creditsType?: string }[] }).plan ?? []);
  if (plans.some((p) => p.creditsType === "sendLimit" && (p.credits ?? 1) <= 0)) {
    findings.push("Your Brevo plan shows no sending credits left, so nothing will send until the limit resets.");
  }

  const senders = await brevo("/senders");
  const sender = (process.env.BREVO_SENDER_EMAIL || SITE_CONFIG.email).toLowerCase();
  const senderList = (senders.data as { senders?: { email: string; active: boolean }[] })?.senders ?? [];
  const senderMatch = senderList.find((s) => s.email.toLowerCase() === sender);
  if (!senders.ok) findings.push(`Could not read your senders (HTTP ${senders.status}).`);
  else if (!senderMatch) findings.push(`${sender} is not one of your Brevo senders, so Brevo will refuse to send from it. Add and verify it in Brevo.`);
  else if (!senderMatch.active) findings.push(`${sender} exists but isn’t verified yet.`);
  if (/@(gmail|yahoo|outlook|hotmail)\./i.test(sender)) {
    findings.push(`The sender ${sender} is a free-mail address. Gmail and Yahoo may spam-folder or reject mail that claims such a sender but isn’t sent by them. A sender on your own authenticated domain is the proper fix.`);
  }

  const lists: Record<string, Probe> = {};
  for (const name of ["BREVO_LIST_ID", "BREVO_LIST_ID_ATTENDING", "BREVO_LIST_ID_MEMBER"]) {
    const id = process.env[name];
    if (!id) continue;
    lists[name] = await brevo(`/contacts/lists/${encodeURIComponent(id)}`);
    if (!lists[name].ok) findings.push(`${name}=${id} wasn’t found in Brevo (HTTP ${lists[name].status}). Use the list number shown under Contacts → Lists.`);
  }

  let contact: Probe | null = null;
  let events: Probe | null = null;
  if (email) {
    contact = await brevo(`/contacts/${encodeURIComponent(email)}`);
    if (contact.status === 404) {
      findings.push(`${email} isn’t a contact in Brevo, so registration never reached Brevo. Look for “[BREVO ERROR]” in the logs from that registration.`);
    } else if (contact.ok) {
      const c = contact.data as { emailBlacklisted?: boolean; listIds?: number[] };
      if (c.emailBlacklisted) findings.push(`${email} is blocklisted in Brevo, so nothing will be delivered to it.`);
      const main = Number(process.env.BREVO_LIST_ID);
      if (main && !(c.listIds ?? []).includes(main)) findings.push(`${email} is in Brevo but not in your main list (${main}), so the welcome automation won’t trigger.`);
    }
    events = await brevo(`/smtp/statistics/events?email=${encodeURIComponent(email)}&limit=20&days=7`);
    const bad = ((events.data as { events?: { event: string; reason?: string; subject?: string }[] })?.events ?? [])
      .find((e) => ["blocked", "hardBounces", "softBounces", "invalid", "spam", "error", "deferred"].includes(e.event));
    if (bad) findings.push(`Brevo logged “${bad.event}” for ${email}${bad.subject ? ` (“${bad.subject}”)` : ""}: ${bad.reason ?? "no reason given"}.`);
  }

  let test: Probe | null = null;
  if (body.sendTest === true) {
    test = await brevo("/smtp/email", {
      method: "POST",
      body: JSON.stringify({
        sender: { name: process.env.BREVO_SENDER_NAME || "theSpotlightChurch", email: sender },
        to: [{ email: admin.email }],
        subject: "Brevo test from theSpotlightChurch",
        htmlContent: "<p>If you can read this, transactional email works.</p>",
      }),
    });
    findings.push(
      test.ok
        ? `Brevo accepted a test email for ${admin.email}. If it doesn’t arrive, check spam and Brevo’s transactional log. Acceptance means Brevo took it, not that the inbox did.`
        : `The test email failed (HTTP ${test.status}): ${message(test.data)}`,
    );
  }

  if (findings.length === 0) findings.push("Nothing obviously wrong with the key, sender or lists. Check the automations and Brevo’s logs next.");
  return NextResponse.json({ findings, env, account, senders, lists, contact, events, test });
}