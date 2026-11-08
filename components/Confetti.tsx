'use client'

import { useEffect, useState } from 'react'

const COLORS = ['#fdc425', '#ffdf9a', '#785a00', '#081534', '#17305f', '#ffffff']

// Same numbers every time, so the layout is stable and the render stays pure
const rand = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

export default function Confetti({ count = 56, lifetimeMs = 6500 }: { count?: number; lifetimeMs?: number }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDone(true), lifetimeMs)
    return () => clearTimeout(t)
  }, [lifetimeMs])

  if (done) return null

  return (
    <div aria-hidden="true" className="confetti-layer pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translate3d(var(--drift), 108vh, 0) rotate(var(--spin)); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .confetti-layer { display: none; } }
      `}</style>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 11 + k)
        const style = {
          left: `${r(1) * 100}%`,
          width: `${6 + r(2) * 6}px`,
          height: `${8 + r(3) * 8}px`,
          background: COLORS[Math.floor(r(4) * COLORS.length)],
          borderRadius: r(5) > 0.7 ? '9999px' : '2px',
          animation: `confetti-fall ${3 + r(6) * 2.5}s ${r(7) * 0.9}s ease-in forwards`,
          '--drift': `${(r(8) - 0.5) * 30}vw`,
          '--spin': `${(r(9) - 0.5) * 1440}deg`,
        } as React.CSSProperties
        return <span key={i} className="absolute top-0 block" style={style} />
      })}
    </div>
  )
}