'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' } }),
}

const pillars = [
  { icon: 'savings', title: 'Tithes & Offerings', desc: 'Honoring God with our first and our tenth, and worshipping Him with our freewill offerings.' },
  { icon: 'energy_savings_leaf', title: 'Prophetic Seeds', desc: 'Sowing purposefully into the anointing, specific kingdom instructions, and thanksgiving for a supernatural harvest.' },
  { icon: 'handshake', title: 'Kingdom Partnership', desc: 'Joining forces to fund church projects, welfare, and taking the gospel to the ends of the earth.' },
]

// ── Account data ─────────────────────────────────────────────────────
const localAccounts = [
  { id: 1, purpose: 'Tithes & Offerings', bank: 'GTBank',     accountName: 'Spotlight Global', accountNo: '0123456789' },
  { id: 2, purpose: 'Welfare & Charity',  bank: 'Zenith Bank', accountName: 'Spotlight Global', accountNo: '0987654321' },
  { id: 3, purpose: 'Building Project',   bank: 'Moniepoint',  accountName: 'Spotlight Global', accountNo: '8877665544' },
]

const intlAccounts = [
  { id: 4, purpose: 'Global Missions (USD)', bank: 'Chase Bank', accountName: 'Spotlight Global LLC', accountNo: '123456789', routing: '987654321', swift: 'CHASUS33' },
  { id: 5, purpose: 'UK Partners (GBP)',      bank: 'Barclays',   accountName: 'Spotlight Global UK',  accountNo: '55667788',  sortCode: '20-00-00', swift: 'BARCGB22' },
]

// ── Copyable row ─────────────────────────────────────────────────────
function CopyRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between bg-[#f7f9fb] px-4 py-2.5 rounded-lg border border-[#eceef0]">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-[#45464e] uppercase tracking-wider">{label}</span>
        <span className="font-mono text-[#081534] tracking-wider text-[14px] font-semibold mt-0.5">{value}</span>
      </div>
      <button onClick={onCopy}
        className="p-2 rounded-lg text-[#76777f] hover:text-[#081534] hover:bg-[#eceef0] transition-all"
        title="Copy">
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="material-symbols-outlined text-[18px] text-green-600">check</motion.span>
          ) : (
            <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="material-symbols-outlined text-[18px]">content_copy</motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}

