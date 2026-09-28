import { useEffect } from 'react'
import { useStore } from '@/state/store'

/** Marks the interface idle after a few still seconds — used by chambers whose UI should recede. */
export function useIdle(ms = 2600) {
  const setUiIdle = useStore((s) => s.setUiIdle)
  useEffect(() => {
    let t = 0
    const wake = () => {
      setUiIdle(false)
      clearTimeout(t)
      t = window.setTimeout(() => setUiIdle(true), ms)
    }
    wake()
    const events = ['pointermove', 'keydown', 'wheel', 'touchstart'] as const
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }))
    return () => {
      clearTimeout(t)
      events.forEach((ev) => window.removeEventListener(ev, wake))
    }
  }, [ms, setUiIdle])
}
