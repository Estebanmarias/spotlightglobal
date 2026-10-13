import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeMediaEventManager, renderEventEmail, reserveEventEmail, sendBrevoEmail } from "@/lib/media-event-auth";

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/conference/registrations/[registrationId]/payment">,
) {
  const manager = await authorizeMediaEventManager(request);
  if (!manager) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { registrationId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(registrationId)) {
    return NextResponse.json({ error: "Invalid registration." }, { status: 400 });
  }

  let body: { payment_reference?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.payment_reference !== undefined && (typeof body.payment_reference !== "string" || body.payment_reference.length > 160)) {
    return NextResponse.json({ error: "Payment reference is too long." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: registration, error: fetchError } = await supabase
    .from("event_registrations")
    .select("id, full_name, email, payment_status, amount_due, currency, event_id")
    .eq("id", registrationId)
    .single();

  if (fetchError || !registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }
  if (registration.payment_status !== "pending") {
    return NextResponse.json({ error: "Only pending payments can be confirmed." }, { status: 409 });
  }

  const paidAt = new Date().toISOString();
  const { data: updatedRegistration, error: updateError } = await supabase
    .from("event_registrations")
    .update({
      payment_status: "paid",
      amount_paid: registration.amount_due,
      payment_reference: typeof body.payment_reference === "string" ? body.payment_reference.trim() || null : null,
      paid_at: paidAt,
      paid_by: manager.userId,
    })
    .eq("id", registrationId)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[EVENT PAYMENT] Could not confirm payment:", updateError.message);
    return NextResponse.json({ error: "Could not confirm payment." }, { status: 500 });
  }
  if (!updatedRegistration) {
    return NextResponse.json({ error: "This payment was already confirmed." }, { status: 409 });
  }

  const emailReservation = await reserveEventEmail(supabase, registrationId, "payment_confirmed");
  if (emailReservation.error) {
    console.error("[EVENT PAYMENT] Could not reserve receipt email:", emailReservation.error);
  }

  let emailSent = false;
  if (emailReservation.id) {
    const { data: event } = await supabase
      .from("church_events")
      .select("title, event_date, event_end_date, event_time, location, flyer_url")
      .eq("id", registration.event_id)
      .single();
    const eventTitle = event?.title ?? "your event registration";
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app").replace(/\/$/, "");
    const dateRange = event
      ? event.event_end_date && event.event_end_date !== event.event_date
        ? `${new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} - ${new Date(`${event.event_end_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`
        : new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
      : null;
    const message = await sendBrevoEmail({
      to: [{ email: registration.email, name: registration.full_name }],
      subject: `Payment confirmed: ${eventTitle}`,
      htmlContent: renderEventEmail({
        preheader: `Your payment for ${eventTitle} is confirmed.`,
        eyebrow: "PAYMENT CONFIRMED",
        title: "Your place is confirmed",
        greeting: `Hi ${registration.full_name.trim().split(/\s+/)[0]},`,
        paragraphs: [`We have confirmed your payment for ${eventTitle}.`, "We look forward to welcoming you. Keep this email for your event details."],
        details: [
          { label: "Event", value: eventTitle },
          { label: "Payment received", value: `${registration.currency} ${Number(registration.amount_due).toLocaleString("en-NG")}` },
          ...(dateRange ? [{ label: "Dates", value: dateRange }] : []),
          ...(event?.event_time ? [{ label: "Sessions", value: event.event_time }] : []),
          ...(event?.location ? [{ label: "Venue", value: event.location }] : []),
        ],
        notice: { title: "Payment complete", body: "Your event registration is confirmed." },
        action: { label: "View event details", url: `${siteUrl}/conference?event=${encodeURIComponent(registration.event_id)}` },
        imageUrl: event?.flyer_url,
      }),
    });

    await supabase.from("event_email_log").update({
      status: message.sent ? "sent" : "failed",
      sent_at: message.sent ? new Date().toISOString() : null,
      provider_message_id: message.sent ? message.messageId : null,
      error_message: message.sent ? null : message.error,
    }).eq("id", emailReservation.id);
    emailSent = message.sent;
  }

  return NextResponse.json({ success: true, emailSent });
}