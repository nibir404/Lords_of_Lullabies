import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DirectionalLight, HemisphereLight, Object3D, PointLight, SpotLight, Vector3 } from 'three'
import type { LightingPreset } from '@/data/types'
import { damp } from '@/utils/math'
import { resolveStyle } from './styleTarget'
import { focusPoint } from './focus'

interface Preset {
  hemi: [string, string, number]
  key: [string, number, [number, number, number]]
  spot: [string, number]
  p1: [string, number]
  p2: [string, number]
  flicker?: boolean
}

const PRESETS: Record<LightingPreset, Preset> = {
  fire: { hemi: ['#4a3426', '#0a0604', 0.35], key: ['#ffcf9a', 0.15, [4, 10, 8]], spot: ['#ffb070', 120], p1: ['#ff8a3c', 90], p2: ['#ff6a2a', 30], flicker: true },
  soft: { hemi: ['#ffffff', '#b8b0a4', 1.35], key: ['#fff4e6', 1.5, [8, 14, 10]], spot: ['#ffffff', 0], p1: ['#ffffff', 0], p2: ['#ffffff', 0] },
  hard: { hemi: ['#ffffff', '#4a4640', 0.5], key: ['#fff2dc', 3.2, [10, 16, 8]], spot: ['#ffffff', 0], p1: ['#ffffff', 0], p2: ['#ffffff', 0] },
  dramatic: { hemi: ['#1c1c2c', '#000000', 0.12], key: ['#ffffff', 0.25, [6, 12, 6]], spot: ['#ffe1b0', 900], p1: ['#ffcf8a', 30], p2: ['#5a6aff', 10] },
  flat: { hemi: ['#ffffff', '#ffffff', 2.2], key: ['#ffffff', 0.6, [4, 10, 8]], spot: ['#ffffff', 0], p1: ['#ffffff', 0], p2: ['#ffffff', 0] },
  museum: { hemi: ['#ffffff', '#d6d0c6', 1.0], key: ['#fff8ee', 2.2, [8, 16, 10]], spot: ['#fff4e0', 300], p1: ['#ffffff', 0], p2: ['#ffffff', 0] },
  neon: { hemi: ['#241a36', '#000000', 0.35], key: ['#88aaff', 0.5, [6, 12, 8]], spot: ['#ffffff', 0], p1: ['#ff4fd8', 90], p2: ['#46e0ff', 90] },
  dawn: { hemi: ['#ffd8b0', '#4a5a7a', 0.9], key: ['#ffb070', 2.4, [-20, 7, -12]], spot: ['#ffffff', 0], p1: ['#ffffff', 0], p2: ['#ffffff', 0] },
}

/**
 * A fixed rig of five lights re-configured per chamber. Keeping the light count constant means
 * materials never recompile when chambers mount — a big stutter source otherwise.
 */
export function LightRig() {
  const hemi = useRef<HemisphereLight>(null)
  const key = useRef<DirectionalLight>(null)
  const spot = useRef<SpotLight>(null)
  const p1 = useRef<PointLight>(null)
  const p2 = useRef<PointLight>(null)
  const spotTarget = useMemo(() => new Object3D(), [])
  const keyTarget = useMemo(() => new Object3D(), [])
  const tmp = useMemo(() => ({ c: new Color(), v: new Vector3(), f: new Vector3() }), [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const st = resolveStyle()
    const p = PRESETS[st.lighting]
    const k = damp(2.5, dt)
    const f = focusPoint(tmp.f)
    const t = state.clock.elapsedTime
    const flick = p.flicker ? 0.75 + 0.25 * Math.sin(t * 13.1) * Math.sin(t * 7.3 + 1.2) + 0.1 * Math.sin(t * 29.0) : 1

    if (hemi.current) {
      hemi.current.color.lerp(tmp.c.set(p.hemi[0]), k)
      hemi.current.groundColor.lerp(tmp.c.set(p.hemi[1]), k)
      hemi.current.intensity += (p.hemi[2] - hemi.current.intensity) * k
    }
    if (key.current) {
      key.current.color.lerp(tmp.c.set(p.key[0]), k)
      key.current.intensity += (p.key[1] - key.current.intensity) * k
      key.current.position.lerp(tmp.v.set(f.x + p.key[2][0], f.y + p.key[2][1], f.z + p.key[2][2]), k)
      keyTarget.position.copy(f)
      keyTarget.updateMatrixWorld()
    }
    if (spot.current) {
      spot.current.color.lerp(tmp.c.set(p.spot[0]), k)
      spot.current.intensity += (p.spot[1] * flick - spot.current.intensity) * k
      spot.current.position.set(f.x, f.y + 16, f.z + 5)
      spotTarget.position.set(f.x, f.y, f.z - 3)
      spotTarget.updateMatrixWorld()
    }
    if (p1.current) {
      p1.current.color.lerp(tmp.c.set(p.p1[0]), k)
      p1.current.intensity += (p.p1[1] * flick - p1.current.intensity) * k
      p1.current.position.set(f.x - 5 + Math.sin(t * 0.3) * 0.4, f.y + 1.5, f.z + 2)
    }
    if (p2.current) {
      p2.current.color.lerp(tmp.c.set(p.p2[0]), k)
      p2.current.intensity += (p.p2[1] * (p.flicker ? 0.8 + 0.2 * Math.sin(t * 17.0) : 1) - p2.current.intensity) * k
      p2.current.position.set(f.x + 6, f.y + 4, f.z - 7)
    }
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffffff', '#d6d0c6', 1]} />
      <primitive object={keyTarget} />
      <primitive object={spotTarget} />
      <directionalLight ref={key} intensity={2} target={keyTarget} />
      <spotLight ref={spot} angle={0.55} penumbra={0.7} distance={60} decay={2} target={spotTarget} />
      <pointLight ref={p1} distance={40} decay={2} intensity={0} />
      <pointLight ref={p2} distance={40} decay={2} intensity={0} />
    </>
  )
}
