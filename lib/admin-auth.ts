import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export type AdminIdentity = { userId: string; email: string; fullName: string; isSuperAdmin: boolean };

export async function authorizeAdminPage(request: NextRequest, page: string): Promise<AdminIdentity | null> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  const supabase = getSupabaseAdminClient();
  const { data: auth, error } = await supabase.auth.getUser(token);
  if (error || !auth.user) return null;

  const { data: role } = (await supabase
    .from("admin_roles")
    .select("role, status, full_name, email, permissions")
    .eq("user_id", auth.user.id)
    .single()) as {
    data: { role: string; status: string; full_name: string; email: string; permissions: string[] | null } | null;
  };
  if (!role || role.status !== "approved") return null;

  const isSuperAdmin = role.role === "super_admin";
  if (!isSuperAdmin && !(role.permissions ?? []).includes(page)) return null;
  return { userId: auth.user.id, email: role.email, fullName: role.full_name, isSuperAdmin };
}