'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { motion, Variants, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

// ── CONFIG ──────────────────────────────────────────────────────
const YT_API_KEY    = 'AIzaSyAtd9uF8EknLxIfBzA2VenjaREwfPoI0Qo'
const YT_CHANNEL_ID = 'UCqKvr26isZoFXO02xEtX5UQ' // e.g. UCxxxxxxxxxxxx

type ChurchEvent = {
  id: string; title: string; description: string | null
  event_date: string; event_time: string | null
  flyer_url: string | null; location: string; is_featured: boolean
}
type CommunityPhoto = { id: string; image_url: string; caption: string | null }
type Testimony = { id: string; name: string; testimony: string; created_at: string }

const linkStack = [
  { icon: 'radio_button_checked', live: true,  title: 'Daily Prayer — Live Service',    meta: null,                              href: 'https://t.me/thespotlightchurchLive' },
  { icon: 'play_circle',          live: false, title: 'Sunday Sermons & Teachings',     meta: 'YouTube · @pstedetkingsley',      href: 'https://www.youtube.com/@pstedetkingsley' },
  { icon: 'podcasts',             live: false, title: 'Audio Teachings',                meta: 'Sermons on the go',               href: 'https://t.me/companyoftheblessed' },
  { icon: 'music_note',           live: false, title: 'Latest Worship Single',          meta: 'Listen on Spotify & Apple Music', href: 'https://kingdomboiz.com/download-music-edet-kingsley-holy-spirit-oyoyo/' },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.4,0,0.2,1] } }),
}

