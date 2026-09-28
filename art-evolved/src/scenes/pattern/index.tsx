import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, Group, InstancedMesh, Object3D, RepeatWrapping } from 'three'
import type { SceneProps } from '../types'
import { Motes, useCanvasTexture, usePalette } from '../shared'
import { painterFor } from '@/art/painters'
import { mulberry32, hashString } from '@/utils/random'

/** Concentric rings of tiles rotating at different speeds — a kinetic, radially symmetric system. */
function RingSculpture({ colors, count, shape }: { colors: Color[]; count: number; shape: 'tile' | 'petal' | 'dot' | 'star' }) {
  const ref = useRef<InstancedMesh>(null)
  const o = useMemo(() => new Object3D(), [])
  const rings = 7
  const per = Math.floor(count / rings)
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    const t = s.clock.elapsedTime
    let i = 0
    for (let r = 0; r < rings; r++) {
      const R = 1.2 + r * 1.05
      const k = Math.max(6, Math.round(per * (0.4 + r / rings)))
      for (let j = 0; j < k && i < count; j++, i++) {
        const a = (j / k) * Math.PI * 2 + t * (r % 2 ? 0.08 : -0.06) * (1 + r * 0.1)
        o.position.set(Math.cos(a) * R, Math.sin(a) * R, Math.sin(t * 0.5 + r) * 0.2)
        o.rotation.set(0, 0, a + (shape === 'petal' ? Math.PI / 2 : 0))
        const s0 = shape === 'petal' ? [0.22, 0.55, 0.08] : shape === 'dot' ? [0.22, 0.22, 0.22] : shape === 'star' ? [0.4, 0.4, 0.1] : [0.35, 0.35, 0.06]
        o.scale.set(s0[0], s0[1], s0[2])
        o.updateMatrix()
        m.setMatrixAt(i, o.matrix)
        m.setColorAt(i, colors[(r + (j % 2)) % colors.length])
      }
    }
    for (; i < count; i++) {
      o.scale.setScalar(0)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      {shape === 'dot' ? <sphereGeometry args={[1, 12, 8]} /> : shape === 'star' ? <octahedronGeometry args={[1, 0]} /> : <boxGeometry args={[1, 1, 1]} />}
      <meshStandardMaterial metalness={0.35} roughness={0.45} />
    </instancedMesh>
  )
}

function KnotSculpture({ colors }: { colors: Color[] }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.z += dt * 0.05
  })
  return (
    <group ref={g}>
      {[
        [2, 3],
        [3, 5],
        [2, 5],
      ].map(([p, q], i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
          <torusKnotGeometry args={[3.2 - i * 0.4, 0.16, 400, 12, p, q]} />
          <meshStandardMaterial color={colors[i % colors.length]} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function LayeredPlanes({ movement }: { movement: SceneProps['movement'] }) {
  const g = useRef<Group>(null)
  useFrame((s) => {
    if (!g.current) return
    g.current.children.forEach((c, i) => (c.position.z = -i * 1.1 + Math.sin(s.clock.elapsedTime * 0.4 + i) * 0.15))
  })
  const tex = useCanvasTexture((ctx, w, h) => painterFor(movement)(ctx, w, h, mulberry32(hashString(movement.id)), movement.visual.palette), 1024, 768, [movement.id])
  return (
    <group ref={g}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} scale={1 - i * 0.12}>
          <planeGeometry args={[9, 6.75]} />
          <meshStandardMaterial map={tex} transparent opacity={i === 0 ? 1 : 0.55} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

export default function PatternScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const v = movement.visual.variant ?? 'mosaic'
  const tex = useCanvasTexture((ctx, w, h) => painterFor(movement)(ctx, w, h, mulberry32(hashString(movement.id + 'dome')), movement.visual.palette), 1024, 512, [movement.id])
  const floorTex = useCanvasTexture((ctx, w, h) => painterFor(movement)(ctx, w, h, mulberry32(hashString(movement.id + 'floor')), movement.visual.palette), 1024, 1024, [movement.id])
  useMemo(() => {
    tex.wrapS = RepeatWrapping
    tex.repeat.set(3, 1)
  }, [tex])
  const shape = v === 'lotus' ? 'petal' : v === 'dots' ? 'dot' : v === 'girih' || v === 'mandala' ? 'star' : 'tile'
  const count = Math.round(520 * Math.max(0.5, quality))
  return (
    <group>
      <mesh position={[0, 0, -10]}>
        <sphereGeometry args={[21, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial map={tex} side={BackSide} roughness={0.7} metalness={v === 'mosaic' ? 0.5 : 0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -10]}>
        <circleGeometry args={[21, 96]} />
        <meshStandardMaterial map={floorTex} roughness={0.85} />
      </mesh>
      <group position={[0, 6.5, -8]}>
        {v === 'knot' ? <KnotSculpture colors={pal.colors} /> : v === 'miniature' || v === 'batik' || v === 'jali' ? <LayeredPlanes movement={movement} /> : <RingSculpture colors={[pal.accent, ...pal.colors]} count={count} shape={shape} />}
      </group>
      <Motes count={Math.round(150 * quality)} area={[24, 14, 24]} position={[0, 0, -8]} color={pal.hex.accent} size={0.06} rise={0.06} opacity={0.5} />
    </group>
  )
}
