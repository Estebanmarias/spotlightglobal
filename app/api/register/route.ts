import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, phone, dob, guest_status } = body;

    // Basic validation
    if (
      !first_name ||
      !last_name ||
      !email ||
      !phone ||
      !dob ||
      !guest_status
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // 1. Insert into Supabase
    const supabaseAdmin = getSupabaseAdminClient();
    const { error: dbError } = await supabaseAdmin
      .from("members")
      .insert([{ first_name, last_name, email, phone, dob, guest_status }]);

    if (dbError) {
      // Handle duplicate email
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "This email is already registered." },
          { status: 409 },
        );
      }
      throw dbError;
    }

    // 2. Push to Brevo (skip gracefully if key not set yet)
    if (process.env.BREVO_API_KEY) {
      await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          email,
          firstName: first_name,
          lastName: last_name,
          listIds: [Number(process.env.BREVO_LIST_ID)],
          updateEnabled: true,
          attributes: { PHONE: phone, DOB: dob, GUEST_STATUS: guest_status },
        }),
      });
    }

    return NextResponse.json({ success: true, first_name }, { status: 200 });
  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
