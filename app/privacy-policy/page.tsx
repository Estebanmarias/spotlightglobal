'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const sections = [
  {
    icon: 'database',
    title: 'Information We Collect',
    content: (
      <>
        <p>We collect information you provide directly when you register, join a ministry, submit a partner form, or contact us. This includes:</p>
        <ul className="mt-4 space-y-3">
          {[
            'Name, email address, and phone number',
            'Date of birth and home address (for membership records)',
            'WhatsApp and Telegram handles (for ministry communication)',
            'Partnership details and giving preferences',
            'Testimonies and prayer requests submitted publicly',
          ].map(item => (
            <li key={item} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#fdc425] text-[18px] mt-0.5 shrink-0">check_circle</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    icon: 'insights',
    title: 'How We Use Your Data',
    content: (
      <>
        <p>Your information is used solely to serve you as part of theSpotlightChurch community. Specifically:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          {[
            { title: 'Membership Management', desc: 'Managing your registration, attendance records, and ministry assignments.' },
            { title: 'Communication', desc: 'Sending service reminders, event updates, and ministry news via email or Telegram.' },
            { title: 'Partnership Tracking', desc: 'Processing and managing your partnership commitments and giving records.' },
            { title: 'Community Building', desc: 'Connecting you with the right ministries, leaders, and church programmes.' },
          ].map(card => (
            <div key={card.title} className="p-5 bg-[#f7f9fb] rounded-xl border border-[#eceef0] hover:border-[#fdc425]/40 transition-colors">
              <h4 className="text-[12px] font-bold text-[#081534] uppercase tracking-widest mb-2">{card.title}</h4>
              <p className="text-[13px] text-[#45464e] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    icon: 'cookie',
    title: 'Cookies',
    content: (
      <>
        <p>
          Our website uses cookies to enhance your experience. Cookies are small files stored on your device
          that help us remember your preferences and keep your admin session active.
        </p>
        <div className="mt-5 p-5 bg-[#081534]/5 rounded-xl border-l-4 border-[#fdc425]">
          <p className="text-[14px] text-[#191c1e] leading-relaxed">
            <span className="font-bold text-[#081534]">Note:</span> You can disable cookies in your browser settings.
            However, the Admin Portal requires cookies to maintain your login session and will not function correctly without them.
          </p>
        </div>
      </>
    ),
  },
  {
    icon: 'shield_lock',
    title: 'Data Security',
    content: (
      <>
        <p>
          We take the security of your personal data seriously. All data is stored securely in Supabase
          with row-level security policies ensuring only authorised administrators can access member records.
        </p>
        <p className="mt-4">
          All connections to our platform are encrypted via SSL/TLS. Admin accounts require approved credentials
          and are managed exclusively by the lead pastor (Setman). We never sell or share your data with third parties.
        </p>
      </>
    ),
  },
  {
    icon: 'manage_accounts',
    title: 'Your Rights',
    content: (
      <>
        <p>You have the right to:</p>
        <ul className="mt-4 space-y-3">
          {[
            'Request access to the personal data we hold about you',
            'Request correction of inaccurate information',
            'Request deletion of your data from our records',
            'Withdraw consent for communications at any time',
          ].map(item => (
            <li key={item} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#fdc425] text-[18px] mt-0.5 shrink-0">check_circle</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">To exercise any of these rights, contact us at the email below.</p>
      </>
    ),
  },
  {
    icon: 'update',
    title: 'Policy Updates',
    content: (
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
        We will notify registered members of significant changes via email. Continued use of our services after
        any changes constitutes acceptance of the updated policy.
      </p>
    ),
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#081534]/5 to-transparent pt-20 pb-12 px-6">
        <div className="max-w-[860px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fdc425]/15 text-[#081534] border border-[#fdc425]/20 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="material-symbols-outlined text-[#fdc425] text-[14px]">verified_user</span>
              Legal & Security
            </span>
            <h1 className="text-[#081534] text-[36px] sm:text-[48px] font-bold leading-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-[#45464e] text-[16px] sm:text-[18px] leading-[28px] max-w-2xl">
              Last updated: July 2026. This policy describes how theSpotlightChurch collects,
              uses, and protects your personal information.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="max-w-[860px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border border-[#eceef0] rounded-2xl p-8 sm:p-14 shadow-sm">

            <div className="space-y-14">
              {sections.map((s, i) => (
                <div key={s.title}>
                  {/* Section header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#f2f4f6] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#081534] text-[24px]">{s.icon}</span>
                    </div>
                    <h2 className="text-[#081534] text-[20px] sm:text-[24px] font-bold">{s.title}</h2>
                  </div>

                  <div className="text-[#45464e] text-[15px] leading-[1.8] pl-16">
                    {s.content}
                  </div>

                  {/* Divider — not after last */}
                  {i < sections.length - 1 && (
                    <div className="mt-14 h-px bg-gradient-to-r from-transparent via-[#c6c6cf]/40 to-transparent" />
                  )}
                </div>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="mt-16 p-8 sm:p-10 bg-[#081534] rounded-2xl text-center relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#fdc425]/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-[#fdc425]/5 rounded-full blur-[40px] pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-white text-[18px] sm:text-[20px] font-bold mb-3">
                  Questions about your privacy?
                </h3>
                <p className="text-white/60 text-[14px] mb-6 max-w-md mx-auto">
                  Our team is happy to clarify any concerns you have about how we handle your personal information.
                </p>
                <a href="mailto:spotlightchurch@gmail.com"
                  className="inline-flex items-center gap-2 bg-[#fdc425] text-[#6d5200] px-8 py-3 rounded-full text-[13px] font-bold hover:brightness-110 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  Contact Us
                </a>
              </div>
            </div>
          </motion.div>

          {/* Back links */}
          <div className="flex flex-wrap gap-4 justify-center mt-8 text-[12px] text-[#76777f]">
            <Link href="/" className="hover:text-[#fdc425] transition-colors">← Back to Home</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-[#fdc425] transition-colors">Contact Us</Link>
            <span>·</span>
            <Link href="/community" className="hover:text-[#fdc425] transition-colors">Community</Link>
          </div>
        </div>
      </section>

    </main>
  )
}