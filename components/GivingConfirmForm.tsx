'use client'

import { useState } from 'react'
import Icon from '@/components/Icon'

const PURPOSES = ['Tithe', 'Offering', 'Prophetic Seed', 'Welfare', 'Projects', 'Partnership', 'Other']
const inputCls =
  'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] focus:ring-2 focus:ring-[#081534]/10 outline-none px-4 py-3 rounded-t-lg text-[15px] text-[#191c1e] transition-colors'
const labelCls = 'block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5'

export default function GivingConfirmForm() {
  const today = new Date().toLocaleDateString('en-CA')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    donorName: '', contact: '', amount: '', currency: 'NGN', purpose: 'Offering', givenOn: today, reference: '', trap: '',
  })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    setError(''); setSending(true)
    try {
      const res = await fetch('/api/giving/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hp_field: form.trap }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.')
    }
    setSending(false)
  }

  return (
    <section className="bg-[#f7f9fb] px-4 py-14 sm:px-6 sm:py-20" id="confirm-gift">
      <div className="mx-auto max-w-[680px] rounded-2xl border border-[#c6c6cf] bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#081534] text-[#fdc425]">
            <Icon name="volunteer_activism" className="text-[24px]" />
          </span>
          <div>
            <h2 className="text-[20px] font-bold text-[#081534] sm:text-[24px]">Sent your gift? Let us know</h2>
            <p className="mt-1 text-[14px] leading-6 text-[#45464e]">
              A quick note helps us record it correctly when we check our bank statement. This is for our records and is not a receipt.
            </p>
          </div>
        </div>

        {done ? (
          <div className="mt-6 rounded-xl bg-green-50 p-5 text-[14px] leading-6 text-green-900">
            <p className="flex items-center gap-2 font-bold"><Icon name="check_circle" className="text-[20px]" />Thank you, God bless you.</p>
            <p className="mt-1">We have your note and will record your gift once it appears on our statement.</p>
          </div>
        ) : !open ? (
          <button onClick={() => setOpen(true)}
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#081534] px-6 text-[13px] font-bold text-white transition hover:bg-[#17305f]">
            Tell us about my gift
          </button>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="gc-name" className={labelCls}>Your name</label>
                <input id="gc-name" required autoComplete="name" value={form.donorName} onChange={set('donorName')} maxLength={120} className={inputCls} />
              </div>
              <div>
                <label htmlFor="gc-contact" className={labelCls}>Email or phone</label>
                <input id="gc-contact" required value={form.contact} onChange={set('contact')} maxLength={120} className={inputCls} />
              </div>
              <div>
                <label htmlFor="gc-amount" className={labelCls}>Amount</label>
                <input id="gc-amount" required type="number" min="1" step="0.01" inputMode="decimal" value={form.amount} onChange={set('amount')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="gc-currency" className={labelCls}>Currency</label>
                <select id="gc-currency" value={form.currency} onChange={set('currency')} className={inputCls}>
                  <option value="NGN">NGN</option><option value="USD">USD</option><option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label htmlFor="gc-purpose" className={labelCls}>What it was for</label>
                <select id="gc-purpose" value={form.purpose} onChange={set('purpose')} className={inputCls}>
                  {PURPOSES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="gc-date" className={labelCls}>Date you gave</label>
                <input id="gc-date" required type="date" max={today} value={form.givenOn} onChange={set('givenOn')} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="gc-ref" className={labelCls}>Transfer reference <span className="font-normal normal-case text-[#5f6068]">(optional)</span></label>
              <input id="gc-ref" value={form.reference} onChange={set('reference')} maxLength={120} placeholder="Narration or reference on your transfer" className={inputCls} />
            </div>
            <input name="hp_field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.trap} onChange={set('trap')} className="hidden" />
            {error && <p role="alert" className="border-l-2 border-[#ba1a1a] bg-[#ffefed] px-4 py-3 text-[13px] text-[#8f1717]">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={sending}
                className="min-h-12 flex-1 rounded-full bg-[#081534] px-6 text-[14px] font-bold text-white transition hover:bg-[#17305f] disabled:opacity-60">
                {sending ? 'Sending…' : 'Send note'}
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className="min-h-12 rounded-full border border-[#c6c6cf] px-6 text-[14px] font-bold text-[#45464e] hover:bg-[#f2f4f6]">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}