import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { admin_role_id, approver_user_id } = body;

    if (!admin_role_id || !approver_user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1. Confirm the approver is super_admin
    const { data: approverRole } = await supabaseAdmin
      .from("admin_roles")
      .select("role")
      .eq("user_id", approver_user_id)
      .single() as { data: { role: string } | null };

    if (!approverRole || approverRole.role !== "super_admin") {
      return NextResponse.json({ error: "Only Setman can remove team members" }, { status: 403 });
    }

    // 2. Fetch the target record
    const { data: targetRecord, error: fetchError } = await supabaseAdmin
      .from("admin_roles")
      .select("*")
      .eq("id", admin_role_id)
      .single() as { data: { id: string; user_id: string | null; email: string } | null; error: any };

    if (fetchError || !targetRecord) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    // 3. Prevent removing yourself through this route
    if (targetRecord.user_id === approver_user_id) {
      return NextResponse.json({ error: "You can't remove your own access" }, { status: 400 });
    }

    // 4. Delete the Supabase Auth user entirely (if one was ever created)
    if (targetRecord.user_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetRecord.user_id);
      if (authDeleteError) {
        console.error("[REMOVE ADMIN] Auth delete failed:", authDeleteError);
        return NextResponse.json({ error: "Failed to delete login: " + authDeleteError.message }, { status: 500 });
      }
    }

    // 5. Delete the admin_roles record
    const { error: roleDeleteError } = await supabaseAdmin
      .from("admin_roles")
      .delete()
      .eq("id", admin_role_id);

    if (roleDeleteError) {
      console.error("[REMOVE ADMIN] Role record delete failed:", roleDeleteError);
      return NextResponse.json({ error: "Login deleted but failed to remove role record: " + roleDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, removed_email: targetRecord.email });

  } catch (err) {
    console.error("[REMOVE ADMIN ERROR]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}