import { useEffect, useState } from 'react'

/** Initial loading state while the WebGL world and its first wing are compiled. */
export function Loader({ done }: { done: boolean }) {
  const [gone, setGone] = useState(false)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setGone(true), 900)
      return () => clearTimeout(t)
    }
    const id = setInterval(() => setN((v) => Math.min(23, v + 1)), 90)
    return () => clearInterval(id)
  }, [done])
  if (gone) return null
  const filled = done ? 24 : n
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg transition-opacity duration-700 ${done ? 'opacity-0' : 'opacity-100'}`} role="status" aria-live="polite">
      <div className="font-sans text-[12px] font-semibold uppercase tracking-[0.3em]">
        ART<span className="text-accent">//</span>EVOLVED
      </div>
      <div className="mt-6 font-mono text-[11px] text-fg/70" aria-hidden>
        {'█'.repeat(filled)}
        {'░'.repeat(24 - filled)}
      </div>
      <div className="mt-3 font-sans text-[9px] uppercase tracking-museum text-muted">Calibrating the archive</div>
    </div>
  )
}