// ── Latest Sermon ────────────────────────────────────────────────
function LatestSermon({ autoplay }: { autoplay: boolean }) {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [title, setTitle]     = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res  = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${YT_CHANNEL_ID}&part=snippet&order=date&maxResults=1&type=video`)
        const data = await res.json()
        if (data.items?.[0]) { setVideoId(data.items[0].id.videoId); setTitle(data.items[0].snippet.title) }
        else setError(true)
      } catch { setError(true) }
      finally  { setLoading(false) }
    }
    fetch_()
  }, [])

  if (error) return null

  return (
    <section className="bg-[#081534] py-24 border-y border-white/5" id="sermon">
      <div className="max-w-[1280px] mx-auto px-6 md:px-16">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Video */}
          <div className="w-full lg:w-2/3">
            {loading ? (
              <div className="w-full aspect-video rounded-2xl bg-white/10 animate-pulse" />
            ) : videoId ? (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`}
                  title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen className="w-full h-full" />
              </motion.div>
            ) : (
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white/5 flex flex-col items-center justify-center gap-4">
                <span className="material-symbols-outlined text-white/20 text-[64px]">play_circle</span>
                <p className="text-white/40 text-[14px]">Sermon coming soon</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="w-full lg:w-1/3 text-white space-y-6">
            <div className="text-[#fdc425] text-[12px] font-bold uppercase tracking-widest">Featured Message</div>
            <h2 className="text-[28px] sm:text-[32px] font-bold leading-tight">
              {title || 'The Fresh Word'}
            </h2>
            <p className="text-white/60 text-[15px] leading-relaxed">
              Join Apostle Edet Kingsley as he delivers a fresh word from God. Every Sunday service is a transformative experience for the entire Spotlight family.
            </p>
            <a href="https://www.youtube.com/@pstedetkingsley" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-[#fdc425] font-bold hover:gap-4 transition-all text-[14px]">
              View All Sermons <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Testimony Ticker ─────────────────────────────────────────────
function TestimonyTicker({ testimonies }: { testimonies: Testimony[] }) {
  const doubled = [...testimonies, ...testimonies]
  if (testimonies.length === 0) return null

  return (
    <div className="overflow-hidden py-4"
      style={{ maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}>
      <div className="flex gap-6 animate-ticker" style={{ width: 'max-content' }}>
        {doubled.map((t, i) => (
          <div key={`${t.id}-${i}`}
            className="shrink-0 w-[380px] bg-[#f2f4f6] border border-[#c6c6cf]/50 rounded-2xl px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#fdc425]/20 flex items-center justify-center font-bold text-[#081534] shrink-0 text-[16px]">
              {t.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[#191c1e] text-[14px] italic line-clamp-2">"{t.testimony}"</p>
              <span className="text-[#785a00] text-[12px] font-bold mt-1 block">— {t.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Events Carousel ──────────────────────────────────────────────
function EventsCarousel({ events }: { events: ChurchEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return {
      day:   date.toLocaleDateString('en-NG', { day: 'numeric' }),
      month: date.toLocaleDateString('en-NG', { month: 'short' }).toUpperCase(),
      full:  date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
  }

  if (events.length === 0) return (
    <div className="text-center py-20 bg-white rounded-3xl border border-[#c6c6cf]">
      <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">event</span>
      <p className="text-[#45464e] font-semibold text-[16px]">No upcoming gatherings scheduled yet</p>
      <p className="text-[13px] text-[#76777f] mt-1">Check back soon, or join us this Sunday</p>
    </div>
  )

  return (
    <div ref={scrollRef}
      className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x"
      style={{ scrollbarWidth: 'none' }}>
      {events.map((e, i) => {
        const { day, month, full } = formatDate(e.event_date)
        return (
          <motion.div key={e.id}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={`shrink-0 w-[320px] md:w-[380px] rounded-3xl overflow-hidden border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-white snap-center
              ${e.is_featured ? 'border-[#fdc425] shadow-md' : 'border-[#c6c6cf]/30'}`}>
            {e.flyer_url ? (
              <div className="h-56 relative overflow-hidden">
                <img src={e.flyer_url} alt={e.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {e.is_featured && (
                  <span className="absolute top-3 left-3 px-3 py-1 bg-[#fdc425] text-[#6d5200] rounded-full text-[9px] font-bold uppercase tracking-widest">
                    Featured
                  </span>
                )}
                <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-3 py-2 text-center">
                  <p className="text-white text-[20px] font-bold leading-none">{day}</p>
                  <p className="text-[#fdc425] text-[9px] font-bold uppercase tracking-widest mt-0.5">{month}</p>
                </div>
              </div>
            ) : (
              <div className="h-56 bg-[#081534] flex flex-col items-center justify-center relative">
                {e.is_featured && (
                  <span className="absolute top-3 left-3 px-3 py-1 bg-[#fdc425] text-[#6d5200] rounded-full text-[9px] font-bold uppercase tracking-widest">
                    Featured
                  </span>
                )}
                <span className="text-white text-[48px] font-bold leading-none">{day}</span>
                <span className="text-[#fdc425] text-[13px] font-bold uppercase tracking-widest mt-1">{month}</span>
              </div>
            )}
            <div className="p-6">
              <div className="text-[#785a00] text-[12px] font-bold mb-2">
                {e.event_time ? `${full} · ${e.event_time}` : full}
              </div>
              <h3 className="text-[18px] font-bold text-[#081534] mb-3 leading-snug line-clamp-2">{e.title}</h3>
              {e.description && (
                <p className="text-[#45464e] text-[13px] mb-4 line-clamp-2 leading-relaxed">{e.description}</p>
              )}
              <div className="flex items-center gap-1.5 text-[12px] text-[#76777f] mb-4">
                <span className="material-symbols-outlined text-[14px] text-[#fdc425]">location_on</span>
                {e.location}
              </div>
              <button className="w-full border-2 border-[#081534] text-[#081534] py-3 rounded-full font-bold text-[13px] hover:bg-[#081534] hover:text-white transition-all">
                Join Us
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Testimony Modal ───────────────────────────────────────────────
function TestimonyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const supabase = getSupabaseClient()
  const [name, setName]           = useState('')
  const [testimony, setTestimony] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !testimony.trim()) { setError('Please fill in both fields.'); return }
    if (testimony.trim().length < 20) { setError('Please share a bit more (at least 20 characters).'); return }
    setSaving(true); setError('')
    const { error: dbErr } = await (supabase.from('testimonies') as any).insert({
      name: name.trim(), testimony: testimony.trim(),
    })
    setSaving(false)
    if (dbErr) { setError('Failed to submit. Please try again.'); return }
    onSuccess()
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-[480px] shadow-2xl overflow-hidden">
          <div className="bg-[#081534] px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-white">Share Your Testimony</h3>
              <p className="text-white/60 text-[12px] mt-0.5">Let the family hear what God has done</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-2">Your Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Blessing O."
                className="w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-2">Your Testimony *</label>
              <textarea value={testimony} onChange={e => setTestimony(e.target.value)}
                placeholder="Share what God has done in your life…" rows={5}
                className="w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors resize-none" />
              <p className="text-[10px] text-[#76777f] text-right mt-1">{testimony.length} chars</p>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#ffdad6] rounded-lg">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[16px]">error</span>
                <p className="text-[#ba1a1a] text-[12px] font-semibold">{error}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 border border-[#c6c6cf] text-[#45464e] rounded-full text-[13px] font-semibold hover:bg-[#f2f4f6] transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 bg-[#fdc425] text-[#6d5200] rounded-full text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-[#6d5200]/30 border-t-[#6d5200] rounded-full animate-spin" />Submitting…</> : 'Share Testimony'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

// ── Main Page ────────────────────────────────────────────────────
function CommunityPageContent() {
  const supabase     = getSupabaseClient()
  const searchParams = useSearchParams()
  const autoplay     = searchParams.get('autoplay') === '1'

  const [events, setEvents]                       = useState<ChurchEvent[]>([])
  const [photos, setPhotos]                       = useState<CommunityPhoto[]>([])
  const [testimonies, setTestimonies]             = useState<Testimony[]>([])
  const [eventsLoading, setEventsLoading]         = useState(true)
  const [photosLoading, setPhotosLoading]         = useState(true)
  const [lightboxIndex, setLightboxIndex]         = useState<number | null>(null)
  const [showTestimonyModal, setShowTestimonyModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast]   = useState(false)

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

  const fetchTestimonies = async () => {
    const { data } = await (supabase.from('testimonies') as any)
      .select('id, name, testimony, created_at')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(20)
    setTestimonies(data || [])
  }

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data: ev } = await (supabase.from('church_events') as any)
        .select('*').gte('event_date', today).order('event_date', { ascending: true }).limit(8)
      setEvents(ev || []); setEventsLoading(false)

      const { data: ph } = await (supabase.from('community_photos') as any)
        .select('*').order('sort_order', { ascending: true }).limit(6)
      setPhotos(ph || []); setPhotosLoading(false)

      await fetchTestimonies()
    }
    load()

    const ch = supabase.channel('community-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'church_events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_photos' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'testimonies' }, fetchTestimonies)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 50s linear infinite;
        }
        .animate-ticker:hover { animation-play-state: paused; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[640px] sm:min-h-[760px] flex items-center pt-20 bg-[#081534] overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img className="w-full h-full object-cover"
            src="/images/gallery/gallery-3.webp"
            alt="Church sanctuary" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081534] via-[#081534]/60 to-[#081534]/40" />
        </div>
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-16 w-full">
          <div className="max-w-3xl">
            <motion.span variants={fadeUp} initial="hidden" animate="show"
              className="inline-block py-1 px-3 rounded-full bg-[#fdc425]/20 border border-[#fdc425]/30 text-[#fdc425] text-[11px] font-bold uppercase tracking-widest mb-6">
            Spotlight Family
            </motion.span>
            <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="show"
              className="text-[48px] sm:text-[72px] md:text-[80px] font-bold leading-[1.05] text-white mb-8">
              Welcome to the <span className="text-[#fdc425]">Family.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show"
              className="text-[16px] sm:text-[18px] leading-[28px] text-white/80 mb-10 max-w-xl">
              Experience a place of light, love, and transformation. At theSpotlightChurch, we believe everyone has a purpose and a place in God's story.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show"
              className="flex flex-col sm:flex-row gap-4">
              <a href="#first-timer"
                className="bg-[#fdc425] text-[#6d5200] px-10 py-4 rounded-full text-[14px] font-bold hover:brightness-110 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(253,196,37,0.3)] inline-block text-center">
                I'm New Here
              </a>
              <a href="#sermon"
                className="border-2 border-white text-white px-10 py-4 rounded-full text-[14px] font-bold hover:bg-white hover:text-[#081534] active:scale-95 transition-all flex items-center gap-2 justify-center">
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                Latest Sermon
              </a>
            </motion.div>
          </div>
        </div>
      </section>
      
      <div>
        {/* ── LATEST SERMON ─────────────────────────────────────────── */}
      <LatestSermon autoplay={autoplay} />
      </div>

      {/* ── TESTIMONIES TICKER ────────────────────────────────────── */}
      <section className="py-12 bg-[#f7f9fb] border-b border-[#c6c6cf]/40 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-[22px] sm:text-[24px] font-bold text-[#081534]">Live Testimonies</h3>
            <p className="text-[#45464e] text-[14px] mt-1">Real stories from our church family.</p>
          </div>
          <button onClick={() => setShowTestimonyModal(true)}
            className="bg-[#fdc425] text-[#6d5200] px-6 py-2.5 rounded-full text-[13px] font-bold hover:brightness-110 hover:scale-105 transition-all shadow-md flex items-center gap-2 active:scale-95">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            Share Yours
          </button>
        </div>

        {testimonies.length > 0 ? (
          <TestimonyTicker testimonies={testimonies} />
        ) : (
          <div className="max-w-[1280px] mx-auto px-6 md:px-16 text-center py-8">
            <p className="text-[#76777f] text-[14px]">Be the first to share what God has done in your life.</p>
          </div>
        )}
      </section>

      {/* ── FIRST-TIMER ───────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white" id="first-timer">
        <div className="max-w-[1280px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white rounded-3xl border-2 border-[#fdc425] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-xl">
            <div className="w-full md:w-1/2">
              <h2 className="text-[32px] sm:text-[44px] md:text-[48px] font-bold text-[#081534] mb-6 leading-tight">
                Visiting for the <span className="underline decoration-[#fdc425] decoration-4">first time?</span>
              </h2>
              <p className="text-[#45464e] text-[16px] sm:text-[18px] leading-relaxed mb-8">
                We have a special welcome waiting for you. Fill out a quick form so we can welcome you properly — from finding a seat to getting to know what makes theSpotlightChurch a home.
              </p>
              <Link href="/join"
                className="inline-block bg-[#081534] text-white px-10 py-4 rounded-full text-[14px] font-bold hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg">
                Tell Us About Yourself
              </Link>
            </div>
            <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden shadow-lg border border-[#c6c6cf]">
              <img
                src="/images/gallery/community-5.jpg"
                alt="Church welcome team"
                className="mx-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ───────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#f2f4f6] overflow-hidden">
        <div className="max-w-[1280px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-12">
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mb-2">Upcoming Gatherings</h2>
            <p className="text-[#45464e] text-[15px]">Save the date for these community moments.</p>
          </motion.div>

          {eventsLoading ? (
            <div className="flex gap-6 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="shrink-0 w-[320px] h-[380px] bg-white rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <EventsCarousel events={events} />
          )}
        </div>
      </section>

      {/* ── COMMUNITY GALLERY ─────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-[28px] sm:text-[32px] font-bold text-[#081534] mb-2">Community Moments</h2>
              <p className="text-[#45464e] text-[15px]">The heart of our church is our people.</p>
            </div>
            <a href="https://instagram.com/thespotlightchurch" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white text-[13px] hover:opacity-90 transition-all shadow-lg shrink-0"
              style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              Follow on Instagram
            </a>
          </motion.div>

          {photosLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`rounded-2xl bg-[#eceef0] animate-pulse ${i === 0 || i === 2 ? 'row-span-2' : ''}`} />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-16 bg-[#f7f9fb] rounded-2xl border border-[#c6c6cf]">
              <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-3">photo_library</span>
              <p className="text-[#45464e] font-semibold">Gallery coming soon</p>
              <p className="text-[13px] text-[#76777f] mt-1">Follow us on Instagram for the latest moments</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
              {photos.slice(0, 6).map((p, i) => {
                // Template masonry layout: col 0 and 2 span 2 rows
                const rowSpan = (i === 0 || i === 2) ? 'row-span-2' : ''
                return (
                  <motion.button key={p.id} type="button"
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setLightboxIndex(i)}
                    className={`${rowSpan} rounded-2xl overflow-hidden bg-[#eceef0] hover:scale-[1.02] transition-transform focus:outline-none cursor-zoom-in group`}>
                    <div className="relative w-full h-full">
                      <img src={p.image_url} alt={p.caption ?? ''}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-[#081534]/0 group-hover:bg-[#081534]/30 transition-colors" />
                      {p.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-white text-[11px] font-semibold line-clamp-2">{p.caption}</p>
                        </div>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── LINK STACK ────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#f2f4f6]" id="links">
        <div className="max-w-[860px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10">
            <h2 className="text-[24px] sm:text-[28px] font-bold text-[#081534]">Quick Links</h2>
          </motion.div>
          <div className="space-y-4">
            {linkStack.map((item, i) => (
              <motion.a key={item.title} href={item.href} target="_blank" rel="noreferrer"
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#785a00] group-hover:bg-[#785a00] group-hover:text-white transition-colors shrink-0">
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#081534]">{item.title}</span>
                      {item.live && <span className="text-[9px] bg-[#ba1a1a] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>}
                    </div>
                    {item.meta && <p className="text-[12px] text-[#45464e] mt-0.5">{item.meta}</p>}
                  </div>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TESTIMONY MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {showTestimonyModal && (
          <TestimonyModal
            onClose={() => setShowTestimonyModal(false)}
            onSuccess={() => {
              setShowTestimonyModal(false)
              setShowSuccessToast(true)
              fetchTestimonies()
              setTimeout(() => setShowSuccessToast(false), 4000)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── SUCCESS TOAST ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#081534] text-white px-6 py-3 rounded-full text-[13px] font-semibold shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fdc425] text-[16px]">favorite</span>
            Testimony submitted — God bless you! 🙏
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <p className="text-[#45464e]">Loading...</p>
      </div>
    }>
      <CommunityPageContent />
    </Suspense>
  )
}