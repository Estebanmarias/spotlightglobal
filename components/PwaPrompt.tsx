'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const KEY_DISMISS = 'pwa-prompt-dismissed'
const KEY_VISITS = 'pwa-prompt-visits'
const COOLDOWN_DAYS = 21

const b64 = (s: string) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export default function PwaPrompt() {
  const pathname = usePathname()
  const [mode, setMode] = useState<'none' | 'push' | 'ios'>('none')
  const [installEvent, setInstallEvent] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)

  const blocked = pathname.startsWith('/admin') || pathname.startsWith('/conference')

  useEffect(() => {
    const onInstall = (e: Event) => { e.preventDefault(); setInstallEvent(e) }
    window.addEventListener('beforeinstallprompt', onInstall)
    return () => window.removeEventListener('beforeinstallprompt', onInstall)
  }, [])

  useEffect(() => {
    if (blocked) return
    let timer: ReturnType<typeof setTimeout> | undefined
    ;(async () => {
      try {
        const last = Number(localStorage.getItem(KEY_DISMISS) || 0)
        if (last && Date.now() - last < COOLDOWN_DAYS * 86_400_000) return
        const visits = Number(localStorage.getItem(KEY_VISITS) || 0) + 1
        sessionStorage.getItem(KEY_VISITS) || (localStorage.setItem(KEY_VISITS, String(visits)), sessionStorage.setItem(KEY_VISITS, '1'))
        if (visits < 2) return

        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
        let next: 'push' | 'ios' | 'none' = 'none'

        if (ios && !standalone) next = 'ios'
        else if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && Notification.permission === 'default') {
          const reg = await navigator.serviceWorker.getRegistration()
          const sub = await reg?.pushManager.getSubscription()
          if (!sub) next = 'push'
        }
        if (next !== 'none') timer = setTimeout(() => setMode(next), 12_000)
      } catch { /* storage blocked: stay quiet */ }
    })()
    return () => clearTimeout(timer)
  }, [blocked])

  const dismiss = () => {
    try { localStorage.setItem(KEY_DISMISS, String(Date.now())) } catch {}
    setMode('none')
  }

  const turnOn = async () => {
    setBusy(true); setMsg('')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { dismiss(); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) })
      const res = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })
      if (!res.ok) throw new Error()
      setDone(true)
      setTimeout(() => setMode('none'), 2500)
    } catch { setMsg('Could not turn on notifications. Please try again.') }
    setBusy(false)
  }

  const install = async () => {
    if (!installEvent) return
    installEvent.prompt()
    await installEvent.userChoice.catch(() => null)
    setInstallEvent(null)
  }

  if (blocked || mode === 'none') return null

  return (
    <div role="dialog" aria-label="Get the church app" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-[440px] rounded-2xl border border-[#c6c6cf] bg-white p-5 shadow-2xl">
      <button onClick={dismiss} aria-label="Close" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#45464e] hover:bg-[#f2f4f6]">✕</button>
      {done ? (
        <p className="py-2 text-center text-[14px] font-bold text-green-800">You’re subscribed. God bless you!</p>
      ) : mode === 'ios' ? (
        <>
          <p className="pr-8 text-[16px] font-bold text-[#081534]">Get a word of hope on your phone</p>
          <p className="mt-1 text-[13px] leading-5 text-[#45464e]">On iPhone: tap the Share button, choose “Add to Home Screen”, then open theSpotlightChurch from your Home Screen. You’ll be able to turn on daily notifications from there.</p>
          <button onClick={dismiss} className="mt-4 rounded-full border border-[#c6c6cf] px-5 py-2 text-[13px] font-bold text-[#45464e]">Not now</button>
        </>
      ) : (
        <>
          <p className="pr-8 text-[16px] font-bold text-[#081534]">A word of hope, every day</p>
          <p className="mt-1 text-[13px] leading-5 text-[#45464e]">Get a short scripture or encouragement on your phone. You can turn it off any time.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={turnOn} disabled={busy} className="rounded-full bg-[#081534] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">{busy ? 'Turning on...' : 'Turn on daily word'}</button>
            {installEvent && <button onClick={install} className="rounded-full bg-[#fdc425] px-5 py-2.5 text-[13px] font-bold text-[#6d5200]">Install app</button>}
            <button onClick={dismiss} className="rounded-full border border-[#c6c6cf] px-5 py-2.5 text-[13px] font-bold text-[#45464e]">Not now</button>
          </div>
          {msg && <p role="alert" className="mt-2 text-[12px] text-[#ba1a1a]">{msg}</p>}
        </>
      )}
    </div>
  )
}