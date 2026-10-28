'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { CONSENT_EVENT, readConsent } from '@/lib/consent'
import {
  Car, CalendarDays, Clock, HandHeart, Handshake, Headphones,
    HeartHandshake, MapPin, Navigation, Phone, UserPlus, X,
} from 'lucide-react'

// ── Edit contacts, links and logo here ───────────────────────────────
const LOGO_SRC = '/apple-touch-icon-v2.png'

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Icon Hotel Hall, Angwan Danlami, New Nyanya, Abuja-Keffi Expressway, Nigeria')

const SETMAN = { name: 'The Setman', number: '2348115316745' }
const COUNSELOR_2 = { name: 'Yahaya Amos', number: '2348102766407' }
const TRANSPORT = { name: 'Babatunde Peter', number: '2348133460220', display: '+234 813 346 0220' }

const wa = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`

const ICON = 'h-4 w-4'

const BRAND_PATHS = {
  whatsapp:
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  youtube:
    'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  spotify:
    'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.59 17.357c-.225.369-.706.488-1.074.263-2.905-1.776-6.561-2.176-10.866-1.192-.423.096-.84-.17-.937-.593-.096-.423.17-.84.593-.937 4.71-1.076 8.74-.622 11.981 1.359.37.224.489.706.263 1.074zm1.493-3.268c-.284.46-.884.61-1.344.327-3.325-2.044-8.391-2.636-12.32-1.443-.518.157-1.066-.142-1.223-.66-.157-.518.142-1.066.66-1.223 4.494-1.362 10.076-.704 13.9 1.649.46.284.61.884.327 1.344zm.13-3.4c-3.985-2.367-10.559-2.586-14.364-1.43-.612.185-1.258-.168-1.443-.779-.186-.612.168-1.258.779-1.443 4.36-1.323 11.602-1.063 16.205 1.669.551.327.734 1.036.407 1.587-.327.551-1.036.734-1.584.407z',
} as const

function BrandIcon({ name }: { name: keyof typeof BRAND_PATHS }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={ICON}>
      <path d={BRAND_PATHS[name]} />
    </svg>
  )
}

type Verse = { text: string; ref: string }
type Action = { label: string; href: string; icon: ReactNode }
type Topic = { id: string; label: string; icon: ReactNode; reply: string; verse?: Verse; actions?: Action[] }
type Message = { id: number; from: 'bot' | 'user'; text: string; verse?: Verse; actions?: Action[] }

const GREETING = 'Hi, welcome to the company of the Blessed 👋 What would you like to know?'

const TOPICS: Topic[] = [
  {
    id: 'times',
    label: 'Service times',
    icon: <Clock className={ICON} />,
    reply:
      'Sunday Service: every Sunday, 8:30 AM.\nMidweek Service: every Wednesday, 6:00 PM.\nBoth hold at Icon Hotel Hall.',
    verse: { text: 'I was glad when they said unto me, Let us go into the house of the LORD.', ref: 'Psalm 122:1' },
  },
  {
    id: 'location',
    label: 'Location',
    icon: <MapPin className={ICON} />,
    reply:
      'Icon Hotel Hall, opposite Mai Angwan House by the transformer, Angwan Danlami, New Nyanya, Abuja-Keffi Express Way.',
    actions: [{ label: 'Get directions', href: MAPS_URL, icon: <Navigation className={ICON} /> }],
  },
  {
    id: 'new',
    label: "I'm new here",
    icon: <UserPlus className={ICON} />,
    reply:
      "Welcome to the Company of the Blessed! 🙏 We're so glad you found us. You're not a visitor here, you're family. Come this Sunday and let us know you're new, so we can look after you.",
    verse: {
      text: 'Now therefore ye are no more strangers and foreigners, but fellowcitizens with the saints, and of the household of God.',
      ref: 'Ephesians 2:19',
    },
    actions: [{ label: 'Join the family', href: '/join', icon: <UserPlus className={ICON} /> }],
  },
  {
    id: 'transport',
    label: 'Need transport',
    icon: <Car className={ICON} />,
    reply: `Need a ride to church? Call ${TRANSPORT.name} on ${TRANSPORT.display}, or message him on WhatsApp, and we'll help you get here.`,
    verse: { text: "Bear ye one another's burdens, and so fulfil the law of Christ.", ref: 'Galatians 6:2' },
    actions: [
      { label: 'Call now', href: `tel:+${TRANSPORT.number}`, icon: <Phone className={ICON} /> },
      { label: 'WhatsApp', href: wa(TRANSPORT.number, 'Hello, I need transport to church.'), icon: <BrandIcon name="whatsapp" /> },
    ],
  },
  {
    id: 'counselor',
    label: 'Speak to a counselor',
    icon: <HeartHandshake className={ICON} />,
    reply:
      "We're here for you, and you don't have to carry it alone. Choose who you'd like to speak with on WhatsApp. If you're in immediate danger, please call 112 first.",
    verse: {
      text: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
      ref: 'Psalm 34:18',
    },
    actions: [
      { label: SETMAN.name, href: wa(SETMAN.number, "Hello, I'd like to speak with a counselor."), icon: <BrandIcon name="whatsapp" /> },
      { label: COUNSELOR_2.name, href: wa(COUNSELOR_2.number, "Hello, I'd like to speak with a counselor."), icon: <BrandIcon name="whatsapp" /> },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    icon: <CalendarDays className={ICON} />,
    reply: "See what's coming up, including conference registration.",
    actions: [{ label: 'View events', href: '/events', icon: <CalendarDays className={ICON} /> }],
  },
  {
    id: 'giving',
    label: 'Giving',
    icon: <HandHeart className={ICON} />,
    reply:
      "Giving is worship, an act of love and obedience. Whether it's your tithe, an offering or a prophetic seed, you can give by bank transfer or in person. Everything you need is on our giving page.",
    verse: {
      text: 'Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.',
      ref: '2 Corinthians 9:7',
    },
    actions: [{ label: 'Give now', href: '/giving', icon: <HandHeart className={ICON} /> }],
  },
  {
    id: 'partner',
    label: 'Partnership',
    icon: <Handshake className={ICON} />,
    reply:
      'Partner with the Kingdom. Join us to fund church projects and welfare, and to take the gospel to the ends of the earth.',
    verse: {
      text: "For we are labourers together with God: ye are God's husbandry, ye are God's building.",
      ref: '1 Corinthians 3:9',
    },
    actions: [{ label: 'Become a partner', href: '/partner', icon: <Handshake className={ICON} /> }],
  },
  {
    id: 'watch',
    label: 'Watch / listen',
    icon: <Headphones className={ICON} />,
    reply: 'Catch our messages anytime, wherever you are.',
    verse: { text: 'So then faith cometh by hearing, and hearing by the word of God.', ref: 'Romans 10:17' },
    actions: [
      { label: 'YouTube', href: 'https://www.youtube.com/@thespotlightchurch', icon: <BrandIcon name="youtube" /> },
      { label: 'Spotify', href: 'https://open.spotify.com/show/75PSP2x3mArsPABn4KReUY', icon: <BrandIcon name="spotify" /> },
    ],
  },
]

