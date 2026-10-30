import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

const STATUSES = ['First_Timer', 'Attending', 'Member']

function getStatusListId(status: string): number | null {
  switch (status) {
    case 'First_Timer': return Number(process.env.BREVO_LIST_ID_FIRST_TIMER) || null
    case 'Attending':   return Number(process.env.BREVO_LIST_ID_ATTENDING) || null
    case 'Member':      return Number(process.env.BREVO_LIST_ID_MEMBER) || null
    default:            return null
  }
}

async function isMembersAdmin(req: NextRequest) {
  const header = req.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return false
  const supabase = getSupabaseAdminClient()
  const { data: auth, error } = await supabase.auth.getUser(token)
  if (error || !auth.user) return false
  const { data: role } = await supabase
    .from('admin_roles')
    .select('role, status, permissions')
    .eq('user_id', auth.user.id)
    .single()
  if (!role || role.status !== 'approved') return false
  return role.role === 'super_admin' || (role.permissions ?? []).includes('members')
}

export async function POST(req: NextRequest) {
  if (!(await isMembersAdmin(req))) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { email, guest_status, old_guest_status } = body as Record<string, string>

  if (!email || !guest_status) {
    return NextResponse.json({ error: 'email and guest_status are required.' }, { status: 400 })
  }
  if (!STATUSES.includes(guest_status) || (old_guest_status && !STATUSES.includes(old_guest_status))) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
  }
  if (!process.env.BREVO_API_KEY) {
    console.error('[SYNC-BREVO-STATUS] BREVO_API_KEY not set')
    return NextResponse.json({ error: 'Brevo not configured' }, { status: 500 })
  }

  const newListId = getStatusListId(guest_status)
  const oldListId = old_guest_status ? getStatusListId(old_guest_status) : null

  const payload: Record<string, unknown> = { attributes: { GUEST_STATUS: guest_status } }
  if (newListId) payload.listIds = [newListId]
  if (oldListId && oldListId !== newListId) payload.unlinkListIds = [oldListId]

  try {
    const brevoRes = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email.toLowerCase().trim())}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
        body: JSON.stringify(payload),
      },
    )
    if (!brevoRes.ok && brevoRes.status !== 204) {
      console.error('[SYNC-BREVO-STATUS] Brevo update failed:', brevoRes.status, await brevoRes.text())
      return NextResponse.json({ error: 'Failed to sync to Brevo.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[SYNC-BREVO-STATUS] Error:', err)
    return NextResponse.json({ error: 'Failed to sync to Brevo.' }, { status: 500 })
  }
}