import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { email, guest_status } = body as Record<string, string>

  if (!email || !guest_status) {
    return NextResponse.json({ error: 'email and guest_status are required.' }, { status: 400 })
  }

  if (!process.env.BREVO_API_KEY) {
    console.error('[SYNC-BREVO-STATUS] BREVO_API_KEY not set')
    return NextResponse.json({ error: 'Brevo not configured' }, { status: 500 })
  }

  try {
    // Brevo identifies existing contacts by their current email for this endpoint.
    const brevoRes = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email.toLowerCase().trim())}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          attributes: { GUEST_STATUS: guest_status },
        }),
      }
    )

    // Brevo returns 204 No Content on a successful update
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