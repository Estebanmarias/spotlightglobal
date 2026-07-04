'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const sections = [
  {
    id: 'acceptance',
    number: '01',
    title: 'Acceptance of Terms',
    content: (
      <div className="space-y-4">
        <p>Welcome to theSpotlightChurch. By accessing or using our website, services, or community platforms, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to all of these Terms, please do not use our services.</p>
        <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide reasonable notice prior to any new terms taking effect. Continued use of our services after revisions become effective means you agree to be bound by the revised terms.</p>
        <div className="bg-[#f7f9fb] p-5 rounded-xl border-l-4 border-[#fdc425]">
          <p className="text-[#081534] font-semibold italic text-[14px] leading-relaxed">
            "By continuing to access or use our Service after revisions become effective, you agree to be bound by the updated terms."
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'conduct',
    number: '02',
    title: 'User Conduct',
    content: (
      <div className="space-y-4">
        <p>As a member or administrator of theSpotlightChurch community, you agree not to engage in any of the following prohibited activities:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {[
            'Copying or distributing any part of the Service without written consent',
            'Using automated systems such as bots, scrapers, or offline readers',
            'Attempting to interfere with system integrity, security, or performance',
            'Taking any action that imposes an unreasonable load on our infrastructure',
            'Submitting false, misleading, or harmful content through any form',
            'Impersonating any person or entity associated with the church',
          ].map(item => (
            <div key={item} className="flex items-start gap-3 p-3 bg-[#ffdad6]/30 rounded-lg border border-[#ba1a1a]/10">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[18px] mt-0.5 shrink-0">block</span>
              <span className="text-[13px] text-[#45464e] leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
        <p className="mt-2">Any violation may result in immediate suspension of access without notice.</p>
      </div>
    ),
  },
  {
    id: 'intellectual',
    number: '03',
    title: 'Intellectual Property',
    content: (
      <div className="space-y-4">
        <p>
          The Service and its original content, features, and functionality are and will remain the exclusive property of theSpotlightChurch and its leadership. Our name, logo, and branding may not be used in connection with any product or service without prior written consent.
        </p>
        <p>
          Members and administrators retain ownership of the data they contribute (such as testimonies, contact details, and ministry content), but grant theSpotlightChurch a non-exclusive license to store and process this data for the purpose of providing our services.
        </p>
      </div>
    ),
  },
  {
    id: 'disclaimers',
    number: '04',
    title: 'Disclaimers',
    dark: true,
    content: (
      <div className="space-y-4">
        <p>
          Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
        </p>
        <p>
          theSpotlightChurch does not warrant that the Service will function uninterrupted or error-free at any particular time or location, or that any defects will be corrected.
        </p>
      </div>
    ),
  },
  {
    id: 'liability',
    number: '05',
    title: 'Limitation of Liability',
    content: (
      <div className="space-y-4">
        <p>
          In no event shall theSpotlightChurch, its leadership, employees, or partners be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of data, revenue, or other intangible losses, resulting from your use of the Service.
        </p>
      </div>
    ),
  },
  {
    id: 'governing',
    number: '06',
    title: 'Governing Law',
    content: (
      <div className="space-y-4">
        <p>
          These Terms shall be governed and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to conflict of law provisions. Any disputes arising under these Terms shall be subject to the jurisdiction of the courts in Abuja, FCT.
        </p>
      </div>
    ),
  },
]

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('acceptance')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      sections.forEach(s => {
        const el = document.getElementById(s.id)
        if (!el) return
        const rect = el.getBoundingClientRect()
        if (rect.top <= 140) setActiveSection(s.id)
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-[#081534] pt-20 pb-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fdc425]/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="max-w-[1000px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fdc425]/20 text-[#fdc425] border border-[#fdc425]/30 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="material-symbols-outlined text-[14px]">gavel</span>
              Legal
            </span>
            <h1 className="text-white text-[36px] sm:text-[48px] font-bold leading-tight mb-3">
              Terms of Service
            </h1>
            <p className="text-white/60 text-[14px]">Last updated: July 2026</p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTENT + TOC ─────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* Table of contents — sticky */}
          <aside className="lg:sticky lg:top-24 lg:w-[220px] shrink-0 w-full">
            <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-widest mb-3 px-1">Sections</p>
            <ul className="space-y-1">
              {sections.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all border-l-2
                      ${activeSection === s.id
                        ? 'text-[#081534] bg-[#eceef0] border-[#fdc425]'
                        : 'text-[#45464e] border-transparent hover:text-[#081534] hover:bg-[#f2f4f6]'}`}>
                    <span className="text-[#fdc425] text-[10px] font-bold w-5 shrink-0">{s.number}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>

            {/* Contact box */}
            <div className="mt-8 p-5 bg-white rounded-xl border border-[#eceef0] shadow-sm">
              <span className="material-symbols-outlined text-[#fdc425] text-[24px] block mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              <h4 className="text-[13px] font-bold text-[#081534] mb-1">Have questions?</h4>
              <p className="text-[11px] text-[#45464e] mb-4 leading-relaxed">Contact us about any legal concerns.</p>
              <a href="mailto:spotlightchurch@gmail.com"
                className="w-full py-2 bg-[#081534] text-white rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">mail</span>
                Email Us
              </a>
            </div>
          </aside>

          {/* Main content */}
          <div ref={contentRef} className="flex-1 space-y-6">
            {sections.map((s, i) => (
              <motion.article
                key={s.id}
                id={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`p-7 sm:p-9 rounded-2xl border scroll-mt-28 relative overflow-hidden
                  ${s.dark
                    ? 'bg-[#081534] border-transparent text-white'
                    : 'bg-white border-[#eceef0] text-[#45464e]'}`}>

                {s.dark && (
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#fdc425]/10 rounded-full blur-[60px] pointer-events-none" />
                )}

                <h2 className={`flex items-center gap-3 text-[18px] sm:text-[22px] font-bold mb-5 ${s.dark ? 'text-white' : 'text-[#081534]'}`}>
                  <span className="w-8 h-8 rounded-lg bg-[#fdc425] flex items-center justify-center text-[#081534] text-[11px] font-bold shrink-0">
                    {s.number}
                  </span>
                  {s.title}
                </h2>

                <div className={`text-[14px] sm:text-[15px] leading-[1.85] ${s.dark ? 'text-white/75' : ''}`}>
                  {s.content}
                </div>
              </motion.article>
            ))}

            {/* Footer CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="p-8 sm:p-10 bg-white rounded-2xl border border-[#eceef0] text-center shadow-sm">
              <h2 className="text-[#081534] text-[20px] sm:text-[24px] font-bold mb-3">Questions about our Terms?</h2>
              <p className="text-[#45464e] text-[14px] mb-6 max-w-lg mx-auto leading-relaxed">
                If you have any questions or concerns about these Terms of Service, our team is happy to provide clarity.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a href="mailto:spotlightchurch@gmail.com"
                  className="flex items-center gap-2 bg-[#081534] text-white px-6 py-3 rounded-full text-[13px] font-bold hover:opacity-90 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  Contact Us
                </a>
                <Link href="/"
                  className="flex items-center gap-2 border border-[#c6c6cf] text-[#45464e] px-6 py-3 rounded-full text-[13px] font-semibold hover:bg-[#f2f4f6] transition-all active:scale-95">
                  Back to Home
                </Link>
              </div>
            </motion.div>

            {/* Bottom links */}
            <div className="flex flex-wrap gap-4 justify-center text-[12px] text-[#76777f]">
              <Link href="/privacy-policy" className="hover:text-[#fdc425] transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link href="/contact" className="hover:text-[#fdc425] transition-colors">Contact Us</Link>
              <span>·</span>
              <Link href="/community" className="hover:text-[#fdc425] transition-colors">Community</Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}