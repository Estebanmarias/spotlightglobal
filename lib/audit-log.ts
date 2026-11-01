import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminIdentity } from "@/lib/admin-auth";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function recordAuditLog(
  supabase: SupabaseClient,
  actor: AdminIdentity,
  input: AuditInput,
) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: actor.userId,
    actor_name: actor.fullName,
    actor_email: actor.email,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("[AUDIT LOG] write failed:", error.message);
  }
}
