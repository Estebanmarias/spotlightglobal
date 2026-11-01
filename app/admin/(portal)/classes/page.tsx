'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'
import AdminLoader from '@/components/AdminLoader'
import Icon from '@/components/Icon'

type Program = { id: string; slug: string; name: string; summary: string; sort_order: number; prerequisite_program_id: string | null }
type PersonHit = { id: string; first_name: string; last_name: string; email: string; phone: string | null }
type Intake = {
  id: string; program_id: string; title: string; start_date: string; end_date: string
  registration_open: boolean; registration_deadline: string | null; capacity: number | null
  price: number; currency: string; payment_instructions: string | null
  meeting_details: string | null; meeting_link: string | null; min_sessions: number | null
}
type Session = { id: string; session_date: string; title: string; mode: 'in_person' | 'remote'; time_label: string | null }
type Enrollment = {
  id: string; full_name: string; email: string; phone: string; status: string
  approval_status: string; prerequisite_met: boolean; payment_status: string
  amount_due: number; currency: string; certificate_issued_at: string | null
}
type Attendance = { enrollment_id: string; session_id: string; present: boolean }
type Detail = { sessions: Session[]; enrollments: Enrollment[]; attendance: Attendance[] }
type ConfirmState = { title: string; body: string; label: string; danger?: boolean; run: () => Promise<void> }
type ApiError = Error & { needsForce?: boolean }

type Form = {
  program_id: string; title: string; start_date: string; end_date: string
  registration_deadline: string; capacity: string; price: string; min_sessions: string
  meeting_link: string; meeting_details: string; payment_instructions: string
}
type SessionDraft = { session_date: string; title: string; mode: 'in_person' | 'remote'; time_label: string }

const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors'
const labelCls = 'block text-[12px] font-bold text-[#45464e] uppercase tracking-wide mb-1.5'
const btn = 'rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition disabled:opacity-50'

const localToday = () => {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtShort = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })
const money = (n: number, c: string) => (Number(n) > 0 ? `${c} ${Number(n).toLocaleString('en-NG')}` : 'Free')
const draft = (date: string, title: string, mode: SessionDraft['mode'], time = ''): SessionDraft => ({ session_date: date, title, mode, time_label: time })

const TONES = {
  green: 'bg-green-100 text-green-800', gold: 'bg-[#fdc425]/25 text-[#6d5200]',
  red: 'bg-[#ffdad6] text-[#ba1a1a]', blue: 'bg-blue-100 text-blue-800', gray: 'bg-[#f2f4f6] text-[#45464e]',
} as const

function Chip({ tone = 'gray', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${TONES[tone]}`}>{children}</span>
}

function Dialog({ onClose, children, wide = false }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`pointer-events-auto max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-[720px]' : 'max-w-[420px]'}`}>
          {children}
        </div>
      </motion.div>
    </>
  )
}

