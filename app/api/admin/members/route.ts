import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { authorizeAdminPage } from "@/lib/admin-auth";
import { pushMemberToBrevo } from "@/lib/brevo-contact";

const SOURCES = ["social", "friend", "website", "walkin"];
const INTERESTS = ["worship", "youth", "outreach", "smallgroups"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s\-()]{7,20}$/;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function POST(request: NextRequest) {
  const admin = await authorizeAdminPage(request, "members");
  if (!admin) return fail("Not authorized.", 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request body.");
  }

  const firstName = clean(body.first_name, 50);
  const lastName = clean(body.last_name, 50);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 20);
  const address = clean(body.address, 200);
  const dob = clean(body.dob, 10);
  const notes = clean(body.admin_notes, 2000);
  const source = clean(body.discovery_source, 20);
  const referral = clean(body.referral_name, 100);
  const interests: string[] = Array.isArray(body.interests)
    ? [...new Set(body.interests.filter((i): i is string => typeof i === "string" && INTERESTS.includes(i)))]
    : [];

  if (!firstName || !lastName || !email || !phone || !dob) {
    return fail("First name, last name, email, phone and date of birth are required.");
  }
  if (!EMAIL.test(email)) return fail("Enter a valid email address.");
  if (!PHONE.test(phone)) return fail("Enter a valid phone number.");
  if (source && !SOURCES.includes(source)) return fail("Invalid discovery source.");

  const dobDate = new Date(`${dob}T00:00:00Z`);
  const age = (Date.now() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(dobDate.getTime()) || age < 0 || age > 120) {
    return fail("Enter a valid date of birth.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: member, error } = await supabase
    .from("members")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address: address || null,
      dob,
      guest_status: "Attending",
      admin_notes: notes || null,
      discovery_source: source || null,
      referral_name: referral || null,
      interests,
    })
    .select("id")
    .single();

  if (error || !member) {
    if (error?.code === "23505") return fail("A member with this email already exists.", 409);
    console.error("[ADMIN ADD MEMBER]", error?.message);
    return fail("Could not add the member. Please try again.", 500);
  }

  const brevo = await pushMemberToBrevo({ email, firstName, lastName, phone, dob, status: "Attending" });
  return NextResponse.json({ success: true, memberId: member.id, brevo });
}