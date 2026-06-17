import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

// Generates a readable temporary password like "Spotlight-7f3k9d"
function generateTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `Spotlight-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { admin_role_id, action, approver_user_id } = body;

    if (!admin_role_id || !action) {
      return NextResponse.json({ error: "Missing admin_role_id or action" }, { status: 400 });
    }
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1. Confirm the approver is actually a super_admin
    if (approver_user_id) {
      const { data: approverRole } = await supabaseAdmin
        .from("admin_roles")
        .select("role")
        .eq("user_id", approver_user_id)
        .single() as { data: { role: string } | null };

      if (!approverRole || approverRole.role !== "super_admin") {
        return NextResponse.json({ error: "Only Setman can approve or reject admin requests" }, { status: 403 });
      }
    }

    // 2. Fetch the pending record
    const { data: pendingRecord, error: fetchError } = await supabaseAdmin
      .from("admin_roles")
      .select("*")
      .eq("id", admin_role_id)
      .single() as { data: { id: string; email: string; full_name: string; role: string; status: string; is_ministry_leader?: boolean; pending_ministry_id?: string } | null; error: any };

    if (fetchError || !pendingRecord) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (pendingRecord.status !== "pending") {
      return NextResponse.json({ error: "This request has already been processed" }, { status: 409 });
    }

    // 3. Reject path — simple, just flip status
    if (action === "reject") {
      const { error: rejectError } = await supabaseAdmin
        .from("admin_roles")
        .update({ status: "rejected" } as any)
        .eq("id", admin_role_id);

      if (rejectError) {
        return NextResponse.json({ error: "Failed to reject request" }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: "rejected" });
    }

    // 4. Approve path — create the actual Supabase Auth user
    const tempPassword = generateTempPassword();

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: pendingRecord.email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError || !newUser?.user) {
      console.error("[APPROVE USER] Auth creation failed:", createError);
      return NextResponse.json(
        { error: createError?.message || "Failed to create login for this admin" },
        { status: 500 }
      );
    }

    // 5. Link the new auth user_id back to the admin_roles row
    const { error: updateError } = await supabaseAdmin
      .from("admin_roles")
      .update({ user_id: newUser.user.id, status: "approved" } as any)
      .eq("id", admin_role_id);

    if (updateError) {
      console.error("[APPROVE USER] Failed to link user_id:", updateError);
      return NextResponse.json({ error: "User created but failed to link role record" }, { status: 500 });
    }

    // 5b. If this was a ministry leader request, link them to their ministry now that we have a real user_id
    const pendingRecordAny = pendingRecord as any;
    if (pendingRecordAny.is_ministry_leader && pendingRecordAny.pending_ministry_id) {
      const { error: linkError } = await supabaseAdmin
        .from("ministry_leaders")
        .insert([{ ministry_id: pendingRecordAny.pending_ministry_id, user_id: newUser.user.id }] as any);
      if (linkError) {
        console.error("[APPROVE USER] Failed to link ministry leader:", linkError);
        // Don't fail the whole approval over this — the role/login still works, just flag it
      }
    }

    // 6. Send credentials via Brevo (best-effort — doesn't block the response)
    if (process.env.BREVO_API_KEY) {
      try {
        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: "theSpotlightChurch Admin", email: "admin@thespotlightchurch.org" },
            to: [{ email: pendingRecord.email, name: pendingRecord.full_name }],
            subject: "Your theSpotlightChurch Admin Access",
            htmlContent: `
              <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f7f9fb;">
                <h2 style="color: #081534;">Welcome to the Admin Portal</h2>
                <p style="color: #45464e; font-size: 15px; line-height: 1.6;">
                  Hi ${pendingRecord.full_name}, you've been granted ${pendingRecord.role === "super_admin" ? "Setman" : "Admin"} access to theSpotlightChurch portal.
                </p>
                <div style="background: #fff; border: 1px solid #c6c6cf; border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 8px; color: #45464e; font-size: 13px; font-weight: 600;">EMAIL</p>
                  <p style="margin: 0 0 16px; color: #081534; font-size: 15px; font-weight: 700;">${pendingRecord.email}</p>
                  <p style="margin: 0 0 8px; color: #45464e; font-size: 13px; font-weight: 600;">TEMPORARY PASSWORD</p>
                  <p style="margin: 0; color: #081534; font-size: 15px; font-weight: 700;">${tempPassword}</p>
                </div>
                <p style="color: #45464e; font-size: 13px;">
                  Please log in and change your password immediately from Settings → My Account.
                </p>
              </div>
            `,
          }),
        });
        if (!brevoRes.ok) {
          console.error("[APPROVE USER] Brevo email failed:", await brevoRes.text());
        }
      } catch (emailErr) {
        console.error("[APPROVE USER] Brevo send error:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      action: "approved",
      temp_password: tempPassword,
      email: pendingRecord.email,
    });

  } catch (err) {
    console.error("[APPROVE USER ERROR]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}