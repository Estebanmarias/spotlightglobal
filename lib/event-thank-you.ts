import type { SupabaseClient } from "@supabase/supabase-js";
import { renderEventEmail, reserveEventEmail, sendBrevoEmail } from "@/lib/media-event-auth";

const WINDOW_DAYS = 3;    // keeps retrying for a few days if a run fails
const MAX_PER_RUN = 100;  // stays well inside Brevo's daily limit; the rest go out on the next run

const iso = (d: Date) => d.toISOString().slice(0, 10);
const shiftDays = (base: string, days: number) => {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
};
const longDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "");

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  event_end_date: string | null;
  event_time: string | null;
  location: string;
  thank_you_message: string | null;
};
type RegistrationRow = { id: string; full_name: string; email: string };

export async function sendEventThankYous(supabase: SupabaseClient<any, any, any>) {
  const result = { sent: 0, failed: 0, skipped: 0 };

  try {
    const today = iso(new Date());
    const from = shiftDays(today, -WINDOW_DAYS);
    const to = shiftDays(today, -1);

    const { data: events, error } = await supabase
      .from("church_events")
      .select("id, title, event_date, event_end_date, event_time, location, thank_you_message")
      .eq("thank_you_enabled", true)
      .neq("recurrence", "weekly")
      .gte("event_date", shiftDays(today, -45))
      .lte("event_date", to);

    if (error) {
      console.error("[EVENT THANK YOU] could not load events:", error.message);
      result.failed += 1;
      return result;
    }

    let budget = MAX_PER_RUN;

    for (const event of (events ?? []) as EventRow[]) {
      const end = event.event_end_date || event.event_date;
      if (end < from || end > to) continue;
      if (budget <= 0) break;

      const { data: registrations, error: registrationError } = await supabase
        .from("event_registrations")
        .select("id, full_name, email")
        .eq("event_id", event.id)
        .eq("registration_status", "registered")
        .in("payment_status", ["free", "paid"]);

      if (registrationError) {
        console.error("[EVENT THANK YOU] could not load registrations:", registrationError.message);
        result.failed += 1;
        continue;
      }

      const body = event.thank_you_message?.trim()
        ? event.thank_you_message.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
        : [
            `Thank you for being part of ${event.title}. It was a joy to have you with us, and we pray that what you received stays with you.`,
            "We would love to see you again. You can follow what is coming next on our events page.",
          ];
      const paragraphs = [...body, "“I thank my God upon every remembrance of you.”\nPhilippians 1:3 (KJV)"];
      const dateLabel = end !== event.event_date ? `${longDate(event.event_date)} to ${longDate(end)}` : longDate(event.event_date);

      const people = (registrations ?? []) as RegistrationRow[];
      for (let i = 0; i < people.length && budget > 0; i += 5) {
        await Promise.all(
          people.slice(i, i + 5).map(async (person) => {
            const reservation = await reserveEventEmail(supabase, person.id, "thank_you");
            if (reservation.error) {
              console.error("[EVENT THANK YOU] could not reserve:", reservation.error);
              result.failed += 1;
              return;
            }
            if (!reservation.id) {
              result.skipped += 1;
              return;
            }
            budget -= 1;

            const first = person.full_name.trim().split(/\s+/)[0];
            const message = await sendBrevoEmail({
              to: [{ email: person.email, name: person.full_name }],
              subject: `Thank you for joining us at ${event.title}`,
              htmlContent: renderEventEmail({
                preheader: `Thank you for being part of ${event.title}.`,
                eyebrow: "THANK YOU",
                title: "Thank you for joining us",
                greeting: `Hi ${first},`,
                paragraphs,
                details: [
                  { label: "Event", value: event.title },
                  { label: "Date", value: dateLabel },
                  { label: "Venue", value: event.location },
                ],
                action: { label: "See upcoming events", url: `${siteUrl()}/events` },
              }),
            });

            await supabase.from("event_email_log").update({
              status: message.sent ? "sent" : "failed",
              sent_at: message.sent ? new Date().toISOString() : null,
              provider_message_id: message.sent ? message.messageId : null,
              error_message: message.sent ? null : message.error,
            }).eq("id", reservation.id);

            if (message.sent) result.sent += 1;
            else result.failed += 1;
          }),
        );
      }
    }
  } catch (error) {
    console.error("[EVENT THANK YOU] run failed:", error);
    result.failed += 1;
  }

  return result;
}