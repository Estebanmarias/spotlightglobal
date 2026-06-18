'use client'

import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import Link from 'next/link'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' } }),
}

const stats = [
  { icon: 'public',         value: '45+',   label: 'Global Partners' },
  { icon: 'travel_explore', value: '12',    label: 'Countries Reached' },
  { icon: 'favorite',       value: '150k+', label: 'Lives Impacted Yearly' },
]

const packages = [
  '₦10,000 Monthly', '₦20,000 Monthly', '₦30,000 Monthly',
  '₦50,000 Monthly', '₦100,000 Monthly', '₦200,000 Monthly',
  '₦500,000 Monthly', '₦1,000,000 Monthly',
]

const contactOptions = ['Email', 'Text', 'Phone', 'Telegram']

const inputCls = 'w-full bg-transparent border-0 border-b border-[#c6c6cf] py-3 px-0 focus:ring-0 focus:border-b-2 focus:border-[#081534] outline-none transition-all text-[16px] text-[#081534]'

export default function PartnerPage() {
  const [contactPrefs, setContactPrefs] = useState<string[]>([])
  const [selectedPackage, setSelectedPackage] = useState('')
  const [otherAmount, setOtherAmount] = useState('')

  const toggleContact = (opt: string) => {
    setContactPrefs(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[640px] flex items-center overflow-hidden bg-[#081534] py-24">
        <div className="absolute inset-0 opacity-20">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDziqhiBPbG-_6Cv4ux1jFto9M6Dka56rortJkcPhltK-5AUb94dVa0bdIk1uFw3hWjDumMMK5MIjseonm98FIbIJJnvQpDsvV0q3Pi0NVGmZZqdS1wSKtbRvjfMXoMBQGkJkxhtBDr81D998m6eS9WvY2n__ekmmSqGu3gTkYwYHUxsZHNsmNEc1fAv9OIn3sj8qi3CbPIlw0QeeUjtVO9_zKWBkDxnpzzZ5GDmS8dcwvDGgMUcQz8MU5Iof8gwGd4cgsjf-GuaJo"
            alt="Diverse community collaborating"
          />
        </div>
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 relative z-10">
          <div className="max-w-3xl">
            <motion.span
              variants={fadeUp} initial="hidden" animate="show"
              className="inline-block px-4 py-1 bg-[#fdc425] text-[#6d5200] rounded-full text-[12px] font-bold uppercase tracking-widest mb-6">
              Global Partnership
            </motion.span>
            <motion.h1
              variants={fadeUp} custom={1} initial="hidden" animate="show"
              className="text-[40px] sm:text-[56px] font-bold leading-[1.1] text-white mb-6">
              Partner with Us
            </motion.h1>
            <motion.p
              variants={fadeUp} custom={2} initial="hidden" animate="show"
              className="text-[16px] sm:text-[18px] leading-[28px] text-white/80 mb-10">
              "He that wins a soul is wise, either financially or otherwise." <br />
              Join our global mission to bring
              light to every corner of the earth. <br />
              Your partnership fuels transformation and expands our reach.
            </motion.p>
            <motion.div
              variants={fadeUp} custom={3} initial="hidden" animate="show"
              className="flex flex-wrap gap-4">
              <a href="#form"
                className="bg-[#fdc425] text-[#6d5200] px-8 py-4 rounded-lg text-[14px] font-bold hover:brightness-110 transition-all active:scale-95 inline-flex items-center gap-2">
                Become a Partner <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              </a>
              <Link href="/vision"
                className="border border-white/30 text-white px-8 py-4 rounded-lg text-[14px] font-bold hover:bg-white/10 transition-all active:scale-95">
                Our Vision
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          IMPACT METRICS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f7f9fb]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-10 bg-white border border-[#c6c6cf] rounded-xl text-center hover:border-[#081534] hover:shadow-md transition-all">
                <span className="material-symbols-outlined text-[40px] text-[#081534] mb-4 block"
                  style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="text-[40px] sm:text-[48px] font-bold text-[#081534] mb-2">{s.value}</div>
                <div className="text-[12px] font-bold text-[#45464e] uppercase tracking-widest">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PARTNERSHIP FORM
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white" id="form">
        <div className="max-w-4xl mx-auto px-6 md:px-16">

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-16 text-center">
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mb-4">Spotlight Global Partnership Form</h2>
            <p className="text-[16px] text-[#45464e]">Please fill out the details below to join the family and begin your partnership journey.</p>
          </motion.div>

          <form className="space-y-12" onSubmit={e => e.preventDefault()}>

            {/* ── Personal Information ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="space-y-8">
              <div className="flex items-center gap-3 border-b border-[#c6c6cf] pb-3">
                <span className="material-symbols-outlined text-[#081534]">person</span>
                <h3 className="text-[20px] sm:text-[22px] font-bold text-[#081534]">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[13px] font-semibold text-[#45464e] mb-2">Full Name *</label>
                  <input type="text" required placeholder="Your answer" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#45464e] mb-2">Email Address *</label>
                  <input type="email" required placeholder="Your answer" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#45464e] mb-2">Phone Number *</label>
                  <input type="tel" required placeholder="Your answer" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#45464e] mb-2">Gender *</label>
                  <select required defaultValue="" className={inputCls + ' cursor-pointer'}>
                    <option value="" disabled>Choose</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[13px] font-semibold text-[#45464e]">Marital Status</label>
                <div className="flex flex-wrap gap-6">
                  {['Single', 'Married'].map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="marital" className="w-5 h-5 border-[#c6c6cf] text-[#081534] focus:ring-[#081534] accent-[#081534]" />
                      <span className="text-[15px] text-[#191c1e] group-hover:text-[#081534] transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Contact Preference ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="space-y-8">
              <div className="flex items-center gap-3 border-b border-[#c6c6cf] pb-3">
                <span className="material-symbols-outlined text-[#081534]">contact_mail</span>
                <h3 className="text-[20px] sm:text-[22px] font-bold text-[#081534]">How do you prefer to be contacted? *</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {contactOptions.map(opt => (
                  <label key={opt}
                    className={`flex items-center gap-3 cursor-pointer p-4 border rounded-lg transition-all
                      ${contactPrefs.includes(opt) ? 'border-[#081534] bg-[#f2f4f6]' : 'border-[#c6c6cf] hover:border-[#081534]'}`}>
                    <input type="checkbox" checked={contactPrefs.includes(opt)}
                      onChange={() => toggleContact(opt)}
                      className="w-5 h-5 rounded border-[#c6c6cf] text-[#081534] focus:ring-[#081534] accent-[#081534]" />
                    <span className="text-[14px] font-semibold text-[#191c1e]">{opt}</span>
                  </label>
                ))}
              </div>

              {contactPrefs.includes('Telegram') && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-[13px] font-semibold text-[#45464e] mb-2">Telegram / Social Media Handle</label>
                  <input type="text" placeholder="@yourhandle" className={inputCls} />
                </motion.div>
              )}
            </motion.div>

            {/* ── Partnership Package ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="space-y-6">
              <div className="flex items-center gap-3 border-b border-[#c6c6cf] pb-3">
                <span className="material-symbols-outlined text-[#081534]">loyalty</span>
                <h3 className="text-[20px] sm:text-[22px] font-bold text-[#081534]">Partnership Package *</h3>
              </div>
              <p className="text-[14px] text-[#45464e] italic">Note: All partnership fees must be paid at the end of every month.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {packages.map(pkg => (
                  <label key={pkg}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all
                      ${selectedPackage === pkg ? 'border-[#081534] bg-[#f2f4f6]' : 'border-[#c6c6cf] hover:border-[#081534]'}`}>
                    <input type="radio" name="package" checked={selectedPackage === pkg}
                      onChange={() => setSelectedPackage(pkg)}
                      className="w-5 h-5 border-[#c6c6cf] text-[#081534] focus:ring-[#081534] accent-[#081534]" />
                    <span className="text-[14px] font-semibold text-[#191c1e]">{pkg}</span>
                  </label>
                ))}
                <input type="number" value={otherAmount}
                  onChange={e => { setOtherAmount(e.target.value); if (e.target.value) setSelectedPackage('') }}
                  placeholder="Other amount"
                  className="bg-transparent border border-[#c6c6cf] rounded-lg py-3.5 px-4 focus:ring-0 focus:border-[#081534] outline-none text-[14px] text-[#081534] transition-all" />
              </div>
            </motion.div>

            {/* ── Additional info ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="space-y-3">
              <label className="block text-[13px] font-semibold text-[#45464e]">Any other information?</label>
              <textarea rows={4} placeholder="Your answer"
                className="w-full bg-transparent border border-[#c6c6cf] rounded-lg py-3.5 px-4 focus:ring-0 focus:border-[#081534] outline-none text-[15px] text-[#081534] transition-all resize-none" />
            </motion.div>

            {/* ── Connect with family banner ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="p-8 bg-[#f2f4f6] rounded-xl border border-[#c6c6cf]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h4 className="text-[20px] sm:text-[22px] font-bold text-[#081534] mb-2">Connect with the Family</h4>
                  <p className="text-[15px] text-[#45464e]">Join our global network for updates and communal fellowship.</p>
                </div>
                <Link href="/community"
                  className="px-8 py-3 bg-[#081534] text-white rounded-lg text-[14px] font-bold flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap">
                  <span className="material-symbols-outlined text-[18px]">groups</span> Join the Community
                </Link>
              </div>
            </motion.div>

            {/* ── Submit ── */}
            <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#c6c6cf]">
              <p className="text-[12px] text-[#45464e] italic">Never submit passwords through this form.</p>
              <div className="flex gap-4 w-full md:w-auto">
                <button type="reset"
                  className="flex-1 md:flex-none px-10 py-4 border border-[#76777f] text-[#45464e] rounded-lg text-[14px] font-bold hover:bg-[#f2f4f6] transition-colors">
                  Clear Form
                </button>
                <motion.button type="submit" whileTap={{ scale: 0.97 }}
                  className="flex-1 md:flex-none px-10 py-4 bg-[#081534] text-white rounded-lg text-[14px] font-bold hover:shadow-lg transition-all">
                  Submit Partnership
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL MESSAGE
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#081534] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#fdc425]/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1e2a4a]/40 rounded-full blur-3xl -ml-48 -mb-48" />
        <div className="relative max-w-[1280px] mx-auto px-6 md:px-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-2xl mx-auto">
            <img
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover mx-auto mb-8 border-4 border-[#fdc425] shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3FR4Uqgj2AfF1eDPGg4-zByN6cbQPzgW2UYX6MS0VYpxd__WuAK2jyOu5TrVl6xAp81is3ubcY0Mb8lShnb11Cobpco1uuA7ojo6k_XT9JgDL-MaShgb1GncGw-Y0mzD8yx_JhvLkb1b_II-0LiSrZrfbl92MTz1YlKWjVSMkorTQh4nigrWFJvsPDDIm7ZUp4s4iM8xjBGQ80RDRoImGxgO2sVApZq3WNiM48Kw3PF6CBQfhk6I8m01ilKtdWIgdV8OVw-6Ie0A"
              alt="Hands completing a world map puzzle"
            />
            <h2 className="text-[32px] sm:text-[40px] font-bold text-white mb-6">God Bless You.</h2>
            <p className="text-[16px] sm:text-[18px] leading-[28px] text-white/70">
              There's a link to a WhatsApp group where every registered partner will be part of —
              to ensure there's a cordial relationship between the partnership and the ministry.
            </p>
          </motion.div>
        </div>
      </section>

    </main>
  )
}