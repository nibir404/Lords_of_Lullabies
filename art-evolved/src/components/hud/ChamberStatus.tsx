import { MOVEMENTS } from '@/data/movements'
import { useStore } from '@/state/store'

/** A quiet indicator while a chamber's code and geometry are being assembled. */
export function ChamberStatus() {
  const index = useStore((s) => s.activeIndex)
  const ready = useStore((s) => s.ready[MOVEMENTS[index].id])
  if (ready) return null
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center" role="status">
      <div className="font-mono text-[10px] uppercase tracking-museum text-fg/70">
        Assembling chamber<span className="animate-pulse">…</span>
      </div>
    </div>
  )
}
