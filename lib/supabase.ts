import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'   // ← Make sure this path is correct

// Public client (for client-side)
let client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!client) {
    client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

export const supabase = getSupabaseClient()

// Admin client (for server-side / API routes)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)