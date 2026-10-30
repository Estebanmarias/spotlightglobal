import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { renderEventEmail, sendBrevoEmail } from "@/lib/media-event-auth";
import { verseFor } from "@/lib/class-verses";

export type ClassesManager = {
  userId: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
};

export async function authorizeClassesManager(request: NextRequest): Promise<ClassesManager | null> {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  if (!accessToken) return null;

  const supabase = getSupabaseAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authData.user) return null;

  const { data: role } = (await supabase
    .from("admin_roles")
    .select("role, status, full_name, email, permissions")
    .eq("user_id", authData.user.id)
    .single()) as {
    data: { role: string; status: string; full_name: string; email: string; permissions: string[] | null } | null;
  };

  if (!role || role.status !== "approved") return null;
  const isSuperAdmin = role.role === "super_admin";
  if (!isSuperAdmin && !(role.permissions ?? []).includes("classes")) return null;

  return { userId: authData.user.id, email: role.email, fullName: role.full_name, isSuperAdmin };
}

export type ClassEmailType = "confirmation" | "payment_confirmed" | "approved" | "rejected" | "completed";

async function reserveClassEmail(
  supabase: SupabaseClient<any, any, any>,
  enrollmentId: string,
  emailType: ClassEmailType,
) {
  const now = new Date();
  const { data: existing, error: readError } = await supabase
    .from("class_email_log")
    .select("id, status, created_at")
    .eq("enrollment_id", enrollmentId)
    .eq("email_type", emailType)
    .maybeSingle();

  if (readError) return { id: null as string | null, error: readError.message };
  if (!existing) {
    const { data: inserted, error: insertError } = await supabase
      .from("class_email_log")
      .insert({ enrollment_id: enrollmentId, email_type: emailType, status: "pending" })
      .select("id")
      .single();
    if (insertError?.code === "23505") return { id: null, error: null };
    return { id: (inserted?.id ?? null) as string | null, error: insertError?.message ?? null };
  }

  if (existing.status === "sent") return { id: null, error: null };
  let retry = supabase.from("class_email_log").update({
    status: "pending",
    created_at: now.toISOString(),
    sent_at: null,
    provider_message_id: null,
    error_message: null,
  }).eq("id", existing.id).eq("status", existing.status);

  if (existing.status === "pending") {
    const stale = new Date(now.getTime() - 15 * 60 * 1000);
    if (new Date(existing.created_at) > stale) return { id: null, error: null };
    retry = retry.lt("created_at", stale.toISOString());
  }

  const { data: reserved, error: retryError } = await retry.select("id").maybeSingle();
  return { id: (reserved?.id ?? null) as string | null, error: retryError?.message ?? null };
}

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "");
const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const todayIso = () => new Date().toISOString().slice(0, 10);

type EmailInput = Parameters<typeof renderEventEmail>[0];

const versePara = (slug?: string | null) => {
  const v = verseFor(slug);
  return `“${v.text}”\n${v.ref} (KJV)`;
};

// Classes that unlock after finishing this one (for example SSLC after Membership Class)
async function successorInfo(supabase: SupabaseClient<any, any, any>, programId: string) {
  const { data: programs } = await supabase
    .from("class_programs")
    .select("id, name")
    .eq("prerequisite_program_id", programId)
    .eq("is_active", true);
  const list = (programs ?? []) as { id: string; name: string }[];
  if (!list.length) return { names: [] as string[], open: [] as { title: string; start: string }[] };

  const { data: intakes } = await supabase
    .from("class_intakes")
    .select("title, start_date, registration_deadline")
    .in("program_id", list.map((p) => p.id))
    .eq("registration_open", true)
    .gte("end_date", todayIso())
    .order("start_date");
  const open = ((intakes ?? []) as { title: string; start_date: string; registration_deadline: string | null }[])
    .filter((i) => !i.registration_deadline || i.registration_deadline >= todayIso())
    .map((i) => ({ title: i.title, start: i.start_date }));
  return { names: list.map((p) => p.name), open };
}

