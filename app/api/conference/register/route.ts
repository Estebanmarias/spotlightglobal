import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { formatEventRegistrationReference } from "@/lib/event-registration-reference";
import { escapeEmailHtml, renderEventEmail, reserveEventEmail, sendBrevoEmail } from "@/lib/media-event-auth";

const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const rateLimit = redisConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "spotlight:event-registration",
    })
  : null;

type RegistrationRequest = {
  eventId?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  location?: unknown;
  accommodationNeeded?: unknown;
  accommodationNotes?: unknown;
  childrenCount?: unknown;
  attendanceDates?: unknown;
  specialSessionAttending?: unknown;
  specialRequest?: unknown;
  prayerRequest?: unknown;
  referralSource?: unknown;
  privacyAccepted?: unknown;
  website?: unknown;
};

function isValidText(value: unknown, minLength: number, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length >= minLength && value.trim().length <= maxLength;
}

function formatEventDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

  if (rateLimit) {
    try {
      const limit = await rateLimit.limit(ip);
      if (!limit.success) {
        return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
      }
    } catch (error) {
      console.error("[EVENT REGISTRATION] Rate limiter unavailable:", error);
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Registration is temporarily unavailable." }, { status: 503 });
      }
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[EVENT REGISTRATION] Upstash rate-limit configuration is missing");
    return NextResponse.json({ error: "Registration is temporarily unavailable." }, { status: 503 });
  }

  let body: RegistrationRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    typeof body.eventId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.eventId) ||
    !isValidText(body.fullName, 2, 120) ||
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
    typeof body.phone !== "string" ||
    !/^\+?[\d\s().-]{7,30}$/.test(body.phone.trim()) ||
    !isValidText(body.location, 2, 160) ||
    typeof body.accommodationNeeded !== "boolean" ||
    typeof body.specialSessionAttending !== "boolean" ||
    typeof body.privacyAccepted !== "boolean" ||
    body.privacyAccepted !== true ||
    !isValidText(body.referralSource, 2, 80) ||
    !Array.isArray(body.attendanceDates) ||
    body.attendanceDates.length < 1 ||
    body.attendanceDates.length > 14 ||
    !body.attendanceDates.every((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))
  ) {
    return NextResponse.json({ error: "Check the required fields and try again." }, { status: 400 });
  }

  const attendanceDates = body.attendanceDates as string[];
  if (
    new Set(attendanceDates).size !== attendanceDates.length ||
    attendanceDates.some((date) => {
      const parsed = new Date(`${date}T00:00:00Z`);
      return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date;
    })
  ) {
    return NextResponse.json({ error: "Select valid, unique event days." }, { status: 400 });
  }

  const childrenCount = body.childrenCount === undefined ? 0 : body.childrenCount;
  if (!Number.isInteger(childrenCount) || (childrenCount as number) < 0 || (childrenCount as number) > 20) {
    return NextResponse.json({ error: "Enter a valid number of children." }, { status: 400 });
  }

  if (body.accommodationNotes !== undefined && !isValidText(body.accommodationNotes, 0, 1000)) {
    return NextResponse.json({ error: "Accommodation details are too long." }, { status: 400 });
  }
  if (body.specialRequest !== undefined && !isValidText(body.specialRequest, 0, 2000)) {
    return NextResponse.json({ error: "Special request is too long." }, { status: 400 });
  }
  if (body.prayerRequest !== undefined && !isValidText(body.prayerRequest, 0, 3000)) {
    return NextResponse.json({ error: "Prayer request is too long." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("register_for_church_event", {
    p_event_id: body.eventId,
    p_full_name: body.fullName.trim(),
    p_email: body.email.trim().toLowerCase(),
    p_phone: body.phone.trim(),
    p_location: body.location.trim(),
    p_accommodation_needed: body.accommodationNeeded,
    p_accommodation_notes: typeof body.accommodationNotes === "string" ? body.accommodationNotes.trim() : null,
    p_children_count: childrenCount,
    p_attendance_dates: body.attendanceDates,
    p_special_session_attending: body.specialSessionAttending,
    p_special_request: typeof body.specialRequest === "string" ? body.specialRequest.trim() : null,
    p_prayer_request: typeof body.prayerRequest === "string" ? body.prayerRequest.trim() : null,
    p_referral_source: body.referralSource.trim(),
    p_privacy_accepted: body.privacyAccepted,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This email is already registered for this event." }, { status: 409 });
    }
    if (error.code === "P0002") {
      return NextResponse.json({ error: "This event could not be found." }, { status: 404 });
    }
    const knownMessages = ["Registration is closed", "Registration deadline has passed", "Event is full", "Event has ended"];
    if (knownMessages.some((message) => error.message.includes(message))) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error.code === "22023") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[EVENT REGISTRATION] Database registration failed:", error.message);
    return NextResponse.json({ error: "Registration could not be completed. Please try again." }, { status: 500 });
  }

  const registration = Array.isArray(data) ? data[0] : data;
  if (!registration?.registration_id) {
    return NextResponse.json({ error: "Registration could not be confirmed." }, { status: 500 });
  }
  const registrationReference = formatEventRegistrationReference(registration.registration_id);

  const { data: eventDetails, error: eventDetailsError } = await supabase
    .from("church_events")
    .select("title, event_date, event_end_date, event_time, flyer_url, location")
    .eq("id", body.eventId)
    .maybeSingle();
  if (eventDetailsError) {
    console.error("[EVENT REGISTRATION] Could not load event email details:", eventDetailsError.message);
  }

  let emailSent = false;
  const emailReservation = await reserveEventEmail(supabase, registration.registration_id, "confirmation");
  if (emailReservation.error) {
    console.error("[EVENT REGISTRATION] Could not reserve confirmation email:", emailReservation.error);
  }

  if (emailReservation.id) {
    const eventTitle = eventDetails?.title ?? registration.event_title;
    const isPaid = registration.payment_status === "pending";
    const paymentInstructions = typeof registration.payment_instructions === "string" && registration.payment_instructions.trim()
      ? registration.payment_instructions.trim()
      : "The church team will contact you with verified payment instructions.";
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "");
    const dateRange = eventDetails
      ? eventDetails.event_end_date && eventDetails.event_end_date !== eventDetails.event_date
        ? `${formatEventDate(eventDetails.event_date)} - ${formatEventDate(eventDetails.event_end_date)}`
        : formatEventDate(eventDetails.event_date)
      : null;
    const attendanceDays = (body.attendanceDates as string[]).map(formatEventDate).join(", ");
    const message = await sendBrevoEmail({
      to: [{ email: body.email.trim().toLowerCase(), name: body.fullName.trim() }],
      subject: isPaid ? `Registration received: ${eventTitle}` : `Registration confirmed: ${eventTitle}`,
      htmlContent: renderEventEmail({
        preheader: isPaid ? `Your registration for ${eventTitle} is received; payment is pending.` : `Your registration for ${eventTitle} is confirmed.`,
        eyebrow: "EVENT REGISTRATION",
        title: isPaid ? "Registration received" : "Registration confirmed",
        greeting: `Hi ${body.fullName.trim().split(/\s+/)[0]}, welcome to the Company of the Blessed.`,
        paragraphs: [
          `Your registration for ${eventTitle} has been received.`,
          "We look forward to welcoming you. Keep this email for your event details.",
        ],
        details: [
          { label: "Registration ref", value: registrationReference },
          { label: "Event", value: eventTitle },
          ...(dateRange ? [{ label: "Dates", value: dateRange }] : []),
          ...(eventDetails?.event_time ? [{ label: "Sessions", value: eventDetails.event_time }] : []),
          ...(eventDetails?.location ? [{ label: "Venue", value: eventDetails.location }] : []),
          { label: "Attending", value: attendanceDays },
          { label: "Group size", value: String(1 + Number(childrenCount)) },
        ],
        notice: isPaid
          ? { title: `Payment pending · ${registration.currency} ${Number(registration.amount_due).toLocaleString("en-NG")}`, body: paymentInstructions }
          : { title: "Registration confirmed", body: "Your place is confirmed. We recorded your attendance preferences." },
        action: { label: "View event details", url: `${siteUrl}/conference?event=${encodeURIComponent(body.eventId)}` },
        imageUrl: eventDetails?.flyer_url,
      }),
    });

    await supabase.from("event_email_log").update({
      status: message.sent ? "sent" : "failed",
      sent_at: message.sent ? new Date().toISOString() : null,
      provider_message_id: message.sent ? message.messageId : null,
      error_message: message.sent ? null : message.error,
    }).eq("id", emailReservation.id);

    if (message.sent) {
      emailSent = true;
      await supabase.from("event_registrations")
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq("id", registration.registration_id);
    }
  }

  const notificationEmail = process.env.EVENTS_NOTIFICATION_EMAIL;
  if (notificationEmail) {
    const escapedName = escapeEmailHtml(body.fullName.trim());
    const escapedEvent = escapeEmailHtml(eventDetails?.title ?? registration.event_title);
    const adminMessage = await sendBrevoEmail({
      to: [{ email: notificationEmail }],
      subject: `New event registration: ${registration.event_title}`,
      htmlContent: `<div style="font-family:Arial,sans-serif"><h2>New conference registration</h2><p><strong>Registration ref:</strong> ${escapeEmailHtml(registrationReference)}</p><p><strong>Event:</strong> ${escapedEvent}</p><p><strong>Name:</strong> ${escapedName}</p><p><strong>Email:</strong> ${escapeEmailHtml(body.email.trim())}</p><p><strong>Phone:</strong> ${escapeEmailHtml(body.phone.trim())}</p><p><strong>Payment:</strong> ${escapeEmailHtml(registration.payment_status)}</p></div>`,
    });
    if (!adminMessage.sent) console.error("[EVENT REGISTRATION] Admin notification failed:", adminMessage.error);
  }

  return NextResponse.json({
    success: true,
    registrationId: registration.registration_id,
    registrationReference,
    paymentStatus: registration.payment_status,
    amountDue: registration.amount_due,
    currency: registration.currency,
    paymentInstructions: registration.payment_instructions,
    emailSent,
  }, { status: 201 });
}