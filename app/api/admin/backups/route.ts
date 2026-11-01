import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminPage } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { checkPublicRateLimit } from "@/lib/public-rate-limit";
import { hasBackupAccess, setBackupAccessCookie, verifyBackupPin } from "@/lib/backup-access";

const BUCKET = "database-backups";

export async function GET(request: NextRequest) {
  const admin = await authorizeAdminPage(request, "settings");
  if (!admin?.isSuperAdmin) {
    return NextResponse.json({ error: "Only Setman can access backups." }, { status: 403 });
  }
  if (!hasBackupAccess(request, admin.userId)) {
    return NextResponse.json({ requiresPin: true }, { status: 401 });
  }

  const storage = getSupabaseAdminClient().storage.from(BUCKET);
  const { data: files, error } = await storage.list("", {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });
  if (error) {
    console.error("[ADMIN BACKUPS] list:", error.message);
    return NextResponse.json({ error: "Could not load backups." }, { status: 500 });
  }

  const backups = [];
  for (const file of (files ?? []).filter((item) => item.name.startsWith("backup-"))) {
    const { data: signed, error: signedError } = await storage.createSignedUrl(file.name, 300);
    if (signedError) {
      console.error("[ADMIN BACKUPS] signed URL:", signedError.message);
      return NextResponse.json({ error: "Could not prepare backup downloads." }, { status: 500 });
    }
    backups.push({
      name: file.name,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      size: file.metadata?.size ?? null,
      downloadUrl: signed.signedUrl,
    });
  }

  return NextResponse.json({ backups });
}

export async function POST(request: NextRequest) {
  const admin = await authorizeAdminPage(request, "settings");
  if (!admin?.isSuperAdmin) {
    return NextResponse.json({ error: "Only Setman can unlock backups." }, { status: 403 });
  }
  const rate = await checkPublicRateLimit(request, "backup-pin");
  if (!rate.allowed) {
    return NextResponse.json({ error: rate.unavailable ? "Backup unlock is temporarily unavailable." : "Too many incorrect attempts. Try again later." }, { status: rate.unavailable ? 503 : 429 });
  }
  let body: { pin?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter the 8-digit backup PIN." }, { status: 400 });
  }
  if (typeof body.pin !== "string" || !verifyBackupPin(body.pin)) {
    return NextResponse.json({ error: "Incorrect backup PIN." }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  setBackupAccessCookie(response, admin.userId);
  return response;
}
