'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, Variants, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════
// ⚙️  CONFIG — swap these two values when you have them
// ═══════════════════════════════════════════════════════════════
const YT_API_KEY     = 'AIzaSyAtd9uF8EknLxIfBzA2VenjaREwfPoI0Qo'
const YT_CHANNEL_ID  = 'PASTE_CHANNEL_ID_HERE' // e.g. UCxxxxxxxxxxxx
// ═══════════════════════════════════════════════════════════════

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

const linkStack = [
  { icon: 'radio_button_checked', live: true,  title: 'Daily Prayer — Live Service',    meta: null,                         href: 'https://t.me/thespotlightchurchLive' },
  { icon: 'play_circle',          live: false, title: 'Sunday Sermons & Teachings',     meta: 'YouTube · @pstedetkingsley', href: 'https://www.youtube.com/@pstedetkingsley' },
  { icon: 'podcasts',             live: false, title: 'Audio Teachings',                meta: 'Sermons on the go',          href: 'https://t.me/companyoftheblessed' },
  { icon: 'music_note',           live: false, title: 'Latest Worship Single',          meta: 'Listen on Spotify & Apple Music', href: 'https://kingdomboiz.com/download-music-edet-kingsley-holy-spirit-oyoyo/' },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' } }),
}

function buildColumns<T>(items: T[], n: number): T[][] {
  const cols: T[][] = Array.from({ length: n }, () => [])
  items.forEach((item, i) => cols[i % n].push(item))
  return cols
}

