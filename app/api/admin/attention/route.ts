import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Task = {
  key: string;
  label: string;
  href: string | null;
  tone: "urgent" | "normal";
  hint?: string;
  run: () => Promise<number>;
};

const NOT_LIVE = "(dropped,rejected)";

export async function GET(request: NextRequest) {
  const [base, classes, prayer, giving, partners] = await Promise.all(
    ["dashboard", "classes", "prayer", "giving", "partners"].map((page) => authorizeAdminPage(request, page)),
  );
  if (!base) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const supabase = getSupabaseAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const count = async (table: string, filter: (q: any) => any) => {
    const { count: n, error } = await filter(supabase.from(table).select("id", { count: "exact", head: true }));
    if (error) throw new Error(`${table}: ${error.message}`);
    return (n ?? 0) as number;
  };

  const tasks: Task[] = [];

  if (base.isSuperAdmin) {
    tasks.push({
      key: "failed-emails",
      label: "Emails that failed to send in the last 7 days",
      href: null,
      tone: "urgent",
      hint: "Open Brevo, then Transactional, then Logs, to see why.",
      run: async () => {
        const [a, b] = await Promise.all([
          count("class_email_log", (q) => q.eq("status", "failed").gte("created_at", weekAgo)),
          count("event_email_log", (q) => q.eq("status", "failed").gte("created_at", weekAgo)),
        ]);
        return a + b;
      },
    });
    tasks.push({
      key: "event-payments",
      label: "Event registrations waiting for payment confirmation",
      href: "/admin/ministry-dashboard",
      tone: "normal",
      run: () => count("event_registrations", (q) => q.eq("registration_status", "registered").eq("payment_status", "pending")),
    });
  }

  if (classes) {
    tasks.push(
      {
        key: "class-approvals",
        label: "Class applications waiting for approval",
        href: "/admin/classes",
        tone: "urgent",
        run: () => count("class_enrollments", (q) => q.eq("approval_status", "pending").not("status", "in", NOT_LIVE)),
      },
      {
        key: "class-payments",
        label: "Class payments waiting for confirmation",
        href: "/admin/classes",
        tone: "normal",
        run: () => count("class_enrollments", (q) => q.eq("payment_status", "pending").not("status", "in", NOT_LIVE)),
      },
      {
        key: "class-refunds",
        label: "Refunds due to people who weren’t approved",
        href: "/admin/classes",
        tone: "urgent",
        run: () => count("class_enrollments", (q) => q.eq("payment_status", "refund_due")),
      },
      {
        key: "class-certificates",
        label: "Completed people still waiting for a certificate",
        href: "/admin/classes",
        tone: "normal",
        run: () => count("class_enrollments", (q) => q.eq("status", "completed").is("certificate_issued_at", null)),
      },
    );
  }

  if (prayer) {
    tasks.push({
      key: "prayer-new",
      label: "New prayer requests",
      href: "/admin/prayer",
      tone: "normal",
      run: () => count("prayer_requests", (q) => q.eq("status", "new")),
    });
  }

  if (giving) {
    tasks.push({
      key: "giving-new",
      label: "Giver confirmations to match against the bank statement",
      href: "/admin/giving",
      tone: "normal",
      run: () => count("giving_confirmations", (q) => q.eq("status", "new")),
    });
  }

  if (partners) {
    tasks.push({
      key: "partners-new",
      label: "New partnership submissions",
      href: "/admin/partner",
      tone: "normal",
      run: () => count("partner_submissions", (q) => q.eq("status", "new")),
    });
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));
  const items: { key: string; label: string; count: number; href: string | null; hint?: string; tone: "urgent" | "normal" }[] = [];
  let partial = false;

  settled.forEach((result, i) => {
    const task = tasks[i];
    if (result.status === "rejected") {
      partial = true;
      console.error("[ATTENTION]", task.key, result.reason);
      return;
    }
    if (result.value > 0) {
      items.push({ key: task.key, label: task.label, count: result.value, href: task.href, hint: task.hint, tone: task.tone });
    }
  });

  return NextResponse.json({ items, partial }, { headers: { "Cache-Control": "no-store" } });
}