export type Match =
  | { kind: 'crisis' }
  | { kind: 'smalltalk'; reply: string }
  | { kind: 'topic'; id: string; confident: boolean }
  | { kind: 'clarify'; options: string[] }
  | { kind: 'none' }

type Keywords = { strong: string[]; weak?: string[] }

export const CRISIS_REPLY =
  'I’m really sorry you’re going through this. You matter, and you don’t have to carry it alone. Please message one of our counselors now, and if you are in immediate danger, call 112 first.'

export const NOT_SURE_REPLY =
  'I don’t have an answer for that yet. Pick a topic below, or message one of our team on WhatsApp and a real person will help.'

const GREETING_REPLY = 'Hello, welcome to theSpotlightChurch. Tap a topic below or type your question.'
const THANKS_REPLY = 'You’re welcome. God bless you.'

const KEYWORDS: Record<string, Keywords> = {
  times: {
    strong: ['service time', 'service times', 'what time', 'sunday service', 'midweek', 'mid week', 'wednesday', 'sunday', 'closing time', 'how long', 'weekday'],
    weak: ['time', 'times', 'when', 'service', 'worship', 'start', 'begin', 'schedule', 'hours', 'morning', 'evening'],
  },
  location: {
    strong: ['address', 'location', 'directions', 'direction', 'venue', 'map', 'icon hotel', 'nyanya', 'angwan', 'danlami', 'how do i get', 'find the church', 'located', 'locate', 'where una dey', 'na where una dey', 'church dey'],
    weak: ['where', 'place', 'hall', 'hotel', 'street'],
  },
  new: {
    strong: ['new here', 'first time', 'first timer', 'visiting', 'visit', 'new member', 'join', 'become a member', 'new to', 'welcome', 'how i fit join', 'i wan join'],
    weak: ['new', 'member', 'family'],
  },
  classes: {
    strong: ['class', 'classes', 'course', 'courses', 'membership class', 'leadership course', 'sslc', 'school of shift', 'certificate', 'certificates', 'cohort', 'cohorts', 'intake', 'intakes', 'enrol', 'enroll', 'training', 'coaching'],
    weak: ['learn', 'fee', 'fee be', 'price', 'cost', 'how much', 'how much be class', 'shift', 'register', 'membership'],
  },
  transport: {
    strong: ['transport', 'ride', 'pick up', 'pickup', 'pick me', 'lift', 'bus', 'cant come', 'how will i get', 'no way to come'],
    weak: ['car', 'drive', 'far', 'carpool', 'abeg'],
  },
  counselor: {
    strong: ['counselor', 'counsellor', 'counseling', 'counselling', 'prayer request', 'need prayer', 'pray for me', 'pray', 'prayer', 'talk to someone', 'speak to someone', 'talk to a person', 'speak to a person', 'real person', 'human', 'someone to talk', 'lonely', 'depressed', 'anxious', 'struggling'],
    weak: ['sad', 'stress', 'stressed', 'marriage', 'advice', 'worried', 'help'],
  },
  events: {
    strong: ['event', 'events', 'conference', 'shift conference', 'soaring', 'upcoming', 'programme', 'programmes', 'program', 'programs', 'flyer'],
    weak: ['registration', 'register', 'attend', 'happening'],
  },
  giving: {
    strong: ['give', 'giving', 'tithe', 'tithes', 'offering', 'offerings', 'donate', 'donation', 'seed', 'seeds', 'prophetic seed', 'account number', 'bank', 'transfer'],
    weak: ['pay', 'payment', 'money', 'sow'],
  },
  partner: {
    strong: ['partner', 'partners', 'partnership', 'kingdom partner', 'sponsor', 'monthly partner'],
    weak: ['support', 'fund', 'projects', 'monthly'],
  },
  watch: {
    strong: ['watch', 'livestream', 'live stream', 'stream', 'youtube', 'spotify', 'podcast', 'sermon', 'sermons', 'listen', 'broadcast', 'recorded'],
    weak: ['online', 'video', 'message', 'messages', 'live'],
  },
  pastor: {
    strong: ['pastor', 'apostle', 'edet', 'kingsley', 'setman', 'lead pastor', 'who leads', 'founder'],
    weak: ['leader', 'who'],
  },
  contact: {
    strong: ['contact', 'email', 'phone number', 'call you', 'reach you', 'social media', 'instagram', 'telegram', 'facebook'],
    weak: ['whatsapp', 'number', 'reach'],
  },
  vision: {
    strong: ['vision', 'mission', 'beliefs', 'believe', 'doctrine', 'about us', 'about the church', 'who are you', 'statement of faith'],
    weak: ['about', 'purpose'],
  },
}

const CRISIS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'end it all', 'want to die', 'wanna die',
  'dont want to live', 'hurt myself', 'self harm', 'cut myself', 'abuse', 'abused', 'being abused',
  'rape', 'raped', 'domestic violence', 'beating me',
]
const THANKS = ['thanks', 'thank you', 'thank u', 'amen', 'god bless', 'appreciate']
const GREETINGS = new Set([
  'hi', 'hello', 'hey', 'hola', 'good', 'morning', 'afternoon', 'evening', 'peace', 'howdy',
  'greetings', 'yo', 'there', 'everyone', 'sir', 'ma',
])

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

function editDistance(a: string, b: string) {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

function tokenMatch(a: string, b: string) {
  if (a === b) return true
  const len = Math.max(a.length, b.length)
  if (len < 6 || a[0] !== b[0]) return false
  return editDistance(a, b) <= (len >= 10 ? 2 : 1)
}

function phraseIn(tokens: string[], phrase: string[]) {
  for (let i = 0; i + phrase.length <= tokens.length; i++) {
    if (phrase.every((p, j) => tokenMatch(tokens[i + j], p))) return true
  }
  return false
}

export function matchQuestion(raw: string, previousTopic?: string): Match {
  const text = normalize(raw.slice(0, 200))
  if (!text) return { kind: 'none' }
  const tokens = text.split(' ')

  if (CRISIS.some(p => phraseIn(tokens, p.split(' ')))) return { kind: 'crisis' }
  if (tokens.every(t => GREETINGS.has(t))) return { kind: 'smalltalk', reply: GREETING_REPLY }
  if (tokens.length <= 5 && THANKS.some(p => phraseIn(tokens, p.split(' ')))) {
    return { kind: 'smalltalk', reply: THANKS_REPLY }
  }

  const scored = Object.entries(KEYWORDS)
    .map(([id, k]) => {
      let score = 0
      for (const p of k.strong) if (phraseIn(tokens, p.split(' '))) score += 3
      for (const p of k.weak ?? []) if (phraseIn(tokens, p.split(' '))) score += 1
      return { id, score: Math.min(score, 9) }
    })
    .sort((a, b) => b.score - a.score)

  const [best, runnerUp] = scored
  if (!best || best.score === 0) {
    if (previousTopic && /\b(also|and|what about|how about|when|where|how much|tomorrow|next)\b/.test(text)) {
      return { kind: 'topic', id: previousTopic, confident: true }
    }
    return { kind: 'none' }
  }
  if (best.score < 3 && best.score === (runnerUp?.score ?? 0) && best.score > 0) {
    return { kind: 'clarify', options: [best.id, runnerUp.id] }
  }
  return {
    kind: 'topic',
    id: best.id,
    confident: best.score >= 3 && best.score >= (runnerUp?.score ?? 0) + 2,
  }
}
