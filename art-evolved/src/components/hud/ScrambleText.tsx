import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/state/store'

const GLYPHS = '█▓▒░/\\|<>+=*#%@01ΔΣΩ'

/** Text that briefly re-generates itself when it changes — and keeps doing so in generative chambers. */
export function ScrambleText({ text, className, duration = 650 }: { text: string; className?: string; duration?: number }) {
  const [out, setOut] = useState(text)
  const reduced = useStore((s) => s.reducedMotion)
  const raf = useRef(0)
  useEffect(() => {
    if (reduced) {
      setOut(text)
      return
    }
    const run = () => {
      const start = performance.now()
      const step = () => {
        const p = Math.min(1, (performance.now() - start) / duration)
        const reveal = Math.floor(p * text.length)
        setOut(
          [...text]
            .map((ch, i) => (i < reveal || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join(''),
        )
        if (p < 1) raf.current = requestAnimationFrame(step)
      }
      step()
    }
    run()
    const iv = window.setInterval(() => document.documentElement.dataset.ui === 'generative' && run(), 4200)
    return () => {
      cancelAnimationFrame(raf.current)
      clearInterval(iv)
    }
  }, [text, duration, reduced])
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  )
}
