import { NextRequest, NextResponse } from 'next/server'

function getStatusListId(status: string): number | null {
  switch (status) {
    case 'First_Timer': return Number(process.env.BREVO_LIST_ID_FIRST_TIMER) || null
    case 'Attending':   return Number(process.env.BREVO_LIST_ID_ATTENDING) || null
    case 'Member':      return Number(process.env.BREVO_LIST_ID_MEMBER) || null
    default:            return null
  }
}

export async function POST(req: NextRequest) {
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

  if (!process.env.BREVO_API_KEY) {
    console.error('[SYNC-BREVO-STATUS] BREVO_API_KEY not set')
    return NextResponse.json({ error: 'Brevo not configured' }, { status: 500 })
  }

  const newListId = getStatusListId(guest_status)
  const oldListId = old_guest_status ? getStatusListId(old_guest_status) : null

  const payload: Record<string, unknown> = {
    attributes: { GUEST_STATUS: guest_status },
  }
  // Move to the new status list, and remove from the old one if it's different
  if (newListId) payload.listIds = [newListId]
  if (oldListId && oldListId !== newListId) payload.unlinkListIds = [oldListId]

  try {
    const brevoRes = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email.toLowerCase().trim())}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    )

    if (!brevoRes.ok && brevoRes.status !== 204) {
      const errText = await brevoRes.text()
      console.error('[SYNC-BREVO-STATUS] Brevo update failed:', brevoRes.status, errText)
      return NextResponse.json({ error: 'Failed to sync to Brevo.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[SYNC-BREVO-STATUS] Error:', err)
    return NextResponse.json({ error: 'Failed to sync to Brevo.' }, { status: 500 })
  }
}