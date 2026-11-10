'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Icon from '@/components/Icon'

export type LegalSection = {
  id?: string
  number?: string
  icon?: string
  title: string
  dark?: boolean
  content: ReactNode
}

export default function LegalAccordion({ sections }: { sections: LegalSection[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [allOpen, setAllOpen] = useState(false)

  const sync = () => {
    const closed = ref.current?.querySelectorAll('details:not([open])').length ?? 0
    setAllOpen(closed === 0)
  }

  const setAll = (value: boolean) => {
    ref.current?.querySelectorAll('details').forEach(d => { d.open = value })
    setAllOpen(value)
  }

  // Opens the section named in the address, e.g. /terms-and-service#liability
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const el = ref.current?.querySelector<HTMLDetailsElement>(`#m-${CSS.escape(hash)}`)
    if (el) {
      el.open = true
      el.scrollIntoView()
    }
  }, [])

  return (
    <div ref={ref}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-semibold text-[#45464e]">{sections.length} sections</p>
        <button type="button" onClick={() => setAll(!allOpen)} className="min-h-10 px-2 text-[12px] font-bold text-[#785a00]">
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="space-y-2.5">
        {sections.map((s, i) => (
          <details
            key={s.title}
            id={s.id ? `m-${s.id}` : undefined}
            open={i === 0}
            onToggle={sync}
            className={`group scroll-mt-20 overflow-hidden rounded-2xl border ${
              s.dark
                ? 'border-transparent bg-[#081534] text-white'
                : 'border-[#e2e2e9] bg-white open:border-[#fdc425]/60 open:shadow-sm'
            }`}
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.dark ? 'bg-[#fdc425] text-[#081534]' : 'bg-[#f2f4f6] text-[#081534]'}`}>
                {s.icon ? <Icon name={s.icon} className="text-[20px]" /> : <span className="text-[11px] font-bold">{s.number}</span>}
              </span>
              <h2 className={`flex-1 text-[15px] font-bold leading-snug ${s.dark ? 'text-white' : 'text-[#081534]'}`}>{s.title}</h2>
              <Icon
                name="expand_more"
                className={`text-[22px] transition-transform group-open:rotate-180 ${s.dark ? 'text-[#fdc425]' : 'text-[#785a00]'}`}
              />
            </summary>
            <div className={`px-4 pb-5 pt-1 text-[14px] leading-[1.75] ${s.dark ? 'text-white/75' : 'text-[#45464e]'}`}>
              {s.content}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}