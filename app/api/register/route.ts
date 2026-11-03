import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'
import { validateMemberDateOfBirth } from '@/lib/age-validation'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { pushMemberToBrevo } from '@/lib/brevo-contact'

// ── Rate limiter — 5 submissions per IP per hour ──────────────────
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix: 'spotlight:register',
})



export async function POST(req: NextRequest) {
  // ── 1. Rate limit check ─────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? '127.0.0.1'

  const { success, limit, remaining, reset } = await ratelimit.limit(ip)

  if (!success) {
    const resetDate = new Date(reset)
    const minutesLeft = Math.ceil((resetDate.getTime() - Date.now()) / 60000)
    return NextResponse.json(
      { error: `Too many submissions. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.` },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': (minutesLeft * 60).toString(),
        },
      }
    )
  }

  // ── 2. Parse body ────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { first_name, last_name, email, phone, address, dob } = body as Record<string, string>

  // ── 3. Input validation ──────────────────────────────────────────
  if (!first_name || !last_name || !email || !phone || !dob) {
    return NextResponse.json({ error: 'All required fields must be filled in.' }, { status: 400 })
  }

  if (typeof first_name !== 'string' || first_name.trim().length < 1 || first_name.trim().length > 50) {
    return NextResponse.json({ error: 'Invalid first name.' }, { status: 400 })
  }

  if (typeof last_name !== 'string' || last_name.trim().length < 1 || last_name.trim().length > 50) {
    return NextResponse.json({ error: 'Invalid last name.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  if (email.length > 254) {
    return NextResponse.json({ error: 'Email address too long.' }, { status: 400 })
  }

  if (!/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 })
  }

  if (address && address.length > 200) {
    return NextResponse.json({ error: 'Address is too long.' }, { status: 400 })
  }

  // Validate DOB
  const dobError = validateMemberDateOfBirth(dob)
  if (dobError) return NextResponse.json({ error: dobError }, { status: 400 })

    // Everyone who registers starts as Attending. The status only becomes
  // Member when they complete Membership Class, so it is never read from
  // the request body.
  const resolvedStatus = 'Attending'

  // ── 4. Insert into Supabase ───────────────────────────────────────
  const { data: member, error: dbError } = await getSupabaseAdminClient()
    .from('members')
    .insert([{
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address?.trim() || null,
      dob,
      guest_status: resolvedStatus,
    }] as any)
    .select()
    .single()

  if (dbError) {
    if (dbError.code === '23505') {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
    }
    console.error('[REGISTER DB ERROR]', dbError.message)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }

  
  return NextResponse.json({ success: true, first_name: first_name.trim(), memberId: member?.id }, { status: 200 })
}