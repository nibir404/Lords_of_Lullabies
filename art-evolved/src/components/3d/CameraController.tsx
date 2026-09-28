import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { MOVEMENTS } from '@/data/movements'
import type { CameraBehavior } from '@/data/types'
import { useStore, type ViewId } from '@/state/store'
import { chamberZ, world } from '@/state/world'
import { clamp, damp, easeInOutCubic, lerp } from '@/utils/math'
import { VIEW_CONFIG } from './viewConfig'

interface Tween {
  fromPos: Vector3
  fromLook: Vector3
  start: number
  duration: number
  lift: number
  transitScale: number
}

interface Offsets {
  yaw: number
  pitch: number
  roll: number
  dist: number
  bob: number
}

function behaviour(kind: CameraBehavior, t: number, out: Offsets) {
  out.yaw = out.pitch = out.roll = out.bob = 0
  out.dist = 1
  switch (kind) {
    case 'slow':
      out.yaw = Math.sin(t * 0.11) * 0.06
      break
    case 'drift':
      out.yaw = Math.sin(t * 0.13) * 0.13
      out.pitch = Math.sin(t * 0.09) * 0.04
      break
    case 'orbit':
      out.yaw = Math.sin(t * 0.06) * 0.42
      out.pitch = Math.sin(t * 0.05) * 0.05
      break
    case 'multi-axis':
      out.yaw = Math.sin(t * 0.21) * 0.24
      out.pitch = Math.sin(t * 0.17) * 0.1
      out.roll = Math.sin(t * 0.13) * 0.035
      break
    case 'theatrical':
      out.dist = 1 + Math.sin(t * 0.18) * 0.2
      out.pitch = Math.sin(t * 0.12) * 0.09
      out.yaw = Math.sin(t * 0.07) * 0.22
      break
    case 'float':
      out.pitch = Math.sin(t * 0.2) * 0.05
      out.roll = Math.sin(t * 0.15) * 0.03
      out.bob = Math.sin(t * 0.33) * 0.5
      break
    default:
      break
  }
  return out
}

/**
 * One continuous camera for the whole world. Views are wings of the same space; moving between
 * them is a flight along an arc, and moving along the corridor is a damped glide (or a leap when far).
 */
