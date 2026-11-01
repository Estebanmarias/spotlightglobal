import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const maxDuration = 60;

const BUCKET = "database-backups";
const RETENTION = 30;
const TABLES = [
  "admin_roles",
  "members",
  "ministries",
  "ministry_leaders",
  "ministry_members",
  "church_events",
  "event_registrations",
  "event_prayer_requests",
  "event_email_log",
  "community_photos",
  "testimonies",
  "partner_submissions",
  "broadcast_messages",
  "blog_posts",
  "giving_records",
  "attendance_records",
  "class_programs",
  "class_intakes",
  "class_sessions",
  "class_enrollments",
  "class_attendance",
  "class_email_log",
  "class_notify_log",
  "audit_logs",
] as const;

function unauthorized(request: NextRequest) {
  return !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (unauthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const tables: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`[DATABASE BACKUP] ${table}:`, error.message);
      return NextResponse.json({ error: `Could not back up ${table}.` }, { status: 500 });
    }
    tables[table] = data ?? [];
  }

  const createdAt = new Date().toISOString();
  const payload = JSON.stringify({ version: 1, createdAt, tables });
  const fileName = `backup-${createdAt.replace(/[:.]/g, "-")}.json`;
  const storage = supabase.storage.from(BUCKET);

  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      console.error("[DATABASE BACKUP] bucket:", error.message);
      return NextResponse.json({ error: "Could not prepare backup storage." }, { status: 500 });
    }
  }

  const { error: uploadError } = await storage.upload(fileName, Buffer.from(payload), {
    contentType: "application/json",
    upsert: false,
  });
  if (uploadError) {
    console.error("[DATABASE BACKUP] upload:", uploadError.message);
    return NextResponse.json({ error: "Could not store database backup." }, { status: 500 });
  }

  const { data: files, error: listError } = await storage.list("", {
    limit: 1000,
    sortBy: { column: "name", order: "desc" },
  });
  if (listError) {
    console.error("[DATABASE BACKUP] list:", listError.message);
    return NextResponse.json({ error: "Backup created but retention cleanup failed." }, { status: 500 });
  }

  const oldFiles = (files ?? [])
    .filter((file) => file.name.startsWith("backup-") && file.name !== fileName)
    .slice(RETENTION - 1)
    .map((file) => file.name);
  if (oldFiles.length) {
    const { error: removeError } = await storage.remove(oldFiles);
    if (removeError) {
      console.error("[DATABASE BACKUP] retention:", removeError.message);
      return NextResponse.json({ error: "Backup created but retention cleanup failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, fileName, tables: TABLES.length });
}
