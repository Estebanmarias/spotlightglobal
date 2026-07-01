'use client'

import { useEffect, useRef } from 'react'
import { motion, Variants } from 'framer-motion'
import Link from 'next/link'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' } }),
}

const pillars = [
  {
    icon: 'menu_book',
    title: 'Wisdom',
    desc: 'We preach the wisdom of God so that your faith will not stand on man, but on the power of God.',
    list: false,
  },
  {
    icon: 'bolt',
    title: 'Power',
    desc: 'We reach many with the power of God to heal, deliver, liberate, and enlighten them, lifting lives into all that God has paid for in Christ Jesus.',
    list: false,
  },
  {
    icon: 'favorite',
    title: 'Love',
    desc: 'God loves us, and it is our responsibility to communicate His love to a faint and dying world through the truth of the Gospel making many realize that God is not mad or angry at them.',
    list: false,
  },
  {
    icon: 'diamond',
    title: 'Wealth',
    desc: null,
    list: true,
    lines: [
      'Money in the hands of righteous men is righteous.',
      'Money in the hands of good people will do great things.',
      'Money in the hands of God\'s men will bring more men to God.',
      'God wants you wealthy.',
    ],
  },
]

const checks = [
  { title: 'Love and be Loved', desc: 'Here we expect you to recieve of Godos Love through Brothers and Sisters and Give it.' },
  { title: 'Respond and be Responsible', desc: 'We expect you to respond to Gods Work and be a Responsible Believer.' },
  { title: 'Serve and be Great', desc: 'You were born with a gift from God to Humanity and we believe that serving Gift is your Guaranteed root to Greatness and this Church give you that Plartform.' },
]

export default function VisionPage() {
  const pillarsRef = useRef<HTMLDivElement>(null)

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
      <header className="relative h-[820px] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#081534]/50 z-10" />
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvswONpbX-jMCM3e6acpa2Qlj9QuNiXdHFzS5xeNSMd4SsgwsAKIM_kXCdi0DRtRie_mdm5ofMx4--JvgIs_waLNj2s48D_SXvGQ8I3pUiBEVP6dCjU96YP3IzCLU5fm3heUpYvTfQcwZQNxnXx3XfVCxtDQzKwGnJqk3dTIVhdr8bERAqJxT2zlc3oX4pdV_6OBKmcNdTaPMBNTv3g8gy9RgCTT3nz-dDUB3MmCk9bXEKEq6_LOgE3SdoV0TBdrWNNKOlhr2e1Gw"
            alt="Church sanctuary"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#081534]/20 via-transparent to-[#f7f9fb] z-10" />
        </div>
        <div className="relative z-20 text-center max-w-4xl px-6 md:px-16">
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show"
            className="text-[48px] sm:text-[56px] leading-[1.1] font-bold tracking-tight text-white mb-6"
          >
            Our Vision &amp; Mission
          </motion.h1>
          <motion.p
            variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="text-[18px] leading-[28px] text-[#ffdf9a] italic mb-10 opacity-90"
          >
            "Manifesting the Character of the Holy Spirit, Helping many find Purpose and through God's lifting Power Fulfilling It."
          </motion.p>
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show">
            <span className="material-symbols-outlined text-[#ffdf9a] text-[40px] animate-bounce">expand_more</span>
          </motion.div>
        </div>
      </header>

      {/* ── Heart of Church ── */}
      <section className="py-24 md:py-32 bg-[#f7f9fb]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 reveal opacity-0 translate-y-8 transition-all duration-700">
              <h2 className="text-[32px] font-bold leading-[40px] text-[#081534] mb-8 relative inline-block">
                The Heart of Our Church
                <span className="absolute -bottom-2 left-0 w-24 h-1 bg-[#fdc425] rounded-full" />
              </h2>
              <p className="text-[18px] leading-[28px] text-[#45464e] mb-6">
                At theSpotlightChurch, we make Christ Known, Manifesting the Character of the Holy Spirit, Helping many find Purpose and through God's lifting Power Fulfilling It.
              </p>
              <p className="text-[18px] leading-[28px] text-[#45464e] mb-10">
                Our mission is rooted in the belief that faith should be active, community should be authentic, and the future should be shaped with intentionality. We don't just gather — we grow together.
              </p>
              <div className="space-y-5">
                {checks.map((c) => (
                  <div key={c.title} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-[#fdc425]/20 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#785a00] text-[16px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#081534] text-[15px]">{c.title}</p>
                      <p className="text-[#45464e] text-[14px]">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2 relative reveal opacity-0 translate-y-8 transition-all duration-700">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <img
                  className="w-full h-full object-cover"
                  src="/images/gallery/community-3.jpg"
                  alt="Community gathering"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-[#fdc425] rounded-2xl -z-10 opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Strategic Pillars ── */}
      <section className="py-24 md:py-32 bg-[#f2f4f6]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="text-center mb-16 reveal opacity-0 translate-y-8 transition-all duration-700">
            <span className="text-[#785a00] text-[12px] font-bold uppercase tracking-widest">How We Move</span>
            <h2 className="text-[32px] font-bold leading-[40px] text-[#081534] mt-2">Key Strategic Pillars</h2>
            <p className="text-[16px] text-[#45464e] max-w-2xl mx-auto mt-4">Our roadmap for growth and impact, guided by four core commitments to our congregation and the world.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                className="group reveal opacity-0 translate-y-8 transition-all duration-700 bg-white p-8 rounded-xl border border-[#c6c6cf] hover:border-[#785a00] hover:shadow-lg hover:-translate-y-1"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-14 h-14 bg-[#081534] rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#ffdf9a] text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                </div>
                <h3 className="text-[24px] font-semibold text-[#081534] mb-3">{p.title}</h3>
                {p.list ? (
                <ul className="space-y-2">
                  {(p as any).lines.map((line: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[15px] text-[#45464e] leading-[24px]">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#fdc425] shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
                  ) : (
                <p className="text-[16px] text-[#45464e] leading-[24px]">{p.desc}</p>
                  )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-[#081534] text-white text-center">
        <div className="max-w-3xl mx-auto px-6 reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-[32px] font-bold leading-[40px] text-[#fdc425] mb-6">Experience the Vision Firsthand</h2>
          <p className="text-[18px] leading-[28px] text-white/80 mb-10">
            Whether you&apos;re exploring faith for the first time or looking for a new spiritual home, we&apos;d love to meet you this Sunday. Step into the spotlight of grace.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/join"
              className="px-10 py-4 bg-[#fdc425] text-[#6d5200] font-bold rounded-full hover:brightness-110 transition-all active:scale-95">
              Plan Your Visit
            </Link>
            <Link href="/community"
              className="px-10 py-4 border-2 border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all active:scale-95">
              Our Ministries
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}