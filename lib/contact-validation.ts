const NG = /^[789][01]\d{8}$/ // Nigerian mobile without the leading 0
const FAKE_LOCALS = new Set(['test', 'tester', 'abc', 'asdf', 'qwerty', 'none', 'noemail', 'na', 'nil', 'example', 'user', 'admin', 'email', 'xxx'])
const BAD_DOMAINS = new Set(['test.com', 'example.com', 'example.org', 'email.com', 'mail.com', 'abc.com', 'xyz.com', 'domain.com', 'mailinator.com', 'yopmail.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'trashmail.com', 'sharklasers.com'])
const TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com',
  'gamil.com': 'gmail.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'hotmal.com': 'hotmail.com', 'outlook.con': 'outlook.com',
}

// Returns +234XXXXXXXXXX (or +international), or null if it isn't a plausible number
export function normalizePhone(raw: string): string | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  let d = s.replace(/\D/g, '')
  if (/(\d)\1{6,}/.test(d)) return null // 08000000000, 1111111111
  if (s.startsWith('+') || d.startsWith('00')) {
    if (d.startsWith('00')) d = d.slice(2)
    if (d.startsWith('234')) return NG.test(d.slice(3)) ? `+${d}` : null
    return d.length >= 8 && d.length <= 15 ? `+${d}` : null
  }
  if (d.startsWith('0') && d.length === 11 && NG.test(d.slice(1))) return `+234${d.slice(1)}`
  if (d.startsWith('234') && NG.test(d.slice(3))) return `+${d}`
  if (NG.test(d)) return `+234${d}`
  return null
}

export const PHONE_HINT = 'Enter a valid phone number, e.g. 0803 123 4567'

export function checkEmail(raw: string): { ok: true; email: string } | { ok: false; error: string } {
  const email = String(raw ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Enter a valid email address.' }
  const [local, domain] = email.split('@')
  if (TYPOS[domain]) return { ok: false, error: `Did you mean ${local}@${TYPOS[domain]}?` }
  if (BAD_DOMAINS.has(domain) || FAKE_LOCALS.has(local.split('+')[0]) || /^(.)\1+$/.test(local)) {
    return { ok: false, error: 'Please use your real email address so we can reach you.' }
  }
  return { ok: true, email }
}