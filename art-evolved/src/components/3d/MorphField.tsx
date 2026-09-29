import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, Color, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import type { Formation } from '@/utils/formations'
import { clamp, damp } from '@/utils/math'
import { useStore } from '@/state/store'
import { isShown } from '@/utils/visibility'

export interface MorphFieldProps {
  formations: Formation[]
  /** Returns a float in [0, formations.length - 1]. Read every frame. */
  progress: () => number
  /** How much units stagger their departure (0 = all together). */
  stagger?: number
  /** Mid-transition effects: gaps open, units tumble and scatter — then resolve. */
  shrink?: number
  tumble?: number
  scatter?: number
  breathe?: number
  roughness?: number
  metalness?: number
  emissive?: number
  position?: [number, number, number]
  smoothing?: number
}

const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * Interpolates N instanced units between formations. Geometry genuinely transforms:
 * every unit travels, rotates, rescales and recolours from one arrangement to the next.
 */
export function MorphField({ formations, progress, stagger = 0.55, shrink = 0.25, tumble = 0.8, scatter = 0.6, breathe = 0.03, roughness = 0.6, metalness = 0, emissive = 0.08, position, smoothing = 4 }: MorphFieldProps) {
  const ref = useRef<InstancedMesh>(null)
  const n = formations[0]?.n ?? 0
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), [])
  const material = useMemo(() => new MeshStandardMaterial({ roughness, metalness, emissive: new Color('#ffffff'), emissiveIntensity: emissive }), [roughness, metalness, emissive])
  const scratch = useMemo(() => {
    const dirs = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = Math.sin(i * 12.9898) * 43758.5453
      const b = Math.sin(i * 78.233) * 12345.6789
      dirs[i * 3] = (a - Math.floor(a)) - 0.5
      dirs[i * 3 + 1] = (b - Math.floor(b)) - 0.5
      dirs[i * 3 + 2] = ((a + b) - Math.floor(a + b)) - 0.5
    }
    return { o: new Object3D(), c: new Color(), dirs, shown: -1 }
  }, [n])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const smoothed = useRef(progress())

  useFrame((state, rawDt) => {
    const mesh = ref.current
    if (!mesh || n === 0) return
    // Hidden (cached chamber or still compiling): skip the per-unit loop, but always fill it once.
    if (scratch.shown >= 0 && !isShown(mesh)) return
    scratch.shown = 1
    const dt = Math.min(rawDt, 0.05)
    const motion = useStore.getState().reducedMotion ? 0.2 : 1
    const target = clamp(progress(), 0, formations.length - 1)
    smoothed.current += (target - smoothed.current) * damp(smoothing, dt)
    const p = smoothed.current
    const i0 = Math.floor(p)
    const i1 = Math.min(formations.length - 1, i0 + 1)
    const local = p - i0
    const A = formations[i0]
    const B = formations[i1]
    const t = state.clock.elapsedTime
    const { o, c, dirs } = scratch

    for (let i = 0; i < n; i++) {
      const k = i * 3
      const delay = A.order[i] * 0.7 + (dirs[k] + 0.5) * 0.3
      const l = clamp(local * (1 + stagger) - delay * stagger)
      const e = ease(l)
      const mid = Math.sin(Math.PI * e)
      const b = Math.sin(t * 0.9 + i * 0.37) * breathe * motion
      o.position.set(
        A.pos[k] + (B.pos[k] - A.pos[k]) * e + dirs[k] * mid * scatter,
        A.pos[k + 1] + (B.pos[k + 1] - A.pos[k + 1]) * e + dirs[k + 1] * mid * scatter + b,
        A.pos[k + 2] + (B.pos[k + 2] - A.pos[k + 2]) * e + dirs[k + 2] * mid * scatter,
      )
      o.rotation.set(
        A.rot[k] + (B.rot[k] - A.rot[k]) * e + dirs[k] * mid * tumble,
        A.rot[k + 1] + (B.rot[k + 1] - A.rot[k + 1]) * e + dirs[k + 1] * mid * tumble,
        A.rot[k + 2] + (B.rot[k + 2] - A.rot[k + 2]) * e + dirs[k + 2] * mid * tumble,
      )
      const s = 1 - shrink * mid
      o.scale.set(
        Math.max(1e-4, (A.scl[k] + (B.scl[k] - A.scl[k]) * e) * s),
        Math.max(1e-4, (A.scl[k + 1] + (B.scl[k + 1] - A.scl[k + 1]) * e) * s),
        Math.max(1e-4, (A.scl[k + 2] + (B.scl[k + 2] - A.scl[k + 2]) * e) * s),
      )
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
      c.setRGB(A.col[k] + (B.col[k] - A.col[k]) * e, A.col[k + 1] + (B.col[k + 1] - A.col[k + 1]) * e, A.col[k + 2] + (B.col[k + 2] - A.col[k + 2]) * e)
      mesh.setColorAt(i, c)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  if (n === 0) return null
  return <instancedMesh ref={ref} args={[geometry, material, n]} position={position} frustumCulled={false} />
}
