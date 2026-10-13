'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'

const messages = [
  "Looks like this page wandered off — but you haven't.",
  "Even when you're off the map, you're never out of the light.",
  "No worries — we'll help you find your way back.",
  '"Your word is a lamp to my feet and a light to my path." — Psalm 119:105',
]

const quickLinks = [
  { icon: 'home',               label: 'Home',            desc: 'Back to the start',          href: '/' },
  { icon: 'favorite',           label: 'Join the Family', desc: 'Register with us',           href: '/join' },
  { icon: 'groups',             label: 'Community',      desc: 'Sermons & testimonies',      href: '/community' },
  { icon: 'volunteer_activism', label: 'Give',           desc: 'Sow into the kingdom',       href: '/giving' },
  { icon: 'handshake',          label: 'Partner',        desc: 'Join the mission',           href: '/partner' },
  { icon: 'person',             label: 'Our Pastor',     desc: 'Meet Apostle Edet Kingsley', href: '/pastor' },
  { icon: 'visibility',         label: 'Our Vision',     desc: 'What we stand for',          href: '/vision' },
  { icon: 'mail',               label: 'Contact',        desc: "We'd love to hear from you", href: '/contact' },
]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.7 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

const LIGHT_MASK =
  'radial-gradient(circle 180px at var(--lx) var(--ly), #000 0%, rgba(0,0,0,0.85) 35%, transparent 100%)'

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()
  const reduce = useReducedMotion()

  const sectionRef = useRef<HTMLElement>(null)
  const numRef = useRef<HTMLDivElement>(null)
  const interacted = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [msgIndex, setMsgIndex] = useState(0)
  const [logoOk, setLogoOk] = useState(true)
  const [clicks, setClicks] = useState(0)
  const [sectionVisible, setSectionVisible] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrolling = useRef(false)
  const scrollResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const moveLight = useCallback((clientX: number, clientY: number) => {
    const section = sectionRef.current
    const number = numRef.current
    if (!section || !number) return
    const sectionRect = section.getBoundingClientRect()
    const numberRect = number.getBoundingClientRect()
    section.style.setProperty('--sx', `${clientX - sectionRect.left}px`)
    section.style.setProperty('--sy', `${clientY - sectionRect.top}px`)
    number.style.setProperty('--lx', `${clientX - numberRect.left}px`)
    number.style.setProperty('--ly', `${clientY - numberRect.top}px`)
  }, [])

  const handlePointer = (event: PointerEvent<HTMLElement>) => {
    interacted.current = true
    moveLight(event.clientX, event.clientY)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => { interacted.current = false }, 3500)
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return
    handlePointer(event)
  }

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(([entry]) => {
      setSectionVisible(entry.isIntersecting)
    })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      interacted.current = true
      if (!scrolling.current) {
        scrolling.current = true
        setIsScrolling(true)
      }
      if (scrollResetTimer.current) clearTimeout(scrollResetTimer.current)
      scrollResetTimer.current = setTimeout(() => {
        scrolling.current = false
        interacted.current = false
        setIsScrolling(false)
      }, 220)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollResetTimer.current) clearTimeout(scrollResetTimer.current)
    }
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const number = numRef.current
    if (!section || !number) return
    let sectionRect = section.getBoundingClientRect()
    let numberRect = number.getBoundingClientRect()
    const syncBounds = () => {
      sectionRect = section.getBoundingClientRect()
      numberRect = number.getBoundingClientRect()
    }
    const place = (fx: number, fy: number) => {
      const clientX = numberRect.left + numberRect.width * fx
      const clientY = numberRect.top + numberRect.height * fy
      section.style.setProperty('--sx', `${clientX - sectionRect.left}px`)
      section.style.setProperty('--sy', `${clientY - sectionRect.top}px`)
      number.style.setProperty('--lx', `${clientX - numberRect.left}px`)
      number.style.setProperty('--ly', `${clientY - numberRect.top}px`)
    }
    if (reduce) { place(0.5, 0.5); return }
    if (!sectionVisible || isScrolling) return

    let frame = 0
    let lastUpdate = 0
    const startTime = performance.now()
    const tick = (time: number) => {
      if (!document.hidden && !interacted.current && time - lastUpdate >= 1000 / 30) {
        const elapsed = (time - startTime) / 1000
        place(0.5 + Math.sin(elapsed * 0.7) * 0.42, 0.5 + Math.cos(elapsed * 1.2) * 0.3)
        lastUpdate = time
      }
      frame = requestAnimationFrame(tick)
    }
    const handleResize = () => syncBounds()
    window.addEventListener('resize', handleResize, { passive: true })
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
    }
  }, [reduce, sectionVisible, isScrolling])

  useEffect(() => {
    const id = setInterval(() => setMsgIndex(index => (index + 1) % messages.length), 4200)
    return () => {
      clearInterval(id)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  const celebrate = async () => {
    setClicks(count => count + 1)
    const module = await import('canvas-confetti')
    const confetti = module.default ?? module
    const colors = ['#fdc425', '#ffffff', '#1e2a4a']
    confetti({ particleCount: 110, spread: 75, origin: { y: 0.45 }, colors, disableForReducedMotion: true })
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true })
      confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true })
    }, 180)
  }

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/')
  }

  const hint = clicks === 0
    ? 'Tap the light for a surprise ✨'
    : clicks < 4
      ? "Surprise! 🎉 Now let's get you home."
      : 'You really like confetti, huh? 😄'

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointer}
      className="relative flex min-h-[88vh] items-center overflow-hidden bg-gradient-to-b from-[#081534] via-[#0b1f4d] to-[#081534] px-4 pb-20 pt-28 sm:px-6"
      style={{ '--sx': '50%', '--sy': '30%' } as CSSProperties}
    >
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#fdc425]/10 blur-xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#1e2a4a]/60 blur-xl" />

      <div
        aria-hidden
        className="pointer-events-none absolute h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: 'var(--sx)',
          top: 'var(--sy)',
          background: 'radial-gradient(circle, rgba(253,196,37,0.20) 0%, rgba(253,196,37,0.06) 40%, transparent 68%)',
        }}
      />

      {!reduce && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: 14 }).map((_, index) => (
            <motion.span
              key={index}
              className="absolute rounded-full bg-[#fdc425]"
              style={{
                left: `${(index * 37) % 100}%`,
                bottom: -12,
                width: 2 + (index % 4),
                height: 2 + (index % 4),
                opacity: 0,
              }}
              animate={sectionVisible && !isScrolling ? { y: [0, -900], opacity: [0, 0.8, 0] } : false}
              transition={{
                duration: 9 + (index % 7),
                delay: (index % 9) * 0.8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-[1000px] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          className="mx-auto w-fit"
        >
          <motion.div
            ref={numRef}
            animate={reduce || !sectionVisible || isScrolling ? { y: 0 } : { y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative select-none text-[clamp(110px,24vw,260px)] font-black leading-none tracking-tighter"
            style={{ '--lx': '50%', '--ly': '50%' } as CSSProperties}
          >
            <div className="flex items-center justify-center gap-[0.06em] text-white/[0.08]">
              <span aria-hidden>4</span>

              <motion.button
                type="button"
                onClick={celebrate}
                aria-label="Tap for a surprise"
                whileHover={{ scale: 1.06, rotate: 4 }}
                whileTap={{ scale: 0.92 }}
                className="relative inline-flex h-[0.7em] w-[0.7em] cursor-pointer items-center justify-center rounded-full bg-[#081534]"
                style={{ border: '0.03em solid #fdc425' }}
              >
                {!reduce && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    animate={{
                      boxShadow: [
                        '0 0 0 0em rgba(253,196,37,0.55)',
                        '0 0 0 0.16em rgba(253,196,37,0)',
                      ],
                    }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                {logoOk ? (
                  <img
                    src="/images/logo.png"
                    alt="theSpotlightChurch"
                    onError={() => setLogoOk(false)}
                    className="h-full w-full rounded-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <span
                    className="material-symbols-outlined text-[#fdc425]"
                    style={{ fontSize: '0.4em', fontVariationSettings: "'FILL' 1" }}
                  >
                    lightbulb
                  </span>
                )}
              </motion.button>

              <span aria-hidden>4</span>
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[0.06em] text-[#fdc425] [text-shadow:0_0_40px_rgba(253,196,37,0.55)]"
              style={{ WebkitMaskImage: LIGHT_MASK, maskImage: LIGHT_MASK }}
            >
              <span>4</span>
              <span className="inline-block w-[0.7em]" />
              <span>4</span>
            </div>
          </motion.div>
        </motion.div>

        <p className="mt-2 text-[12px] text-white/40">{hint}</p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-6 text-[26px] font-extrabold text-white sm:text-[38px]"
        >
          Oops! This page is <span className="text-[#fdc425]">off the map</span>
        </motion.h1>

        <div className="mt-3 flex h-[56px] items-center justify-center sm:h-[48px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="max-w-xl px-2 text-[15px] text-white/70 sm:text-[17px]"
            >
              {messages[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
          className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[12px] text-white/60"
        >
          <span className="material-symbols-outlined shrink-0 text-[16px] text-[#fdc425]">travel_explore</span>
          <span className="shrink-0">We couldn&apos;t find</span>
          <code className="truncate font-mono text-[#fdc425]">{pathname}</code>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.45 }}
          className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fdc425] px-8 py-3.5 text-[14px] font-bold text-[#6d5200] shadow-[0_0_24px_rgba(253,196,37,0.35)] transition-all hover:scale-105 hover:brightness-110 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Take Me Home
          </Link>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-white/10 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Go Back
          </button>
        </motion.div>

        <p className="mb-4 mt-12 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
          Or jump straight to
        </p>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 text-left sm:gap-4 md:grid-cols-4"
        >
          {quickLinks.map(link => (
            <motion.div key={link.href} variants={item}>
              <Link
                href={link.href}
                className="group flex h-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition-all hover:-translate-y-1 hover:border-[#fdc425]/60 hover:bg-white/[0.09] sm:p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdc425]/15 text-[#fdc425] transition-colors group-hover:bg-[#fdc425] group-hover:text-[#6d5200]">
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                </span>
                <span className="text-[14px] font-bold text-white">{link.label}</span>
                <span className="text-[12px] leading-snug text-white/50">{link.desc}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-10 text-[12px] text-white/40">
          Think this is a mistake?{' '}
          <Link href="/contact" className="text-[#fdc425] underline-offset-4 hover:underline">
            Let us know
          </Link>{' '}
          and we&apos;ll fix it. · Error 404
        </p>
      </div>
    </section>
  )
}
