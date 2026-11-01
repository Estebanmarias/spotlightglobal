import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminPage } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const admin = await authorizeAdminPage(request, "settings");
  if (!admin?.isSuperAdmin) {
    return NextResponse.json({ error: "Only Setman can access the audit log." }, { status: 403 });
  }

  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 100), 1), 200);
  const { data, error } = await getSupabaseAdminClient()
    .from("audit_logs")
    .select("id, actor_name, actor_email, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[AUDIT LOG] load failed:", error.message);
    const message = error.code === "42P01"
      ? "The audit_logs table is not installed yet. Apply the latest Supabase migration, then try again."
      : "Could not load the audit log.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const admin = await authorizeAdminPage(request, "settings");
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action.trim().slice(0, 100) : "";
  const entityType = typeof body.entityType === "string" ? body.entityType.trim().slice(0, 100) : "";
  const entityId = typeof body.entityId === "string" ? body.entityId.trim().slice(0, 100) : null;
  if (!action || !entityType) {
    return NextResponse.json({ error: "Action and entity type are required." }, { status: 400 });
  }

  const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
    ? body.metadata
    : {};
  const { error } = await getSupabaseAdminClient().from("audit_logs").insert({
    actor_user_id: admin.userId,
    actor_name: admin.fullName,
    actor_email: admin.email,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
  if (error) {
    console.error("[AUDIT LOG] write failed:", error.message);
    return NextResponse.json({ error: "Could not record the audit event." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
