import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { first_name, last_name, email, phone, dob, guest_status } = body;

    // 1. Presence validation
    if (!first_name || !last_name || !email || !phone || !dob || !guest_status) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // 2. Email format validation
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 3. Insert into Supabase
    const supabaseAdmin = getSupabaseAdminClient();

    const { error: dbError } = await supabaseAdmin
      .from("members")
      .insert([{
        first_name,
        last_name,
        email,
        phone,
        dob,
        guest_status,
      } satisfies Database["public"]["Tables"]["members"]["Insert"]]);   // ← Best fix

    if (dbError) {
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "This email is already registered." },
          { status: 409 }
        );
      }
      console.error("Supabase error:", dbError);
      throw dbError;
    }

    // 4. Push to Brevo
    if (process.env.BREVO_API_KEY) {
      const listId = parseInt(process.env.BREVO_LIST_ID ?? "0", 10);

      if (listId) {
        const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            email,
            attributes: {
              FIRSTNAME: first_name,
              LASTNAME: last_name,
              SMS: phone,
              DOB: dob,
              GUEST_STATUS: guest_status,
            },
            listIds: [listId],
            updateEnabled: true,
          }),
        });

        if (!brevoRes.ok) {
          const brevoError = await brevoRes.text();
          console.error("[BREVO] Failed to sync contact:", brevoRes.status, brevoError);
        }
      }
    }

    return NextResponse.json({ success: true, first_name }, { status: 200 });
  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}