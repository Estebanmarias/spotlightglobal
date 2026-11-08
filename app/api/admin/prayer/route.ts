import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeAdminPage } from "@/lib/admin-auth";

const UUID = /^[0-9a-f-]{36}$/i;
const STATUSES = ["new", "prayed", "follow_up"];
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "prayer"))) return fail("Not authorized.", 403);
  const { data, error } = await getSupabaseAdminClient()
    .from("prayer_requests")
    .select("id, created_at, name, contact, request, wants_reply, status")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[ADMIN PRAYER] load failed:", error.message);
    return fail("Could not load prayer requests.", 500);
  }
  return NextResponse.json({ requests: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const admin = await authorizeAdminPage(request, "prayer");
  if (!admin) return fail("Not authorized.", 403);
  let body: { id?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.");
  }
  if (typeof body.id !== "string" || !UUID.test(body.id) || typeof body.status !== "string" || !STATUSES.includes(body.status)) {
    return fail("Invalid request.");
  }
  const reset = body.status === "new";
  const { error } = await getSupabaseAdminClient()
    .from("prayer_requests")
    .update({
      status: body.status,
      handled_at: reset ? null : new Date().toISOString(),
      handled_by: reset ? null : admin.userId,
    })
    .eq("id", body.id);
  if (error) {
    console.error("[ADMIN PRAYER] update failed:", error.message);
    return fail("Could not update the request.", 500);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "prayer"))) return fail("Not authorized.", 403);
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!UUID.test(id)) return fail("Invalid request.");
  const { error } = await getSupabaseAdminClient().from("prayer_requests").delete().eq("id", id);
  if (error) {
    console.error("[ADMIN PRAYER] delete failed:", error.message);
    return fail("Could not delete the request.", 500);
  }
  return NextResponse.json({ success: true });
}