function IntakeModal({ mode, programs, programId, intake, onClose, onSubmit }: {
  mode: 'create' | 'edit'; programs: Program[]; programId: string; intake?: Intake
  onClose: () => void; onSubmit: (body: Record<string, unknown>) => Promise<void>
}) {
  const [form, setForm] = useState<Form>(() => intake ? {
    program_id: intake.program_id, title: intake.title, start_date: intake.start_date, end_date: intake.end_date,
    registration_deadline: intake.registration_deadline ?? '', capacity: intake.capacity ? String(intake.capacity) : '',
    price: String(intake.price ?? 0), min_sessions: intake.min_sessions ? String(intake.min_sessions) : '',
    meeting_link: intake.meeting_link ?? '', meeting_details: intake.meeting_details ?? '',
    payment_instructions: intake.payment_instructions ?? '',
  } : {
    program_id: programId, title: '', start_date: '', end_date: '', registration_deadline: '', capacity: '',
    price: '0', min_sessions: '', meeting_link: '', meeting_details: '', payment_instructions: '',
  })
  const [sessions, setSessions] = useState<SessionDraft[]>([])
  const [weeks, setWeeks] = useState('12')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const program = programs.find(p => p.id === form.program_id)
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const applySessions = (list: SessionDraft[]) => {
    setSessions(list)
    const last = list.map(s => s.session_date).sort().pop()
    if (last) setForm(f => (!f.end_date || f.end_date < last ? { ...f, end_date: last } : f))
  }
  const membershipSchedule = () => {
    const s = form.start_date
    applySessions([
      draft(addDays(s, 0), 'Class 1', 'in_person', 'After service'),
      draft(addDays(s, 4), 'Online class 1', 'remote'),
      draft(addDays(s, 7), 'Class 2', 'in_person', 'After service'),
      draft(addDays(s, 11), 'Online class 2', 'remote'),
      draft(addDays(s, 14), 'Class 3', 'in_person', 'After service'),
      draft(addDays(s, 18), 'Online class 3', 'remote'),
    ])
  }
  const weekly = () => {
    const n = Math.min(Math.max(parseInt(weeks) || 0, 1), 40)
    applySessions(Array.from({ length: n }, (_, i) => draft(addDays(form.start_date, i * 7), `Session ${i + 1}`, 'remote')))
  }
  const updateSession = (i: number, patch: Partial<SessionDraft>) =>
    setSessions(list => list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))

  const submit = async () => {
    setError('')
    if (mode === 'create') {
      if (!form.program_id || !form.title.trim() || !form.start_date || !form.end_date) return setError('Choose a class, add a title and set the start and end dates.')
      if (sessions.some(s => !s.session_date || !s.title.trim())) return setError('Every session needs a date and a title.')
    }
    const common = {
      title: form.title, registration_deadline: form.registration_deadline, capacity: form.capacity,
      price: Number(form.price || 0), min_sessions: form.min_sessions, meeting_link: form.meeting_link,
      meeting_details: form.meeting_details, payment_instructions: form.payment_instructions,
    }
    setSaving(true)
    try {
      await onSubmit(mode === 'create'
        ? { action: 'create_intake', program_id: form.program_id, start_date: form.start_date, end_date: form.end_date, sessions, ...common }
        : { action: 'update_intake', intake_id: intake!.id, ...common })
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <Dialog onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-[#c6c6cf] px-6 py-5">
        <h3 className="text-[18px] font-bold text-[#081534]">{mode === 'create' ? 'New intake' : 'Edit intake'}</h3>
        <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6]">
          <Icon name="close" className="text-[20px]" />
        </button>
      </div>

      <div className="space-y-5 px-6 py-6">
        {mode === 'create' && (
          <div>
            <label className={labelCls}>Class</label>
            <select value={form.program_id} onChange={set('program_id')} className={inputCls}>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={labelCls}>Title</label>
          <input value={form.title} onChange={set('title')} placeholder="e.g. November intake" className={inputCls} />
        </div>
        {mode === 'create' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Start date</label><input type="date" value={form.start_date} onChange={set('start_date')} className={inputCls} /></div>
            <div><label className={labelCls}>End date</label><input type="date" value={form.end_date} onChange={set('end_date')} className={inputCls} /></div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>Registration deadline</label><input type="date" value={form.registration_deadline} onChange={set('registration_deadline')} className={inputCls} /></div>
          <div><label className={labelCls}>Capacity (blank = no limit)</label><input type="number" min="1" value={form.capacity} onChange={set('capacity')} className={inputCls} /></div>
          <div><label className={labelCls}>Price (0 = free)</label><input type="number" min="0" value={form.price} onChange={set('price')} className={inputCls} /></div>
          <div><label className={labelCls}>Sessions required for completion</label><input type="number" min="1" value={form.min_sessions} onChange={set('min_sessions')} placeholder="Blank = no minimum" className={inputCls} /></div>
        </div>
        <div>
          <label className={labelCls}>WhatsApp group link</label>
          <input value={form.meeting_link} onChange={set('meeting_link')} placeholder="https://chat.whatsapp.com/… (sent by email once they're confirmed)" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>How we meet</label>
          <textarea rows={2} value={form.meeting_details} onChange={set('meeting_details')} placeholder="e.g. Sundays after service at Icon Hotel Hall; Thursdays online." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Payment instructions</label>
          <textarea rows={3} value={form.payment_instructions} onChange={set('payment_instructions')} placeholder="Bank, account number, and what to put as the reference." className={inputCls} />
        </div>

        {mode === 'create' && (
          <div className="space-y-3 rounded-xl border border-[#e2e2e9] bg-[#f7f9fb] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-[#081534]">Sessions</p>
              <div className="flex flex-wrap items-center gap-2">
                {program?.slug === 'membership-class' && (
                  <button type="button" disabled={!form.start_date} onClick={membershipSchedule}
                    className={`${btn} bg-[#081534] text-white`}>Fill membership schedule</button>
                )}
                <input type="number" min="1" max="40" value={weeks} onChange={e => setWeeks(e.target.value)}
                  aria-label="Number of weekly sessions" className="w-16 rounded-lg border border-[#c6c6cf] bg-white px-2 py-1.5 text-[12px]" />
                <button type="button" disabled={!form.start_date} onClick={weekly}
                  className={`${btn} border border-[#081534] text-[#081534]`}>Generate weekly</button>
                <button type="button" onClick={() => setSessions(l => [...l, draft('', '', 'remote')])}
                  className={`${btn} border border-[#c6c6cf] text-[#45464e]`}>Add one</button>
              </div>
            </div>
            {!form.start_date && <p className="text-[11px] text-[#76777f]">Set a start date to use the generators. The Sunday class starts on the date you choose.</p>}
            {sessions.map((s, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[130px_1fr_110px_110px_32px]">
                <input type="date" value={s.session_date} onChange={e => updateSession(i, { session_date: e.target.value })} className="rounded-lg border border-[#c6c6cf] bg-white px-2 py-2 text-[12px]" />
                <input value={s.title} onChange={e => updateSession(i, { title: e.target.value })} placeholder="Title" className="rounded-lg border border-[#c6c6cf] bg-white px-2 py-2 text-[12px]" />
                <select value={s.mode} onChange={e => updateSession(i, { mode: e.target.value as SessionDraft['mode'] })} className="rounded-lg border border-[#c6c6cf] bg-white px-2 py-2 text-[12px]">
                  <option value="in_person">In person</option><option value="remote">Online</option>
                </select>
                <input value={s.time_label} onChange={e => updateSession(i, { time_label: e.target.value })} placeholder="Time" className="rounded-lg border border-[#c6c6cf] bg-white px-2 py-2 text-[12px]" />
                <button type="button" aria-label="Remove session" onClick={() => setSessions(l => l.filter((_, idx) => idx !== i))}
                  className="flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#ffdad6] hover:text-[#ba1a1a]">
                  <Icon name="close" className="text-[16px]" />
                </button>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-[13px] font-semibold text-[#ba1a1a]">{error}</p>}
      </div>

      <div className="flex gap-3 border-t border-[#c6c6cf] px-6 py-4">
        <button onClick={onClose} className="flex-1 rounded-xl border border-[#c6c6cf] py-3 text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">Cancel</button>
        <button onClick={submit} disabled={saving} className="flex-1 rounded-xl bg-[#081534] py-3 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving...' : mode === 'create' ? 'Create intake' : 'Save changes'}
        </button>
      </div>
    </Dialog>
  )
}

function AddPersonModal({ intake, canPreComplete, onClose, search, onSubmit }: {
  intake: Intake; canPreComplete: boolean; onClose: () => void
  search: (q: string) => Promise<PersonHit[]>
  onSubmit: (body: Record<string, unknown>) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<PersonHit[]>([])
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState<PersonHit | null>(null)
  const [markPaid, setMarkPaid] = useState(false)
  const [preComplete, setPreComplete] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = query.trim()
    if (picked || q.length < 2) return
    let live = true
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await search(q)
        if (live) setHits(r)
      } catch (e) {
        if (live) setError((e as Error).message)
      }
      if (live) setSearching(false)
    }, 250)
    return () => { live = false; clearTimeout(t) }
  }, [query, picked, search])

  const shown = picked || query.trim().length < 2 ? [] : hits
  const priced = Number(intake.price) > 0

  const submit = async () => {
    if (!picked) return setError('Choose a person first.')
    setError('')
    setSaving(true)
    try {
      await onSubmit({
        action: 'add_enrollment', intake_id: intake.id, member_id: picked.id,
        mark_paid: markPaid, already_completed: preComplete, send_email: sendEmail && !preComplete,
      })
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <Dialog onClose={onClose}>
      <div className="flex items-center justify-between border-b border-[#c6c6cf] px-6 py-5">
        <h3 className="text-[17px] font-bold text-[#081534]">Add a person</h3>
        <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6]">
          <Icon name="close" className="text-[20px]" />
        </button>
      </div>
      <div className="space-y-5 px-6 py-6">
        <p className="text-[12px] text-[#45464e]">Only people already in the members list can be added to {intake.title}.</p>

        {picked ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f2f4f6] p-4">
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[#081534]">{picked.first_name} {picked.last_name}</p>
              <p className="truncate text-[12px] text-[#45464e]">{picked.email}</p>
              <p className="text-[12px] text-[#76777f]">{picked.phone || 'No phone on file'}</p>
            </div>
            <button onClick={() => { setPicked(null); setQuery('') }} className={`${btn} border border-[#c6c6cf] text-[#45464e]`}>Change</button>
          </div>
        ) : (
          <div>
            <label className={labelCls}>Find a member</label>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or email" autoFocus className={inputCls} />
            <div className="mt-2 space-y-1">
              {searching && <p className="px-1 text-[12px] text-[#76777f]">Searching…</p>}
              {!searching && query.trim().length >= 2 && shown.length === 0 && (
                <p className="px-1 text-[12px] text-[#76777f]">No match. They need to join the church first.</p>
              )}
              {shown.map(h => (
                <button key={h.id} onClick={() => setPicked(h)}
                  className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-[#f2f4f6]">
                  <span className="text-[13px] font-semibold text-[#081534]">{h.first_name} {h.last_name}</span>
                  <span className="text-[11px] text-[#45464e]">{h.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {picked && (
          <div className="space-y-3">
            {priced && !preComplete && (
              <label className="flex cursor-pointer items-start gap-3 text-[13px] text-[#191c1e]">
                <input type="checkbox" checked={markPaid} onChange={e => setMarkPaid(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#081534]" />
                Payment already received ({money(intake.price, intake.currency)})
              </label>
            )}
            {canPreComplete && (
              <label className="flex cursor-pointer items-start gap-3 text-[13px] text-[#191c1e]">
                <input type="checkbox" checked={preComplete} onChange={e => setPreComplete(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#081534]" />
                <span>
                  Mark as already completed
                  <span className="block text-[11px] text-[#76777f]">Counts as finishing this class, sets them to Member, and lets them register for the next one. No email is sent.</span>
                </span>
              </label>
            )}
            {!preComplete && (
              <label className="flex cursor-pointer items-start gap-3 text-[13px] text-[#191c1e]">
                <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#081534]" />
                Send the confirmation email
              </label>
            )}
          </div>
        )}
        {error && <p className="text-[13px] font-semibold text-[#ba1a1a]">{error}</p>}
      </div>
      <div className="flex gap-3 border-t border-[#c6c6cf] px-6 py-4">
        <button onClick={onClose} className="flex-1 rounded-xl border border-[#c6c6cf] py-3 text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">Cancel</button>
        <button onClick={submit} disabled={saving || !picked} className="flex-1 rounded-xl bg-[#081534] py-3 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-50">
          {saving ? 'Adding...' : 'Add to roster'}
        </button>
      </div>
    </Dialog>
  )
}

export default function ClassesAdminPage() { 
  const supabase = getSupabaseClient()
  const access = useAdminAccess('classes')

  const [programs, setPrograms] = useState<Program[]>([])
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [programId, setProgramId] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail>({ sessions: [], enrollments: [], attendance: [] })
  const [detailLoading, setDetailLoading] = useState(false)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<Enrollment | null>(null)
  const [payRef, setPayRef] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

  const api = useCallback(async (method: 'GET' | 'POST', body?: Record<string, unknown>, query = '') => {
    const { data } = await supabase.auth.getSession()
    const res = await fetch(`/api/admin/classes${query}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw Object.assign(new Error(json.error || 'Something went wrong.'), { needsForce: Boolean(json.needsForce) })
    return json
  }, [supabase])

  const load = useCallback(async (intakeId?: string | null) => {
    try {
      const d = await api('GET', undefined, intakeId ? `?intake=${intakeId}` : '')
      setPrograms(d.programs ?? [])
      setIntakes(d.intakes ?? [])
      setCounts(d.counts ?? {})
      if (intakeId) setDetail({ sessions: d.sessions ?? [], enrollments: d.enrollments ?? [], attendance: d.attendance ?? [] })
    } catch (e) {
      showToast((e as Error).message)
    }
    setLoading(false)
    setDetailLoading(false)
  }, [api])

  useEffect(() => { if (!access.loading) load() }, [access.loading, load])
  useEffect(() => { if (!programId && programs.length) setProgramId(programs[0].id) }, [programs, programId])

  const openIntake = (id: string) => { setActiveId(id); setDetailLoading(true); load(id) }
  const closeIntake = () => { setActiveId(null); load() }

  const active = intakes.find(i => i.id === activeId) ?? null
  const activeProgram = programs.find(p => p.id === active?.program_id)
  const programIntakes = intakes.filter(i => i.program_id === programId)
  const today = localToday()

  const attMap = useMemo(() => {
    const m = new Map<string, boolean>()
    detail.attendance.forEach(a => m.set(`${a.enrollment_id}:${a.session_id}`, a.present))
    return m
  }, [detail.attendance])

  const stats = useMemo(() => {
    const live = detail.enrollments.filter(e => !['dropped', 'rejected'].includes(e.status))
    return {
      registered: live.length,
      paid: detail.enrollments.filter(e => e.payment_status === 'paid').length,
      awaiting: detail.enrollments.filter(e => e.approval_status === 'pending').length,
      completed: detail.enrollments.filter(e => e.status === 'completed').length,
    }
  }, [detail.enrollments])

  const canAttend = (e: Enrollment) =>
    ['registered', 'in_progress', 'completed'].includes(e.status) && e.approval_status !== 'pending' && e.payment_status !== 'pending'

  const toggleAttendance = async (enrollmentId: string, sessionId: string) => {
    const next = !attMap.get(`${enrollmentId}:${sessionId}`)
    const apply = (present: boolean) => setDetail(d => ({
      ...d,
      attendance: [
        ...d.attendance.filter(a => !(a.enrollment_id === enrollmentId && a.session_id === sessionId)),
        { enrollment_id: enrollmentId, session_id: sessionId, present },
      ],
    }))
    apply(next)
    try {
      await api('POST', { action: 'set_attendance', enrollment_id: enrollmentId, session_id: sessionId, present: next })
    } catch (e) {
      apply(!next)
      showToast((e as Error).message)
    }
  }

  const run = async (busy: string, body: Record<string, unknown>, success: string) => {
    setBusyId(busy)
    try {
      const r = await api('POST', body)
      showToast(r.emailSent === false ? `${success}. The email could not be sent.` : r.notified > 0 ? `${success}. ${r.notified} eligible ${r.notified === 1 ? 'person' : 'people'} emailed.` : success)
      await load(activeId)
    } catch (e) {
      showToast((e as Error).message)
    }
    setBusyId(null)
  }

  const completeEnrollment = async (en: Enrollment, force = false) => {
    setBusyId(en.id)
    try {
      const r = await api('POST', { action: 'mark_completed', enrollment_id: en.id, force })
      const base = r.membershipConfirmed ? `${en.full_name} completed and confirmed as a member` : `${en.full_name} marked as completed`
      showToast(r.emailSent === false ? `${base}. The email could not be sent.` : base)
      await load(activeId)
    } catch (e) {
      const err = e as ApiError
      if (err.needsForce) {
        setConfirm({
          title: 'Complete anyway?',
          body: `${err.message} Mark ${en.full_name} as completed regardless?`,
          label: 'Complete anyway',
          run: () => completeEnrollment(en, true),
        })
      } else {
        showToast(err.message)
      }
    }
    setBusyId(null)
  }

  const askConfirm = (state: ConfirmState) => setConfirm(state)
  const submitIntake = async (body: Record<string, unknown>) => {
    const r = await api('POST', body)
    setModal(null)
    showToast(body.action === 'create_intake' ? 'Intake created' : 'Intake updated')
    await load(activeId)
    if (body.action === 'create_intake' && r.id) openIntake(r.id)
  }

  const searchMembers = useCallback(async (q: string): Promise<PersonHit[]> => {
    const r = await api('POST', { action: 'search_members', query: q })
    return r.members ?? []
  }, [api])

  const submitAdd = async (body: Record<string, unknown>) => {
    const r = await api('POST', body)
    setAddOpen(false)
    showToast(r.emailSent === false ? 'Added. The email could not be sent.' : 'Added to the roster')
    await load(activeId)
  }

  if (access.loading || loading) return <AdminLoader fullScreen label="Loading classes..." />

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <div className="sticky top-0 z-30 border-b border-[#c6c6cf] bg-white px-4 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {active && (
              <button onClick={closeIntake} aria-label="Back to intakes"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c6c6cf] text-[#45464e] hover:bg-[#f2f4f6]">
                <Icon name="arrow_back" className="text-[18px]" />
              </button>
            )}
            <div>
              <h2 className="text-[20px] font-bold text-[#081534] sm:text-[24px]">{active ? active.title : 'Classes'}</h2>
              <p className="text-[12px] text-[#45464e]">{active ? activeProgram?.name : 'Membership Class, SSLC and School of Shift'}</p>
            </div>
          </div>
          {!active ? (
            <button onClick={() => setModal('create')} className="flex items-center gap-1.5 rounded-lg bg-[#081534] px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90">
              <Icon name="add" className="text-[16px]" /> New intake
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-[#081534] px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90">
                <Icon name="person_add" className="text-[16px]" /> Add person
              </button>
              <button onClick={() => setModal('edit')} className="flex items-center gap-1.5 rounded-lg border border-[#c6c6cf] bg-white px-3 py-2 text-[12px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">
                <Icon name="edit" className="text-[16px]" /> Edit
              </button>
              <button
                onClick={() => run(active.id, { action: 'update_intake', intake_id: active.id, registration_open: !active.registration_open },
                  active.registration_open ? 'Registration closed' : 'Registration opened')}
                disabled={busyId === active.id}
                className={`rounded-lg px-4 py-2 text-[12px] font-bold disabled:opacity-50 ${active.registration_open ? 'border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]' : 'bg-[#fdc425] text-[#6d5200] hover:brightness-105'}`}>
                {active.registration_open ? 'Close registration' : 'Open registration'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {!active && (
          <>
            <div className="flex flex-wrap gap-2">
              {programs.map(p => (
                <button key={p.id} onClick={() => setProgramId(p.id)}
                  className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${programId === p.id ? 'bg-[#081534] text-white' : 'border border-[#c6c6cf] bg-white text-[#45464e] hover:border-[#081534]'}`}>
                  {p.name}
                </button>
              ))}
            </div>

            {programIntakes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#c6c6cf] bg-white px-6 py-16 text-center">
                <Icon name="school" className="mx-auto text-[40px] text-[#c6c6cf]" />
                <p className="mt-3 text-[15px] font-bold text-[#081534]">No intakes yet</p>
                <p className="mt-1 text-[13px] text-[#76777f]">Create the first intake for this class to open registration.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {programIntakes.map(i => {
                  const phase = today > i.end_date ? 'Ended' : today >= i.start_date ? 'Running' : 'Upcoming'
                  return (
                    <button key={i.id} onClick={() => openIntake(i.id)}
                      className="rounded-xl border border-[#c6c6cf] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] font-bold text-[#081534]">{i.title}</h3>
                        <Chip tone={phase === 'Running' ? 'blue' : 'gray'}>{phase}</Chip>
                      </div>
                      <p className="mt-1 text-[12px] text-[#45464e]">{fmt(i.start_date)} to {fmt(i.end_date)}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Chip>{counts[i.id] ?? 0}{i.capacity ? ` of ${i.capacity}` : ''} registered</Chip>
                        {Number(i.price) > 0 && <Chip tone="gold">{money(i.price, i.currency)}</Chip>}
                        <Chip tone={i.registration_open ? 'green' : 'gray'}>{i.registration_open ? 'Registration open' : 'Registration closed'}</Chip>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {active && (
          detailLoading ? <AdminLoader label="Loading intake..." /> : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: 'Registered', value: stats.registered + (active.capacity ? ` / ${active.capacity}` : '') },
                  { label: 'Paid', value: stats.paid },
                  { label: 'Awaiting approval', value: stats.awaiting },
                  { label: 'Completed', value: stats.completed },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-[#c6c6cf] bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#76777f]">{s.label}</p>
                    <p className="mt-1 text-[24px] font-bold text-[#081534]">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px] text-[#45464e]">
                <span>{fmt(active.start_date)} to {fmt(active.end_date)}</span>
                <span>{money(active.price, active.currency)}</span>
                <span>{active.min_sessions ? `${active.min_sessions} sessions needed to complete` : 'No attendance minimum set'}</span>
                {active.registration_deadline && <span>Deadline {fmt(active.registration_deadline)}</span>}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#c6c6cf] bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#c6c6cf] bg-[#f2f4f6]">
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#45464e]">Person</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#45464e]">Status</th>
                        {detail.sessions.map(s => (
                          <th key={s.id} className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#45464e]" title={`${s.title}${s.time_label ? ` · ${s.time_label}` : ''}`}>
                            <Icon name={s.mode === 'remote' ? 'videocam' : 'location_on'} className="mx-auto mb-0.5 text-[13px] text-[#785a00]" />
                            {fmtShort(s.session_date)}
                          </th>
                        ))}
                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#45464e]">Attended</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#45464e]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.enrollments.length === 0 && (
                        <tr><td colSpan={detail.sessions.length + 4} className="px-6 py-14 text-center text-[13px] text-[#76777f]">No registrations yet.</td></tr>
                      )}
                      {detail.enrollments.map(en => {
                        const attendable = canAttend(en)
                        const present = detail.sessions.filter(s => attMap.get(`${en.id}:${s.id}`)).length
                        const live = ['registered', 'in_progress'].includes(en.status)
                        return (
                          <tr key={en.id} className="border-t border-[#f2f4f6] align-top">
                            <td className="px-4 py-3">
                              <p className="text-[13px] font-bold text-[#081534]">{en.full_name}</p>
                              <p className="text-[11px] text-[#45464e]">{en.email}</p>
                              <p className="text-[11px] text-[#76777f]">{en.phone}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                <Chip tone={en.status === 'completed' ? 'green' : en.status === 'in_progress' ? 'blue' : en.status === 'rejected' ? 'red' : 'gray'}>
                                  {en.status === 'in_progress' ? 'In progress' : en.status.charAt(0).toUpperCase() + en.status.slice(1)}
                                </Chip>
                                {en.approval_status === 'pending' && <Chip tone="gold">Needs approval</Chip>}
                                {!en.prerequisite_met && <Chip tone="gold">Prerequisite not met</Chip>}
                                {en.payment_status === 'pending' && <Chip tone="gold">Payment pending</Chip>}
                                {en.payment_status === 'paid' && <Chip tone="green">Paid</Chip>}
                                {en.payment_status === 'refund_due' && <Chip tone="red">Refund due</Chip>}
                                {en.payment_status === 'refunded' && <Chip>Refunded</Chip>}
                                {en.certificate_issued_at && <Chip tone="green">Certificate sent</Chip>}
                              </div>
                            </td>
                            {detail.sessions.map(s => (
                              <td key={s.id} className="px-2 py-3 text-center">
                                <input type="checkbox" disabled={!attendable} checked={Boolean(attMap.get(`${en.id}:${s.id}`))}
                                  onChange={() => toggleAttendance(en.id, s.id)}
                                  aria-label={`${en.full_name} at ${s.title}`} className="h-4 w-4 accent-[#081534] disabled:opacity-30" />
                              </td>
                            ))}
                            <td className="px-3 py-3 text-center text-[12px] font-bold text-[#081534]">{present}/{detail.sessions.length}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {en.payment_status === 'pending' && en.status !== 'rejected' && (
                                  <button className={`${btn} bg-[#fdc425] text-[#6d5200]`} disabled={busyId === en.id}
                                    onClick={() => { setPayRef(''); setPayTarget(en) }}>Confirm payment</button>
                                )}
                                {en.approval_status === 'pending' && (
                                  <>
                                    <button className={`${btn} bg-[#081534] text-white`} disabled={busyId === en.id}
                                      onClick={() => run(en.id, { action: 'approve', enrollment_id: en.id }, `${en.full_name} approved`)}>Approve</button>
                                    <button className={`${btn} border border-[#ba1a1a] text-[#ba1a1a]`} disabled={busyId === en.id}
                                      onClick={() => askConfirm({
                                        title: 'Reject this registration?',
                                        body: `${en.full_name} will be emailed.${en.payment_status === 'paid' ? ' They have paid, so a refund will be marked as due.' : ''}`,
                                        label: 'Reject', danger: true,
                                        run: () => run(en.id, { action: 'reject', enrollment_id: en.id }, `${en.full_name} rejected`),
                                      })}>Reject</button>
                                  </>
                                )}
                                {en.payment_status === 'refund_due' && (
                                  <button className={`${btn} border border-[#081534] text-[#081534]`} disabled={busyId === en.id}
                                    onClick={() => run(en.id, { action: 'mark_refunded', enrollment_id: en.id }, 'Marked as refunded')}>Refund sent</button>
                                )}
                                {live && en.approval_status !== 'pending' && en.payment_status !== 'pending' && (
                                  <button className={`${btn} bg-green-700 text-white`} disabled={busyId === en.id}
                                    onClick={() => completeEnrollment(en)}>Mark completed</button>
                                )}
                                {en.status === 'completed' && !en.certificate_issued_at && (
                                  <button className={`${btn} bg-[#081534] text-white`} disabled={busyId === en.id}
                                    onClick={() => askConfirm({
                                      title: 'Issue certificate?',
                                      body: `${en.full_name} will receive their certificate by email as a PDF.`,
                                      label: 'Issue certificate',
                                      run: () => run(en.id, { action: 'issue_certificate', enrollment_id: en.id }, 'Certificate issued'),
                                    })}>Issue certificate</button>
                                )}
                                {live && (
                                  <button className={`${btn} border border-[#c6c6cf] text-[#45464e] hover:text-[#ba1a1a]`} disabled={busyId === en.id}
                                    onClick={() => askConfirm({
                                      title: 'Mark as dropped?', body: `${en.full_name} will no longer count towards capacity.`, label: 'Drop',
                                      danger: true, run: () => run(en.id, { action: 'set_status', enrollment_id: en.id, status: 'dropped' }, `${en.full_name} dropped`),
                                    })}>Drop</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <IntakeModal mode={modal} programs={programs} programId={programId} intake={modal === 'edit' ? active ?? undefined : undefined}
            onClose={() => setModal(null)} onSubmit={submitIntake} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addOpen && active && (
          <AddPersonModal
            intake={active}
            canPreComplete={programs.some(p => p.prerequisite_program_id === active.program_id)}
            onClose={() => setAddOpen(false)}
            search={searchMembers}
            onSubmit={submitAdd}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {payTarget && (
          <Dialog onClose={() => setPayTarget(null)}>
            <div className="p-6">
              <h3 className="text-[17px] font-bold text-[#081534]">Confirm payment</h3>
              <p className="mt-2 text-[13px] text-[#45464e]">
                Confirm that {payTarget.full_name} has paid {money(payTarget.amount_due, payTarget.currency)}. They will be emailed a receipt.
              </p>
              <label className={`${labelCls} mt-5`}>Payment reference (optional)</label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Bank reference or note" className={inputCls} />
              <div className="mt-6 flex gap-3">
                <button onClick={() => setPayTarget(null)} className="flex-1 rounded-xl border border-[#c6c6cf] py-3 text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">Cancel</button>
                <button onClick={async () => {
                  const t = payTarget; setPayTarget(null)
                  await run(t.id, { action: 'confirm_payment', enrollment_id: t.id, payment_reference: payRef }, 'Payment confirmed')
                }} className="flex-1 rounded-xl bg-[#081534] py-3 text-[13px] font-bold text-white hover:opacity-90">Confirm</button>
              </div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirm && (
          <Dialog onClose={() => setConfirm(null)}>
            <div className="p-6">
              <h3 className="text-[17px] font-bold text-[#081534]">{confirm.title}</h3>
              <p className="mt-2 text-[13px] text-[#45464e]">{confirm.body}</p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setConfirm(null)} className="flex-1 rounded-xl border border-[#c6c6cf] py-3 text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">Cancel</button>
                <button disabled={confirming} onClick={async () => {
                  setConfirming(true)
                  const c = confirm; setConfirm(null)
                  await c.run()
                  setConfirming(false)
                }} className={`flex-1 rounded-xl py-3 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-50 ${confirm.danger ? 'bg-[#ba1a1a]' : 'bg-[#081534]'}`}>{confirm.label}</button>
              </div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-full bg-[#081534] px-5 py-3 text-[13px] font-semibold text-white shadow-lg">
            <Icon name="check_circle" className="text-[16px] text-[#fdc425]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}