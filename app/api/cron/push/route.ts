import { NextRequest, NextResponse } from "next/server";
import { sendScheduledPush } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.PUSH_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ success: true, push: await sendScheduledPush() });
  } catch (e) {
    console.error("[PUSH CRON] failed:", (e as Error).message);
    return NextResponse.json({ error: "push failed" }, { status: 500 });
  }
}