export function CameraController() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const pose = useMemo(() => ({ pos: new Vector3(...VIEW_CONFIG.landing.pos), look: new Vector3(...VIEW_CONFIG.landing.look) }), [])
  const desired = useMemo(() => ({ pos: new Vector3(), look: new Vector3(), fov: 50, roll: 0 }), [])
  const offs = useMemo(() => ({ a: { yaw: 0, pitch: 0, roll: 0, dist: 1, bob: 0 }, b: { yaw: 0, pitch: 0, roll: 0, dist: 1, bob: 0 } }), [])
  const tween = useRef<Tween | null>(null)
  const lastView = useRef<ViewId>(useStore.getState().view)
  const roll = useRef(0)

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = useStore.getState()
    const now = performance.now()
    const t = state.clock.elapsedTime
    const motion = s.reducedMotion ? 0 : 1
    let transit = 0

    if (s.view !== lastView.current) {
      const from = lastView.current
      lastView.current = s.view
      const entering = from === 'landing' && s.view === 'timeline'
      if (s.view === 'timeline' && from !== 'create') world.f = world.target
      tween.current = {
        fromPos: camera.position.clone(),
        fromLook: pose.look.clone(),
        start: now,
        duration: s.reducedMotion ? 700 : entering ? 3800 : 2800,
        lift: entering ? 1.2 : -1,
        transitScale: entering ? 0.2 : 1,
      }
    }

    // Corridor position.
    let jumpLift = 0
    if (s.view === 'timeline') {
      const j = world.jump
      if (j) {
        const p = clamp((now - j.start) / (s.reducedMotion ? 600 : j.duration))
        const e = easeInOutCubic(p)
        world.f = lerp(j.from, j.to, e)
        jumpLift = Math.sin(Math.PI * e) * Math.min(28, Math.abs(j.to - j.from) * 1.6) * motion
        transit = Math.max(transit, Math.sin(Math.PI * e))
        if (p >= 1) {
          world.jump = null
          world.f = world.target = j.to
        }
      } else {
        if (now - world.lastInput > 420) world.target += (Math.round(world.target) - world.target) * damp(6, dt)
        const prev = world.f
        world.f += (world.target - world.f) * damp(3.2, dt)
        world.velocity = (world.f - prev) / Math.max(dt, 1e-4)
        transit = Math.max(transit, clamp(Math.abs(world.velocity) * 0.45 - 0.12))
      }
      const idx = Math.max(0, Math.min(MOVEMENTS.length - 1, Math.round(world.f)))
      if (idx !== s.activeIndex) s.setActiveIndex(idx)
    }

    world.orbit.yaw += (world.orbit.targetYaw - world.orbit.yaw) * damp(5, dt)
    world.orbit.pitch += (world.orbit.targetPitch - world.orbit.pitch) * damp(5, dt)
    const px = world.pointer.x * motion
    const py = world.pointer.y * motion

    desired.fov = 50
    desired.roll = 0
    if (s.view === 'timeline' || s.view === 'create') {
      const f = clamp(world.f, 0, MOVEMENTS.length - 1)
      const ia = Math.floor(f)
      const ib = Math.min(MOVEMENTS.length - 1, ia + 1)
      const mt = f - ia
      behaviour(MOVEMENTS[ia].visual.camera, t, offs.a)
      behaviour(MOVEMENTS[ib].visual.camera, t, offs.b)
      const yaw = lerp(offs.a.yaw, offs.b.yaw, mt) * motion + world.orbit.yaw + px * 0.04
      const pitch = lerp(offs.a.pitch, offs.b.pitch, mt) * motion + world.orbit.pitch + 0.06 + py * 0.025
      const distMul = lerp(offs.a.dist, offs.b.dist, mt)
      const bob = lerp(offs.a.bob, offs.b.bob, mt) * motion
      desired.roll = lerp(offs.a.roll, offs.b.roll, mt) * motion
      const z = chamberZ(f)
      const dist = (s.exploring ? 10.5 : 17) * distMul * (1 + world.zoom)
      desired.look.set(s.exploring ? 3 : 0, (s.exploring ? 3.4 : 3.8) + jumpLift * 0.75 + bob * 0.4, z - (s.exploring ? 1 : 0))
      desired.pos.set(
        desired.look.x + Math.sin(yaw) * Math.cos(pitch) * dist,
        desired.look.y + Math.sin(pitch) * dist + bob - 0.9 + jumpLift * 0.25,
        desired.look.z + Math.cos(yaw) * Math.cos(pitch) * dist,
      )
      desired.fov = s.exploring ? 46 : 50
    } else {
      const c = VIEW_CONFIG[s.view]
      desired.look.set(c.look[0], c.look[1], c.look[2])
      const dx = c.pos[0] - c.look[0]
      const dy = c.pos[1] - c.look[1]
      const dz = c.pos[2] - c.look[2]
      const dist = Math.hypot(dx, dy, dz) * (1 + (s.view === 'landing' ? 0 : world.zoom))
      const baseYaw = Math.atan2(dx, dz)
      const basePitch = Math.asin(dy / Math.hypot(dx, dy, dz))
      const yaw = baseYaw + world.orbit.yaw + px * 0.06 + (s.view === 'finale' ? Math.sin(t * 0.08) * 0.3 * motion : 0)
      const pitch = basePitch + world.orbit.pitch + py * 0.04
      desired.pos.set(
        desired.look.x + Math.sin(yaw) * Math.cos(pitch) * dist,
        desired.look.y + Math.sin(pitch) * dist,
        desired.look.z + Math.cos(yaw) * Math.cos(pitch) * dist,
      )
      if (s.view === 'evolution') {
        // Perspective "breaks" mid-transformation: FOV widens and the horizon tilts.
        const e = world.sliders.evolution
        desired.fov = 44 + Math.sin(Math.PI * e) * 24
        desired.roll = Math.sin(Math.PI * e) * 0.06 * Math.sin(t * 0.4)
      }
    }

    const tw = tween.current
    world.tweening = tw !== null
    if (tw) {
      const p = clamp((now - tw.start) / tw.duration)
      const e = easeInOutCubic(p)
      const d = tw.fromPos.distanceTo(desired.pos)
      const lift = tw.lift >= 0 ? tw.lift : Math.min(70, d * 0.06)
      pose.pos.lerpVectors(tw.fromPos, desired.pos, e)
      pose.look.lerpVectors(tw.fromLook, desired.look, e)
      const arc = Math.sin(Math.PI * e) * lift * (s.reducedMotion ? 0.2 : 1)
      pose.pos.y += arc
      pose.look.y += arc * 0.8
      transit = Math.max(transit, Math.sin(Math.PI * e) * tw.transitScale)
      if (p >= 1) tween.current = null
      world.tweening = tween.current !== null
    } else if (s.view === 'map') {
      // OrbitControls owns the camera once arrived; keep the pose in sync for the next flight.
      pose.pos.copy(camera.position)
      pose.look.set(...VIEW_CONFIG.map.look)
      world.transit = 0
      return
    } else {
      const k = damp(3.6, dt)
      pose.pos.lerp(desired.pos, k)
      pose.look.lerp(desired.look, k)
    }

    camera.position.copy(pose.pos)
    camera.lookAt(pose.look)
    roll.current += (desired.roll - roll.current) * damp(3, dt)
    if (Math.abs(roll.current) > 1e-4) camera.rotateZ(roll.current)
    if (Math.abs(camera.fov - desired.fov) > 0.01) {
      camera.fov += (desired.fov - camera.fov) * damp(3, dt)
      camera.updateProjectionMatrix()
    }
    world.transit = transit
  })

  return null
}
