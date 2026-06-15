'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' } }),
}

const pillars = [
  { icon: 'volunteer_activism', title: 'Local Outreach', desc: 'Supporting local schools, food pantries, and neighborhood revitalization programs.' },
  { icon: 'public', title: 'Global Missions', desc: 'Funding international clean water projects and church planting in unreached areas.' },
  { icon: 'foundation', title: 'Church Operations', desc: 'Maintaining our sanctuary and providing tools needed for weekly worship experiences.' },
]

const amounts = ['₦5,000', '₦10,000', '₦25,000', 'Other']

export default function GivingPage() {
  const [selectedAmount, setSelectedAmount] = useState(1)
  const [frequency, setFrequency] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('opacity-0', 'translate-y-8')
        }
      })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ── Hero ── */}
      <header className="relative h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHBkDdUPNgXGh4a1YwAkp_2zu-psL6jUpmKpcGu1j07McnKpAlB2bBvMLkddQLtdJsXxauIDJe49UwzOu4eNQ09mWKaWkrIEKEggUawaxbDbrmS9rSj4dAxgD1gt6DnG9mZoFCKR0E7M6voNMffa0RuJ8DnAM2zc9UY-U05fXCVh9fM893s7UYD2MiS9DHvF2ZmwuNNaWNe11TlsKoQnq23ifdqFq3385rGZVjcU3uoeAuDdqY41T_zWq6U8OiTzVrWHbOEhS5sZA"
            alt="Church sanctuary" />
          <div className="absolute inset-0 bg-[#081534]/45" />
        </div>
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="max-w-2xl">
            <motion.h1 variants={fadeUp} initial="hidden" animate="show"
              className="text-[48px] sm:text-[56px] font-bold leading-[1.1] text-white mb-4">
              Investing in the Kingdom
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} initial="hidden" animate="show"
              className="text-[18px] leading-[28px] text-white/90">
              Your generosity empowers us to share the light of Christ across the street and around the world.
            </motion.p>
          </div>
        </div>
      </header>

      {/* ── Why We Give ── */}
      <section className="py-24 bg-[#f7f9fb]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative group reveal opacity-0 translate-y-8 transition-all duration-700">
            <div className="absolute -inset-4 bg-[#785a00]/10 rounded-xl -rotate-2 group-hover:rotate-0 transition-transform duration-500" />
            <img
              className="relative rounded-lg shadow-xl w-full h-[400px] object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4S2KcFmSARhXglOpoP3l0HvVSGpWhmVcU8vy2wN4KhriDdnKUKrMOPvkA8YHJlGBQrrUnLzBvUlTluYBoF60EsLZmIaAW_qkVAmrNVhUMOAb8eV07jn5n4gTzdLpUdT_F4H2P_K2gxJFFZ8gp22Mu6cOwRDakgl_2_Vofr_DBostS2-McUbBSI_bLjBqEpxumf7IURsy2MynMtkQ1qc_GDRIFZZVnNYt9xHNp1byi2U5V8575aurhDSKXfxQNsc4_X-qqW5zVyoQ"
              alt="Community impact" />
          </div>
          <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[32px] font-bold leading-[40px] text-[#081534] mb-6">Why We Give</h2>
            <p className="text-[16px] leading-[24px] text-[#45464e] mb-8">
              At theSpotlightChurch, we believe that giving is an act of worship. It's a tangible expression of our trust in God and our commitment to the mission of shining His light in every corner of society. Through your support, we sustain our ministries, care for the vulnerable, and create a space where everyone belongs.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="border-l-4 border-[#fdc425] pl-4">
                <span className="block text-[24px] font-semibold text-[#081534]">1,200+</span>
                <span className="text-[14px] font-semibold text-[#45464e]">Families Served</span>
              </div>
              <div className="border-l-4 border-[#fdc425] pl-4">
                <span className="block text-[24px] font-semibold text-[#081534]">15</span>
                <span className="text-[14px] font-semibold text-[#45464e]">Global Partners</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="py-24 bg-[#f2f4f6]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="text-center mb-16 reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[32px] font-bold leading-[40px] text-[#081534] mb-4">Our Giving Pillars</h2>
            <p className="text-[16px] text-[#45464e]">Where your contribution makes a difference.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <div key={p.title}
                className="reveal opacity-0 translate-y-8 transition-all duration-700 bg-white p-8 rounded-xl border border-[#c6c6cf] hover:border-[#785a00] transition-all group"
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="w-12 h-12 bg-[#fdc425] rounded-lg flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[#6d5200]">{p.icon}</span>
                </div>
                <h3 className="text-[24px] font-semibold text-[#081534] mb-3">{p.title}</h3>
                <p className="text-[16px] text-[#45464e] mb-6">{p.desc}</p>
                <a className="inline-flex items-center gap-2 text-[14px] font-bold text-[#785a00] group-hover:underline" href="#">
                  Learn more <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Giving Portal ── */}
      <section className="py-24 bg-[#f7f9fb]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="max-w-xl mx-auto reveal opacity-0 translate-y-8 transition-all duration-700">
            <div className="bg-white rounded-xl border border-[#c6c6cf] shadow-lg p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[24px] font-semibold text-[#081534]">Giving Portal</h2>
                <div className="flex items-center gap-2 bg-[#081534]/5 px-3 py-1 rounded-full border border-[#081534]/10">
                  <span className="material-symbols-outlined text-[16px] text-[#081534]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  <span className="text-[12px] font-bold text-[#081534] uppercase tracking-wider">Secure</span>
                </div>
              </div>

              {/* Frequency */}
              <div className="flex p-1 bg-[#f2f4f6] rounded-lg mb-8">
                {['One-time', 'Monthly'].map((f, i) => (
                  <button key={f} onClick={() => setFrequency(i)}
                    className={`flex-1 py-2 text-[14px] font-semibold rounded-md transition-all ${frequency === i ? 'bg-white shadow-sm text-[#081534]' : 'text-[#45464e] hover:text-[#081534]'}`}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Amounts */}
              <div className="mb-8">
                <label className="block text-[14px] font-semibold text-[#45464e] mb-4">Select Amount</label>
                <div className="grid grid-cols-4 gap-3">
                  {amounts.map((a, i) => (
                    <button key={a} onClick={() => setSelectedAmount(i)}
                      className={`py-3 border rounded-lg text-[14px] font-semibold transition-colors ${selectedAmount === i ? 'bg-[#785a00] text-white border-[#785a00]' : 'border-[#c6c6cf] text-[#191c1e] hover:border-[#785a00]'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Giving to */}
              <div className="mb-8">
                <label className="block text-[14px] font-semibold text-[#45464e] mb-2">Giving To</label>
                <select className="w-full bg-[#f2f4f6] border-none rounded-lg p-4 text-[16px] text-[#081534] focus:ring-2 focus:ring-[#fdc425]">
                  <option>General Fund</option>
                  <option>Missions</option>
                  <option>Building Fund</option>
                  <option>Youth Ministry</option>
                </select>
              </div>

              <button className="w-full bg-[#081534] text-white py-4 rounded-lg text-[18px] font-semibold hover:opacity-90 transition-all active:scale-95">
                Give Now
              </button>
              <p className="text-center mt-6 text-[12px] text-[#45464e]/60">
                By clicking 'Give Now' you agree to our Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Other Ways ── */}
      <section className="py-24 bg-[#081534] text-white">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 text-center reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-[32px] font-bold mb-12">Other Ways to Give</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: 'smartphone', title: 'App', desc: 'Download our mobile app to set up giving in seconds.' },
              { icon: 'diversity_3', title: 'In-Person', desc: 'Visit our giving kiosks located in the church foyer on Sundays.' },
              { icon: 'mail', title: 'Bank Transfer', desc: 'Contact us for our church bank details for direct transfers.' },
            ].map(w => (
              <div key={w.title} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px]">{w.icon}</span>
                </div>
                <h4 className="text-[24px] font-semibold mb-2">{w.title}</h4>
                <p className="text-[16px] text-white/70">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}