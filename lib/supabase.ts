import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient<any, any, any> | null = null

export function getSupabaseClient() {
  if (!client) {
    client = createClient<any, any, any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

export const supabase = getSupabaseClient()