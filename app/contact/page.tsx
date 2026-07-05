'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const interests = ['General Inquiry', 'Prayer Request', 'Volunteer', 'Partnership', 'Media & Press']

const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[15px] text-[#191c1e] transition-colors'
const labelCls = 'block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5'

const BrandIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.117C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.386.524A2.994 2.994 0 0 0 .502 6.186 31.26 31.26 0 0 0 0 12a31.26 31.26 0 0 0 .502 5.814 2.994 2.994 0 0 0 2.112 2.117c1.881.524 9.386.524 9.386.524s7.505 0 9.386-.524a2.994 2.994 0 0 0 2.112-2.117A31.26 31.26 0 0 0 24 12a31.26 31.26 0 0 0-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 0C8.74 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.986 8.74 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.846-10.405a1.441 1.441 0 1 1-2.883.001 1.441 1.441 0 0 1 2.883-.001z" />
        </svg>
      )
    default:
      return null
  }
}

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
                { icon: 'mail',     brand: false, text: 'officialspotlightglobal@gmail.com',     href: 'mailto:officialspotlightglobal@gmail.com' },
                { icon: 'telegram', brand: true,  text: 't.me/thespotlightchurchLive',            href: 'https://t.me/thespotlightchurchLive' },
                { icon: 'youtube',  brand: true,  text: 'YouTube · @thespotlightchurch',          href: 'https://www.youtube.com/@thespotlightchurch' },
              ].map(item => {
                const isMailto = item.href.startsWith('mailto:')
                return (
                  <a key={item.icon} href={item.href}
                    {...(!isMailto && { target: '_blank', rel: 'noreferrer' })}
                    className="flex items-center gap-4 group">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#fdc425] transition-colors">
                      {item.brand ? (
                        <BrandIcon name={item.icon} className="w-[16px] h-[16px] text-[#fdc425] group-hover:text-[#081534] transition-colors" />
                      ) : (
                        <span className="material-symbols-outlined text-[#fdc425] group-hover:text-[#081534] text-[18px] transition-colors">{item.icon}</span>
                      )}
                    </div>
                    <span className="text-[13px] text-white/80 group-hover:text-white transition-colors">{item.text}</span>
                  </a>
                )
              })}
            </div>

            {/* Social icons */}
            <div className="mt-auto pt-6 border-t border-white/10">
              <p className="text-white/40 text-[11px] uppercase tracking-widest mb-4">Follow Us</p>
              <div className="flex gap-3">
                {[
                  { href: 'https://instagram.com/thespotlightchurch', icon: 'instagram' },
                  { href: 'https://www.youtube.com/@thespotlightchurch', icon: 'youtube' },
                  { href: 'https://t.me/thespotlightchurchLive', icon: 'telegram' },
                ].map(s => (
                  <a key={s.icon} href={s.href} target="_blank" rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#fdc425] transition-all group">
                    <BrandIcon name={s.icon} className="w-[15px] h-[15px] text-white group-hover:text-[#081534] transition-colors" />
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