export async function sendClassEmail(
  supabase: SupabaseClient<any, any, any>,
  enrollmentId: string,
  type: ClassEmailType,
  options: { membershipConfirmed?: boolean } = {},
) {
  const reservation = await reserveClassEmail(supabase, enrollmentId, type);
  const logId = reservation.id;
  if (!logId) return { sent: false, error: reservation.error };

  const finish = async (sent: boolean, messageId: string | null, error: string | null) => {
    await supabase.from("class_email_log").update({
      status: sent ? "sent" : "failed",
      sent_at: sent ? new Date().toISOString() : null,
      provider_message_id: sent ? messageId : null,
      error_message: sent ? null : error,
    }).eq("id", logId);
    return { sent, error };
  };

  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("intake_id, full_name, email, approval_status, payment_status, amount_due, currency")
    .eq("id", enrollmentId)
    .single();
  if (!enrollment) return finish(false, null, "Enrollment not found");

  const { data: intake } = await supabase
    .from("class_intakes")
    .select("program_id, title, start_date, payment_instructions, meeting_details, meeting_link")
    .eq("id", enrollment.intake_id)
    .single();
  if (!intake) return finish(false, null, "Intake not found");

  const { data: program } = await supabase.from("class_programs").select("name, slug").eq("id", intake.program_id).single();
  const { data: sessionData } = await supabase
    .from("class_sessions")
    .select("session_date, title, mode, time_label")
    .eq("intake_id", enrollment.intake_id)
    .order("session_date");

  const className = String(program?.name ?? "your class");
  const first = String(enrollment.full_name).trim().split(/\s+/)[0];
  const owing = enrollment.payment_status === "pending";
  const waiting = enrollment.approval_status === "pending";
  const cleared = !owing && !waiting && enrollment.approval_status !== "rejected";
  const amount = `${enrollment.currency} ${Number(enrollment.amount_due).toLocaleString("en-NG")}`;
  const link: string | null = intake.meeting_link;
  const verse = versePara(program?.slug);
  const schedule = ((sessionData ?? []) as { session_date: string; title: string; mode: string; time_label: string | null }[])
    .map((s) => `${fmtDate(s.session_date)}: ${s.title}${s.time_label ? ` (${s.time_label})` : ""} · ${s.mode === "remote" ? "Online" : "In person"}`)
    .join("\n");

  const classDetails = [
    { label: "Class", value: className },
    { label: "Intake", value: String(intake.title) },
    { label: "Starts", value: fmtDate(intake.start_date) },
    ...(schedule ? [{ label: "Sessions", value: schedule }] : []),
  ];
  const paymentNotice = {
    title: "Payment details",
    body: `${intake.payment_instructions || "The church team will contact you with payment details."}\n\nAmount: ${amount}\nIf your place isn’t approved, your payment will be refunded.`,
  };
  const followUp = {
    title: "What happens next",
    body: "Our team will reach out with the remaining details, including the class WhatsApp group.",
  };
  const groupAction = cleared && link ? { label: "Join the WhatsApp group", url: link } : undefined;
  const greeting = `Hi ${first},`;

  let subject = "";
  let content: EmailInput;

  switch (type) {
    case "confirmation": {
      subject = `Your registration: ${className}`;
      if (owing) {
        content = {
          greeting, preheader: `One step left to secure your place in ${className}.`, eyebrow: "CLASS REGISTRATION",
          title: "One step left: payment",
          paragraphs: [
            `Thank you for registering for ${className}. Your place is secured once we confirm your payment.`,
            ...(waiting ? ["Our team will also review your application and email you the outcome."] : []),
            verse,
          ],
          details: classDetails, notice: paymentNotice,
        };
      } else if (waiting) {
        content = {
          greeting, preheader: `We received your application for ${className}.`, eyebrow: "CLASS APPLICATION",
          title: "Application received",
          paragraphs: [`Thank you for applying to ${className}. Our team will review your application and email you the outcome.`, verse],
          details: classDetails,
        };
      } else {
        content = {
          greeting, preheader: `You’re registered for ${className}.`, eyebrow: "CLASS REGISTRATION",
          title: "You’re registered",
          paragraphs: [`Thank you for registering for ${className}. We’re glad you’re joining us.`, verse],
          details: [...classDetails, ...(intake.meeting_details ? [{ label: "How we meet", value: String(intake.meeting_details) }] : [])],
          notice: link ? undefined : followUp,
          action: groupAction,
        };
      }
      break;
    }
    case "payment_confirmed": {
      subject = `Payment received: ${className}`;
      content = {
        greeting, preheader: `We received your payment for ${className}.`, eyebrow: "PAYMENT RECEIVED",
        title: "Payment received",
        paragraphs: [
          `We’ve confirmed your payment of ${amount} for ${className}.`,
          waiting ? "Your application is now with our team for review. We’ll email you the outcome." : "Your place is confirmed.",
          verse,
        ],
        details: classDetails,
        notice: cleared && !link ? followUp : undefined,
        action: groupAction,
      };
      break;
    }
    case "approved": {
      subject = `You’re in: ${className}`;
      content = {
        greeting, preheader: `Your application for ${className} is approved.`, eyebrow: "APPLICATION APPROVED",
        title: owing ? "Approved: one step left" : "Your place is confirmed",
        paragraphs: [
          `Good news: your application for ${className} has been approved.`,
          owing ? "Please complete your payment to secure your place." : "Welcome aboard. We’re glad you’re here.",
          verse,
        ],
        details: classDetails,
        notice: owing ? paymentNotice : cleared && !link ? followUp : undefined,
        action: groupAction,
      };
      break;
    }
    case "rejected": {
      subject = `An update on your application: ${className}`;
      content = {
        greeting, preheader: `An update on your application for ${className}.`, eyebrow: "APPLICATION UPDATE",
        title: "We couldn’t offer you a place",
        paragraphs: [
          `Thank you for your interest in ${className}. We’re unable to offer you a place in this intake.`,
          "You are welcome to apply again for a future intake.",
        ],
        notice: enrollment.payment_status === "refund_due"
          ? { title: "Your refund", body: "Your payment will be refunded. The church team will contact you about it." }
          : undefined,
      };
      break;
    }
    case "completed": {
      subject = `Congratulations on completing ${className}`;
      const next = await successorInfo(supabase, intake.program_id);
      const nextTitle = `Your next step: ${next.names.join(" or ")}`;
      content = {
        greeting, preheader: `You completed ${className}.`, eyebrow: "CLASS COMPLETED",
        title: "Congratulations, you did it",
        paragraphs: [
          `You have completed ${className}. We celebrate you.`,
          ...(options.membershipConfirmed ? ["Your membership is now confirmed. You are a committed member of theSpotlightChurch."] : []),
          "Our team will share your certificate with you.",
          verse,
        ],
        notice: next.names.length
          ? next.open.length
            ? {
                title: nextTitle,
                body: `Registration is open now:\n${next.open.map((i) => `${i.title}, starts ${fmtDate(i.start)}`).join("\n")}\n\nUse the same email address when you register.`,
              }
            : { title: nextTitle, body: "Registration isn’t open yet. We’ll email you the moment it opens." }
          : undefined,
        action: next.open.length ? { label: "Register now", url: `${siteUrl()}/classes` } : undefined,
      };
      break;
    }
  }

  const message = await sendBrevoEmail({
    to: [{ email: enrollment.email, name: enrollment.full_name }],
    subject,
    htmlContent: renderEventEmail(content),
  });
  return finish(message.sent, message.sent ? (message.messageId ?? null) : null, message.sent ? null : (message.error ?? null));
}

