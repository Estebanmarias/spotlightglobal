'use client'

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import Icon from '@/components/Icon'
import { verseFor } from '@/lib/class-verses'

export type PublicProgram = {
  id: string; slug: string; name: string; summary: string; perks: string[]
  prerequisiteName: string | null; requiresApproval: boolean
}
export type PublicIntake = {
  id: string; program_id: string; title: string; start_date: string; end_date: string
  price: number; currency: string; spotsLeft: number | null; open: boolean
}

type Result = {
  approvalStatus: string; paymentStatus: string; amountDue: number; currency: string
  className: string; paymentInstructions: string | null
}
type Blocked = 'not_member' | 'prerequisite_missing'

const ICONS: Record<string, string> = { 'membership-class': 'groups', sslc: 'school', 'school-of-shift': 'bolt' }

const fmt = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

const money = (currency: string, n: number) =>
  n > 0 ? `${currency === 'NGN' ? '₦' : `${currency} `}${n.toLocaleString('en-NG')}` : 'Free'

// Orders programs by their prerequisite chain so the page reads as a journey
function orderPrograms(list: PublicProgram[]): PublicProgram[] {
  const names = new Set(list.map(p => p.name))
  const placed = new Set<string>()
  const out: PublicProgram[] = []
  const visit = (p: PublicProgram) => {
    if (placed.has(p.id)) return
    placed.add(p.id)
    out.push(p)
    list.filter(c => c.prerequisiteName === p.name).forEach(visit)
  }
  list.filter(p => !p.prerequisiteName || !names.has(p.prerequisiteName)).forEach(visit)
  list.forEach(visit)
  return out
}

function statusOf(i: PublicIntake) {
  if (!i.open) {
    return i.spotsLeft === 0
      ? { label: 'Full', cls: 'bg-[#ffefed] text-[#8f1717]' }
      : { label: 'Closed', cls: 'bg-[#eceef0] text-[#45464e]' }
  }
  if (i.spotsLeft !== null && i.spotsLeft > 0 && i.spotsLeft <= 10) {
    return { label: `${i.spotsLeft} spot${i.spotsLeft === 1 ? '' : 's'} left`, cls: 'bg-[#fff4d6] text-[#785a00]' }
  }
  return { label: 'Open', cls: 'bg-green-100 text-green-800' }
}

const HOW_IT_WORKS = [
  { icon: 'how_to_reg', title: 'Register', body: 'Fill in a short form using the same email you joined the church with.' },
  { icon: 'verified',   title: 'Get confirmed', body: 'Some classes need a quick review or payment. You’ll see what to do right after registering.' },
  { icon: 'school',     title: 'Begin', body: 'The church team reaches out with the remaining details before your class starts.' },
]

const FAQS = [
  { q: 'Which email should I use?', a: 'Use the same email you joined theSpotlightChurch with. We match it to your record to confirm eligibility for classes that follow an earlier one.' },
  { q: 'Do I have to pay?', a: 'Each cohort shows its fee, or “Free”. If there’s a fee, payment instructions appear as soon as you register.' },
  { q: 'What if my place isn’t approved?', a: 'Some classes review applications before confirming. If your place isn’t approved, you will be refunded.' },
  { q: 'Who do I contact with questions?', a: 'Reach the church team through the contact page and we’ll be glad to help.' },
]

const inputCls =
  'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] focus:ring-2 focus:ring-[#081534]/10 outline-none px-4 py-3 rounded-t-lg text-[15px] text-[#191c1e] transition-colors'
const labelCls = 'block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5'
const primaryBtn =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#081534] px-6 text-[13px] font-bold text-white transition hover:bg-[#17305f] focus-visible:ring-2 focus-visible:ring-[#fdc425]'
const ghostBtn =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#c6c6cf] px-6 text-[13px] font-bold text-[#45464e] transition hover:bg-[#f2f4f6] focus-visible:ring-2 focus-visible:ring-[#081534]/30'

