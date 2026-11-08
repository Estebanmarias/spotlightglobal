import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeAdminPage } from "@/lib/admin-auth";
import { deleteBrevoContact } from "@/lib/brevo-contact";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
  if (!(await authorizeAdminPage(request, "members"))) return fail("Not authorized.", 403);

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.");
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) return fail("Invalid email.");

  // Only once the member row is really gone
  const { count, error } = await getSupabaseAdminClient()
    .from("members")
    .select("id", { count: "exact", head: true })
    .ilike("email", email.replace(/[\\%_]/g, "\\$&"));
  if (error) {
    console.error("[BREVO CONTACT] member check failed:", error.message);
    return fail("Could not verify the member was removed.", 500);
  }
  if ((count ?? 0) > 0) return fail("This email still belongs to a member.", 409);

  const result = await deleteBrevoContact(email);
  if (!result.ok) return fail(result.error, 502);
  return NextResponse.json({ success: true, existed: result.existed });
}