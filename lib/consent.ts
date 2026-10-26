export const CONSENT_KEY = 'spotlight_cookie_consent_v1'
export const CONSENT_EVENT = 'spotlight-consent-changed'
export const OPEN_PREFS_EVENT = 'spotlight-open-cookie-settings'

export type Consent = { analytics: boolean; decidedAt: string }

export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.analytics !== 'boolean') return null
    return parsed as Consent
  } catch {
    return null
  }
}

export function writeConsent(analytics: boolean) {
  const value: Consent = { analytics, decidedAt: new Date().toISOString() }
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value))
  } catch {
    // storage blocked — consent just won't persist across visits
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }))
}

// Google Analytics + Microsoft Clarity cookie names
const ANALYTICS_COOKIES = [/^_ga/, /^_gid/, /^_gat/, /^_clck/, /^_clsk/, /^CLID$/, /^ANONCHK$/, /^MR$/, /^SM$/, /^SRM_/]

export function clearAnalyticsCookies() {
  if (typeof document === 'undefined') return
  const host = window.location.hostname
  const domains = [host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'

  document.cookie.split(';').forEach(c => {
    const name = c.split('=')[0].trim()
    if (!ANALYTICS_COOKIES.some(p => p.test(name))) return
    document.cookie = `${name}=; ${expired}; path=/`
    domains.forEach(d => { document.cookie = `${name}=; ${expired}; path=/; domain=${d}` })
  })
}