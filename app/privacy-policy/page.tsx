'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Icon from '@/components/Icon'
import { SITE_CONFIG } from '@/lib/site-config'
import LegalAccordion from '@/components/LegalAccordion'

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
            'Testimonies submitted for public display and private prayer requests submitted through church forms',
            'Event registration details, including attendance days, accommodation requests, accompanying children counts, special-session selections, and referral source',
            'Optional special requests and prayer requests submitted with event registrations',
            'Class registrations, including your name, email, phone number and class progress',
            'Notification subscriptions: if you choose to receive daily notifications, we store a technical address for your browser or device that its push service gives us. It is not linked to your name, email or phone number.',
            'Notes you send us about a gift you have given: your name, contact details, amount, purpose, date and optional transfer reference',
            'Questions you type into the website chat, which are sent to our server to find an answer. We do not keep them in our database, but our hosting provider’s technical logs may record them for a short time.',
          ].map(item => (
            <li key={item} className="flex items-start gap-3">
              <Icon name="check_circle" className="text-[#fdc425] text-[18px] mt-0.5 shrink-0" />
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
          that help us remember your preferences and keep your admin session active. With your consent, we also use analytics tools (including Google Analytics, Microsoft Clarity and Google Tag Manager) to understand how the site is used. These load only after you accept, and you can change your choice at any time from Cookie settings in the footer.
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
          We take the security of your personal data seriously. Member, event registration, class and prayer-request information is held in a secured, access-controlled database. Access is limited to approved church staff and only to the records their role requires, and pastoral prayer requests are further restricted to a small number of authorised pastoral leaders.
        </p>
        <p className="mt-4">
          Information sent between your device and our website is encrypted. We do not sell personal information. We use trusted third-party service providers for secure data storage, email delivery, website hosting and analytics, only to operate and improve our services. They handle information on our behalf under their own security and privacy commitments, and some of them may process it outside Nigeria. Payment card details are not collected through our forms.
        </p>
      </>
    ),
  },
  {
    icon: 'schedule',
    title: 'How Long We Keep Your Information',
    content: (
      <>
        <p>We keep personal information only for as long as we need it for the purpose it was given. In practice:</p>
        <ul className="mt-4 space-y-3">
          {[
            'Prayer requests are kept until our pastoral team has dealt with them, and for up to 90 days after that.',
            'Personal details on event registrations (name, email, phone, location and notes) are removed 12 months after the event. We keep anonymous totals.',
            'Records of the emails we send about events and classes are kept for 12 months.',
            'Notes you send us about a gift are kept for up to 24 months after we have reviewed them.',
            'For classes, we keep your name, the class and the completion date so your certificate can be verified. We remove your phone number after 24 months.',
            'Partnership submissions and administrative activity logs are kept for 24 months.',
            'Giving records are kept as financial records for as long as the law requires.',
            'Notification subscriptions are kept until you turn notifications off or your device tells us the subscription is no longer valid, and then they are deleted.',
          ].map(item => (
            <li key={item} className="flex items-start gap-3">
              <Icon name="check_circle" className="text-[#fdc425] text-[18px] mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">Our backups roll over every 30 days, so deleted information can remain in a backup for up to 30 days. You can ask us to delete your information at any time.</p>
      </>
    ),
  },
  {
    icon: 'campaign',
    title: 'Notifications',
    content: (
      <>
        <p>
          You can choose to receive a daily scripture or word of encouragement on your device. This is optional and off by default, and we only ask for permission after you tap the button.
        </p>
        <p className="mt-4">
          To stop, tap &quot;Turn off&quot; on the Community page, or block notifications for this site in your browser or phone settings. Notifications are delivered through your browser&apos;s push service (for example Google or Apple), which receives the message in order to deliver it.
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
              <Icon name="check_circle" className="text-[#fdc425] text-[18px] mt-0.5 shrink-0" />
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
              <Icon name="verified_user" className="text-[#fdc425] text-[14px]" />
              Legal & Security
            </span>
            <h1 className="text-[#081534] text-[36px] sm:text-[48px] font-bold leading-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-[#45464e] text-[16px] sm:text-[18px] leading-[28px] max-w-2xl">
              Last updated: November 2026. This policy describes how theSpotlightChurch collects,
              uses, and protects your personal information.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="max-w-[860px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="sm:bg-white sm:border sm:border-[#eceef0] sm:rounded-2xl sm:p-14 sm:shadow-sm">

            {/* Phones: collapsible sections */}
            <div className="sm:hidden">
              <LegalAccordion sections={sections} />
            </div>

            {/* Tablets and larger: the full page */}
            <div className="hidden space-y-14 sm:block">
              {sections.map((s, i) => (
                <div key={s.title}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#f2f4f6] flex items-center justify-center shrink-0">
                      <Icon name={s.icon} className="text-[#081534] text-[24px]" />
                    </div>
                    <h2 className="text-[#081534] text-[24px] font-bold">{s.title}</h2>
                  </div>

                  <div className="text-[#45464e] text-[15px] leading-[1.8] pl-16">
                    {s.content}
                  </div>

                  {i < sections.length - 1 && (
                    <div className="mt-14 h-px bg-gradient-to-r from-transparent via-[#c6c6cf]/40 to-transparent" />
                  )}
                </div>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="mt-10 sm:mt-16 p-8 sm:p-10 bg-[#081534] rounded-2xl text-center relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#fdc425]/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-[#fdc425]/5 rounded-full blur-[40px] pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-white text-[18px] sm:text-[20px] font-bold mb-3">
                  Questions about your privacy?
                </h3>
                <p className="text-white/60 text-[14px] mb-6 max-w-md mx-auto">
                  Our team is happy to clarify any concerns you have about how we handle your personal information.
                </p>
                <a href={`mailto:${SITE_CONFIG.email}`}
                  className="inline-flex items-center gap-2 bg-[#fdc425] text-[#6d5200] px-8 py-3 rounded-full text-[13px] font-bold hover:brightness-110 transition-all active:scale-95">
                  <Icon name="mail" className="text-[16px]" />
                  Contact Us
                </a>
              </div>
            </div>
          </motion.div>

          {/* Back links */}
          <div className="flex flex-wrap gap-4 justify-center mt-8 text-[12px] text-[#5f6068]">
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

