'use client'

import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Link from 'next/link'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] } }),
}

const statCards = [
  { icon: 'church',             label: 'Founded',      value: 'theSpotlightChurch' },
  { icon: 'volunteer_activism', label: 'Daily Prayer',  value: '5:00 AM' },
  { icon: 'auto_stories',       label: 'Sermons',       value: '1,200+' },
  { icon: 'school',             label: 'Teachings',     value: 'Global' },
]

export default function PastorPage() {
  return (
    <main className="bg-[#f7f9fb] text-[#191c1e] overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center bg-[#081534] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/apostle-1.jpg"
          alt="Apostle Edet Kingsley"
          className="w-full h-full object-cover object-top opacity-60"
        />
        {/* Gradient sits on top of image, both inside z-0 wrapper */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#081534] via-[#081534]/60 to-transparent" />
      </div>

        <div className="relative z-20 w-full max-w-[1280px] mx-auto px-6 md:px-16 py-24">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="max-w-2xl">
            <span className="text-[#fdc425] text-[11px] font-bold tracking-[0.2em] uppercase mb-4 block">
              Lead Pastor · theSpotlightChurch
            </span>
            <h1 className="text-white text-[48px] sm:text-[64px] lg:text-[80px] font-bold leading-[1.0] mb-6">
              Apostle Edet<br />Kingsley
            </h1>
            <p className="text-white/80 text-[16px] sm:text-[18px] leading-[28px] mb-10 max-w-xl">
              A voice of hope, a beacon of light, and a shepherd dedicated to revealing the
              transformative power of God's love to our generation.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="https://www.youtube.com/@pstedetkingsley" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 bg-[#fdc425] text-[#6d5200] px-8 py-4 rounded-full text-[13px] font-bold hover:brightness-110 transition-all active:scale-95">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                Watch Sermons
              </a>
              <a href="https://t.me/thespotlightchurchLive" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-full text-[13px] font-bold hover:bg-white/10 transition-all active:scale-95">
                <span className="material-symbols-outlined text-[18px]">radio_button_checked</span>
                Join Live Prayer
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── QUOTE BAND ───────────────────────────────────────────── */}
      <section className="bg-[#fdc425] py-8 px-6">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="text-[#6d5200] text-[16px] sm:text-[20px] font-bold leading-relaxed italic">
            "We are a people marvellously helped, greatly blessed, deeply loved, and highly favoured."
          </h2>
        </div>
      </section>

      {/* ── BIO & PROFILE ────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#f2f4f6]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-16">

            {/* Sticky sidebar */}
            <aside className="lg:w-1/3 lg:sticky lg:top-28 h-fit">
              {/* Portrait */}
              <div className="relative bg-white p-2 rounded-xl shadow-lg mb-8 group overflow-hidden">
                <div className="aspect-[4/5] rounded-lg overflow-hidden">
                  <img
                    src="/images/apostle-1.jpg"
                    alt="Apostle Edet Kingsley"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                {/* Gold border accent */}
                <div className="absolute inset-0 rounded-xl ring-2 ring-[#fdc425]/40 pointer-events-none" />
              </div>

              {/* Stat cards grid */}
              <div className="grid grid-cols-2 gap-4">
                {statCards.map(s => (
                  <div key={s.label}
                    className="bg-white p-5 rounded-xl border border-[#c6c6cf] flex flex-col items-center text-center hover:shadow-md transition-all">
                    <span className="material-symbols-outlined text-[#fdc425] text-[28px] mb-2"
                      style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    <span className="text-[11px] text-[#45464e] font-semibold uppercase tracking-wide mb-0.5">{s.label}</span>
                    <span className="text-[13px] font-bold text-[#081534] text-center leading-snug">{s.value}</span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Bio content */}
            <div className="lg:w-2/3">
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="space-y-8">

                <div>
                  <span className="inline-block px-4 py-1 bg-[#fdc425]/20 text-[#785a00] border border-[#fdc425]/40 rounded-full text-[12px] font-bold mb-4 uppercase tracking-widest">
                    Biography
                  </span>
                  <h2 className="text-[#081534] text-[28px] sm:text-[36px] lg:text-[44px] font-bold leading-tight">
                    Leading a Generation to the{' '}
                    <span className="text-[#785a00] italic">Spotlight</span>{' '}
                    of God's Presence.
                  </h2>
                </div>

                <div className="space-y-6 text-[#45464e] text-[15px] sm:text-[16px] leading-[1.85]">
                  <p>
                    <span className="text-[#081534] font-bold">Apostle Edet Kingsley</span> is a visionary leader,
                    teacher, and apostle called to awaken the world to the reality of the Holy Spirit. As the lead pastor
                    of theSpotlightChurch, he has fostered a community where diversity is celebrated and spiritual
                    stability is the foundation of every life.
                  </p>
                  <p>
                    His ministry is marked by a unique blend of corporate excellence and spiritual depth. Beyond the
                    pulpit, Apostle Kingsley is a renowned gospel artist whose music has touched millions globally.
                    His landmark anthem,{' '}
                    <span className="text-[#081534] font-bold italic">"Holy Spirit Oyoyo,"</span>{' '}
                    has become a staple in worship sessions around the world, known for ushering in an atmosphere
                    of intense divine presence.
                  </p>
                  <p>
                    With years of ministry, his teachings focus on the practical application of the Word, empowering
                    believers to shine their light in the spheres of business, arts, and governance. He believes that
                    the church is not just a building, but a light-station where every member is equipped to impact
                    their world.
                  </p>
                </div>

                {/* CTA block */}
                <div className="p-8 bg-[#081534] rounded-2xl relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#fdc425]/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-white text-[18px] font-bold mb-1">Join our global community</h3>
                      <p className="text-white/60 text-[13px]">Connect with Apostle Edet Kingsley and the family today.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                      <Link href="/join"
                        className="bg-[#fdc425] text-[#6d5200] px-6 py-3 rounded-full text-[13px] font-bold hover:brightness-110 transition-all active:scale-95">
                        Join the Church
                      </Link>
                      <Link href="/community"
                        className="text-white border border-white/30 px-6 py-3 rounded-full text-[13px] font-bold hover:bg-white/10 transition-all active:scale-95">
                        Our Community
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Gospel artistry + leadership photo cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Gospel card */}
                  <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="group cursor-pointer rounded-xl overflow-hidden">
                    <div className="relative h-64 overflow-hidden">
                      <img src="/images/apostle-2.jpg" alt="Gospel Artistry"
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute inset-0 bg-[#fdc425]/0 group-hover:bg-[#fdc425]/10 transition-colors duration-500" />
                      <div className="absolute bottom-4 left-4">
                        <span className="text-[#fdc425] text-[10px] font-bold uppercase tracking-widest block mb-1">Gospel Artistry</span>
                        <h4 className="text-white text-[18px] font-bold">Holy Spirit Oyoyo</h4>
                      </div>
                      <a href="https://kingdomboiz.com/download-music-edet-kingsley-holy-spirit-oyoyo/"
                        target="_blank" rel="noreferrer"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#fdc425] text-[#6d5200] px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">music_note</span>
                        Listen
                      </a>
                    </div>
                  </motion.div>

                  {/* Leadership card */}
                  <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="group cursor-pointer rounded-xl overflow-hidden">
                    <div className="relative h-64 overflow-hidden">
                      <img src="/images/apostle-3.jpg" alt="Sunday Teachings"
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute inset-0 bg-[#081534]/0 group-hover:bg-[#081534]/20 transition-colors duration-500" />
                      <div className="absolute bottom-4 left-4">
                        <span className="text-[#fdc425] text-[10px] font-bold uppercase tracking-widest block mb-1">Leadership</span>
                        <h4 className="text-white text-[18px] font-bold">Sunday Teachings</h4>
                      </div>
                      <a href="https://www.youtube.com/@pstedetkingsley" target="_blank" rel="noreferrer"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 border border-white/30">
                        <span className="material-symbols-outlined text-[14px]">play_circle</span>
                        Watch
                      </a>
                    </div>
                  </motion.div>
                </div>

              </motion.div>
            </div>
          </div>
        </div>
      </section>

      

    </main>
  )
}