// ── Latest Sermon Section ────────────────────────────────────────
function LatestSermon({ autoplay }: { autoplay: boolean }) {
  const [videoId, setVideoId]   = useState<string | null>(null)
  const [title, setTitle]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${YT_CHANNEL_ID}&part=snippet&order=date&maxResults=1&type=video`
        )
        const data = await res.json()
        if (data.items?.[0]) {
          setVideoId(data.items[0].id.videoId)
          setTitle(data.items[0].snippet.title)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [])

  if (error) return null

  return (
    <section className="py-16 px-6 bg-[#081534]">
      <div className="max-w-[1100px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-10">
          <span className="text-[#fdc425] text-[12px] font-bold uppercase tracking-widest">Fresh Word</span>
          <h2 className="text-[28px] sm:text-[32px] font-bold text-white mt-2">Latest Sermon</h2>
          {title && <p className="text-white/60 text-[14px] mt-2 max-w-xl mx-auto">{title}</p>}
        </motion.div>

        {loading ? (
          <div className="w-full aspect-video bg-white/10 rounded-2xl animate-pulse max-w-4xl mx-auto" />
        ) : videoId ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>
        ) : null}

        <div className="text-center mt-8">
          <a href="https://www.youtube.com/@pstedetkingsley" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full text-[13px] font-bold hover:bg-white/20 transition-all">
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            View All Sermons on YouTube
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Events Carousel ──────────────────────────────────────────────
function EventsCarousel({ events }: { events: ChurchEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft]   = useState(false)
  const [canRight, setCanRight] = useState(true)

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return {
      day:     date.toLocaleDateString('en-NG', { day: 'numeric' }),
      month:   date.toLocaleDateString('en-NG', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('en-NG', { weekday: 'long' }),
      full:    date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
  }

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    checkScroll()
    return () => el.removeEventListener('scroll', checkScroll)
  }, [events])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' })
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-[#c6c6cf]">
        <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">event</span>
        <p className="text-[#45464e] font-semibold text-[16px]">No upcoming services scheduled yet</p>
        <p className="text-[13px] text-[#76777f] mt-1">Check back soon, or join us this Sunday</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Scroll buttons */}
      {canLeft && (
        <button onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-[#c6c6cf] flex items-center justify-center text-[#081534] hover:bg-[#081534] hover:text-white transition-all">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
      )}
      {canRight && (
        <button onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-[#c6c6cf] flex items-center justify-center text-[#081534] hover:bg-[#081534] hover:text-white transition-all">
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      )}

      {/* Cards */}
      <div ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-4 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {events.map((e, i) => {
          const { day, month, weekday, full } = formatDate(e.event_date)
          return (
            <motion.div key={e.id}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`shrink-0 w-[280px] sm:w-[300px] rounded-2xl overflow-hidden border transition-all hover:shadow-xl hover:-translate-y-1 bg-white
                ${e.is_featured ? 'border-[#fdc425] ring-2 ring-[#fdc425]/30' : 'border-[#c6c6cf]'}`}>

              {/* Image or date block */}
              {e.flyer_url ? (
                <div className="h-[180px] overflow-hidden relative">
                  <img src={e.flyer_url} alt={e.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {e.is_featured && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#fdc425] text-[#6d5200] rounded-full text-[9px] font-bold uppercase tracking-widest">
                      Featured
                    </span>
                  )}
                  {/* Date pill over image */}
                  <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-3 py-2 text-center">
                    <p className="text-white text-[20px] font-bold leading-none">{day}</p>
                    <p className="text-[#fdc425] text-[9px] font-bold uppercase tracking-widest mt-0.5">{month}</p>
                  </div>
                </div>
              ) : (
                <div className="h-[180px] bg-[#081534] flex flex-col items-center justify-center relative">
                  {e.is_featured && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#fdc425] text-[#6d5200] rounded-full text-[9px] font-bold uppercase tracking-widest">
                      Featured
                    </span>
                  )}
                  <span className="text-white text-[48px] font-bold leading-none">{day}</span>
                  <span className="text-[#fdc425] text-[13px] font-bold uppercase tracking-widest mt-1">{month}</span>
                </div>
              )}

              {/* Card body */}
              <div className="p-4">
                <h3 className="text-[15px] font-bold text-[#081534] leading-snug mb-2 line-clamp-2">{e.title}</h3>
                {e.description && (
                  <p className="text-[12px] text-[#45464e] mb-3 line-clamp-2 leading-relaxed">{e.description}</p>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#76777f]">
                    <span className="material-symbols-outlined text-[14px] text-[#fdc425]">calendar_today</span>
                    {full}{e.event_time ? ` · ${e.event_time}` : ''}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#76777f]">
                    <span className="material-symbols-outlined text-[14px] text-[#fdc425]">location_on</span>
                    {e.location}
                  </div>
                </div>
                <Link href="/join"
                  className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#081534] text-white rounded-xl text-[12px] font-bold hover:opacity-90 transition-opacity">
                  Join Us
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Dot indicators */}
      {events.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {events.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#c6c6cf]" />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────
export default function CommunityPage() {
  const supabase      = getSupabaseClient()
  const searchParams  = useSearchParams()
  const autoplay      = searchParams.get('autoplay') === '1'

  const [events, setEvents]           = useState<ChurchEvent[]>([])
  const [photos, setPhotos]           = useState<CommunityPhoto[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [photosLoading, setPhotosLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const closeLightbox = () => setLightboxIndex(null)
  const lightboxPrev  = () => setLightboxIndex(i => (i === null || i === 0 ? photos.length - 1 : i - 1))
  const lightboxNext  = () => setLightboxIndex(i => (i === null ? 0 : (i + 1) % photos.length))

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return
    if (e.key === 'Escape')     closeLightbox()
    if (e.key === 'ArrowLeft')  lightboxPrev()
    if (e.key === 'ArrowRight') lightboxNext()
  }, [lightboxIndex, photos.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data: ev } = await (supabase.from('church_events') as any)
        .select('*').gte('event_date', today).order('event_date', { ascending: true }).limit(8)
      setEvents(ev || [])
      setEventsLoading(false)

      const { data: ph } = await (supabase.from('community_photos') as any)
        .select('*').order('sort_order', { ascending: true }).limit(12)
      setPhotos(ph || [])
      setPhotosLoading(false)
    }
    load()

    const ch = supabase.channel('community-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'church_events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_photos' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const masonryCols2 = buildColumns(photos, 2)
  const masonryCols3 = buildColumns(photos, 3)

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-[#081534]">
        <div className="absolute inset-0 z-0">
          <img className="w-full h-full object-cover opacity-30"
            src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1600&h=900&fit=crop"
            alt="Church sanctuary" />
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
            <a href="#sermon"
              className="border border-white/30 text-white px-8 py-4 rounded-full text-[14px] font-bold hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              Latest Sermon
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── LATEST SERMON ────────────────────────────────────────── */}
      <div id="sermon">
        <LatestSermon autoplay={autoplay} />
      </div>

      {/* ── FIRST-TIMER CARD ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white" id="first-timer">
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

      {/* ── UPCOMING EVENTS CAROUSEL ──────────────────────────────── */}
      <section className="py-20 px-6 bg-[#f7f9fb]">
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="text-[#785a00] text-[12px] font-bold uppercase tracking-widest">What's Happening</span>
              <h2 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mt-1">Upcoming Services</h2>
            </div>
            <p className="text-[13px] text-[#76777f]">Swipe to see more →</p>
          </motion.div>

          {eventsLoading ? (
            <div className="flex gap-5 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="shrink-0 w-[280px] h-[360px] bg-[#eceef0] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <EventsCarousel events={events} />
          )}
        </div>
      </section>

      {/* ── COMMUNITY GALLERY ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <span className="text-[#785a00] text-[12px] font-bold uppercase tracking-widest">Moments</span>
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mt-2">From Our Community</h2>
            <p className="text-[15px] text-[#45464e] mt-3 max-w-xl mx-auto">
              A glimpse into life at theSpotlightChurch — worship, fellowship, and everything in between.
            </p>
          </motion.div>

          {photosLoading ? (
            <div className="hidden sm:flex gap-3 items-start">
              {[...Array(3)].map((_, c) => (
                <div key={c} className="flex-1 flex flex-col gap-3">
                  {[...Array(c === 1 ? 3 : 2)].map((_, r) => (
                    <div key={r} className="w-full bg-[#eceef0] rounded-xl animate-pulse"
                      style={{ height: `${160 + (c + r) * 30}px` }} />
                  ))}
                </div>
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 bg-[#f7f9fb] rounded-xl border border-[#c6c6cf]">
              <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-3">photo_library</span>
              <p className="text-[#45464e] font-semibold">Gallery coming soon</p>
              <p className="text-[13px] text-[#76777f] mt-1">Follow us on Instagram for the latest moments</p>
            </div>
          ) : (
            <>
              {/* Mobile 2-col */}
              <div className="flex gap-3 sm:hidden items-start">
                {masonryCols2.map((col, c) => (
                  <div key={c} className="flex-1 flex flex-col gap-3">
                    {col.map((p, r) => {
                      const idx = photos.indexOf(p)
                      return (
                        <motion.button key={p.id} type="button"
                          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                          transition={{ delay: (c + r) * 0.04 }}
                          onClick={() => setLightboxIndex(idx)}
                          className="group relative w-full overflow-hidden rounded-xl focus:outline-none"
                          style={{ aspectRatio: c === 0 ? (r % 2 === 0 ? '3/4' : '1/1') : (r % 2 === 0 ? '1/1' : '3/4') }}>
                          <img src={p.image_url} alt={p.caption ?? ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-[#081534]/0 group-hover:bg-[#081534]/40 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[16px]">zoom_in</span>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Desktop 3-col */}
              <div className="hidden sm:flex gap-4 items-start">
                {masonryCols3.map((col, c) => (
                  <div key={c} className="flex-1 flex flex-col gap-4">
                    {col.map((p, r) => {
                      const idx = photos.indexOf(p)
                      const aspects = ['3/4', '1/1', '4/3', '2/3', '1/1']
                      const aspect  = aspects[(c * 2 + r) % aspects.length]
                      return (
                        <motion.button key={p.id} type="button"
                          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                          transition={{ delay: (c * 0.1) + (r * 0.07) }}
                          onClick={() => setLightboxIndex(idx)}
                          className="group relative w-full overflow-hidden rounded-2xl focus:outline-none cursor-zoom-in"
                          style={{ aspectRatio: aspect }}>
                          <img src={p.image_url} alt={p.caption ?? ''} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-br from-[#fdc425]/0 via-transparent to-[#081534]/0 group-hover:from-[#fdc425]/10 group-hover:to-[#081534]/60 transition-all duration-500" />
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[16px]">zoom_in</span>
                            </div>
                          </div>
                          {p.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                              <p className="text-white text-[12px] font-semibold line-clamp-2">{p.caption}</p>
                            </div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="text-center mt-10">
            <a href="https://instagram.com/thespotlightchurch" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#f7f9fb] border border-[#c6c6cf] rounded-full text-[13px] font-bold text-[#081534] hover:border-[#081534] transition-all">
              <svg viewBox="0 0 24 24" className="w-4 h-4"><defs><linearGradient id="igg" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#igg)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              Follow us on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ── LINK STACK ────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#f7f9fb]" id="links">
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
                className="group flex items-center p-4 sm:p-5 bg-white rounded-xl border border-[#c6c6cf] hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className="relative mr-4 shrink-0">
                  <span className="material-symbols-outlined text-[#081534] text-[28px]">{item.icon}</span>
                  {item.live && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white animate-pulse" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-[#081534]">{item.title}</span>
                    {item.live && <span className="text-[9px] bg-[#ba1a1a] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>}
                  </div>
                  {item.meta && <p className="text-[12px] text-[#45464e] mt-0.5">{item.meta}</p>}
                </div>
                <span className="material-symbols-outlined text-[#76777f] group-hover:translate-x-1 transition-transform">chevron_right</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIGHTBOX ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}>
            <button onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10">
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full z-10">
              <span className="text-white text-[12px] font-semibold">{lightboxIndex + 1} / {photos.length}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); lightboxPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10">
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
            <button onClick={e => { e.stopPropagation(); lightboxNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10">
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
            <motion.div key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}
              className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center">
              <img src={photos[lightboxIndex].image_url} alt={photos[lightboxIndex].caption ?? ''}
                className="max-h-[78vh] max-w-full w-auto h-auto rounded-xl object-contain shadow-2xl" />
              {photos[lightboxIndex].caption && (
                <p className="mt-4 text-white/80 text-[13px] font-semibold text-center max-w-lg px-4">
                  {photos[lightboxIndex].caption}
                </p>
              )}
            </motion.div>
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto pb-1 px-2">
                {photos.map((p, i) => (
                  <button key={p.id} onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                    className={`shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all
                      ${i === lightboxIndex ? 'border-[#fdc425] scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}