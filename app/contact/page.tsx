'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const interests = ['General Inquiry', 'Prayer Request', 'Volunteer', 'Partnership', 'Media & Press']

const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] text-[#191c1e] transition-colors'
const labelCls = 'block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', message: '',
  })
  const [selectedInterest, setSelectedInterest] = useState('General Inquiry')
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name || !form.email || !form.message) {
      setErrorMsg('Please fill in your name, email, and message.')
      return
    }
    setErrorMsg('')
    setFormState('submitting')

    // Sent via our own server route — keeps the Brevo API key off the client
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, interest: selectedInterest }),
      })
      if (!res.ok) throw new Error('Send failed')
      setFormState('success')
    } catch {
      setFormState('error')
      setErrorMsg('Failed to send message. Please email us directly at officialspotlightglobal@gmail.com')
    }
  }

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-[#081534] py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fdc425] rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fdc425]/20 text-[#fdc425] border border-[#fdc425]/30 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="material-symbols-outlined text-[14px]">mail</span>
              Get in Touch
            </span>
            <h1 className="text-white text-[36px] sm:text-[48px] lg:text-[56px] font-bold leading-tight mb-6">
              We'd Love to Hear From You
            </h1>
            <p className="text-white/70 text-[16px] sm:text-[18px] leading-[28px] max-w-2xl mx-auto">
              Whether you have a question about our ministries, need prayer, or want to get involved —
              our team is here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT GRID ─────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-6 -mt-12 mb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Info panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#081534] text-white p-8 rounded-2xl shadow-2xl flex flex-col gap-8">
            <div>
              <h3 className="text-[20px] font-bold mb-3">Contact Information</h3>
              <p className="text-white/60 text-[14px] leading-relaxed">
                Fill out the form and our team will get back to you within 24 hours.
              </p>
            </div>

            <div className="space-y-5">
              {[
                { icon: 'mail',        text: 'officialspotlightglobal@gmail.com',       href: 'mailto:officialspotlightglobal@gmail.com' },
                { icon: 'send',        text: 't.me/thespotlightchurchLive',     href: 'https://t.me/thespotlightchurchLive' },
                { icon: 'play_circle', text: 'YouTube · @thespotlightchurch',   href: 'https://www.youtube.com/@thespotlightchurch' },
              ].map(item => (
                <a key={item.icon} href={item.href} target="_blank" rel="noreferrer"
                  className="flex items-center gap-4 group">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#fdc425] transition-colors">
                    <span className="material-symbols-outlined text-[#fdc425] group-hover:text-[#081534] text-[18px] transition-colors">{item.icon}</span>
                  </div>
                  <span className="text-[13px] text-white/80 group-hover:text-white transition-colors">{item.text}</span>
                </a>
              ))}
            </div>

            {/* Social icons */}
            <div className="mt-auto pt-6 border-t border-white/10">
              <p className="text-white/40 text-[11px] uppercase tracking-widest mb-4">Follow Us</p>
              <div className="flex gap-3">
                {[
                  { href: 'https://instagram.com/thespotlightchurch', icon: 'photo_camera' },
                  { href: 'https://www.youtube.com/@thespotlightchurch', icon: 'play_circle' },
                  { href: 'https://t.me/thespotlightchurchLive', icon: 'send' },
                ].map(s => (
                  <a key={s.icon} href={s.href} target="_blank" rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#fdc425] transition-all group">
                    <span className="material-symbols-outlined text-white group-hover:text-[#081534] text-[16px] transition-colors">{s.icon}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-[#eceef0] p-8 sm:p-10">

            {formState === 'success' ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="w-16 h-16 bg-[#fdc425] rounded-full flex items-center justify-center mb-6 text-3xl">🙏</div>
                <h3 className="text-[22px] font-bold text-[#081534] mb-3">Message Sent!</h3>
                <p className="text-[#45464e] text-[14px] mb-6 max-w-sm">
                  Thank you for reaching out. We'll get back to you within 24 hours. God bless you!
                </p>
                <button onClick={() => { setFormState('idle'); setForm({ first_name: '', last_name: '', email: '', phone: '', message: '' }) }}
                  className="px-6 py-2.5 border border-[#c6c6cf] rounded-full text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6] transition-colors">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input value={form.first_name} onChange={set('first_name')} placeholder="Jane" required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input value={form.last_name} onChange={set('last_name')} placeholder="Doe" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address *</label>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+234 000 0000" className={inputCls} />
                  </div>
                </div>

                {/* Interest pills */}
                <div>
                  <label className={labelCls}>What are you reaching out about?</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map(opt => (
                      <button key={opt} type="button" onClick={() => setSelectedInterest(opt)}
                        className={`px-4 py-2 rounded-full text-[12px] font-semibold border transition-all
                          ${selectedInterest === opt
                            ? 'bg-[#081534] text-white border-[#081534]'
                            : 'bg-white text-[#45464e] border-[#c6c6cf] hover:border-[#081534]'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className={labelCls}>Message *</label>
                  <textarea value={form.message} onChange={set('message')} required rows={5}
                    placeholder="How can we help you?"
                    className="w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] text-[#191c1e] transition-colors resize-none" />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2 p-3 bg-[#ffdad6] rounded-lg">
                      <span className="material-symbols-outlined text-[#ba1a1a] text-[16px] shrink-0 mt-0.5">error</span>
                      <p className="text-[#ba1a1a] text-[13px] font-semibold">{errorMsg}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between pt-2 border-t border-[#f2f4f6]">
                  <p className="text-[11px] text-[#76777f] italic">
                    By submitting, you agree to our{' '}
                    <Link href="/privacy-policy" className="text-[#785a00] hover:underline">Privacy Policy</Link>.
                  </p>
                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={formState === 'submitting'}
                    className="flex items-center gap-2 bg-[#fdc425] text-[#6d5200] px-8 py-3 rounded-full text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-60">
                    {formState === 'submitting' ? (
                      <><span className="w-4 h-4 border-2 border-[#6d5200]/30 border-t-[#6d5200] rounded-full animate-spin" /> Sending…</>
                    ) : (
                      <>Send Message <span className="material-symbols-outlined text-[16px]">send</span></>
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── CLOSING BANNER ───────────────────────────────────────── */}
      <section className="bg-[#081534] py-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto">
          <h2 className="text-white text-[24px] sm:text-[32px] font-bold mb-4">
            We are one body, shining one light.
          </h2>
          <p className="text-white/60 text-[14px] mb-6">
            Can't wait? Reach us directly on Telegram or YouTube.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="https://t.me/thespotlightchurchLive" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-[#fdc425] text-[#6d5200] px-6 py-3 rounded-full text-[13px] font-bold hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-[16px]">send</span> Join on Telegram
            </a>
            <Link href="/community"
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full text-[13px] font-bold hover:bg-white/20 transition-all">
              <span className="material-symbols-outlined text-[16px]">groups</span> Our Community
            </Link>
          </div>
        </motion.div>
      </section>

    </main>
  )
}