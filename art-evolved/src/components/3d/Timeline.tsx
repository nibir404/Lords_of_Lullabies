import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Color, InstancedMesh, Object3D, SRGBColorSpace } from 'three'
import { MOVEMENTS } from '@/data/movements'
import { formatSpan } from '@/data/eras'
import { preloadScene } from '@/scenes/registry'
import { useStore } from '@/state/store'
import { CHAMBER_SPACING, chamberZ, world } from '@/state/world'
import { EraScene } from './EraScene'

const PORTAL_OFFSET = CHAMBER_SPACING * 0.42
/** Minimum gap between two chamber mounts, so their setup work never lands in the same frame. */
const MOUNT_GAP = 140

/** How many chambers may stay mounted: the ones around the camera plus recently visited ones. */
function cacheSize(quality: number) {
  return quality >= 1 ? 6 : quality >= 0.6 ? 4 : 3
}

/**
 * The corridor. The chambers around the camera are mounted (only the current one while moving fast,
 * and just the destination during a long leap). Recently visited chambers stay mounted but hidden,
 * so stepping back and forth never rebuilds them. New chambers are mounted one at a time.
 */
export function Timeline({ quality }: { quality: number }) {
  const view = useStore((s) => s.view)
  const [mounted, setMounted] = useState<number[]>([0])
  const cache = useRef({ list: [0] as number[], lastMount: 0 })

  useFrame(() => {
    const s = useStore.getState()
    const now = performance.now()
    let need: number[]
    let wanted: number[] = []
    if (s.view === 'landing') need = [0]
    else if (s.view !== 'timeline' && !world.tweening) need = []
    else if (world.jump) {
      const j = world.jump
      const p = (now - j.start) / j.duration
      need = p < 0.25 ? [j.to, Math.round(j.from)] : [j.to]
    } else {
      const c = Math.round(world.f)
      const moving = Math.abs(world.velocity) > 6
      const dir = world.target >= world.f ? 1 : -1
      need = [c]
      // Neighbours in the direction of travel first; skipped while scrolling fast.
      wanted = moving ? [] : [c + dir, c - dir]
    }
    const valid = (i: number) => i >= 0 && i < MOVEMENTS.length
    need = need.filter(valid)
    wanted = wanted.filter(valid)

    const c = cache.current
    const prev = c.list
    let list = prev
    if (need.length === 0) {
      if (prev.length) list = []
    } else {
      // Required chambers go in immediately; optional ones wait for the mount gap.
      const missing = need.filter((i) => !list.includes(i))
      if (missing.length) {
        list = [...list, ...missing]
        c.lastMount = now
      }
      if (now - c.lastMount > MOUNT_GAP) {
        const next = wanted.find((i) => !list.includes(i))
        if (next !== undefined) {
          list = [...list, next]
          c.lastMount = now
        }
      }
      const cap = Math.max(cacheSize(quality), need.length + wanted.length)
      if (list.length > cap) {
        const keep = new Set([...need, ...wanted])
        const f = world.f
        const evict = list.filter((i) => !keep.has(i)).sort((a, b) => Math.abs(b - f) - Math.abs(a - f))
        const drop = new Set(evict.slice(0, list.length - cap))
        list = list.filter((i) => !drop.has(i))
      }
    }
    if (list !== prev) {
      c.list = list
      setMounted([...list].sort((a, b) => a - b))
    }
  })

  // Warm the code-split chunks for the next chambers in the direction of travel.
  const active = useStore((s) => s.activeIndex)
  useEffect(() => {
    // Mid-leap the chambers flown past won't be visited; the destination is mounted directly.
    if (world.jump && Math.round(world.jump.to) !== active) return
    for (const d of [1, 2, -1]) {
      const m = MOVEMENTS[active + d]
      if (m) preloadScene(m.visual.scene)
    }
  }, [active])

  const showPortals = view === 'timeline' || view === 'landing' || view === 'create'

  return (
    <group>
      {mounted.map((i) => (
        <EraScene key={MOVEMENTS[i].id} movement={MOVEMENTS[i]} index={i} quality={quality} />
      ))}
      {showPortals && <Portals />}
      {showPortals && <PortalLabels />}
    </group>
  )
}

/** Instanced archways between chambers; they brighten as the camera approaches. */
function Portals() {
  const ref = useRef<InstancedMesh>(null)
  const count = MOVEMENTS.length * 3
  const data = useMemo(() => {
    const inks = MOVEMENTS.map((m) => new Color(m.visual.palette.ink))
    const accents = MOVEMENTS.map((m) => new Color(m.visual.palette.accent))
    return { inks, accents, tmp: new Color(), o: new Object3D() }
  }, [])

  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = data.o
    MOVEMENTS.forEach((_, i) => {
      const z = chamberZ(i) + PORTAL_OFFSET
      const parts: [number, number, number, number, number, number][] = [
        [-15, 9, z, 0.35, 18, 0.35],
        [15, 9, z, 0.35, 18, 0.35],
        [0, 18, z, 30.35, 0.35, 0.35],
      ]
      parts.forEach((p, j) => {
        o.position.set(p[0], p[1], p[2])
        o.scale.set(p[3], p[4], p[5])
        o.updateMatrix()
        mesh.setMatrixAt(i * 3 + j, o.matrix)
        mesh.setColorAt(i * 3 + j, data.inks[i])
      })
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [data])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh || !mesh.instanceColor) return
    const camZ = -world.f * CHAMBER_SPACING + 17
    for (let i = 0; i < MOVEMENTS.length; i++) {
      const z = chamberZ(i) + PORTAL_OFFSET
      const d = Math.abs(camZ - z)
      if (d > 140) continue
      const glow = Math.max(0, 1 - d / 60)
      data.tmp.copy(data.inks[i]).multiplyScalar(0.55 + 0.2 * glow).lerp(data.accents[i], glow * 0.55)
      for (let j = 0; j < 3; j++) mesh.setColorAt(i * 3 + j, data.tmp)
    }
    mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

function makeLabel(index: number) {
  const m = MOVEMENTS[index]
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 1024, 128)
  ctx.fillStyle = m.visual.palette.ink
  ctx.font = '500 26px "Inter Tight", Helvetica, sans-serif'
  ctx.textBaseline = 'middle'
  const num = String(index + 1).padStart(2, '0')
  ctx.fillText(`${num} / ${String(MOVEMENTS.length).padStart(2, '0')}`, 16, 34)
  ctx.textAlign = 'right'
  ctx.fillText(formatSpan(m.startYear, m.endYear), 1008, 34)
  ctx.textAlign = 'left'
  ctx.font = '600 58px "Inter Tight", Helvetica, sans-serif'
  ctx.fillText(m.name.toUpperCase(), 14, 92)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  return tex
}

function PortalLabel({ index }: { index: number }) {
  const tex = useMemo(() => makeLabel(index), [index])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <mesh position={[0, 19.6, chamberZ(index) + PORTAL_OFFSET]}>
      <planeGeometry args={[24, 3]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

function PortalLabels() {
  const active = useStore((s) => s.activeIndex)
  const indices = [active - 1, active, active + 1, active + 2].filter((i) => i >= 0 && i < MOVEMENTS.length)
  return (
    <>
      {indices.map((i) => (
        <PortalLabel key={i} index={i} />
      ))}
    </>
  )
}
