// app/api/cron/weekly-summary/route.ts
// Runs every Monday at 8:00 AM via Vercel Cron.
// Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/weekly-summary",
//     "schedule": "0 8 * * 1"
//   }]
// }

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  // Protect endpoint — only Vercel's cron runner should call this
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdminClient()
  const now      = new Date()
  const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // ── Fetch weekly stats ────────────────────────────────────────
  const { count: totalMembers }    = await supabase.from('members').select('id', { count: 'exact', head: true })
  const { count: newThisWeek }     = await supabase.from('members').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString())
  const { count: newThisMonth }    = await supabase.from('members').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString())
  const { count: newPartners }     = await (supabase.from('partner_submissions') as any).select('id', { count: 'exact', head: true }).eq('status', 'new')
  const { count: totalPartners }   = await supabase.from('partner_submissions').select('id', { count: 'exact', head: true })

  // Latest Sunday attendance
  const { data: latestAttendance } = await supabase
    .from('attendance_records')
    .select('service_date, total_count, male_count, female_count, children_count')
    .order('service_date', { ascending: false })
    .limit(1)
    .single() as { data: { service_date: string; total_count: number; male_count: number; female_count: number; children_count: number } | null }

  // Upcoming events this week
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const { data: upcomingEvents } = await supabase
    .from('church_events')
    .select('title, event_date, event_time, location')
    .gte('event_date', now.toISOString().split('T')[0])
    .lte('event_date', nextWeek.toISOString().split('T')[0])
    .order('event_date', { ascending: true }) as { data: { title: string; event_date: string; event_time: string | null; location: string }[] | null }

  const dateLabel = now.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const attendanceBlock = latestAttendance
    ? `Last Sunday (${new Date(latestAttendance.service_date + 'T00:00:00').toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}):\n  Total: ${latestAttendance.total_count} | Male: ${latestAttendance.male_count} | Female: ${latestAttendance.female_count} | Children: ${latestAttendance.children_count}`
    : 'No attendance recorded yet this week.'

  const eventsBlock = upcomingEvents && upcomingEvents.length > 0
    ? upcomingEvents.map(e => `  • ${e.title} — ${new Date(e.event_date + 'T00:00:00').toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}${e.event_time ? ` at ${e.event_time}` : ''}, ${e.location}`).join('\n')
    : '  No events scheduled this week.'

  const emailBody = `Good morning Setman,

Here is your weekly ministry summary for ${dateLabel}:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CONGREGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Registered Members: ${totalMembers?.toLocaleString() || '—'}
New This Week: ${newThisWeek || 0}
New This Month: ${newThisMonth || 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🙏 SUNDAY ATTENDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${attendanceBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 PARTNERSHIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
New Submissions (unreviewed): ${newPartners || 0}
Total Partners: ${totalPartners || 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 UPCOMING EVENTS THIS WEEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${eventsBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
View full dashboard: https://spotlightglobal.vercel.app/admin/dashboard

Keep shining the light. 🌟

— theSpotlightChurch Admin System`

  // ── Send via Brevo ────────────────────────────────────────────
  if (!process.env.BREVO_API_KEY) {
    console.error('[CRON] BREVO_API_KEY not set')
    return NextResponse.json({ error: 'Brevo not configured' }, { status: 500 })
  }

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'Spotlight Admin', email: 'noreply@thespotlightchurch.com' },
      to: [{ email: 'spotlightchurch@gmail.com', name: 'Apostle Edet Kingsley' }],
      subject: `Weekly Spotlight Summary — ${dateLabel}`,
      textContent: emailBody,
    }),
  })

  if (!brevoRes.ok) {
    const err = await brevoRes.text()
    console.error('[CRON] Brevo send failed:', err)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }

  console.log('[CRON] Weekly summary sent successfully')
  return NextResponse.json({
    success: true,
    stats: { totalMembers, newThisWeek, newThisMonth, newPartners, latestAttendance }
  })
}