export default function ClassesClient({ programs, intakes }: { programs: PublicProgram[]; intakes: PublicIntake[] }) {
  const [target, setTarget] = useState<{ intake: PublicIntake; program: PublicProgram } | null>(null)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', website: '', privacy: false })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [blocked, setBlocked] = useState<Blocked | null>(null)

  const ordered = orderPrograms(programs)
  const nextIntake = [...intakes].filter(i => i.open).sort((a, b) => a.start_date.localeCompare(b.start_date))[0]

  const open = (intake: PublicIntake, program: PublicProgram) => {
    setTarget({ intake, program }); setResult(null); setBlocked(null); setError(''); setStatus('idle')
  }
  const close = () => { if (status !== 'submitting') setTarget(null) }

  // Escape closes the dialog; background scroll is locked while it's open
  useEffect(() => {
    if (!target) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'submitting') setTarget(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [target, status])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!target) return
    setStatus('submitting'); setError('')
    try {
      const res = await fetch('/api/classes/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId: target.intake.id, fullName: form.fullName, email: form.email,
          phone: form.phone, privacyAccepted: form.privacy, website: form.website,
        }),
      })
      const data = await res.json()
      if (res.status === 422 && (data.code === 'not_member' || data.code === 'prerequisite_missing')) {
        setBlocked(data.code); setStatus('idle'); return
      }
      if (!res.ok) throw new Error(data.error || 'Registration could not be completed.')
      setResult(data)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration could not be completed. Please try again.')
      setStatus('error')
    }
  }

  const verse = verseFor(target?.program.slug)
  const prereq = target?.program.prerequisiteName ?? 'the earlier class'
  const title = blocked
    ? 'We can’t register you yet'
    : result
      ? result.approvalStatus === 'pending' ? 'Application received' : 'You’re registered'
      : 'Register'

  return (
    <MotionConfig reducedMotion="user">
      <main className="bg-[#f7f9fb] text-[#191c1e]">

        {/* ── HERO ───────────────────────────────────────────── */}
        <header className="relative overflow-hidden bg-[#081534] px-5 pb-16 pt-20 text-white sm:px-8 sm:pb-24 sm:pt-28">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#fdc425]/15 blur-[100px]" />
            <div className="absolute -bottom-40 -left-24 h-[380px] w-[380px] rounded-full bg-[#1e2a4a]/70 blur-[90px]" />
            <div className="absolute right-[8%] top-[18%] h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute right-[14%] top-[30%] h-24 w-24 rounded-full border border-[#fdc425]/30" />
          </div>

          <div className="relative mx-auto max-w-7xl">
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdc425]">
              Classes
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="mt-3 max-w-3xl text-[40px] font-bold leading-[1.05] sm:text-[60px]">
              Find your <span className="text-[#fdc425]">next step</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              className="mt-5 max-w-2xl text-[15px] leading-7 text-white/75 sm:text-[17px]">
              From joining the family to leading it, there is a class for where you are right now.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#path"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#fdc425] px-8 text-[14px] font-bold text-[#6d5200] transition hover:brightness-110 active:scale-95">
                See the path <Icon name="arrow_forward" className="text-[18px]" />
              </a>
              <a href="#faq"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-8 text-[14px] font-bold text-white transition hover:bg-white/10 active:scale-95">
                Common questions
              </a>
            </motion.div>

            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-2.5 text-[12px] font-semibold">
              {ordered.length > 0 && (
                <li className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur">
                  <Icon name="school" className="text-[16px] text-[#fdc425]" />{ordered.length} class{ordered.length === 1 ? '' : 'es'}
                </li>
              )}
              {nextIntake && (
                <li className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur">
                  <Icon name="event" className="text-[16px] text-[#fdc425]" />Next cohort · {fmt(nextIntake.start_date)}
                </li>
              )}
              <li className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur">
                <Icon name="schedule" className="text-[16px] text-[#fdc425]" />Register online in minutes
              </li>
            </motion.ul>
          </div>
        </header>

        {/* ── THE PATH ───────────────────────────────────────── */}
        <section id="path" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#785a00]">Your path</p>
            <h2 className="mt-2 text-[28px] font-bold leading-tight text-[#081534] sm:text-[36px]">Each class builds on the last</h2>
            <p className="mt-3 text-[15px] leading-7 text-[#45464e]">
              Start where you are. When you finish one class, the next one opens up for you.
            </p>
          </div>

          {ordered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#c6c6cf] bg-white px-6 py-16 text-center text-[14px] text-[#76777f]">
              Classes are being set up. Please check back soon.
            </p>
          ) : (
            <div className="grid gap-y-5 pt-3 lg:grid-cols-3 lg:gap-x-8">
              {ordered.map((p, idx) => {
                const list = intakes.filter(i => i.program_id === p.id).slice(0, 3)
                const isLast = idx === ordered.length - 1
                return (
                  <Fragment key={p.id}>
                    <motion.article
                      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                      className="relative flex flex-col rounded-3xl border border-[#d9dbe0] bg-white p-6 pt-9 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:p-8 sm:pt-10">

                      <span className="absolute -top-3.5 left-6 inline-flex items-center rounded-full bg-[#fdc425] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#6d5200] shadow sm:left-8">
                        Step {idx + 1}
                      </span>
                      {!isLast && (
                        <span aria-hidden
                          className="absolute left-full top-24 ml-4 hidden h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-[#d9dbe0] bg-white text-[#785a00] shadow-sm lg:flex">
                          <Icon name="arrow_forward" className="text-[16px]" />
                        </span>
                      )}

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#081534] text-[#fdc425]">
                        <Icon name={ICONS[p.slug] ?? 'church'} className="text-[26px]" />
                      </div>
                      <h3 className="mt-5 text-[22px] font-bold leading-snug text-[#081534]">{p.name}</h3>
                      <p className="mt-2 text-[14px] leading-6 text-[#45464e]">{p.summary}</p>

                      {(p.prerequisiteName || p.requiresApproval) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {p.prerequisiteName && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f4f6] px-3 py-1.5 text-[11.5px] font-semibold text-[#45464e]">
                              <Icon name="lock" className="text-[14px] text-[#785a00]" />Requires {p.prerequisiteName}
                            </span>
                          )}
                          {p.requiresApproval && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f4f6] px-3 py-1.5 text-[11.5px] font-semibold text-[#45464e]">
                              <Icon name="verified" className="text-[14px] text-[#785a00]" />Reviewed before confirmation
                            </span>
                          )}
                        </div>
                      )}

                      <ul className="mt-5 space-y-2.5">
                        {p.perks.map(perk => (
                          <li key={perk} className="flex items-start gap-2.5 text-[13px] leading-5 text-[#191c1e]">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fdc425]/25">
                              <Icon name="check" className="text-[13px] text-[#785a00]" />
                            </span>
                            {perk}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-8">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#76777f]">Upcoming cohorts</p>
                        {list.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-[#c6c6cf] px-4 py-4 text-center text-[13px] text-[#76777f]">
                            Next cohort to be announced.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {list.map(i => {
                              const st = statusOf(i)
                              const isNext = nextIntake?.id === i.id
                              return (
                                <div key={i.id}
                                  className={`rounded-2xl border p-4 transition ${isNext ? 'border-[#fdc425] bg-[#fffaf0]' : 'border-[#e2e2e9]'}`}>
                                  {isNext && (
                                    <span className="mb-2 inline-block rounded-full bg-[#fdc425] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#6d5200]">
                                      Next up
                                    </span>
                                  )}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-[14px] font-bold leading-snug text-[#081534]">{i.title}</p>
                                      <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#45464e]">
                                        <Icon name="event" className="text-[14px] text-[#785a00]" />
                                        {fmt(i.start_date)} – {fmt(i.end_date)}
                                      </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-[#081534] px-3 py-1 text-[12px] font-bold text-white">
                                      {money(i.currency, i.price)}
                                    </span>
                                  </div>
                                  <div className="mt-3 flex items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                                  </div>
                                  <button type="button" disabled={!i.open} onClick={() => open(i, p)}
                                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#081534] px-5 text-[13px] font-bold text-white transition hover:bg-[#17305f] focus-visible:ring-2 focus-visible:ring-[#fdc425] disabled:cursor-not-allowed disabled:bg-[#e2e2e9] disabled:text-[#76777f]">
                                    {i.open ? 'Register' : i.spotsLeft === 0 ? 'Class full' : 'Registration closed'}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </motion.article>

                    {!isLast && (
                      <div aria-hidden className="flex justify-center text-[#785a00] lg:hidden">
                        <Icon name="arrow_downward" className="text-[24px]" />
                      </div>
                    )}
                  </Fragment>
                )
              })}
            </div>
          )}
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────── */}
        <section className="border-y border-[#e2e2e9] bg-white px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl lg:px-4">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#785a00]">How it works</p>
              <h2 className="mt-2 text-[28px] font-bold text-[#081534] sm:text-[34px]">Three simple steps</h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {HOW_IT_WORKS.map((s, i) => (
                <motion.li key={s.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  className="relative rounded-2xl bg-[#f7f9fb] p-6">
                  <span className="absolute right-5 top-4 text-[44px] font-black leading-none text-[#081534]/[0.06]">{i + 1}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fdc425] text-[#6d5200]">
                    <Icon name={s.icon} className="text-[22px]" />
                  </span>
                  <h3 className="mt-4 text-[16px] font-bold text-[#081534]">{s.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-6 text-[#45464e]">{s.body}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────── */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#785a00]">FAQ</p>
          <h2 className="mt-2 text-[28px] font-bold text-[#081534] sm:text-[34px]">Good to know</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map(f => (
              <details key={f.q} className="group rounded-2xl border border-[#e2e2e9] bg-white px-5 py-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-bold text-[#081534] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Icon name="expand_more" className="text-[22px] text-[#785a00] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[14px] leading-6 text-[#45464e]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CLOSING CTA ────────────────────────────────────── */}
        <section className="px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#081534] px-6 py-12 text-center text-white sm:px-12">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#fdc425]/15 blur-[70px]" />
            <h2 className="relative text-[26px] font-bold sm:text-[32px]">Not part of the family yet?</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-[14px] leading-6 text-white/70 sm:text-[15px]">
              Joining takes a minute, and it opens the door to everything we offer.
            </p>
            <div className="relative mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/join"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#fdc425] px-8 text-[14px] font-bold text-[#6d5200] transition hover:brightness-110 active:scale-95">
                Join the church
              </Link>
              <Link href="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-8 text-[14px] font-bold text-white transition hover:bg-white/10 active:scale-95">
                Get in touch
              </Link>
            </div>
          </div>
        </section>

        {/* ── REGISTRATION DIALOG ────────────────────────────── */}
        <AnimatePresence>
          {target && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}
                className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
              <motion.div role="dialog" aria-modal="true" aria-label={`Register for ${target.program.name}`}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
                className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
                <div className="pointer-events-auto max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                  <div className="flex items-start justify-between gap-3 border-b border-[#e2e2e9] px-6 py-5">
                    <div>
                      <h3 className="text-[18px] font-bold text-[#081534]">{title}</h3>
                      <p className="mt-0.5 text-[12px] text-[#76777f]">{target.program.name} · {target.intake.title}</p>
                    </div>
                    <button onClick={close} aria-label="Close"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6]">
                      <Icon name="close" className="text-[20px]" />
                    </button>
                  </div>

                  {blocked ? (
                    <div className="space-y-4 px-6 py-6 text-[14px] leading-6 text-[#45464e]">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fdc425]/25">
                        <Icon name="info" className="text-[26px] text-[#785a00]" />
                      </div>
                      <p className="text-[16px] font-bold text-[#081534]">
                        {blocked === 'not_member' ? 'You’re not a member yet' : `Complete ${prereq} first`}
                      </p>
                      <p>
                        {blocked === 'not_member'
                          ? 'Membership Class is for people who have joined theSpotlightChurch, and we couldn’t find a membership under this email. Join the church first, then come back to register. If you’ve already joined, try the email you used when you registered.'
                          : `${target.program.name} follows ${prereq}, and we couldn’t find a completed ${prereq} under this email. Complete that class first, then register here. If you’ve already completed it, try the email you used for it.`}
                      </p>
                      <div className="flex flex-col gap-2 pt-1">
                        {blocked === 'not_member' && <Link href="/join" className={primaryBtn}>Join the church</Link>}
                        <button onClick={() => setBlocked(null)} className={blocked === 'not_member' ? ghostBtn : primaryBtn}>Try another email</button>
                        <button onClick={close} className={ghostBtn}>Close</button>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="space-y-4 px-6 py-6 text-[14px] leading-6 text-[#45464e]">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <Icon name="check_circle" className="text-[26px] text-green-700" />
                      </div>
                      <p>
                        {result.approvalStatus === 'pending'
                          ? 'Thank you for applying. Our team will review your application and get back to you.'
                          : 'Welcome to the class. The church team will reach out with the remaining details.'}
                      </p>

                      <div className="rounded-xl bg-[#f7f9fb] p-4 text-[13px]">
                        <p className="font-bold text-[#081534]">{result.className || target.program.name}</p>
                        <p className="mt-1 flex items-center gap-1.5">
                          <Icon name="event" className="text-[15px] text-[#785a00]" />
                          {fmt(target.intake.start_date)} – {fmt(target.intake.end_date)}
                        </p>
                      </div>

                      {result.paymentStatus === 'pending' && (
                        <div className="rounded-xl border-l-2 border-[#fdc425] bg-[#fff9e8] p-4">
                          <p className="font-bold text-[#081534]">Payment: {money(result.currency, Number(result.amountDue))}</p>
                          <p className="mt-1 whitespace-pre-line">{result.paymentInstructions || 'The church team will contact you with payment details.'}</p>
                          <p className="mt-2 text-[12px]">If your place isn’t approved, you will be refunded.</p>
                        </div>
                      )}
                      <p className="border-l-2 border-[#fdc425] pl-3 text-[13px] italic leading-5">
                        “{verse.text}” <span className="font-semibold not-italic text-[#785a00]">{verse.ref} (KJV)</span>
                      </p>
                      <button onClick={close} className={primaryBtn}>Done</button>
                    </div>
                  ) : (
                    <form onSubmit={submit} className="space-y-5 px-6 py-6">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-[#f7f9fb] px-4 py-3 text-[12px] font-semibold text-[#45464e]">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="event" className="text-[15px] text-[#785a00]" />
                          {fmt(target.intake.start_date)} – {fmt(target.intake.end_date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="payments" className="text-[15px] text-[#785a00]" />
                          {money(target.intake.currency, target.intake.price)}
                        </span>
                      </div>

                      <div>
                        <label htmlFor="cls-name" className={labelCls}>Full name</label>
                        <input id="cls-name" required autoFocus autoComplete="name" value={form.fullName}
                          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="cls-email" className={labelCls}>Email</label>
                        <input id="cls-email" required type="email" autoComplete="email" value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                        <p className="mt-1.5 text-[11px] text-[#76777f]">Use the same email you joined the church with, so we can match your record.</p>
                      </div>
                      <div>
                        <label htmlFor="cls-phone" className={labelCls}>Phone number</label>
                        <input id="cls-phone" required type="tel" autoComplete="tel" value={form.phone}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="Include country code" className={inputCls} />
                      </div>

                      <input name="hp_field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website}
                        onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                        className="hidden" />

                      <label htmlFor="cls-privacy" className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e2e2e9] p-4">
                        <input id="cls-privacy" type="checkbox" required checked={form.privacy}
                          onChange={e => setForm(f => ({ ...f, privacy: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 accent-[#081534]" />
                        <span className="text-[12px] leading-5 text-[#45464e]">
                          I agree that theSpotlightChurch may use these details to manage my registration and contact me about this class.
                        </span>
                      </label>

                      {error && (
                        <p role="alert" className="border-l-2 border-[#ba1a1a] bg-[#ffefed] px-4 py-3 text-[13px] text-[#8f1717]">{error}</p>
                      )}

                      <button type="submit" disabled={status === 'submitting'}
                        className="min-h-12 w-full rounded-full bg-[#081534] px-6 text-[14px] font-bold text-white transition hover:bg-[#17305f] focus-visible:ring-2 focus-visible:ring-[#fdc425] disabled:opacity-60">
                        {status === 'submitting' ? 'Submitting…' : 'Complete registration'}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  )
}