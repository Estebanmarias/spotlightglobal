'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'
import AdminLoader from '@/components/AdminLoader'
import Icon from '@/components/Icon'

type Msg = { id: string; title: string; body: string; url: string; send_on: string; sent_at: string | null; sent_count: number | null }
type Filter = 'scheduled' | 'sent' | 'all'
type Draft = { title: string; body: string; url: string; send_on: string }

const lagosDay = (offset = 0) => new Date(Date.now() + offset * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
const prettyDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const LINKS = ['/devotionals', '/community', '/giving', '/events', '/prayer', '/']
const inputCls = 'w-full rounded-lg border border-[#c6c6cf] bg-white px-3 py-2 text-[14px] text-[#191c1e]'

function Counter({ value, max }: { value: string; max: number }) {
  return <span className={`text-[11px] ${value.length > max ? 'text-[#ba1a1a]' : 'text-[#5f6068]'}`}>{value.length}/{max}</span>
}

export default function NotificationsAdminPage() {
  const supabase = getSupabaseClient()
  const access = useAdminAccess('notifications')
  const [items, setItems] = useState<Msg[]>([])
  const [subscribers, setSubscribers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('scheduled')
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const blank = (): Draft => ({ title: '', body: '', url: '/devotionals', send_on: lagosDay(1) })
  const [draft, setDraft] = useState<Draft>(blank())
  const [edit, setEdit] = useState<Draft>(blank())

  const headers = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` }
  }, [supabase])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications', { headers: await headers() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not load notifications.')
      setItems(json.messages ?? [])
      setSubscribers(json.subscribers ?? 0)
      setError('')
    } catch (e) { setError((e as Error).message) }
    setLoading(false)
  }, [headers])

  useEffect(() => { if (!access.loading) load() }, [access.loading, load])

  const call = async (method: string, payload?: object, query = '') => {
    const res = await fetch(`/api/admin/notifications${query}`, { method, headers: await headers(), body: payload ? JSON.stringify(payload) : undefined })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.')
  }

  const create = async () => {
    setSaving(true); setError('')
    try {
      await call('POST', draft)
      // stay on the same day until it has 2 messages, then move to the next day
      const onDay = items.filter(m => m.send_on === draft.send_on).length + 1
      const next = new Date(`${draft.send_on}T00:00:00Z`)
      if (onDay >= 2) next.setUTCDate(next.getUTCDate() + 1)
      setDraft({ ...blank(), send_on: next.toISOString().slice(0, 10) })
      await load()
    } catch (e) { setError((e as Error).message) }
    setSaving(false)
  }

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true); setError('')
    try { await call('PATCH', { id: editId, ...edit }); setEditId(null); await load() }
    catch (e) { setError((e as Error).message) }
    setSaving(false)
  }

  const remove = async (id: string) => {
    setConfirmId(null)
    try { await call('DELETE', undefined, `?id=${encodeURIComponent(id)}`); setItems(l => l.filter(m => m.id !== id)) }
    catch (e) { setError((e as Error).message) }
  }

  if (access.loading || loading) return <AdminLoader fullScreen label="Loading notifications..." />

  const scheduled = items.filter(m => !m.sent_at).sort((a, b) => a.send_on.localeCompare(b.send_on))
  const sent = items.filter(m => m.sent_at)
  const shown = filter === 'scheduled' ? scheduled : filter === 'sent' ? sent : [...scheduled, ...sent]
  const formOk = draft.title.trim() && draft.body.trim() && draft.title.length <= 60 && draft.body.length <= 180
  const lastScheduled = scheduled.length ? scheduled[scheduled.length - 1].send_on : null

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <div className="sticky top-0 z-30 border-b border-[#c6c6cf] bg-white px-4 py-4 sm:px-8">
        <h2 className="text-[20px] font-bold text-[#081534] sm:text-[24px]">Notifications</h2>
        <p className="text-[12px] text-[#45464e]">Up to 3 messages a day go to phones that turned notifications on. {subscribers} {subscribers === 1 ? 'person is' : 'people are'} subscribed.</p>
      </div>

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        {error && <div role="alert" className="rounded-xl bg-[#ffefed] px-4 py-3 text-[13px] text-[#8f1717]">{error}</div>}

        <section className="rounded-xl border border-[#c6c6cf] bg-white p-5">
          <h3 className="text-[15px] font-bold text-[#081534]">New message</h3>
          <p className="mt-1 text-[12px] text-[#45464e]">Use the KJV or your own words. Titles under about 40 characters and messages under about 120 read best on a phone lock screen.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="flex justify-between"><label htmlFor="n-title" className="text-[12px] font-bold text-[#45464e]">Title</label><Counter value={draft.title} max={60} /></div>
              <input id="n-title" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} className={inputCls} placeholder="A word for today" />
            </div>
            <div className="sm:col-span-2">
              <div className="flex justify-between"><label htmlFor="n-body" className="text-[12px] font-bold text-[#45464e]">Message</label><Counter value={draft.body} max={180} /></div>
              <textarea id="n-body" rows={3} value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} className={inputCls} placeholder="The LORD is my shepherd; I shall not want. — Psalm 23:1" />
            </div>
            <div>
              <label htmlFor="n-url" className="text-[12px] font-bold text-[#45464e]">Opens this page when tapped</label>
              <input id="n-url" list="n-links" value={draft.url} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))} className={inputCls} />
              <datalist id="n-links">{LINKS.map(l => <option key={l} value={l} />)}</datalist>
            </div>
            <div>
              <label htmlFor="n-date" className="text-[12px] font-bold text-[#45464e]">Send on</label>
              <input id="n-date" type="date" min={lagosDay(0)} value={draft.send_on} onChange={e => setDraft(d => ({ ...d, send_on: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={create} disabled={saving || !formOk} className="rounded-lg bg-[#081534] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50">
              {saving ? 'Saving...' : 'Schedule message'}
            </button>
            {lastScheduled && <span className="text-[12px] text-[#5f6068]">Scheduled up to {prettyDay(lastScheduled)}.</span>}
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {([['scheduled', 'Scheduled', scheduled.length], ['sent', 'Sent', sent.length], ['all', 'All', items.length]] as [Filter, string, number][]).map(([key, label, n]) => (
            <button key={key} onClick={() => setFilter(key)} aria-pressed={filter === key}
              className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${filter === key ? 'bg-[#081534] text-white' : 'border border-[#c6c6cf] bg-white text-[#45464e] hover:border-[#081534]'}`}>
              {label} <span className="opacity-70">{n}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c6c6cf] bg-white px-6 py-16 text-center">
            <Icon name="campaign" className="mx-auto text-[40px] text-[#c6c6cf]" />
            <p className="mt-3 text-[15px] font-bold text-[#081534]">Nothing here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(m => (
              <article key={m.id} className="rounded-xl border border-[#c6c6cf] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-[12px] font-semibold text-[#45464e]">{prettyDay(m.send_on)}</p>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${m.sent_at ? 'bg-green-100 text-green-800' : 'bg-[#fff4d6] text-[#785a00]'}`}>
                    {m.sent_at ? `Sent to ${m.sent_count ?? 0}` : 'Scheduled'}
                  </span>
                </div>

                {editId === m.id ? (
                  <div className="mt-3 space-y-2">
                    <input aria-label="Title" value={edit.title} onChange={e => setEdit(d => ({ ...d, title: e.target.value }))} className={inputCls} />
                    <textarea aria-label="Message" rows={3} value={edit.body} onChange={e => setEdit(d => ({ ...d, body: e.target.value }))} className={inputCls} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input aria-label="Link" value={edit.url} onChange={e => setEdit(d => ({ ...d, url: e.target.value }))} className={inputCls} />
                      <input aria-label="Send on" type="date" min={lagosDay(0)} value={edit.send_on} onChange={e => setEdit(d => ({ ...d, send_on: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving} className="rounded-lg bg-[#081534] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-60">Save</button>
                      <button onClick={() => setEditId(null)} className="rounded-lg border border-[#c6c6cf] px-4 py-2 text-[12px] font-bold text-[#45464e]">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-[14px] font-bold text-[#081534]">{m.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[14px] leading-6 text-[#191c1e]">{m.body}</p>
                    <p className="mt-2 text-[11px] text-[#5f6068]">Opens {m.url}</p>
                  </>
                )}

                {!m.sent_at && editId !== m.id && (
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <button onClick={() => { setEditId(m.id); setEdit({ title: m.title, body: m.body, url: m.url, send_on: m.send_on }) }}
                      className="rounded-lg border border-[#c6c6cf] px-3 py-1.5 text-[12px] font-bold text-[#45464e]">Edit</button>
                    {confirmId === m.id ? (
                      <span className="flex items-center gap-2 text-[12px]">
                        Delete?
                        <button onClick={() => remove(m.id)} className="rounded-lg bg-[#ba1a1a] px-3 py-1.5 font-bold text-white">Delete</button>
                        <button onClick={() => setConfirmId(null)} className="rounded-lg border border-[#c6c6cf] px-3 py-1.5 font-bold text-[#45464e]">Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmId(m.id)} aria-label="Delete message" className="rounded p-1.5 text-[#45464e] hover:bg-[#ffdad6] hover:text-[#ba1a1a]">
                        <Icon name="delete" className="text-[16px]" />
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}