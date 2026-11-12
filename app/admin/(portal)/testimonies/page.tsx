'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'
import AdminLoader from '@/components/AdminLoader'
import Icon from '@/components/Icon'

type Testimony = { id: string; created_at: string; name: string; testimony: string; is_visible: boolean }
type Filter = 'pending' | 'live' | 'all'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'live', label: 'Live' },
  { key: 'all', label: 'All' },
]

export default function TestimoniesAdminPage() {
  const supabase = getSupabaseClient()
  const access = useAdminAccess('testimonies')
  const [items, setItems] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('pending')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', testimony: '' })

  const headers = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` }
  }, [supabase])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/testimonies', { headers: await headers() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not load testimonies.')
      setItems(json.testimonies ?? [])
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }, [headers])

  useEffect(() => { if (!access.loading) load() }, [access.loading, load])

  const patch = async (id: string, changes: Partial<Pick<Testimony, 'is_visible' | 'name' | 'testimony'>>) => {
    const before = items
    setItems(list => list.map(t => (t.id === id ? { ...t, ...changes } : t)))
    try {
      const res = await fetch('/api/admin/testimonies', { method: 'PATCH', headers: await headers(), body: JSON.stringify({ id, ...changes }) })
      if (!res.ok) throw new Error()
    } catch {
      setItems(before)
      setError('Could not save that change. Please try again.')
    }
  }

  const remove = async (id: string) => {
    setConfirmId(null)
    try {
      const res = await fetch(`/api/admin/testimonies?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: await headers() })
      if (!res.ok) throw new Error()
      setItems(list => list.filter(t => t.id !== id))
    } catch {
      setError('Could not delete that testimony. Please try again.')
    }
  }

  const saveEdit = async () => {
    if (!editId) return
    const name = draft.name.trim(), testimony = draft.testimony.trim()
    if (!name || testimony.length < 20) { setError('Name is required and the testimony needs at least 20 characters.'); return }
    await patch(editId, { name, testimony })
    setEditId(null)
  }

  if (access.loading || loading) return <AdminLoader fullScreen label="Loading testimonies..." />

  const count = (k: Filter) => (k === 'all' ? items.length : items.filter(t => t.is_visible === (k === 'live')).length)
  const shown = filter === 'all' ? items : items.filter(t => t.is_visible === (filter === 'live'))

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <div className="sticky top-0 z-30 border-b border-[#c6c6cf] bg-white px-4 py-4 sm:px-8">
        <h2 className="text-[20px] font-bold text-[#081534] sm:text-[24px]">Testimonies</h2>
        <p className="text-[12px] text-[#45464e]">Only “Live” ones appear on the community page. Check each for names of other people and health or family details before approving.</p>
      </div>

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-[#ffefed] px-4 py-3 text-[13px] text-[#8f1717]">
            <span>{error}</span>
            <button onClick={() => { setError(''); setLoading(true); load() }} className="rounded-lg border border-[#8f1717]/40 px-3 py-1.5 text-[12px] font-bold">Retry</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
              className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${filter === f.key ? 'bg-[#081534] text-white' : 'border border-[#c6c6cf] bg-white text-[#45464e] hover:border-[#081534]'}`}>
              {f.label} <span className="opacity-70">{count(f.key)}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c6c6cf] bg-white px-6 py-16 text-center">
            <Icon name="chat_bubble" className="mx-auto text-[40px] text-[#c6c6cf]" />
            <p className="mt-3 text-[15px] font-bold text-[#081534]">Nothing here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(t => (
              <article key={t.id} className="rounded-xl border border-[#c6c6cf] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-bold text-[#081534]">{t.name}</p>
                    <p className="text-[11px] text-[#5f6068]">
                      {new Date(t.created_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${t.is_visible ? 'bg-green-100 text-green-800' : 'bg-[#fff4d6] text-[#785a00]'}`}>
                    {t.is_visible ? 'Live' : 'Pending'}
                  </span>
                </div>

                {editId === t.id ? (
                  <div className="mt-3 space-y-2">
                    <input aria-label="Name" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                      className="w-full rounded-lg border border-[#c6c6cf] px-3 py-2 text-[14px]" maxLength={60} />
                    <textarea aria-label="Testimony" value={draft.testimony} onChange={e => setDraft(d => ({ ...d, testimony: e.target.value }))}
                      rows={6} maxLength={1500} className="w-full rounded-lg border border-[#c6c6cf] px-3 py-2 text-[14px] leading-6" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="rounded-lg bg-[#081534] px-4 py-2 text-[12px] font-bold text-white">Save</button>
                      <button onClick={() => setEditId(null)} className="rounded-lg border border-[#c6c6cf] px-4 py-2 text-[12px] font-bold text-[#45464e]">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[#191c1e]">{t.testimony}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  {editId !== t.id && (
                    <button onClick={() => { setEditId(t.id); setDraft({ name: t.name, testimony: t.testimony }) }}
                      className="rounded-lg border border-[#c6c6cf] px-3 py-1.5 text-[12px] font-bold text-[#45464e]">Edit</button>
                  )}
                  <button onClick={() => patch(t.id, { is_visible: !t.is_visible })}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-bold ${t.is_visible ? 'border border-[#c6c6cf] text-[#45464e]' : 'bg-[#081534] text-white'}`}>
                    {t.is_visible ? 'Hide' : 'Approve'}
                  </button>
                  {confirmId === t.id ? (
                    <span className="flex items-center gap-2 text-[12px]">
                      Delete?
                      <button onClick={() => remove(t.id)} className="rounded-lg bg-[#ba1a1a] px-3 py-1.5 font-bold text-white">Delete</button>
                      <button onClick={() => setConfirmId(null)} className="rounded-lg border border-[#c6c6cf] px-3 py-1.5 font-bold text-[#45464e]">Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmId(t.id)} aria-label="Delete testimony"
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