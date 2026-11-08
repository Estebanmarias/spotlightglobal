import type { SupabaseClient } from "@supabase/supabase-js";

// Runs on the 1st of each month. Counts only, unless RETENTION_APPLY=true is set in the environment.
export async function runRetentionIfDue(supabase: SupabaseClient<any, any, any>) {
  if (new Date().getUTCDate() !== 1) return { ran: false as const };

  const apply = process.env.RETENTION_APPLY === "true";
  try {
    const { data, error } = await supabase.rpc("run_retention", { p_apply: apply });
    if (error) throw error;
    await supabase.from("audit_logs").insert({
      action: apply ? "retention.applied" : "retention.dry_run",
      entity_type: "system",
      metadata: data,
    });
    return { ran: true as const, apply, result: data };
  } catch (error) {
    console.error("[RETENTION] run failed:", error);
    return { ran: false as const, error: "failed" };
  }
}