'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import Icon from '@/components/Icon'

type Item = { key: string; label: string; count: number; href: string | null; hint?: string; tone: 'urgent' | 'normal' }

export default function NeedsAttention() {
  const supabase = getSupabaseClient()
  const [items, setItems] = useState<Item[] | null>(null)
  const [partial, setPartial] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/attention', {
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
        cache: 'no-store',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(`HTTP ${res.status}${body?.error ? `: ${body.error}` : ''}`)
      }
      const json = await res.json()
      setItems(json.items ?? [])
      setPartial(Boolean(json.partial))
      setFailure(null)
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Network error')
    }
  }, [supabase])

  useEffect(() => { void load() }, [load])

  if (failure) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-[#ffefed] px-4 py-3 text-[13px] text-[#8f1717]">
        <span>Couldn’t check what needs attention ({failure}).</span>
        <button onClick={() => { setFailure(null); void load() }}
          className="rounded-lg border border-[#8f1717]/40 px-3 py-1.5 text-[12px] font-bold">Retry</button>
      </div>
    )
  }

  if (items === null) {
    return <div className="h-16 animate-pulse rounded-xl border border-[#c6c6cf] bg-white" />
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-semibold text-green-800">
        <Icon name="check_circle" className="text-[18px]" />
        All clear. Nothing needs your attention right now.
      </div>
    )
  }

  return (
    <section aria-label="Needs attention" className="overflow-hidden rounded-xl border border-[#fdc425]/60 bg-white">
      <div className="flex items-center gap-2 border-b border-[#fdc425]/40 bg-[#fff9e8] px-5 py-3">
        <Icon name="notifications_active" className="text-[18px] text-[#785a00]" />
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#785a00]">Needs attention</h3>
      </div>
      <ul className="divide-y divide-[#f2f4f6]">
        {items.map(i => (
          <li key={i.key} className="flex items-center justify-between gap-3 px-5 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[12px] font-extrabold ${i.tone === 'urgent' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#fdc425]/30 text-[#6d5200]'}`}>
                {i.count}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#081534]">{i.label}</p>
                {i.hint && <p className="text-[11px] text-[#5f6068]">{i.hint}</p>}
              </div>
            </div>
            {i.href && (
              <Link href={i.href} className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-[#785a00] hover:underline">
                Open <Icon name="arrow_forward" className="text-[14px]" />
              </Link>
            )}
          </li>
        ))}
      </ul>
      {partial && <p className="border-t border-[#f2f4f6] px-5 py-2 text-[11px] text-[#5f6068]">Some checks couldn’t run. This list may be incomplete.</p>}
    </section>
  )
}