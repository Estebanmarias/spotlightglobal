'use client'

import { OPEN_PREFS_EVENT } from '@/lib/consent'

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFS_EVENT))}
      className="text-[12px] hover:underline"
    >
      Cookie settings
    </button>
  )
}