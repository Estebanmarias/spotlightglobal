import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      dob, 
      guest_status = "First_Timer"
    } = body;

    // 1. Validation
    if (!first_name || !last_name || !email || !phone || !dob) {
      return NextResponse.json(
        { error: "First name, last name, email, phone and DOB are required" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 2. Insert into Supabase (Only existing columns)
    const supabaseAdmin = getSupabaseAdminClient();
    const { data: member, error: dbError } = await supabaseAdmin
      .from("members")
      .insert([{
        first_name,
        last_name,
        email: email.toLowerCase().trim(),
        phone,
        dob,
        guest_status,
      }])
      .select()
      .single();

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

    // 3. Push to Brevo
    if (process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) {
      const listId = parseInt(process.env.BREVO_LIST_ID, 10);

      if (isNaN(listId) || listId <= 0) {
        console.error("[BREVO] Invalid BREVO_LIST_ID:", process.env.BREVO_LIST_ID);
      } else {
        try {
          const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": process.env.BREVO_API_KEY,
            },
            body: JSON.stringify({
              email: email.toLowerCase().trim(),
              attributes: {
                FIRSTNAME: first_name,
                LASTNAME: last_name,
                PHONE: phone,
                DOB: dob,
                GUEST_STATUS: guest_status,
              },
              listIds: [listId],
              updateEnabled: true,
            }),
          });

          if (brevoRes.ok) {
            console.log(`✅ Brevo: Contact successfully added/updated → ${email}`);
          } else {
            const errorText = await brevoRes.text();
            console.error(`❌ Brevo Error ${brevoRes.status}:`, errorText);
          }
        } catch (brevoErr) {
          console.error("[BREVO] API call failed:", brevoErr);
        }
      }
    } else {
      console.warn("[BREVO] BREVO_API_KEY or BREVO_LIST_ID is missing in environment variables");
    }

    return NextResponse.json({ 
      success: true, 
      first_name,
      memberId: member?.id 
    });

  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}