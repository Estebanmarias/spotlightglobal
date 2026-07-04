import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { first_name, last_name, email, phone, message, interest } = body as Record<string, string>

  if (!first_name || !email || !message) {
    return NextResponse.json({ error: 'Please fill in your name, email, and message.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  if (!process.env.BREVO_API_KEY) {
    console.error('[CONTACT] BREVO_API_KEY not set')
    return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 })
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'spotlightchurch@gmail.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'theSpotlightChurch Website'

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: 'spotlightchurch@gmail.com', name: 'theSpotlightChurch' }],
        replyTo: { email, name: `${first_name} ${last_name || ''}`.trim() },
        subject: `Contact Form: ${interest || 'General Inquiry'} — ${first_name} ${last_name || ''}`.trim(),
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <div style="background:#081534;padding:24px 32px;border-radius:12px 12px 0 0;">
              <h2 style="color:#fdc425;margin:0;font-size:18px;">New Contact Message</h2>
              <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px;">${interest || 'General Inquiry'}</p>
            </div>
            <div style="background:#fff;padding:24px 32px;border:1px solid #eceef0;border-top:none;border-radius:0 0 12px 12px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#76777f;font-size:13px;width:120px;">Name</td><td style="color:#081534;font-weight:600;">${first_name} ${last_name || ''}</td></tr>
                <tr><td style="padding:8px 0;color:#76777f;font-size:13px;">Email</td><td style="color:#081534;"><a href="mailto:${email}" style="color:#081534;">${email}</a></td></tr>
                ${phone ? `<tr><td style="padding:8px 0;color:#76777f;font-size:13px;">Phone</td><td style="color:#081534;">${phone}</td></tr>` : ''}
              </table>
              <div style="margin-top:16px;padding:16px;background:#f7f9fb;border-radius:8px;border-left:3px solid #fdc425;">
                <p style="margin:0;color:#45464e;font-size:14px;line-height:1.7;">${message}</p>
              </div>
            </div>
          </div>
        `,
      }),
    })

    if (!brevoRes.ok) {
      const errText = await brevoRes.text()
      console.error('[CONTACT] Brevo send failed:', brevoRes.status, errText)
      return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[CONTACT] Error:', err)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}