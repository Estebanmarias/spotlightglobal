import { createClient as createServerClient } from "@supabase/supabase-js";

let supabaseAdmin: ReturnType<typeof createServerClient> | null = null;

export function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Missing Supabase server environment variables");
    }

    supabaseAdmin = createServerClient(url, key);
  }
  return supabaseAdmin;
}
