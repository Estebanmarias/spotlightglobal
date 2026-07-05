import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'
import { readFileSync } from 'fs'
import path from 'path'

// Maps audience selection to the Brevo List ID that should receive it.
// 'all' uses your main Spotlight Members list; the others use the
// dedicated per-status lists (see setup note — these must be created
// in Brevo first, since segments no longer auto-update reliably).
function getListId(audience: string): number | null {
  switch (audience) {
    case 'all':
      return Number(process.env.BREVO_LIST_ID)
    case 'First_Timer':
      return Number(process.env.BREVO_LIST_ID_FIRST_TIMER)
    case 'Attending':
      return Number(process.env.BREVO_LIST_ID_ATTENDING)
    case 'Member':
      return Number(process.env.BREVO_LIST_ID_MEMBER)
    default:
      return null
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const {
    subject,
    preview_text,
    body_text,
    audience,
    scheduled_for, // ISO string or null/undefined for immediate send
    sent_by,       // admin user id, passed from the client's session
  } = body as Record<string, string>

  if (!subject || !body_text || !audience) {
    return NextResponse.json({ error: 'Subject, message body, and audience are required.' }, { status: 400 })
  }

  const listId = getListId(audience)
  if (!listId || isNaN(listId)) {
    return NextResponse.json(
      { error: `No Brevo list configured for audience "${audience}". Check your env vars.` },
      { status: 500 }
    )
  }

  if (!process.env.BREVO_API_KEY) {
    return NextResponse.json({ error: 'Brevo not configured.' }, { status: 500 })
  }

  const supabase = getSupabaseAdminClient()

  // Build the branded HTML by injecting the admin's message into the template
  let template: string
  try {
    const templatePath = path.join(process.cwd(), 'lib', 'broadcast-template.html')
    template = readFileSync(templatePath, 'utf-8')
  } catch (err) {
    console.error('[BROADCAST] Could not read template:', err)
    return NextResponse.json({ error: 'Broadcast template not found on server.' }, { status: 500 })
  }

  // Convert plain-text paragraphs (split on blank lines) into <p> tags
  const bodyHtml = body_text
    .split(/\n\s*\n/)
    .map(para => `<p>${para.trim().replace(/\n/g, '<br/>')}</p>`)
    .join('\n')

  const finalHtml = template
    .replace('{{SUBJECT}}', subject)
    .replace('{{BROADCAST_BODY}}', bodyHtml)

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'spotlightchurch@gmail.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'theSpotlightChurch'

  try {
    // 1. Create the campaign (draft by default, or scheduled if scheduledAt provided)
    const campaignPayload: Record<string, unknown> = {
      name: `Broadcast — ${subject} — ${new Date().toISOString()}`,
      subject,
      sender: { name: senderName, email: senderEmail },
      type: 'classic',
      htmlContent: finalHtml,
      recipients: { listIds: [listId] },
    }
    if (preview_text) campaignPayload.previewText = preview_text
    if (scheduled_for) campaignPayload.scheduledAt = scheduled_for

    const createRes = await fetch('https://api.brevo.com/v3/emailCampaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(campaignPayload),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('[BROADCAST] Campaign create failed:', createRes.status, errText)
      return NextResponse.json({
        error: `Brevo error (${createRes.status}): ${errText}`,
        debugSenderUsed: { senderEmail, senderName }, // TEMP — remove once fixed
      }, { status: 500 })
    }

    const created = await createRes.json()
    const campaignId = created.id

    // 2. If no schedule was given, send immediately
    if (!scheduled_for) {
      const sendRes = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY },
      })
      if (!sendRes.ok) {
        const errText = await sendRes.text()
        console.error('[BROADCAST] sendNow failed:', sendRes.status, errText)
        return NextResponse.json({ error: 'Campaign created but failed to send.' }, { status: 500 })
      }
    }

    // 3. Log it in Supabase
    await supabase.from('broadcast_messages').insert([{
      subject,
      preview_text: preview_text || null,
      body_text,
      audience,
      scheduled_for: scheduled_for || null,
      status: scheduled_for ? 'scheduled' : 'sent',
      brevo_campaign_id: String(campaignId),
      sent_by: sent_by || null,
    }] as any)

    return NextResponse.json({ success: true, campaignId, status: scheduled_for ? 'scheduled' : 'sent' })
  } catch (err) {
    console.error('[BROADCAST] Error:', err)
    return NextResponse.json({ error: 'Failed to send broadcast.' }, { status: 500 })
  }
}