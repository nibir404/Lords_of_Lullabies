import { useEffect } from 'react'
import { MOVEMENT_BY_ID } from '@/data/movements'
import { formatSpan } from '@/data/eras'
import { useStore } from '@/state/store'

export function SurpriseOverlay() {
  const surprise = useStore((s) => s.surprise)
  const clear = useStore((s) => s.clearSurprise)
  useEffect(() => {
    if (!surprise) return
    const t = setTimeout(clear, 3600)
    return () => clearTimeout(t)
  }, [surprise, clear])
  if (!surprise) return null
  const m = MOVEMENT_BY_ID[surprise.id]
  return (
    <div key={surprise.at} className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" role="status" aria-live="assertive">
      <div className="animate-rise text-center">
        <div className="font-sans text-[11px] uppercase tracking-[0.4em] text-fg/70">Your next artistic encounter</div>
        <div className="mt-5 font-sans text-[clamp(40px,7vw,110px)] font-semibold uppercase leading-none tracking-[-0.03em] text-fg">{m.name}</div>
        <div className="mt-4 font-mono text-xs text-fg/70">{formatSpan(m.startYear, m.endYear)} · {m.region}</div>
      </div>
    </div>
  )
}
