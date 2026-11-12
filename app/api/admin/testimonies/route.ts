import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeAdminPage } from "@/lib/admin-auth";

const UUID = /^[0-9a-f-]{36}$/i;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "testimonies"))) return fail("Not authorized.", 403);
  const { data, error } = await getSupabaseAdminClient()
    .from("testimonies")
    .select("id, created_at, name, testimony, is_visible")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[ADMIN TESTIMONIES] load failed:", error.message);
    return fail("Could not load testimonies.", 500);
  }
  return NextResponse.json({ testimonies: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "testimonies"))) return fail("Not authorized.", 403);
  let body: { id?: unknown; is_visible?: unknown; name?: unknown; testimony?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.");
  }
  if (typeof body.id !== "string" || !UUID.test(body.id)) return fail("Invalid request.");

  const update: Record<string, unknown> = {};
  if (body.is_visible !== undefined) {
    if (typeof body.is_visible !== "boolean") return fail("Invalid request.");
    update.is_visible = body.is_visible;
  }
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 60) return fail("Invalid name.");
    update.name = body.name.trim();
  }
  if (body.testimony !== undefined) {
    if (typeof body.testimony !== "string" || body.testimony.trim().length < 20 || body.testimony.length > 1500) {
      return fail("Invalid testimony.");
    }
    update.testimony = body.testimony.trim();
  }
  if (Object.keys(update).length === 0) return fail("Nothing to update.");

  const { error } = await getSupabaseAdminClient().from("testimonies").update(update).eq("id", body.id);
  if (error) {
    console.error("[ADMIN TESTIMONIES] update failed:", error.message);
    return fail("Could not update the testimony.", 500);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "testimonies"))) return fail("Not authorized.", 403);
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!UUID.test(id)) return fail("Invalid request.");
  const { error } = await getSupabaseAdminClient().from("testimonies").delete().eq("id", id);
  if (error) {
    console.error("[ADMIN TESTIMONIES] delete failed:", error.message);
    return fail("Could not delete the testimony.", 500);
  }
  return NextResponse.json({ success: true });
}