'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Icon from '@/components/Icon'

const KEY_DISMISS = 'pwa-prompt-dismissed'
const KEY_VISITS = 'pwa-prompt-visits'
const COOLDOWN_DAYS = 21

const b64 = (s: string) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

const BENEFITS = [
  { icon: 'bolt', text: 'Opens instantly from your home screen' },
  { icon: 'favorite', text: 'Get a word of hope as a daily notification' },
  { icon: 'fullscreen', text: 'Distraction-free, full-screen experience' },
]

type Env = { ios: boolean; standalone: boolean; canPush: boolean }

export default function PwaPrompt() {
  const pathname = usePathname()
  const blocked = pathname.startsWith('/admin') || pathname.startsWith('/conference')
  const [env, setEnv] = useState<Env | null>(null)
  const [open, setOpen] = useState(false)
  const [installEvent, setInstallEvent] = useState<any>(null)
  const [step, setStep] = useState<'install' | 'push' | 'done'>('install')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [manual, setManual] = useState(false)

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
        let visits = Number(localStorage.getItem(KEY_VISITS) || 0)
        if (!sessionStorage.getItem(KEY_VISITS)) {
          visits += 1
          localStorage.setItem(KEY_VISITS, String(visits))
          sessionStorage.setItem(KEY_VISITS, '1')
        }
        if (visits < 2) return

        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
        let canPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && Notification.permission === 'default'
        if (canPush) {
          const reg = await navigator.serviceWorker.getRegistration()
          if (await reg?.pushManager.getSubscription()) canPush = false
        }
        timer = setTimeout(() => { setEnv({ ios, standalone, canPush }); setOpen(true) }, 12_000)
      } catch { /* storage blocked: stay quiet */ }
    })()
    return () => clearTimeout(timer)
  }, [blocked])

  const dismiss = () => {
    try { localStorage.setItem(KEY_DISMISS, String(Date.now())) } catch {}
    setOpen(false)
  }

  const install = async () => {
    if (!installEvent) { setManual(true); return }
    installEvent.prompt()
    const choice = await installEvent.userChoice.catch(() => null)
    setInstallEvent(null)
    if (choice?.outcome === 'accepted' && env?.canPush) setStep('push')
    else dismiss()
  }

  const turnOn = async () => {
    setBusy(true); setMsg('')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { dismiss(); setBusy(false); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) })
      const res = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })
      if (!res.ok) throw new Error()
      setStep('done')
      setTimeout(() => setOpen(false), 2500)
    } catch { setMsg('Could not turn on notifications. Please try again.') }
    setBusy(false)
  }

  if (blocked || !open || !env) return null

  const notInstalled = !env.standalone
  if (!notInstalled && !env.canPush) return null
  const iosInstall = env.ios && notInstalled
  const showPush = step === 'push' || (!notInstalled && step !== 'done')

  return (
    <>
      <div className="fixed inset-0 z-[59] bg-black/40" onClick={dismiss} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Get the church app"
        className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[460px] rounded-t-3xl bg-white px-6 pb-7 pt-6 shadow-2xl sm:bottom-6 sm:rounded-3xl">
        <button onClick={dismiss} aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f4f6] text-[#45464e]">
          <Icon name="close" className="text-[18px]" />
        </button>

        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] bg-[#081534] shadow-md ring-1 ring-[#fdc425]/30">
          <img src="/images/logo.png" alt="" className="h-full w-full object-cover" />
        </div>

        {step === 'done' ? (
          <p className="py-6 text-center text-[16px] font-bold text-green-800">You’re all set. God bless you!</p>
        ) : showPush ? (
          <>
            <h2 className="mt-4 text-center text-[20px] font-bold text-[#081534]">{step === 'push' ? 'App installed. One more step' : 'Get a word of hope daily'}</h2>
            <p className="mt-2 text-center text-[14px] leading-6 text-[#45464e]">Turn on notifications and get a short scripture or encouragement each day. You can turn it off any time.</p>
            <button onClick={turnOn} disabled={busy} className="mt-6 w-full rounded-xl bg-[#fdc425] py-3.5 text-[15px] font-bold text-[#6d5200] disabled:opacity-60">
              {busy ? 'Turning on...' : 'Turn on notifications'}
            </button>
            {msg && <p role="alert" className="mt-2 text-center text-[12px] text-[#ba1a1a]">{msg}</p>}
            <button onClick={dismiss} className="mt-3 w-full py-2 text-[13px] font-semibold text-[#45464e]">Not now</button>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-center text-[20px] font-bold text-[#081534]">Get the theSpotlightChurch app</h2>
            <p className="mt-2 text-center text-[14px] leading-6 text-[#45464e]">Install theSpotlightChurch on your device for a faster, full-screen experience.</p>
            <ul className="mt-5 space-y-3">
              {BENEFITS.map(b => (
                <li key={b.text} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4d6] text-[#785a00]"><Icon name={b.icon} className="text-[20px]" /></span>
                  <span className="text-[14px] font-medium text-[#191c1e]">{b.text}</span>
                </li>
              ))}
            </ul>
            {iosInstall ? (
              <p className="mt-5 rounded-xl bg-[#f7f9fb] p-4 text-[13px] leading-6 text-[#45464e]">
                On iPhone: tap the <strong>Share</strong> button, choose <strong>“Add to Home Screen”</strong>, then open theSpotlightChurch from your Home Screen. You can turn on daily notifications from there.
              </p>
            ) : (
              <>
                <button onClick={install} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#fdc425] py-3.5 text-[15px] font-bold text-[#6d5200]">
                  <Icon name="download" className="text-[18px]" /> Install App
                </button>
                {manual && (
                  <p className="mt-3 rounded-xl bg-[#f7f9fb] p-4 text-[13px] leading-6 text-[#45464e]">
                    Tap your browser menu (<strong>⋮</strong>), then choose <strong>“Install app”</strong> or <strong>“Add to Home screen”</strong>.
                  </p>
                )}
              </>
            )}
            <button onClick={dismiss} className="mt-3 w-full py-2 text-[13px] font-semibold text-[#45464e]">Not now</button>
          </>
        )}
      </div>
    </>
  )
}