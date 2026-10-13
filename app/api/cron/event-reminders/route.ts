import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { renderEventEmail, reserveEventEmail, sendBrevoEmail } from "@/lib/media-event-auth";

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string;
  event_end_date?: string | null;
  flyer_url?: string | null;
};

type RegistrationRow = {
  id: string;
  full_name: string;
  email: string;
  currency: string;
  payment_status: string;
};

function dateOffset(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysFromToday(eventDate: string) {
  const today = dateOffset(0);
  return Math.round((Date.parse(`${eventDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BREVO_API_KEY) {
    return NextResponse.json({ error: "Brevo is not configured." }, { status: 503 });
  }

  const supabase = getSupabaseAdminClient();
  const results = { sent: 0, failed: 0, skipped: 0 };
  const runStartedAt = new Date().toISOString();

  for (const reminder of [
    { days: 7, type: "reminder_7d" as const, label: "in 7 days" },
    { days: 1, type: "reminder_1d" as const, label: "tomorrow" },
  ]) {
    const targetDate = dateOffset(reminder.days);
    const { data: events, error: eventError } = await supabase
      .from("church_events")
      .select("id, title, event_date, event_end_date, event_time, location, flyer_url")
      .eq("event_date", targetDate) as { data: EventRow[] | null; error: { message: string } | null };

    if (eventError) {
      console.error("[EVENT REMINDERS] Could not load events:", eventError.message);
      return NextResponse.json({ error: "Could not load reminder events." }, { status: 500 });
    }

    for (const event of events ?? []) {
      const { data: registrations, error: registrationError } = await supabase
        .from("event_registrations")
        .select("id, full_name, email, currency, payment_status")
        .eq("event_id", event.id)
        .eq("registration_status", "registered")
        .in("payment_status", ["free", "paid"]) as { data: RegistrationRow[] | null; error: { message: string } | null };

      if (registrationError) {
        console.error("[EVENT REMINDERS] Could not load attendees:", registrationError.message);
        results.failed += 1;
        continue;
      }

      for (const registration of registrations ?? []) {
        const reservation = await reserveEventEmail(supabase, registration.id, reminder.type);
        if (reservation.error) {
          console.error("[EVENT REMINDERS] Could not reserve reminder:", reservation.error);
          results.failed += 1;
          continue;
        }
        if (!reservation.id) {
          results.skipped += 1;
          continue;
        }

        const dateLabel = new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-NG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const message = await sendBrevoEmail({
          to: [{ email: registration.email, name: registration.full_name }],
          subject: `${event.title} is ${reminder.label}`,
          htmlContent: renderEventEmail({
            preheader: `${event.title} is ${reminder.label}.`,
            eyebrow: "EVENT REMINDER",
            title: `Your event is ${reminder.label}`,
            greeting: `Hi ${registration.full_name.trim().split(/\s+/)[0]},`,
            paragraphs: [`This is a reminder about ${event.title}.`, "We look forward to seeing you."],
            details: [
              { label: "Event", value: event.title },
              { label: "Date", value: dateLabel },
              ...(event.event_time ? [{ label: "Sessions", value: event.event_time }] : []),
              { label: "Venue", value: event.location },
            ],
            action: { label: "View event details", url: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "")}/conference?event=${encodeURIComponent(event.id)}` },
            imageUrl: event.flyer_url,
          }),
        });

        await supabase.from("event_email_log").update({
          status: message.sent ? "sent" : "failed",
          sent_at: message.sent ? new Date().toISOString() : null,
          provider_message_id: message.sent ? message.messageId : null,
          error_message: message.sent ? null : message.error,
        }).eq("id", reservation.id);

        if (message.sent) results.sent += 1;
        else results.failed += 1;
      }
    }
  }

  const { data: failedReminders, error: failedReminderError } = await supabase
    .from("event_email_log")
    .select("registration_id, email_type")
    .eq("status", "failed")
    .lt("created_at", runStartedAt)
    .in("email_type", ["reminder_7d", "reminder_1d"]);

  if (failedReminderError) {
    console.error("[EVENT REMINDERS] Could not load failed reminders:", failedReminderError.message);
    return NextResponse.json({ error: "Could not load failed reminders." }, { status: 500 });
  }

  for (const failedReminder of failedReminders ?? []) {
    const reminderType = failedReminder.email_type as "reminder_7d" | "reminder_1d";
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("id, event_id, full_name, email, payment_status, registration_status")
      .eq("id", failedReminder.registration_id)
      .maybeSingle() as { data: (RegistrationRow & { event_id: string; registration_status: string }) | null };
    if (!registration || registration.registration_status !== "registered" || !["free", "paid"].includes(registration.payment_status)) continue;

    const { data: event } = await supabase
      .from("church_events")
      .select("id, title, event_date, event_end_date, event_time, location, flyer_url")
      .eq("id", registration.event_id)
      .single() as { data: (EventRow & { event_end_date: string | null }) | null };
    if (!event) continue;
    const daysUntil = daysFromToday(event.event_date);
    if (daysUntil < 1 || daysUntil > 7 || (event.event_end_date && event.event_end_date < dateOffset(0))) continue;

    const reservation = await reserveEventEmail(supabase, registration.id, reminderType);
    if (reservation.error) {
      console.error("[EVENT REMINDERS] Could not reserve retry:", reservation.error);
      results.failed += 1;
      continue;
    }
    if (!reservation.id) {
      results.skipped += 1;
      continue;
    }

    const dateLabel = new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-NG", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const reminderLabel = reminderType === "reminder_7d" ? "in 7 days" : "tomorrow";
    const message = await sendBrevoEmail({
      to: [{ email: registration.email, name: registration.full_name }],
      subject: `${event.title} reminder`,
      htmlContent: renderEventEmail({
        preheader: `${event.title} is ${reminderLabel}.`,
        eyebrow: "EVENT REMINDER",
        title: `Your event is ${reminderLabel}`,
        greeting: `Hi ${registration.full_name.trim().split(/\s+/)[0]},`,
        paragraphs: [`This is a reminder about ${event.title}.`, "We look forward to seeing you."],
        details: [
          { label: "Event", value: event.title },
          { label: "Date", value: dateLabel },
          ...(event.event_time ? [{ label: "Sessions", value: event.event_time }] : []),
          { label: "Venue", value: event.location },
        ],
        action: { label: "View event details", url: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "")}/conference?event=${encodeURIComponent(event.id)}` },
        imageUrl: event.flyer_url,
      }),
    });
    await supabase.from("event_email_log").update({
      status: message.sent ? "sent" : "failed",
      sent_at: message.sent ? new Date().toISOString() : null,
      provider_message_id: message.sent ? message.messageId : null,
      error_message: message.sent ? null : message.error,
    }).eq("id", reservation.id);
    if (message.sent) results.sent += 1;
    else results.failed += 1;
  }

  return NextResponse.json({ success: true, results });
}