// Emails everyone who finished the prerequisite class when a follow-on intake opens.
// class_notify_log makes sure each person is told once per intake.
export async function notifyEligibleForIntake(supabase: SupabaseClient<any, any, any>, intakeId: string) {
  const result = { eligible: 0, sent: 0, failed: 0, skipped: 0 };

  const { data: intake } = await supabase
    .from("class_intakes")
    .select("id, program_id, title, start_date, end_date, price, currency, registration_open, registration_deadline")
    .eq("id", intakeId)
    .single();
  if (!intake || !intake.registration_open) return result;
  if (intake.registration_deadline && intake.registration_deadline < todayIso()) return result;

  const { data: program } = await supabase
    .from("class_programs")
    .select("name, slug, eligibility, prerequisite_program_id")
    .eq("id", intake.program_id)
    .single();
  if (!program || program.eligibility !== "prerequisite" || !program.prerequisite_program_id) return result;

  const { data: prereq } = await supabase.from("class_programs").select("name").eq("id", program.prerequisite_program_id).single();
  const { data: priorIntakes } = await supabase.from("class_intakes").select("id").eq("program_id", program.prerequisite_program_id);
  const priorIds = ((priorIntakes ?? []) as { id: string }[]).map((i) => i.id);
  if (!priorIds.length) return result;

  const { data: completed } = await supabase
    .from("class_enrollments").select("full_name, email").in("intake_id", priorIds).eq("status", "completed");
  const { data: already } = await supabase
    .from("class_enrollments").select("email").eq("intake_id", intakeId).not("status", "in", "(dropped,rejected)");
  const taken = new Set(((already ?? []) as { email: string }[]).map((r) => r.email.toLowerCase()));

  const people = new Map<string, string>();
  for (const row of (completed ?? []) as { full_name: string; email: string }[]) {
    const email = row.email.toLowerCase();
    if (!taken.has(email) && !people.has(email)) people.set(email, row.full_name);
  }
  result.eligible = people.size;

  const entries = [...people.entries()];
  const verse = versePara(program.slug);
  const price = Number(intake.price) > 0 ? `${intake.currency} ${Number(intake.price).toLocaleString("en-NG")}` : "Free";

  for (let i = 0; i < entries.length; i += 5) {
    await Promise.all(entries.slice(i, i + 5).map(async ([email, name]) => {
      const { error: insertError } = await supabase.from("class_notify_log").insert({ intake_id: intakeId, email, status: "pending" });
      if (insertError) {
        // Already notified. Only retry if the earlier attempt failed.
        const { data: retried } = await supabase
          .from("class_notify_log")
          .update({ status: "pending", error_message: null })
          .eq("intake_id", intakeId).eq("email", email).eq("status", "failed")
          .select("email").maybeSingle();
        if (!retried) { result.skipped += 1; return; }
      }

      const message = await sendBrevoEmail({
        to: [{ email, name }],
        subject: `${program.name} registration is now open`,
        htmlContent: renderEventEmail({
          greeting: `Hi ${name.trim().split(/\s+/)[0]},`,
          preheader: `Registration for ${program.name} is open.`,
          eyebrow: "REGISTRATION OPEN",
          title: `${program.name} is open`,
          paragraphs: [
            `Registration for ${program.name} is now open, and you’re eligible because you completed ${prereq?.name ?? "the earlier class"}.`,
            "Use the same email address when you register.",
            verse,
          ],
          details: [
            { label: "Intake", value: String(intake.title) },
            { label: "Starts", value: fmtDate(intake.start_date) },
            { label: "Ends", value: fmtDate(intake.end_date) },
            { label: "Fee", value: price },
            ...(intake.registration_deadline ? [{ label: "Register by", value: fmtDate(intake.registration_deadline) }] : []),
          ],
          action: { label: "Register now", url: `${siteUrl()}/classes` },
        }),
      });

      await supabase.from("class_notify_log").update({
        status: message.sent ? "sent" : "failed",
        sent_at: message.sent ? new Date().toISOString() : null,
        error_message: message.sent ? null : (message.error ?? null),
      }).eq("intake_id", intakeId).eq("email", email);
      if (message.sent) result.sent += 1; else result.failed += 1;
    }));
  }
  return result;
}

function statusListId(status: string): number | null {
  switch (status) {
    case "Attending": return Number(process.env.BREVO_LIST_ID_ATTENDING) || null;
    case "Member": return Number(process.env.BREVO_LIST_ID_MEMBER) || null;
    default: return null;
  }
}

export async function syncMemberStatusToBrevo(
  email: string,
  status: "Attending" | "Member",
  previous: "Attending" | "Member" | null = null,
) {
  const key = process.env.BREVO_API_KEY;
  if (!key) return false;
  const newList = statusListId(status);
  const oldList = previous ? statusListId(previous) : null;
  const payload: Record<string, unknown> = { attributes: { GUEST_STATUS: status } };
  if (newList) payload.listIds = [newList];
  if (oldList && oldList !== newList) payload.unlinkListIds = [oldList];
  try {
    const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email.trim().toLowerCase())}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "api-key": key },
      body: JSON.stringify(payload),
    });
    if (!res.ok && res.status !== 204) {
      console.error("[BREVO STATUS SYNC]", res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[BREVO STATUS SYNC]", error);
    return false;
  }
}