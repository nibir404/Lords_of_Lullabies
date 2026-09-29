import { useEffect, type RefObject } from 'react'
import { useStore } from '@/state/store'
import { world } from '@/state/world'
import { clamp } from '@/utils/math'

/**
 * Bridges DOM input to the world: wheel travels the corridor (or scrubs sliders), drag orbits,
 * pinch/ctrl-wheel zooms, pointer position adds parallax.
 */
export function useWorldInput(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let dragging = false
    let lastX = 0
    let lastY = 0
    let landingAccum = 0
    // One wheel gesture = one chamber. A trackpad flick keeps emitting inertial events for ~1s, so
    // after a step the wheel is locked until the gesture has gone quiet (or a clearly new one starts).
    let stepAccum = 0
    let stepLocked = false
    let stepLockedUntil = 0
    let lastWheel = 0
    let lastMag = 0
    const touches = new Map<number, { x: number; y: number }>()
    let pinchStart = 0
    let zoomStart = 0

    const onWheel = (e: WheelEvent) => {
      const s = useStore.getState()
      if (s.view === 'map' || s.view === 'create') return
      e.preventDefault()
      world.lastInput = performance.now()
      if (e.ctrlKey) {
        world.zoom = clamp(world.zoom + e.deltaY * 0.004, -0.5, 0.9)
        return
      }
      if (s.view === 'timeline') {
        const now = performance.now()
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
        const mag = Math.abs(delta) * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1)
        const quiet = now - lastWheel > 180
        lastWheel = now
        if (now < stepLockedUntil) {
          lastMag = mag
          return
        }
        if (stepLocked) {
          // Still the same gesture (inertia only decays): ignore. A quiet gap or a sharp rise is a new one.
          if (!quiet && mag <= lastMag * 1.5 + 4) {
            lastMag = mag
            return
          }
          stepLocked = false
          stepAccum = 0
        }
        lastMag = mag
        if (quiet) stepAccum = 0
        stepAccum += Math.sign(delta) * mag
        if (Math.abs(stepAccum) < 24) return
        const dir = Math.sign(stepAccum)
        stepAccum = 0
        stepLocked = true
        stepLockedUntil = now + 600
        if (dir > 0) s.next()
        else s.prev()
      } else if (s.view === 'landing') {
        landingAccum += Math.max(0, e.deltaY)
        if (landingAccum > 260) {
          landingAccum = 0
          s.setView('timeline')
        }
      } else if (s.view === 'evolution' || s.view === 'morph' || s.view === 'media') {
        s.setSlider(s.view, clamp(s.sliders[s.view] + e.deltaY * 0.0005))
      } else {
        world.zoom = clamp(world.zoom + e.deltaY * 0.001, -0.5, 0.9)
      }
    }

    const onDown = (e: PointerEvent) => {
      if (useStore.getState().view === 'map') return
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.size === 2) {
        const [a, b] = [...touches.values()]
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y)
        zoomStart = world.zoom
        dragging = false
        return
      }
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    const onMove = (e: PointerEvent) => {
      world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      world.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
      if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.size === 2 && pinchStart > 0) {
        const [a, b] = [...touches.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        world.zoom = clamp(zoomStart + (pinchStart - d) * 0.004, -0.5, 0.9)
        return
      }
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      const s = useStore.getState()
      const yawLimit = s.view === 'timeline' ? 1.1 : 1.5
      world.orbit.targetYaw = clamp(world.orbit.targetYaw - dx * 0.005, -yawLimit, yawLimit)
      world.orbit.targetPitch = clamp(world.orbit.targetPitch + dy * 0.003, -0.3, 0.55)
    }
    const onUp = (e: PointerEvent) => {
      touches.delete(e.pointerId)
      if (touches.size < 2) pinchStart = 0
      dragging = false
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    // Orbit and zoom relax when the visitor moves to a new chamber or view.
    const unsub = useStore.subscribe((s, p) => {
      if (s.activeIndex !== p.activeIndex || s.view !== p.view) {
        world.orbit.targetYaw = 0
        world.orbit.targetPitch = 0
        world.zoom = 0
      }
    })

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      unsub()
    }
  }, [ref])
}
