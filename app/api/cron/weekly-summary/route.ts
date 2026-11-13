import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'
import { SITE_CONFIG } from '@/lib/site-config'
import { renderEventEmail, sendBrevoEmail } from '@/lib/media-event-auth'

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://spotlightglobal.vercel.app').replace(/\/$/, '')

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.BREVO_API_KEY) return NextResponse.json({ error: 'Brevo not configured' }, { status: 500 })

  const db = getSupabaseAdminClient() as any
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString()
  const today = now.toISOString().split('T')[0]
  const nextWeek = new Date(now.getTime() + 7 * 86_400_000).toISOString().split('T')[0]
  const head = (table: string) => db.from(table).select('id', { count: 'exact', head: true })

  const [total, week, month, partnersNew, prayerNew, givingNew, testimoniesPending, attendance, events] = await Promise.all([
    head('members'),
    head('members').gte('created_at', weekAgo),
    head('members').gte('created_at', monthAgo),
    head('partner_submissions').eq('status', 'new'),
    head('prayer_requests').eq('status', 'new'),
    head('giving_confirmations').eq('status', 'new'),
    head('testimonies').eq('is_visible', false),
    db.from('attendance_records').select('service_date, total_count, male_count, female_count, children_count').order('service_date', { ascending: false }).limit(1).maybeSingle(),
    db.from('church_events').select('title, event_date, event_time, location').gte('event_date', today).lte('event_date', nextWeek).order('event_date', { ascending: true }),
  ])

  const n = (r: { count: number | null }) => r.count ?? 0
  const day = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', opts)
  const dateLabel = now.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const waiting = [
    [n(prayerNew), 'new prayer request'],
    [n(givingNew), 'giver confirmation'],
    [n(testimoniesPending), 'testimony awaiting approval'],
    [n(partnersNew), 'partner submission'],
  ].filter(([c]) => (c as number) > 0).map(([c, l]) => `${c} ${l}${c === 1 ? '' : 's'}`)

  const a = attendance.data
  const details = [
    { label: 'Total members', value: n(total).toLocaleString() },
    { label: 'New this week', value: String(n(week)) },
    { label: 'New this month', value: String(n(month)) },
    { label: 'Last service', value: a ? `${day(a.service_date, { day: 'numeric', month: 'short' })}: ${a.total_count} total (${a.male_count} men, ${a.female_count} women, ${a.children_count} children)` : 'No attendance recorded yet' },
    ...((events.data ?? []) as any[]).map(e => ({
      label: e.title,
      value: `${day(e.event_date, { weekday: 'short', day: 'numeric', month: 'short' })}${e.event_time ? `, ${e.event_time}` : ''}, ${e.location}`,
    })),
  ]
  if (!(events.data ?? []).length) details.push({ label: 'Events this week', value: 'None scheduled' })

  const message = await sendBrevoEmail({
    to: [{ email: SITE_CONFIG.email, name: 'Apostle Edet Kingsley' }],
    subject: `Weekly Spotlight Summary: ${dateLabel}`,
    htmlContent: renderEventEmail({
      preheader: waiting.length ? `Waiting for you: ${waiting.join(', ')}.` : 'Your weekly ministry summary.',
      eyebrow: 'WEEKLY SUMMARY',
      title: 'Your week at a glance',
      greeting: 'Good morning Setman,',
      paragraphs: [
        waiting.length ? `Waiting for you in the admin portal: ${waiting.join(', ')}.` : 'Nothing is waiting for review. All clear.',
        `Here is the summary for ${dateLabel}.`,
      ],
      details,
      action: { label: 'Open the dashboard', url: `${SITE}/admin/dashboard` },
    }),
  })

  if (!message.sent) {
    console.error('[CRON] Weekly summary send failed:', message.error)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}