import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

// Public, unauthenticated endpoint — but only ever returns counts, never
// actual member records, so it doesn't need to bypass RLS in a risky way.
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()

    const { count: memberCount } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true })

    const { count: ministryCount } = await supabase
      .from('ministries')
      .select('id', { count: 'exact', head: true })

    return NextResponse.json({
      memberCount: memberCount || 0,
      ministryCount: ministryCount || 0,
    })
  } catch (err) {
    console.error('[PUBLIC STATS] Error:', err)
    return NextResponse.json({ memberCount: 0, ministryCount: 0 }, { status: 500 })
  }
}