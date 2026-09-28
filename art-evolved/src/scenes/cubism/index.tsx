import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Group, InstancedMesh, Object3D, Vector3 } from 'three'
import type { SceneProps } from '../types'
import { Figure, Motes, usePalette, useSeed } from '../shared'
import { alignY } from '@/utils/formations'
import type { Rng } from '@/utils/random'

interface Facet {
  p: Vector3
  n: Vector3
  view: number
  object: number
  color: Color
  size: number
  spin: number
}

const OBJECTS = [
  { c: new Vector3(-4.5, 4.5, -8), kind: 'bottle' },
  { c: new Vector3(1, 5, -9), kind: 'face' },
  { c: new Vector3(6.5, 3.2, -7), kind: 'bowl' },
] as const

function sample(kind: string, rng: Rng): [Vector3, Vector3] {
  const u = rng() * Math.PI * 2
  const v = rng()
  if (kind === 'bottle') {
    const y = v * 7 - 3.5
    const r = y > 1 ? 0.35 + Math.max(0, 1.6 - y) * 0.3 : 1.25
    return [new Vector3(Math.cos(u) * r, y, Math.sin(u) * r), new Vector3(Math.cos(u), 0, Math.sin(u))]
  }
  if (kind === 'face') {
    const th = Math.acos(1 - 2 * v)
    const n = new Vector3(Math.sin(th) * Math.cos(u), Math.cos(th), Math.sin(th) * Math.sin(u))
    const p = n.clone().multiply(new Vector3(2, 2.7, 1.8))
    if (n.z > 0.8 && Math.abs(n.x) < 0.2) p.z += 0.7 * (1 - Math.abs(n.y))
    return [p, n]
  }
  const th = Math.acos(1 - 2 * v)
  const n = new Vector3(Math.sin(th) * Math.cos(u), Math.cos(th), Math.sin(th) * Math.sin(u))
  const k = Math.floor(rng() * 3)
  return [n.clone().multiplyScalar(1.1).add(new Vector3((k - 1) * 1.6, 0, k === 1 ? 0.6 : 0)), n]
}

/**
 * Objects decomposed into planar facets, each assigned to one of three viewpoints. Facets from
 * different viewpoints coexist, overlap and — as the camera moves sideways — separate further.
 */
function Facets({ count, colors, rng }: { count: number; colors: Color[]; rng: Rng }) {
  const ref = useRef<InstancedMesh>(null)
  const facets = useMemo<Facet[]>(() => {
    const light = new Vector3(0.6, 0.7, 0.4).normalize()
    return Array.from({ length: count }, (_, i) => {
      const object = i % OBJECTS.length
      const [p, n] = sample(OBJECTS[object].kind, rng)
      const lum = Math.max(0, n.dot(light))
      const color = colors[Math.min(colors.length - 1, Math.floor((1 - lum) * (colors.length - 0.01)))].clone()
      return { p, n, view: Math.floor(rng() * 3), object, color, size: 0.5 + rng() * 0.7, spin: (rng() - 0.5) * 0.6 }
    })
  }, [count, colors, rng])
  const tmp = useMemo(() => ({ o: new Object3D(), v: new Vector3(), n: new Vector3(), up: new Vector3(0, 1, 0), cam: new Vector3(), rel: new Vector3() }), [])

  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    m.getWorldPosition(tmp.cam)
    const camLocal = tmp.rel.copy(state.camera.position).sub(tmp.cam)
    const sideways = Math.min(1, Math.abs(camLocal.x) / 8)
    const frag = 0.55 + 0.45 * sideways
    facets.forEach((f, i) => {
      const obj = OBJECTS[f.object]
      const ang = [-0.7, 0, 0.75][f.view] * frag + Math.atan2(camLocal.x, camLocal.z) * [0.6, 0, -0.6][f.view]
      tmp.v.copy(f.p).applyAxisAngle(tmp.up, ang)
      tmp.v.x += [-1.3, 0, 1.3][f.view] * frag
      tmp.v.z *= 0.35
      tmp.v.add(obj.c)
      tmp.o.position.copy(tmp.v)
      const n = tmp.n.copy(f.n).applyAxisAngle(tmp.up, ang)
      const [rx, ry, rz] = alignY(n.x, n.y * 0.4, n.z + 1.2)
      const q = Math.PI / 6
      tmp.o.rotation.set(Math.round(rx / q) * q, Math.round(ry / q) * q, Math.round((rz + f.spin + Math.sin(t * 0.3 + i) * 0.03) / q) * q)
      tmp.o.scale.set(f.size, 0.03, f.size * 0.8)
      tmp.o.updateMatrix()
      m.setMatrixAt(i, tmp.o.matrix)
      m.setColorAt(i, f.color)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, facets.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.9} flatShading />
    </instancedMesh>
  )
}

