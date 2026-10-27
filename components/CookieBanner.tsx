'use client'

import { useEffect, useState } from 'react'
import { readConsent, writeConsent, OPEN_PREFS_EVENT } from '@/lib/consent'

export default function CookieBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (readConsent() === null) setOpen(true)
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_PREFS_EVENT, reopen)
    return () => window.removeEventListener(OPEN_PREFS_EVENT, reopen)
  }, [])

  const choose = (analytics: boolean) => {
    writeConsent(analytics)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border border-[#c6c6cf] bg-white p-5 shadow-2xl sm:flex-row sm:items-center sm:gap-6">
        <div className="flex-1">
          <p className="text-[14px] font-bold text-[#081534]">Cookies on theSpotlightChurch</p>
          <p className="mt-1 text-[12px] leading-5 text-[#45464e]">
            We use analytics cookies (Google Analytics and Microsoft Clarity) to understand how the site is used and improve it.
            They stay off unless you accept. You can change your choice anytime from Cookie settings in the footer.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose(false)}
            className="min-h-11 flex-1 rounded-md border border-[#081534] px-5 text-[13px] font-bold text-[#081534] transition hover:bg-[#f2f4f6] sm:flex-none"
          >
            Reject
          </button>
          <button
            onClick={() => choose(true)}
            className="min-h-11 flex-1 rounded-md bg-[#081534] px-5 text-[13px] font-bold text-white transition hover:bg-[#17305f] sm:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}