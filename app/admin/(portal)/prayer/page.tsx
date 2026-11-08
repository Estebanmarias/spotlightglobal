'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'
import AdminLoader from '@/components/AdminLoader'
import Icon from '@/components/Icon'

type Status = 'new' | 'prayed' | 'follow_up'
type PrayerRequest = {
  id: string; created_at: string; name: string | null; contact: string | null
  request: string; wants_reply: boolean; status: Status
}

const FILTERS: { key: 'all' | Status; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'follow_up', label: 'Follow up' },
  { key: 'prayed', label: 'Prayed' },
]
const STATUS_LABEL: Record<Status, string> = { new: 'New', follow_up: 'Follow up', prayed: 'Prayed' }

export default function PrayerAdminPage() {
  const supabase = getSupabaseClient()
  const access = useAdminAccess('prayer')
  const [items, setItems] = useState<PrayerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const headers = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` }
  }, [supabase])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/prayer', { headers: await headers() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not load prayer requests.')
      setItems(json.requests ?? [])
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }, [headers])

  useEffect(() => { if (!access.loading) load() }, [access.loading, load])

  const setStatus = async (id: string, status: Status) => {
    const before = items
    setItems(list => list.map(r => (r.id === id ? { ...r, status } : r)))
    try {
      const res = await fetch('/api/admin/prayer', { method: 'PATCH', headers: await headers(), body: JSON.stringify({ id, status }) })
      if (!res.ok) throw new Error()
    } catch {
      setItems(before)
      setError('Could not save that change. Please try again.')
    }
  }

  const remove = async (id: string) => {
    setConfirmId(null)
    try {
      const res = await fetch(`/api/admin/prayer?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: await headers() })
      if (!res.ok) throw new Error()
      setItems(list => list.filter(r => r.id !== id))
    } catch {
      setError('Could not delete that request. Please try again.')
    }
  }

  if (access.loading || loading) return <AdminLoader fullScreen label="Loading prayer requests..." />

  const count = (key: 'all' | Status) => (key === 'all' ? items.length : items.filter(r => r.status === key).length)
  const shown = filter === 'all' ? items : items.filter(r => r.status === filter)

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <div className="sticky top-0 z-30 border-b border-[#c6c6cf] bg-white px-4 py-4 sm:px-8">
        <h2 className="text-[20px] font-bold text-[#081534] sm:text-[24px]">Prayer requests</h2>
        <p className="text-[12px] text-[#45464e]">Private to the pastoral team.</p>
      </div>

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-[#ffefed] px-4 py-3 text-[13px] text-[#8f1717]">
            <span>{error}</span>
            <button onClick={() => { setLoading(true); load() }} className="rounded-lg border border-[#8f1717]/40 px-3 py-1.5 text-[12px] font-bold">Retry</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${filter === f.key ? 'bg-[#081534] text-white' : 'border border-[#c6c6cf] bg-white text-[#45464e] hover:border-[#081534]'}`}>
              {f.label} <span className="opacity-70">{count(f.key)}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c6c6cf] bg-white px-6 py-16 text-center">
            <Icon name="favorite" className="mx-auto text-[40px] text-[#c6c6cf]" />
            <p className="mt-3 text-[15px] font-bold text-[#081534]">Nothing here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(r => (
              <article key={r.id} className="rounded-xl border border-[#c6c6cf] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-bold text-[#081534]">{r.name || 'Anonymous'}</p>
                    <p className="text-[11px] text-[#76777f]">
                      {new Date(r.created_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <select aria-label="Status" value={r.status} onChange={e => setStatus(r.id, e.target.value as Status)}
                    className="min-h-9 rounded-md border border-[#c6c6cf] bg-white px-2 text-[12px] text-[#45464e]">
                    {(Object.keys(STATUS_LABEL) as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[#191c1e]">{r.request}</p>
                {r.wants_reply && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fff4d6] px-3 py-1.5 text-[12px] font-semibold text-[#785a00]">
                    <Icon name="call" className="text-[14px]" />Wants contact: {r.contact || 'no details left'}
                  </p>
                )}
                <div className="mt-4 flex justify-end">
                  {confirmId === r.id ? (
                    <span className="flex items-center gap-2 text-[12px]">
                      Delete this request?
                      <button onClick={() => remove(r.id)} className="rounded-lg bg-[#ba1a1a] px-3 py-1.5 font-bold text-white">Delete</button>
                      <button onClick={() => setConfirmId(null)} className="rounded-lg border border-[#c6c6cf] px-3 py-1.5 font-bold text-[#45464e]">Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmId(r.id)} aria-label="Delete request"
                      className="rounded p-1.5 text-[#45464e] hover:bg-[#ffdad6] hover:text-[#ba1a1a]">
                      <Icon name="delete" className="text-[16px]" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}