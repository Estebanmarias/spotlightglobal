import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { sendClassEmail } from "@/lib/classes";

const UUID = /^[0-9a-f-]{36}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  // Honeypot: real visitors never fill this hidden field
     if (typeof body.website === "string" && body.website.trim()) {
       console.warn("[CLASS REGISTER] spam-trap field was filled, registration ignored");
    return NextResponse.json({ success: true });
  }

  const intakeId = clean(body.intakeId, 36);
  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 30);

  if (!UUID.test(intakeId)) return fail("Please choose a class.", 400);
  if (fullName.length < 2) return fail("Please enter your full name.", 400);
  if (!EMAIL.test(email)) return fail("Please enter a valid email address.", 400);
  if (phone.length < 7) return fail("Please enter a valid phone number.", 400);
  if (body.privacyAccepted !== true) return fail("Please accept the privacy notice.", 400);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("register_for_class_intake", {
    p_intake_id: intakeId,
    p_full_name: fullName,
    p_email: email,
    p_phone: phone,
    p_privacy_accepted: true,
  });

  if (error) {
    if (error.code === "CL001") return NextResponse.json({ error: "Not a member yet.", code: "not_member" }, { status: 422 });
    if (error.code === "CL002") return NextResponse.json({ error: "Prerequisite not completed.", code: "prerequisite_missing" }, { status: 422 });
    if (error.code === "23505") return fail("You're already registered for this class.", 409);;
    if (error.code === "P0001") return fail(error.message, 409);
    if (error.code === "P0002") return fail("That class could not be found.", 404);
    if (error.code === "22023") return fail("Please check your details and try again.", 400);
    console.error("[CLASS REGISTER]", error.message);
    return fail("Registration could not be completed. Please try again.", 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return fail("Registration could not be completed. Please try again.", 500);

  const { data: intake } = await supabase
    .from("class_intakes")
    .select("payment_instructions")
    .eq("id", intakeId)
    .single();
  const email_ = await sendClassEmail(supabase, row.enrollment_id, "confirmation");

  return NextResponse.json({
    success: true,
    approvalStatus: row.approval_status,
    prerequisiteMet: row.prerequisite_met,
    paymentStatus: row.payment_status,
    amountDue: row.amount_due,
    currency: row.currency,
    className: row.program_name,
    paymentInstructions: row.payment_status === "pending" ? (intake?.payment_instructions ?? null) : null,
    emailSent: email_.sent,
  });
}