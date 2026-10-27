'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { OPEN_PREFS_EVENT, clearAnalyticsCookies, readConsent, writeConsent } from '@/lib/consent'

function Switch({
  checked, onChange, disabled = false,
}: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors
        ${checked ? 'bg-[#fdc425]' : 'bg-white/20'}
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [customize, setCustomize] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (!readConsent()) timer = setTimeout(() => setVisible(true), 1200)

    // Footer "Cookie settings" link fires this event
    const openPrefs = () => {
      setAnalytics(readConsent()?.analytics ?? false)
      setCustomize(true)
      setVisible(true)
    }
    window.addEventListener(OPEN_PREFS_EVENT, openPrefs)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener(OPEN_PREFS_EVENT, openPrefs)
    }
  }, [])

  const save = (value: boolean) => {
    const prev = readConsent()
    writeConsent(value)
    setVisible(false)
    setCustomize(false)
    // Turning analytics OFF after it was on: clear cookies and reload so scripts unload
    if (prev?.analytics && !value) {
      clearAnalyticsCookies()
      window.location.reload()
    }
  }

  const back = () => {
    setCustomize(false)
    if (readConsent()) setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Cookie preferences"
          aria-live="polite"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="fixed inset-x-3 bottom-3 z-[60] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-[420px]"
        >
          <div className="rounded-2xl border border-white/10 bg-[#081534] p-5 text-white shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fdc425] text-[#6d5200]">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  cookie
                </span>
              </span>
              <div>
                <h2 className="text-[15px] font-bold">We value your privacy</h2>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/70">
                  Essential cookies keep the site working. With your OK, we also use analytics
                  (Google Analytics, Microsoft Clarity) to understand how the site is used
                  and improve it. See our{' '}
                  <Link href="/privacy-policy" className="text-[#fdc425] underline-offset-2 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            {customize && (
              <div className="mt-4 space-y-3 rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold">Essential</p>
                    <p className="text-[11.5px] text-white/50">Login, security and site basics. Always on.</p>
                  </div>
                  <Switch checked disabled />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold">Analytics</p>
                    <p className="text-[11.5px] text-white/50">
                      Google Analytics and Microsoft Clarity.
                    </p>
                  </div>
                  <Switch checked={analytics} onChange={setAnalytics} />
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {customize ? (
                <>
                  <button
                    type="button"
                    onClick={() => save(analytics)}
                    className="rounded-full bg-[#fdc425] px-5 py-2.5 text-[13px] font-bold text-[#6d5200] transition-all hover:brightness-110 active:scale-95"
                  >
                    Save preferences
                  </button>
                  <button
                    type="button"
                    onClick={back}
                    className="rounded-full border border-white/30 px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-white/10 active:scale-95"
                  >
                    Back
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => save(true)}
                    className="rounded-full bg-[#fdc425] px-5 py-2.5 text-[13px] font-bold text-[#6d5200] transition-all hover:brightness-110 active:scale-95"
                  >
                    Accept all
                  </button>
                  <button
                    type="button"
                    onClick={() => save(false)}
                    className="rounded-full border border-white/30 px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-white/10 active:scale-95"
                  >
                    Essential only
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAnalytics(false); setCustomize(true) }}
                    className="px-2 py-2.5 text-[12.5px] font-semibold text-white/60 underline-offset-4 hover:text-white hover:underline"
                  >
                    Customize
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}