import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { POST_MODES } from '@/shaders/post'
import { useStore, type ViewId } from '@/state/store'
import { world } from '@/state/world'

/**
 * Cycles through N stages, holding each form before transforming to the next. Optionally
 * drives the global post-process for stages that are "digital languages" (pixel, ASCII).
 */
export function useAutoStage(view: ViewId, stages: number, hold = 3.2, move = 2.2, postStages: Partial<Record<number, keyof typeof POST_MODES>> = {}) {
  const progress = useRef(0)
  const start = useRef(0)
  useEffect(() => {
    start.current = performance.now() / 1000
    return () => {
      world.postOverride = null
    }
  }, [])
  useFrame(() => {
    const s = useStore.getState()
    const reduced = s.reducedMotion
    const span = hold + move
    const tt = (performance.now() / 1000 - start.current) / (reduced ? span * 2 : span)
    const stage = Math.floor(tt) % stages
    const fr = tt - Math.floor(tt)
    const local = Math.max(0, (fr - hold / span) / (move / span))
    // Progress runs 0..stages; index `stages` is a duplicate of stage 0, so the cycle closes seamlessly.
    progress.current = stage + local
    world.autoStage[view] = progress.current

    if (s.view !== view || world.tweening) {
      if (s.view !== view) return
      world.postOverride = null
      return
    }
    let best: { mode: number; amount: number } | null = null
    for (const [k, mode] of Object.entries(postStages)) {
      const idx = Number(k)
      const d = Math.min(Math.abs(progress.current - idx), Math.abs(progress.current - idx - stages))
      const w = Math.max(0, 1 - d * 1.6)
      if (w > 0 && (!best || w > best.amount)) best = { mode: POST_MODES[mode!], amount: w }
    }
    world.postOverride = best
  })
  return progress
}