export default function GivingPage() {
  const [accountTab, setAccountTab] = useState<'local' | 'intl'>('local')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

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

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

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
              className="text-[40px] sm:text-[56px] font-bold leading-[1.1] text-white mb-4">
              Partner With the Kingdom
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} initial="hidden" animate="show"
              className="text-[16px] sm:text-[18px] leading-[28px] text-white/90">
              Your giving is a covenant practice that empowers the church to shine His light while guaranteeing your own supernatural harvest.
            </motion.p>
          </div>
        </div>
      </header>

      {/* ── Why We Give ── */}
      <section className="py-20 sm:py-24 bg-[#f7f9fb]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 grid md:grid-cols-2 gap-12 sm:gap-16 items-center">
          <div className="relative group reveal opacity-0 translate-y-8 transition-all duration-700">
            <div className="absolute -inset-4 bg-[#785a00]/10 rounded-xl -rotate-2 group-hover:rotate-0 transition-transform duration-500" />
            <img
              className="relative rounded-lg shadow-xl w-full h-[320px] sm:h-[400px] object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4S2KcFmSARhXglOpoP3l0HvVSGpWhmVcU8vy2wN4KhriDdnKUKrMOPvkA8YHJlGBQrrUnLzBvUlTluYBoF60EsLZmIaAW_qkVAmrNVhUMOAb8eV07jn5n4gTzdLpUdT_F4H2P_K2gxJFFZ8gp22Mu6cOwRDakgl_2_Vofr_DBostS2-McUbBSI_bLjBqEpxumf7IURsy2MynMtkQ1qc_GDRIFZZVnNYt9xHNp1byi2U5V8575aurhDSKXfxQNsc4_X-qqW5zVyoQ"
              alt="Community impact" />
          </div>
          <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[28px] sm:text-[32px] font-bold leading-[1.25] text-[#081534] mb-6">A Covenant of Blessing</h2>
            <p className="text-[15px] sm:text-[16px] leading-[24px] text-[#45464e] mb-8">
              At theSpotlightChurch, we believe that giving is a profound act of worship and obedience. Whether it is your tithe, a freewill offering, or a prophetic seed, your financial partnership empowers us to advance the Gospel, execute kingdom projects, and be a blessing to our community.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="border-l-4 border-[#fdc425] pl-4">
                <span className="block text-[22px] sm:text-[24px] font-semibold text-[#081534]">1,200+</span>
                <span className="text-[13px] sm:text-[14px] font-semibold text-[#45464e]">Lives Impacted</span>
              </div>
              <div className="border-l-4 border-[#fdc425] pl-4">
                <span className="block text-[22px] sm:text-[24px] font-semibold text-[#081534]">50+</span>
                <span className="text-[13px] sm:text-[14px] font-semibold text-[#45464e]">Kingdom Projects</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="py-20 sm:py-24 bg-[#f2f4f6]">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16">
          <div className="text-center mb-12 sm:mb-16 reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[28px] sm:text-[32px] font-bold leading-[1.25] text-[#081534] mb-4">Channels of Giving</h2>
            <p className="text-[15px] sm:text-[16px] text-[#45464e]">Sow purposefully towards kingdom advancement.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <div key={p.title}
                className="reveal opacity-0 translate-y-8 transition-all duration-700 bg-white p-7 sm:p-8 rounded-xl border border-[#c6c6cf] hover:border-[#785a00] transition-all group"
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="w-12 h-12 bg-[#fdc425] rounded-lg flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[#6d5200]">{p.icon}</span>
                </div>
                <h3 className="text-[20px] sm:text-[22px] font-semibold text-[#081534] mb-3">{p.title}</h3>
                <p className="text-[14px] sm:text-[15px] text-[#45464e] mb-6">{p.desc}</p>
                <a className="inline-flex items-center gap-2 text-[13px] sm:text-[14px] font-bold text-[#785a00] group-hover:underline" href="#">
                  Learn more <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ACCOUNT NUMBERS — replaces the old Giving Portal
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 bg-[#f7f9fb]">
        <div className="max-w-[1100px] mx-auto px-6 md:px-16">

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10">
            <span className="text-[#785a00] text-[12px] font-bold uppercase tracking-widest">Bank Transfer</span>
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mt-2 mb-4">Give Directly to Our Accounts</h2>
            <p className="text-[15px] text-[#45464e] max-w-xl mx-auto">
              Choose a channel below and transfer directly. Tap any field to copy it instantly.
            </p>
          </motion.div>

          {/* Tab switcher */}
          <div className="flex justify-center mb-10">
            <div className="bg-white border border-[#c6c6cf] p-1 rounded-full flex gap-1 shadow-sm">
              <button onClick={() => setAccountTab('local')}
                className={`px-6 py-2.5 rounded-full font-bold text-[13px] transition-all duration-200
                  ${accountTab === 'local' ? 'bg-[#081534] text-white shadow-sm' : 'text-[#45464e] hover:text-[#081534]'}`}>
                Local (NGN)
              </button>
              <button onClick={() => setAccountTab('intl')}
                className={`px-6 py-2.5 rounded-full font-bold text-[13px] transition-all duration-200
                  ${accountTab === 'intl' ? 'bg-[#081534] text-white shadow-sm' : 'text-[#45464e] hover:text-[#081534]'}`}>
                International
              </button>
            </div>
          </div>

          {/* Local accounts */}
          <AnimatePresence mode="wait">
            {accountTab === 'local' && (
              <motion.div key="local"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {localAccounts.map((acc, i) => (
                  <motion.div key={acc.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white border border-[#c6c6cf] rounded-xl p-6 flex flex-col justify-between hover:border-[#081534]/30 hover:shadow-md transition-all">
                    <div>
                      <p className="text-[10px] font-bold text-[#785a00] uppercase tracking-widest mb-3">
                        {acc.purpose}
                      </p>
                      <h3 className="text-[19px] font-bold text-[#081534] mb-0.5">{acc.bank}</h3>
                      <p className="text-[13px] text-[#45464e] mb-5">{acc.accountName}</p>
                    </div>
                    <CopyRow label="Account Number" value={acc.accountNo}
                      copied={copiedKey === `local-${acc.id}`}
                      onCopy={() => handleCopy(acc.accountNo, `local-${acc.id}`)} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* International accounts */}
            {accountTab === 'intl' && (
              <motion.div key="intl"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {intlAccounts.map((acc, i) => (
                  <motion.div key={acc.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white border border-[#c6c6cf] rounded-xl p-6 flex flex-col gap-5 hover:border-[#081534]/30 hover:shadow-md transition-all">
                    <div>
                      <p className="text-[10px] font-bold text-[#785a00] uppercase tracking-widest mb-3">
                        {acc.purpose}
                      </p>
                      <h3 className="text-[19px] font-bold text-[#081534] mb-0.5">{acc.bank}</h3>
                      <p className="text-[13px] text-[#45464e]">{acc.accountName}</p>
                    </div>

                    <div className="space-y-2.5">
                      <CopyRow label="Account No" value={acc.accountNo}
                        copied={copiedKey === `intl-acct-${acc.id}`}
                        onCopy={() => handleCopy(acc.accountNo, `intl-acct-${acc.id}`)} />

                      {'routing' in acc ? (
                        <CopyRow label="Routing Number" value={acc.routing!}
                          copied={copiedKey === `intl-route-${acc.id}`}
                          onCopy={() => handleCopy(acc.routing!, `intl-route-${acc.id}`)} />
                      ) : (
                        <CopyRow label="Sort Code" value={acc.sortCode!}
                          copied={copiedKey === `intl-sort-${acc.id}`}
                          onCopy={() => handleCopy(acc.sortCode!, `intl-sort-${acc.id}`)} />
                      )}

                      <CopyRow label="SWIFT / BIC Code" value={acc.swift}
                        copied={copiedKey === `intl-swift-${acc.id}`}
                        onCopy={() => handleCopy(acc.swift, `intl-swift-${acc.id}`)} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust note */}
          <div className="flex items-center justify-center gap-2 mt-10">
            <span className="material-symbols-outlined text-[16px] text-[#081534]"
              style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-[12px] font-semibold text-[#45464e]">
              All accounts are officially registered under Spotlight Global
            </span>
          </div>
        </div>
      </section>

      {/* ── Other Ways ── */}
      <section className="py-20 sm:py-24 bg-[#081534] text-white">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 text-center reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-[28px] sm:text-[32px] font-bold mb-12">Other Ways to Give</h2>
          <div className="grid md:grid-cols-2 gap-10 sm:gap-12 max-w-2xl mx-auto">
            {[
              { icon: 'point_of_sale', title: 'In-Service', desc: 'Use our POS terminals or giving envelopes during any of our physical services.' },
              { icon: 'dialpad', title: 'USSD Code', desc: 'Use our dedicated USSD codes for quick, offline, and seamless giving.' },
            ].map(w => (
              <div key={w.title} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px]">{w.icon}</span>
                </div>
                <h4 className="text-[20px] sm:text-[22px] font-semibold mb-2">{w.title}</h4>
                <p className="text-[14px] sm:text-[15px] text-white/70">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}