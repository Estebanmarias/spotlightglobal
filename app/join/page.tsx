'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'

const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3.5 rounded-t-lg text-[16px] transition-colors'

export default function JoinPage() {
  const supabase = getSupabaseClient()

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', address: '', dob: '',
    guest_status: 'First_Timer',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.dob) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    setSubmitting(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="bg-[#f7f9fb] min-h-screen">

      {/* Hero */}
      <section className="bg-[#081534] px-6 py-16 sm:py-24 text-center">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-[32px] sm:text-[48px] font-bold text-white mb-4 leading-tight">
          Join the Family
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/70 text-[16px] sm:text-[18px] max-w-xl mx-auto">
          Register with theSpotlightChurch and become part of the Company of the Blessed.
        </motion.p>
      </section>

      {/* Form */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-[560px] mx-auto">

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white rounded-2xl border border-[#c6c6cf] px-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-green-700 text-[40px]">check_circle</span>
              </div>
              <h2 className="text-[24px] font-bold text-[#081534] mb-3">
                Welcome, {form.first_name}! 🎉
              </h2>
              <p className="text-[15px] text-[#45464e] leading-relaxed">
                You're now part of theSpotlightChurch family. Check your email for a welcome message from us.
              </p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-[#c6c6cf] p-6 sm:p-8 shadow-sm">

              <h2 className="text-[20px] font-bold text-[#081534] mb-6">Your Details</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">
                      First Name *
                    </label>
                    <input name="first_name" value={form.first_name} onChange={handleChange}
                      placeholder="e.g. John" className={inputCls} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">
                      Last Name *
                    </label>
                    <input name="last_name" value={form.last_name} onChange={handleChange}
                      placeholder="e.g. Doe" className={inputCls} required />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">
                    Email Address *
                  </label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="you@example.com" className={inputCls} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">
                      Phone Number *
                    </label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+234 000 0000" className={inputCls} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">
                      Date of Birth *
                    </label>
                    <input type="date" name="dob" value={form.dob} onChange={handleChange}
                      className={inputCls} required />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">
                    Home Address
                  </label>
                  <input name="address" value={form.address} onChange={handleChange}
                    placeholder="e.g. 12 Karu Street, Abuja" className={inputCls} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#45464e] uppercase tracking-wide">
                    How often do you attend?
                  </label>
                  <select name="guest_status" value={form.guest_status} onChange={handleChange}
                    className={inputCls}>
                    <option value="First_Timer">First Timer — just visiting</option>
                    <option value="Attending">Attending — I come regularly</option>
                    <option value="Member">Member — this is my church home</option>
                  </select>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-[#ffdad6] rounded-lg">
                    <span className="material-symbols-outlined text-[#ba1a1a] text-[16px] shrink-0 mt-0.5">error</span>
                    <p className="text-[#ba1a1a] text-[13px] font-semibold">{error}</p>
                  </div>
                )}

                <motion.button type="submit" disabled={submitting} whileTap={{ scale: 0.97 }}
                  className="w-full py-4 bg-[#081534] text-white font-bold text-[15px] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
                  ) : (
                    <>Join the Family <span className="material-symbols-outlined text-[18px]">favorite</span></>
                  )}
                </motion.button>

                <p className="text-[11px] text-[#76777f] text-center">
                  Your information is kept private and never sold or shared.
                </p>
              </form>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  )
}