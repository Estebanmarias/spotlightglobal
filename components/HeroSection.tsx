'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const YT_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!
const YT_CHANNEL_ID = 'UCqKvr26isZoFXO02xEtX5UQ'

type HeroVideoState =
  | { type: 'live';   videoId: string; title: string }
  | { type: 'latest'; videoId: string; title: string }
  | { type: 'none' }

export default function HeroSection() {
  const [videoState, setVideoState] = useState<HeroVideoState>({ type: 'none' })

  useEffect(() => {
    const check = async () => {
      try {
        // 1. Check if channel is currently live
        const liveRes  = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${YT_CHANNEL_ID}&part=snippet&eventType=live&type=video`
        )
        const liveData = await liveRes.json()
        if (liveData.items?.[0]) {
          const v = liveData.items[0]
          setVideoState({ type: 'live', videoId: v.id.videoId, title: v.snippet.title })
          return
        }

        // 2. Not live — find latest embeddable video
        const searchRes  = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&channelId=${YT_CHANNEL_ID}&part=snippet&order=date&maxResults=10&type=video`
        )
        const searchData = await searchRes.json()
        if (!searchData.items?.length) return

        const ids = searchData.items.map((v: any) => v.id.videoId).join(',')
        const videoRes  = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?key=${YT_API_KEY}&id=${ids}&part=status,snippet`
        )
        const videoData = await videoRes.json()
        const embeddable = videoData.items?.find((v: any) => v.status?.embeddable === true)
        if (embeddable) {
          setVideoState({ type: 'latest', videoId: embeddable.id, title: embeddable.snippet.title })
        }
      } catch {
        // Fail silently — hero still works without video
      }
    }
    check()
  }, [])

  const handleScroll = () => {
    document.getElementById('connect')?.scrollIntoView({ behavior: 'smooth' })
  }

  const isLive   = videoState.type === 'live'
  const hasVideo = videoState.type !== 'none'

  return (
    <header className="relative w-full min-h-[560px] sm:min-h-[680px] lg:h-[870px] overflow-hidden flex items-center py-16 sm:py-0">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/gallery/community-1.jpg"
          alt="Church service"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(8,21,52,0.92), rgba(8,21,52,0.55))' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-16 w-full max-w-[1280px] mx-auto text-white">
        <div className="max-w-2xl">

          {/* Live badge */}
          {isLive && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-[#ba1a1a] text-white px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Live Now
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-[34px] sm:text-[44px] lg:text-[56px] leading-[1.15] lg:leading-[64px] font-bold tracking-tight mb-4">
            Welcome Home
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="text-[15px] sm:text-[18px] leading-[24px] sm:leading-[28px] mb-8 opacity-90">
            We Are a People Marvelously Helped, Greatly Blessed, Deeply Loved, and Highly Favored.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="flex flex-wrap gap-3 sm:gap-4">

            <button onClick={handleScroll}
              className="bg-[#fdc425] text-[#6d5200] px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold flex items-center gap-2 hover:brightness-110 transition-all active:scale-95">
              Start Your Journey
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            {/* Dynamic button — Live / Latest Sermon / fallback */}
            {isLive ? (
              <Link href={`/community?autoplay=1`}
                className="bg-[#ba1a1a] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Watch Live
              </Link>
            ) : hasVideo ? (
              <Link href="/community?autoplay=1"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                Latest Sermon
              </Link>
            ) : (
              <a href="https://www.youtube.com/@pstedetkingsley" target="_blank" rel="noreferrer"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                Watch on YouTube
              </a>
            )}
          </motion.div>

          {/* Video title hint */}
          {hasVideo && !isLive && videoState.type === 'latest' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="mt-4 text-white/40 text-[11px] truncate max-w-sm">
              Latest: {videoState.title}
            </motion.p>
          )}
        </div>
      </div>
    </header>
  )
}