'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' } }),
}

const highlights = [
  { icon: 'church',       label: 'Founded',        value: 'theSpotlightChurch' },
  { icon: 'radio_button_checked', label: 'Daily Prayer', value: 'Live on Telegram' },
  { icon: 'play_circle',  label: 'Sermons',         value: 'YouTube · @pstedetkingsley' },
  { icon: 'podcasts',     label: 'Teachings',       value: 'Spotify & Telegram' },
]

export default function PastorPage() {
  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden bg-[#081534]">
        {/* Background portrait */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/apostle-edet-kingsley.jpg"
            alt="Apostle Edet Kingsley"
            className="w-full h-full object-cover object-top opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081534] via-[#081534]/60 to-[#081534]/20" />
        </div>

        {/* Hero text */}
        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-6 pb-16 pt-32">
          <motion.p variants={fadeUp} initial="hidden" animate="show"
            className="text-[#fdc425] text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
            Lead Pastor · theSpotlightChurch
          </motion.p>
          <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="text-white text-[48px] sm:text-[64px] lg:text-[80px] font-bold leading-[1.0] mb-6">
            Apostle Edet<br />Kingsley
          </motion.h1>
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="flex flex-wrap gap-3">
            <a href="https://www.youtube.com/@pstedetkingsley" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-[#fdc425] text-[#6d5200] px-6 py-3 rounded-full text-[13px] font-bold hover:brightness-110 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              Watch Sermons
            </a>
            <a href="https://t.me/thespotlightchurchLive" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full text-[13px] font-bold hover:bg-white/20 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[16px]">radio_button_checked</span>
              Join Live Prayer
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── QUOTE BAND ───────────────────────────────────────────── */}
      <section className="bg-[#fdc425] py-8 px-6">
        <div className="max-w-[900px] mx-auto text-center">
          <p className="text-[#6d5200] text-[16px] sm:text-[20px] font-bold leading-relaxed italic">
            "We are a people marvellously helped, greatly blessed, deeply loved, and highly favoured."
          </p>
          <p className="text-[#785a00] text-[12px] font-semibold mt-2 uppercase tracking-widest">— Apostle Edet Kingsley</p>
        </div>
      </section>

      {/* ── BIO ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

            {/* Portrait card */}
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="shrink-0 lg:sticky lg:top-24">
              <div className="relative">
                <div className="absolute -inset-2 rounded-[24px] bg-gradient-to-br from-[#fdc425] via-[#fdc425]/40 to-transparent" />
                <div className="relative w-[260px] sm:w-[300px] rounded-[22px] overflow-hidden bg-[#1e2a4a]"
                  style={{ aspectRatio: '3/4' }}>
                  <img
                    src="/images/apostle-edet-kingsley.webp"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Gold dot */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#fdc425] border-4 border-white" />
              </div>

              {/* Highlights */}
              <div className="mt-8 space-y-3 w-[260px] sm:w-[300px]">
                {highlights.map(h => (
                  <div key={h.label} className="flex items-center gap-3 p-3 bg-[#f7f9fb] rounded-xl border border-[#eceef0]">
                    <div className="w-8 h-8 rounded-lg bg-[#081534] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#fdc425] text-[16px]">{h.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#76777f] uppercase tracking-wide">{h.label}</p>
                      <p className="text-[12px] font-bold text-[#081534] truncate">{h.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bio text */}
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="flex-1 pt-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-[3px] bg-[#fdc425] rounded-full" />
                <span className="material-symbols-outlined text-[#fdc425] text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>church</span>
                <div className="w-12 h-[3px] bg-[#fdc425] rounded-full" />
              </div>

              <div className="space-y-5 text-[15px] sm:text-[16px] text-[#45464e] leading-[1.85]">
                <p>
                  <span className="text-[#081534] font-bold">Apostle Edet Kingsley</span> is the Setman of The Spotlight Church,
                   a vibrant ministry committed to raising believers who accurately represent Christ through sound doctrine, 
                  spiritual excellence, and purposeful living.
                </p>
                <p>
                  With a strong apostolic and teaching grace, he is passionate about unveiling <br /> God's Word with clarity, 
                  depth, and practical relevance. His ministry emphasizes spiritual growth, preparation for destiny, 
                  excellence in service, kingdom leadership, and the transforming power of God's presence. 
                  His messages challenge believers to pursue intimacy with God,
                   embrace discipline, and <br /> become effective ambassadors of Christ in every sphere of influence.
                </p>
                <p>
                    Through preaching, leadership development, discipleship, and mentorship, 
                    Pastor Edet is committed to equipping men and women to discover their God-given purpose, 
                    maximize their potential, and impact their generation for the Kingdom.
                </p>
                <p>
                  He is also a recording gospel artist — his music is a soundtrack of faith, hope, and the glory of God.
                  His debut single <span className="text-[#081534] font-semibold italic">Holy Spirit Oyoyo</span> has
                  touched lives across Nigeria and beyond, and is available on all major streaming platforms.
                </p>
                <p>
                  Under his leadership, theSpotlightChurch has grown into a community of believers who are not just
                  churchgoers but Kingdom ambassadors — marvellously helped, greatly blessed, deeply loved,
                  and highly favoured.
                </p>
              </div>

              {/* CTA block */}
              <div className="mt-10 p-6 bg-[#081534] rounded-2xl">
                <p className="text-white font-bold text-[16px] mb-1">Ready to be part of the family?</p>
                <p className="text-white/60 text-[13px] mb-5">Join us for service this Sunday — in person or online.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/join"
                    className="flex items-center gap-2 bg-[#fdc425] text-[#6d5200] px-6 py-3 rounded-full text-[13px] font-bold hover:brightness-110 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    Join the Church
                  </Link>
                  <Link href="/community"
                    className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full text-[13px] font-bold hover:bg-white/20 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-[16px]">groups</span>
                    Our Community
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CLOSING BANNER ───────────────────────────────────────── */}
      <section className="bg-[#081534] py-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto">
          <p className="text-[#fdc425] text-[11px] font-bold uppercase tracking-widest mb-4">theSpotlightChurch</p>
          <h2 className="text-white text-[24px] sm:text-[32px] font-bold leading-snug">
            We are one body, shining one light.
          </h2>
        </motion.div>
      </section>

    </main>
  )
}