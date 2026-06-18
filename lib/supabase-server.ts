import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseAdmin: SupabaseClient<any, any, any> | null = null

export function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Missing Supabase server environment variables')
    }

    supabaseAdmin = createClient<any, any, any>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdmin
}