function Avatar({ size }: { size: number }) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-white object-cover"
    />
  )
}

function ActionButton({ action, onNavigate }: { action: Action; onNavigate: () => void }) {
  const cls =
    'inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#081534] px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-[#17305f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdc425] active:scale-95'
  if (action.href.startsWith('/')) {
    return <Link href={action.href} onClick={onNavigate} className={cls}>{action.icon}{action.label}</Link>
  }
  const external = action.href.startsWith('http')
  return (
    <a href={action.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={cls}>
      {action.icon}{action.label}
    </a>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <Avatar size={28} />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-[#e2e2e9] bg-white px-4 py-3.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9a9ca5]"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function FaqChat() {
  const [open, setOpen] = useState(false)
  const [typing, setTyping] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [consentPending, setConsentPending] = useState(true)
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: 'bot', text: GREETING }])
  const nextId = useRef(1)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const anchorRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close the panel after navigating to another page
  useEffect(() => { setOpen(false) }, [pathname])

  // Keep the latest question at the top of the panel so its answer reads downward
  const lastUser = messages.map(m => m.from).lastIndexOf('user')
  const anchorIndex = lastUser === -1 ? 0 : lastUser

  useEffect(() => {
    if (open) anchorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    const show = setTimeout(() => setTeaser(true), 5000)
    const hide = setTimeout(() => setTeaser(false), 14000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [])

  useEffect(() => { if (open) setTeaser(false) }, [open])

  // On phones the cookie banner spans the bottom, so hide the chat button until a choice is made
  useEffect(() => {
    setConsentPending(readConsent() === null)
    const onChoice = () => setConsentPending(false)
    window.addEventListener(CONSENT_EVENT, onChoice)
    return () => window.removeEventListener(CONSENT_EVENT, onChoice)
  }, [])

  const ask = (topic: Topic) => {
    if (typing) return
    setMessages(prev => [...prev, { id: nextId.current++, from: 'user', text: topic.label }])
    setTyping(true)
    // Longer answers "take longer to type": 0.9s base + 8ms per character, capped at 2.4s
    const delay = Math.min(2400, 900 + topic.reply.length * 8)
    timer.current = setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: nextId.current++, from: 'bot', text: topic.reply, verse: topic.verse, actions: topic.actions },
      ])
      setTyping(false)
    }, delay)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Chat with theSpotlightChurch"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[4.75rem] right-4 z-50 flex h-[min(600px,calc(100dvh-6.5rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#d9dbe0] bg-white shadow-[0_12px_40px_rgba(8,21,52,0.25)] sm:bottom-24 sm:right-5 sm:w-[380px]"
          >
            <div className="flex items-center gap-3 bg-[#081534] px-4 py-3.5 text-white">
              <Avatar size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold leading-tight">theSpotlightChurch</p>
                <p className="text-[11px] text-white/60">Quick answers, any time</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdc425]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#f7f9fb] p-4">
              {messages.map((m, i) => (
                <div key={m.id} ref={i === anchorIndex ? anchorRef : undefined}>
                  {m.from === 'user' ? (
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#081534] px-3.5 py-2 text-[13px] text-white">
                        {m.text}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <Avatar size={28} />
                      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-bl-sm border border-[#e2e2e9] bg-white px-3.5 py-3">
                        <p className="whitespace-pre-line text-[13px] leading-5 text-[#191c1e]">{m.text}</p>
                        {m.verse && (
                          <p className="mt-2.5 border-l-2 border-[#fdc425] pl-3 text-[12px] italic leading-5 text-[#45464e]">
                            “{m.verse.text}”{' '}
                            <span className="font-semibold not-italic text-[#785a00]">{m.verse.ref} (KJV)</span>
                          </p>
                        )}
                        {m.actions && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {m.actions.map(a => <ActionButton key={a.label} action={a} onNavigate={() => setOpen(false)} />)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {typing && <TypingBubble />}

              <div className="pt-1">
                <p className="mb-2 text-[12px] font-semibold text-[#45464e]">How can we help you today?</p>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={typing}
                      onClick={() => ask(t)}
                      className="inline-flex items-center gap-1.5 rounded-full min-h-10 border border-[#081534]/20 bg-white px-3.5 py-2 text-[12px] font-semibold text-[#081534] transition hover:bg-[#081534] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdc425] active:scale-95 disabled:opacity-60"
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`fixed bottom-4 right-4 z-50 sm:bottom-5 sm:right-5 ${consentPending ? 'max-sm:hidden' : ''}`}>
        <AnimatePresence>
          {teaser && !open && (
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-1.5 right-14 w-max max-w-[calc(100vw-6.5rem)] rounded-2xl rounded-br-sm border border-[#e2e2e9] bg-white px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#081534] shadow-lg sm:bottom-2 sm:right-[4.25rem]"
            >
              Questions? Tap to ask 👋
            </motion.button>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label={open ? 'Close chat' : 'Open chat'}
          className="relative flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14 shadow-[0_8px_24px_rgba(8,21,52,0.35)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdc425] focus-visible:ring-offset-2 active:scale-95"
        >
          {!open && (
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[#fdc425]/60 motion-safe:animate-ping"
              style={{ animationIterationCount: 4 }}
            />
          )}
          <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#081534] ring-2 ring-[#fdc425]">
            {open ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Image
                src={LOGO_SRC}
                alt=""
                width={56}
                height={56}
                className="h-full w-full bg-white object-cover"
              />
            )}
          </span>
        </button>
      </div>
    </>
  )
}