function Shards({ colors, rng }: { colors: string[]; rng: Rng }) {
  const shards = useMemo(() => Array.from({ length: 36 }, () => ({ p: [(rng() - 0.5) * 34, rng() * 16, -18 - rng() * 8] as [number, number, number], r: Math.round(((rng() - 0.5) * 3) / 0.52) * 0.52, s: [2 + rng() * 6, 2 + rng() * 6] as [number, number], c: colors[Math.floor(rng() * colors.length)] })), [colors, rng])
  return (
    <group>
      {shards.map((s, i) => (
        <mesh key={i} position={s.p} rotation={[0, 0, s.r]}>
          <planeGeometry args={s.s} />
          <meshStandardMaterial color={s.c} roughness={1} transparent opacity={0.85} />
        </mesh>
      ))}
      {shards.slice(0, 14).map((s, i) => (
        <mesh key={`l${i}`} position={[s.p[0], s.p[1], s.p[2] + 0.1]} rotation={[0, 0, s.r + 0.3]}>
          <boxGeometry args={[s.s[0] * 1.4, 0.05, 0.02]} />
          <meshBasicMaterial color="#1f1c18" />
        </mesh>
      ))}
    </group>
  )
}

function MotionStudy({ color, accent }: { color: string; accent: string }) {
  const g = useRef<Group>(null)
  useFrame((s) => {
    if (g.current) g.current.position.x = Math.sin(s.clock.elapsedTime * 0.4) * 2
  })
  return (
    <group ref={g} position={[0, 0, -6]}>
      {Array.from({ length: 7 }, (_, i) => (
        <Figure key={i} position={[-6 + i * 1.6, 0, -i * 0.3]} rotation={Math.PI / 2 + i * 0.05} scale={1.5 - i * 0.03} color={i === 6 ? accent : color} pose={{ contrapposto: 1, lean: -0.25, armRaise: 0.3 + i * 0.05 }} metalness={0.6} roughness={0.3} />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} position={[4 - i * 1.2, 1 + (i % 5) * 1.2, -2]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[6, 0.05, 0.05]} />
          <meshBasicMaterial color={i % 3 ? color : accent} />
        </mesh>
      ))}
    </group>
  )
}

export default function CubismScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const rng = useSeed(movement)
  const futurism = movement.visual.variant === 'futurism'
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={pal.hex.colors[futurism ? 0 : 1]} roughness={1} />
      </mesh>
      <Shards colors={movement.visual.palette.colors} rng={rng} />
      {futurism ? <MotionStudy color={pal.hex.colors[1]} accent={pal.hex.accent} /> : <Facets count={Math.round(1500 * Math.max(0.5, quality))} colors={pal.colors} rng={rng} />}
      <Motes count={Math.round(80 * quality)} area={[30, 12, 20]} position={[0, 0, -8]} color={pal.hex.colors[3] ?? '#d7c7a4'} size={0.06} rise={0.05} opacity={0.4} />
    </group>
  )
}
