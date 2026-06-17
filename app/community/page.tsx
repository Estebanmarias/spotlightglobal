'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────
type ChurchEvent = {
  id: string
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  flyer_url: string | null
  location: string
  is_featured: boolean
}

type CommunityPhoto = {
  id: string
  image_url: string
  caption: string | null
}

// ── Static link-stack content (edit here) ───────────────────────────
const linkStack = [
  {
    icon: 'radio_button_checked', live: true,
    title: 'Daily Prayer — Live Service',
    meta: null,
    href: 'https://t.me/thespotlightchurchLive',
  },
  {
    icon: 'play_circle', live: false,
    title: 'Sunday Sermons & Teachings',
    meta: 'YouTube · @pstedetkingsley',
    href: 'https://www.youtube.com/@pstedetkingsley',
  },
  {
    icon: 'podcasts', live: false,
    title: 'Audio Teachings',
    meta: 'Sermons on the go',
    href: 'https://t.me/companyoftheblessed',
  },
  {
    icon: 'music_note', live: false,
    title: 'Latest Worship Single',
    meta: 'Listen on Spotify & Apple Music',
    href: 'https://kingdomboiz.com/download-music-edet-kingsley-holy-spirit-oyoyo/',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' } }),
}

export default function CommunityPage() {
  const supabase = getSupabaseClient()
  const [events, setEvents]   = useState<ChurchEvent[]>([])
  const [photos, setPhotos]   = useState<CommunityPhoto[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [photosLoading, setPhotosLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      // Upcoming events — today onward, soonest first
      const today = new Date().toISOString().split('T')[0]
      const { data: ev } = await supabase
        .from('church_events')
        .select('*')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(4)
      setEvents(ev || [])
      setEventsLoading(false)

      // Community photos
      const { data: ph } = await supabase
        .from('community_photos')
        .select('*')
        .order('sort_order', { ascending: true })
        .limit(8)
      setPhotos(ph || [])
      setPhotosLoading(false)
    }
    load()

    // Realtime — new events/photos show up without refresh
    const ch = supabase
      .channel('community-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'church_events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_photos' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return {
      day: date.toLocaleDateString('en-NG', { day: 'numeric' }),
      month: date.toLocaleDateString('en-NG', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('en-NG', { weekday: 'long' }),
    }
  }

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-[#081534]">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-30"
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1600&h=900&fit=crop"
            alt="Church sanctuary"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081534] via-[#081534]/80 to-transparent" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <motion.h1 variants={fadeUp} initial="hidden" animate="show"
            className="text-[40px] sm:text-[56px] font-bold leading-[1.1] text-white mb-6">
            Welcome to the Family
          </motion.h1>
          <motion.p variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="text-[16px] sm:text-[18px] leading-[28px] text-white/80 mb-10 max-w-2xl mx-auto">
            Whether it's your first time here or you've been part of the family for years —
            find everything you need to stay connected, watch live, and see what's happening this week.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#first-timer"
              className="bg-[#fdc425] text-[#6d5200] px-8 py-4 rounded-full text-[14px] font-bold hover:brightness-110 transition-all active:scale-95">
              I'm New Here
            </a>
            <a href="#links"
              className="border border-white/30 text-white px-8 py-4 rounded-full text-[14px] font-bold hover:bg-white/10 transition-all active:scale-95">
              Watch Live
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FIRST-TIMER CARD
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6" id="first-timer">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-white rounded-2xl border-2 border-[#fdc425] p-8 sm:p-12 shadow-lg flex flex-col sm:flex-row items-center gap-8">
          <div className="bg-[#fdc425]/20 p-6 rounded-full shrink-0">
            <span className="material-symbols-outlined text-[56px] text-[#785a00]"
              style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-[24px] sm:text-[28px] font-bold text-[#081534] mb-3">First Visit? Let's Get to Know You</h2>
            <p className="text-[15px] text-[#45464e] mb-6">
              We're so glad you're here. Fill out a quick form so we can welcome you properly
              and share more about what makes theSpotlightChurch a home.
            </p>
            <Link href="/join"
              className="inline-block bg-[#081534] text-white px-8 py-3 rounded-full text-[14px] font-bold hover:opacity-90 transition-all">
              Tell Us About Yourself
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          UPCOMING SERVICES — live from Supabase
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <span className="text-[#785a00] text-[12px] font-bold uppercase tracking-widest">What's Happening</span>
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mt-2">Upcoming Services</h2>
            <p className="text-[15px] text-[#45464e] mt-3 max-w-xl mx-auto">Don't miss what's coming up — services, special events, and gatherings.</p>
          </motion.div>

          {eventsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-[#f2f4f6] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-[#f7f9fb] rounded-xl border border-[#c6c6cf]">
              <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-3">event</span>
              <p className="text-[#45464e] font-semibold">No upcoming services scheduled yet</p>
              <p className="text-[13px] text-[#76777f] mt-1">Check back soon, or join us this Sunday</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {events.map((e, i) => {
                const { day, month, weekday } = formatDate(e.event_date)
                return (
                  <motion.div key={e.id}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`rounded-xl overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-1
                      ${e.is_featured ? 'border-[#fdc425] ring-2 ring-[#fdc425]/20' : 'border-[#c6c6cf]'}`}>
                    {e.flyer_url ? (
                      <div className="h-40 overflow-hidden bg-[#eceef0]">
                        <img src={e.flyer_url} alt={e.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-40 bg-[#081534] flex flex-col items-center justify-center text-white">
                        <span className="text-[32px] font-bold leading-none">{day}</span>
                        <span className="text-[12px] font-bold uppercase tracking-widest text-[#fdc425] mt-1">{month}</span>
                      </div>
                    )}
                    <div className="p-4 bg-white">
                      {e.is_featured && (
                        <span className="inline-block px-2 py-0.5 bg-[#fdc425] text-[#6d5200] rounded-full text-[9px] font-bold uppercase tracking-wider mb-2">
                          Featured
                        </span>
                      )}
                      <h3 className="text-[15px] font-bold text-[#081534] leading-snug mb-1">{e.title}</h3>
                      <p className="text-[12px] text-[#45464e]">{weekday}{e.event_time ? ` · ${e.event_time}` : ''}</p>
                      <p className="text-[11px] text-[#76777f] mt-0.5">{e.location}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          COMMUNITY GALLERY — curated, swappable for IG API later
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-[#f7f9fb]">
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <span className="text-[#785a00] text-[12px] font-bold uppercase tracking-widest">Moments</span>
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mt-2">From Our Community</h2>
            <p className="text-[15px] text-[#45464e] mt-3 max-w-xl mx-auto">A glimpse into life at theSpotlightChurch — worship, fellowship, and everything in between.</p>
          </motion.div>

          {photosLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-[#eceef0] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[#c6c6cf]">
              <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-3">photo_library</span>
              <p className="text-[#45464e] font-semibold">Gallery coming soon</p>
              <p className="text-[13px] text-[#76777f] mt-1">Follow us on Instagram for the latest moments</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer">
                  <img src={p.image_url} alt={p.caption ?? 'Community photo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081534]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    {p.caption && <p className="text-white text-[11px] font-semibold line-clamp-2">{p.caption}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <a href="#" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#c6c6cf] rounded-full text-[13px] font-bold text-[#081534] hover:border-[#081534] transition-all">
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="igfollow" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <path fill="url(#igfollow)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
              Follow us on Instagram for daily updates
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          LINK STACK
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-white" id="links">
        <div className="max-w-[560px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10">
            <h2 className="text-[24px] sm:text-[28px] font-bold text-[#081534]">Watch, Listen & Stay Connected</h2>
          </motion.div>
          <div className="flex flex-col gap-3">
            {linkStack.map((item, i) => (
              <motion.a key={item.title} href={item.href}
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group flex items-center p-4 sm:p-5 bg-[#f7f9fb] rounded-xl border border-[#c6c6cf] hover:-translate-y-0.5 hover:shadow-md hover:bg-white transition-all">
                <div className="relative mr-4 shrink-0">
                  <span className="material-symbols-outlined text-[#081534] text-[28px]">{item.icon}</span>
                  {item.live && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-[#f7f9fb] animate-pulse" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-[#081534]">{item.title}</span>
                    {item.live && (
                      <span className="text-[9px] bg-[#ba1a1a] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
                    )}
                  </div>
                  {item.meta && <p className="text-[12px] text-[#45464e] mt-0.5">{item.meta}</p>}
                </div>
                <span className="material-symbols-outlined text-[#76777f] group-hover:translate-x-1 transition-transform">chevron_right</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SOCIAL HUB
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 bg-[#f7f9fb]">
        <div className="max-w-275 mx-auto text-center">
          <h3 className="text-[12px] font-bold text-[#45464e] uppercase tracking-widest mb-8">Connect With Us</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { 
                name: 'WhatsApp', 
                href: 'https://wa.me/YOUR_NUMBER', // Add your WhatsApp link here
                color: '#25D366', 
                path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' 
              },
              { 
                name: 'Email', 
                href: 'mailto:hello@thespotlightchurch.com', // Add your email address
                color: '#081534', 
                icon: 'mail' 
              },
              { 
                name: 'YouTube', 
                href: 'https://www.youtube.com/@pstedetkingsley', // Add your YouTube channel link
                color: '#FF0000', 
                path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' 
              },
              { 
                name: 'Instagram', 
                href: 'https://instagram.com/thespotlightchurch', // Add your Instagram link
                gradient: true,
                path: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.863.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.756 6.162 6.162 6.162 3.405 0 6.162-2.757 6.162-6.162 0-3.402-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z'
              },
              { 
                name: 'TikTok', 
                href: 'https://tiktok.com/@yourhandle', // Add your TikTok link
                color: '#ffffff', 
                path: 'M12.525.02c1.31.036 2.512.335 3.6.855-.063 1.582.502 3.006 1.541 4.212.428.497 1.037.935 1.637 1.258V9.3c-1.347-.132-2.316-.62-3.18-1.428-.403-.377-.733-.825-1.025-1.304-.047 3.52-.008 7.04-.012 10.56-.017 1.83-.557 3.444-1.782 4.757-1.314 1.41-3.036 2.122-4.996 2.115-2.023-.007-3.738-.767-4.97-2.362-1.34-1.733-1.635-4.223-.526-6.196.887-1.577 2.408-2.673 4.195-2.816v3.253c-1.013.133-1.848.563-2.348 1.464-.492.886-.445 2.13.25 2.92.56.638 1.306.947 2.148.922 1.378-.04 2.378-1.002 2.457-2.378.03-1.843.015-3.687.015-5.53V.02h2.596z' 
              },
              { 
                name: 'Spotify', 
                href: 'https://open.spotify.com/show/75PSP2x3mArsPABn4KReUY?si=9pyOmuWlShORXAyODUEQTw', // Add your Spotify link
                color: '#1DB954', 
                path: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.59 17.357c-.225.369-.706.488-1.074.263-2.905-1.776-6.561-2.176-10.866-1.192-.423.096-.84-.17-.937-.593-.096-.423.17-.84.593-.937 4.71-1.076 8.74-.622 11.981 1.359.37.224.489.706.263 1.074zm1.493-3.268c-.284.46-.884.61-1.344.327-3.325-2.044-8.391-2.636-12.32-1.443-.518.157-1.066-.142-1.223-.66-.157-.518.142-1.066.66-1.223 4.494-1.362 10.076-.704 13.9 1.649.46.284.61.884.327 1.344zm.13-3.4c-3.985-2.367-10.559-2.586-14.364-1.43-.612.185-1.258-.168-1.443-.779-.186-.612.168-1.258.779-1.443 4.36-1.323 11.602-1.063 16.205 1.669.551.327.734 1.036.407 1.587-.327.551-1.036.734-1.584.407z' 
              },
            ].map((s, i) => (
              <motion.a 
                key={s.name} 
                href={s.href}     // <--- UPDATED: Dynamic link mapped from the array
                target="_blank"   // <--- UPDATED: Opens in a new tab
                rel="noreferrer"  // <--- UPDATED: Security best practice for target="_blank"
                aria-label={s.name}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="w-14 h-14 rounded-full bg-[#081534] flex items-center justify-center hover:bg-[#fdc425] transition-all active:scale-90 group">
                
                {s.icon ? (
                  <span className="material-symbols-outlined text-white group-hover:text-[#6d5200] text-[22px]">{s.icon}</span>
                ) : s.gradient ? (
                  <svg viewBox="0 0 24 24" className="w-6 h-6"> {/* Unified to standard 24x24 viewBox */}
                    <defs>
                      <linearGradient id={`ig-${i}`} x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/>
                      </linearGradient>
                    </defs>
                    <path fill={`url(#ig-${i})`} d={s.path} /> {/* Path is now pulled dynamically */}
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-6 h-6"> {/* Unified to standard 24x24 viewBox */}
                    <path fill={s.color} d={s.path} />
                  </svg>
                )}
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CLOSING FOOTER
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#081534] py-20 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center">
          <h2 className="text-[28px] sm:text-[32px] font-bold text-white mb-4 leading-snug">
            We are one body, shining one light. We can't wait to see you soon.
          </h2>
          {/* <div className="flex gap-4 flex-wrap justify-center opacity-80 mt-8 text-[13px]">
            <Link href="#" className="text-white/60 hover:text-[#fdc425] transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-white/60 hover:text-[#fdc425] transition-colors">Terms of Service</Link>
            <Link href="#" className="text-white/60 hover:text-[#fdc425] transition-colors">Contact Us</Link>
            <Link href="/giving" className="text-[#fdc425] font-bold hover:brightness-110 transition-all">Give</Link>
          </div> */}
        </motion.div>
      </section>

    </main>
  )
}