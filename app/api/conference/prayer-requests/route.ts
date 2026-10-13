import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeMediaEventManager } from "@/lib/media-event-auth";

export async function GET(request: NextRequest) {
  const manager = await authorizeMediaEventManager(request);
  if (!manager?.isSuperAdmin) {
    return NextResponse.json({ error: "Pastoral access required." }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get("event_id");
  if (!eventId || !/^[0-9a-f-]{36}$/i.test(eventId)) {
    return NextResponse.json({ error: "A valid event_id is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: requests, error } = await supabase
    .from("event_prayer_requests")
    .select("id, registration_id, request, created_at, status")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[EVENT PRAYER REQUESTS] Could not load requests:", error.message);
    return NextResponse.json({ error: "Could not load prayer requests." }, { status: 500 });
  }

  const registrationIds = (requests ?? []).map((item) => item.registration_id);
  const { data: registrants } = registrationIds.length
    ? await supabase.from("event_registrations").select("id, full_name").in("id", registrationIds)
    : { data: [] };
  const namesById = new Map((registrants ?? []).map((item) => [item.id, item.full_name]));

  return NextResponse.json({
    requests: (requests ?? []).map((item) => ({
      ...item,
      full_name: namesById.get(item.registration_id) ?? "Attendee",
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const manager = await authorizeMediaEventManager(request);
  if (!manager?.isSuperAdmin) {
    return NextResponse.json({ error: "Pastoral access required." }, { status: 403 });
  }

  let body: { requestId?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body.requestId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(body.requestId) ||
    !["new", "prayed", "follow_up"].includes(String(body.status))
  ) {
    return NextResponse.json({ error: "Invalid prayer request update." }, { status: 400 });
  }

  const { error } = await getSupabaseAdminClient()
    .from("event_prayer_requests")
    .update({
      status: body.status,
      handled_at: body.status === "new" ? null : new Date().toISOString(),
      handled_by: manager.userId,
    })
    .eq("id", body.requestId);

  if (error) {
    console.error("[EVENT PRAYER REQUESTS] Could not update request:", error.message);
    return NextResponse.json({ error: "Could not update prayer request." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}