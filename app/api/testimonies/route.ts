import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'spotlight:testimony',
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)
  if (!success) return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const testimony = typeof body.testimony === 'string' ? body.testimony.trim() : ''
  if (!name || name.length > 60) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  if (testimony.length < 20 || testimony.length > 1500) {
    return NextResponse.json({ error: 'Your testimony must be between 20 and 1500 characters.' }, { status: 400 })
  }

  const { error } = await getSupabaseAdminClient()
    .from('testimonies')
    .insert([{ name, testimony, is_visible: false }] as any)

  if (error) {
    console.error('[TESTIMONY DB ERROR]', error.message)
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}