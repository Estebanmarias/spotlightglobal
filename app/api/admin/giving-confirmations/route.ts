import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeAdminPage } from "@/lib/admin-auth";

const UUID = /^[0-9a-f-]{36}$/i;
const STATUSES = ["new", "matched", "not_found", "duplicate"];
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "giving"))) return fail("Not authorized.", 403);
  const { data, error } = await getSupabaseAdminClient()
    .from("giving_confirmations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[GIVING CONFIRMATIONS] load failed:", error.message);
    return fail("Could not load confirmations.", 500);
  }
  return NextResponse.json({ confirmations: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const admin = await authorizeAdminPage(request, "giving");
  if (!admin) return fail("Not authorized.", 403);
  let body: { id?: unknown; status?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.");
  }
  if (typeof body.id !== "string" || !UUID.test(body.id)) return fail("Invalid request.");

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !STATUSES.includes(body.status)) return fail("Invalid status.");
    patch.status = body.status;
    patch.handled_at = body.status === "new" ? null : new Date().toISOString();
    patch.handled_by = body.status === "new" ? null : admin.userId;
  }
  if (body.note !== undefined) {
    if (typeof body.note !== "string" || body.note.length > 500) return fail("The note is too long.");
    patch.note = body.note.trim() || null;
  }
  if (!Object.keys(patch).length) return fail("Nothing to update.");

  const { error } = await getSupabaseAdminClient().from("giving_confirmations").update(patch).eq("id", body.id);
  if (error) {
    console.error("[GIVING CONFIRMATIONS] update failed:", error.message);
    return fail("Could not update the confirmation.", 500);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "giving"))) return fail("Not authorized.", 403);
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!UUID.test(id)) return fail("Invalid request.");
  const { error } = await getSupabaseAdminClient().from("giving_confirmations").delete().eq("id", id);
  if (error) {
    console.error("[GIVING CONFIRMATIONS] delete failed:", error.message);
    return fail("Could not delete the confirmation.", 500);
  }
  return NextResponse.json({ success: true });
}