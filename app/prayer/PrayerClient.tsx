'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Icon from '@/components/Icon'

const MAX = 1000
const CRISIS = /suicid|kill myself|end my life|want to die|wanna die|hurt myself|self[- ]?harm|abus|rape|beating me/i

const inputCls =
  'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] focus:ring-2 focus:ring-[#081534]/10 outline-none px-4 py-3 rounded-t-lg text-[15px] text-[#191c1e] transition-colors'
const labelCls = 'block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5'

export default function PrayerClient() {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [wantsReply, setWantsReply] = useState(false)
  const [request, setRequest] = useState('')
  const [trap, setTrap] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [needsCare, setNeedsCare] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setError('')
    if (request.trim().length < 5) { setError('Please share your prayer request in a few words.'); return }
    if (wantsReply && !contact.trim()) { setError('Add a phone number or email so we can reach you.'); return }
    setSending(true)
    try {
      const res = await fetch('/api/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, wantsReply, request, hp_field: trap }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setNeedsCare(CRISIS.test(request))
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    }
    setSending(false)
  }

  const reset = () => {
    setName(''); setContact(''); setWantsReply(false); setRequest(''); setNeedsCare(false); setDone(false)
  }

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">
      <header className="relative overflow-hidden bg-[#081534] px-5 pb-16 pt-20 text-white sm:px-8 sm:pb-20 sm:pt-28">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-[#fdc425]/15 blur-[100px]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#fdc425]">Prayer</p>
          <h1 className="mt-3 text-[38px] font-bold leading-[1.05] sm:text-[52px]">We would love to pray with you</h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-white/75 sm:text-[17px]">
            Share what is on your heart. Our pastoral team will pray over your request.
          </p>
          <p className="mx-auto mt-6 max-w-xl border-l-2 border-[#fdc425] pl-4 text-left text-[13px] italic leading-6 text-white/80">
            “Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.”{' '}
            <span className="font-semibold not-italic text-[#fdc425]">Philippians 4:6 (KJV)</span>
          </p>
        </div>
      </header>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-[600px]">
          {done ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-[#c6c6cf] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fdc425]/25">
                <Icon name="favorite" className="text-[28px] text-[#785a00]" />
              </div>
              <h2 className="mt-5 text-[22px] font-bold text-[#081534]">We have received your request</h2>
              <p className="mt-2 text-[14px] leading-6 text-[#45464e]">Thank you for trusting us with it. You are in our prayers.</p>
              <p className="mx-auto mt-5 max-w-md border-l-2 border-[#fdc425] pl-4 text-left text-[13px] italic leading-6 text-[#45464e]">
                “Casting all your care upon him; for he careth for you.”{' '}
                <span className="font-semibold not-italic text-[#785a00]">1 Peter 5:7 (KJV)</span>
              </p>

              {needsCare && (
                <div className="mt-6 rounded-xl border-l-2 border-[#ba1a1a] bg-[#ffefed] p-4 text-left text-[13px] leading-6 text-[#5b1a1a]">
                  <p className="font-bold">You don’t have to carry this alone.</p>
                  <p className="mt-1">
                    Tap the chat button at the bottom right and choose “Speak to a counselor”. If you are in immediate danger, please call 112 first.
                  </p>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#081534] px-6 text-[13px] font-bold text-white hover:bg-[#17305f]">
                  Back to home
                </Link>
                <button onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#c6c6cf] px-6 text-[13px] font-bold text-[#45464e] hover:bg-[#f2f4f6]">
                  Send another request
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#c6c6cf] bg-white p-6 sm:p-8">
              <div>
                <label htmlFor="pr-name" className={labelCls}>Your name <span className="font-normal normal-case text-[#5f6068]">(optional)</span></label>
                <input id="pr-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={80} className={inputCls} />
              </div>

              <div>
                <label htmlFor="pr-request" className={labelCls}>Your prayer request</label>
                <textarea id="pr-request" required rows={6} maxLength={MAX} value={request} onChange={e => setRequest(e.target.value)}
                  placeholder="Share as much or as little as you like." className={`${inputCls} resize-none`} />
                <p className="mt-1 text-right text-[11px] text-[#5f6068]">{request.length}/{MAX}</p>
              </div>

              <label htmlFor="pr-reply" className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e2e2e9] p-4">
                <input id="pr-reply" type="checkbox" checked={wantsReply} onChange={e => setWantsReply(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#081534]" />
                <span className="text-[13px] leading-5 text-[#45464e]">I would like someone from the church to contact me.</span>
              </label>

              {wantsReply && (
                <div>
                  <label htmlFor="pr-contact" className={labelCls}>Phone or email</label>
                  <input id="pr-contact" value={contact} onChange={e => setContact(e.target.value)} maxLength={120} className={inputCls} />
                </div>
              )}

              <input name="hp_field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={e => setTrap(e.target.value)} className="hidden" />

              {error && <p role="alert" className="border-l-2 border-[#ba1a1a] bg-[#ffefed] px-4 py-3 text-[13px] text-[#8f1717]">{error}</p>}

              <button type="submit" disabled={sending}
                className="min-h-12 w-full rounded-full bg-[#081534] px-6 text-[14px] font-bold text-white transition hover:bg-[#17305f] disabled:opacity-60">
                {sending ? 'Sending…' : 'Send my request'}
              </button>
              <p className="text-center text-[11px] leading-5 text-[#5f6068]">Requests are seen only by our pastoral team and are never shown publicly.</p>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}