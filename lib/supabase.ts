import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient<any, any> | null = null

// IMPORTANT: createBrowserClient (from @supabase/ssr) stores the session
// as cookies instead of localStorage. This is required for middleware.ts
// to be able to see the session at all — the previous createClient()
// from @supabase/supabase-js stored sessions in localStorage only, which
// middleware running on the Edge runtime can never read. That mismatch
// was the root cause of login appearing to "succeed" in the browser while
// every protected route redirect kept failing.
export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient<any, any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

export const supabase = getSupabaseClient()