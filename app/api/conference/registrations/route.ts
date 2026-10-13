import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeMediaEventManager } from "@/lib/media-event-auth";

export async function GET(request: NextRequest) {
  const manager = await authorizeMediaEventManager(request);
  if (!manager) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const eventId = request.nextUrl.searchParams.get("event_id");
  if (!eventId || !/^[0-9a-f-]{36}$/i.test(eventId)) {
    return NextResponse.json({ error: "A valid event_id is required." }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("event_registrations")
    .select("id, created_at, full_name, email, phone, location, accommodation_needed, accommodation_notes, children_count, attendee_count, attendance_dates, special_session_attending, special_request, referral_source, registration_status, payment_status, amount_due, currency, payment_reference, amount_paid, paid_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[EVENT REGISTRATIONS] Could not load registrations:", error.message);
    return NextResponse.json({ error: "Could not load registrations." }, { status: 500 });
  }

  return NextResponse.json({ registrations: data ?? [] });
}