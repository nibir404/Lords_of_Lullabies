import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ConeGeometry, InstancedMesh, Object3D } from 'three'
import type { SceneProps } from '../types'
import { Column, Floor, Motes, PaintedPlane, useDisposable, usePalette } from '../shared'

/** Repeated symbolic tokens: rows of rings and almond shapes that rise and fall in unison. */
function SymbolRows({ color, count = 60 }: { color: string; count?: number }) {
  const ref = useRef<InstancedMesh>(null)
  const o = useMemo(() => new Object3D(), [])
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    const t = s.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 20)
      const col = i % 20
      o.position.set((col - 9.5) * 1.3, 12 + row * 1.6 + Math.sin(t * 0.6 + col * 0.4) * 0.15, -16)
      o.rotation.set(0, 0, 0)
      o.scale.setScalar(row === 1 ? 0.5 : 0.35)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <torusGeometry args={[0.6, 0.12, 8, 24]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
    </instancedMesh>
  )
}

function Pyramid({ color, cap }: { color: string; cap: string }) {
  const geo = useDisposable(() => new ConeGeometry(16, 14, 4, 1), [])
  return (
    <group position={[0, 0, -48]}>
      <mesh geometry={geo} position={[0, 7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <meshStandardMaterial color={color} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 13.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.8, 1.6, 4]} />
        <meshStandardMaterial color={cap} metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  )
}

function Stepped({ color, accent, temple }: { color: string; accent: string; temple: boolean }) {
  const tiers = temple ? 7 : 5
  return (
    <group position={[0, 0, -42]}>
      {Array.from({ length: tiers }, (_, i) => (
        <mesh key={i} position={[0, i * 2 + 1, 0]}>
          <boxGeometry args={[26 - i * 3.4, 2, 22 - i * 3]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, tiers + 0.5, 10.5 - tiers * 0.3]} rotation={[-0.62, 0, 0]}>
        <boxGeometry args={[4, tiers * 2.6, 0.4]} />
        <meshStandardMaterial color={accent} roughness={0.9} />
      </mesh>
      {temple && (
        <mesh position={[0, tiers * 2 + 1.5, 0]}>
          <boxGeometry args={[4, 3, 3]} />
          <meshStandardMaterial color={accent} roughness={0.8} />
        </mesh>
      )}
    </group>
  )
}

/** Abstracted cast heads: concentric striations on a serene ovoid. */
function Head({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh scale={[0.8, 1.05, 0.9]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.35} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0, -0.6 + i * 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.83, 0.92, 1]}>
          <torusGeometry args={[Math.sqrt(Math.max(0.05, 1 - ((-0.6 + i * 0.14) / 1.05) ** 2)) * 0.98, 0.018, 6, 40]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -1.4, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 0.8, 24]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}

export default function MonumentScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const v = movement.visual.variant
  const c = movement.visual.palette.colors
  const colRows = useMemo(() => Array.from({ length: 5 }, (_, i) => -2 - i * 4.2), [])
  return (
    <group>
      <Floor color={v === 'plaques' ? '#2a1d14' : c[3] ?? '#c9a26a'} />
      {v !== 'plaques' &&
        colRows.map((z) =>
          [-6.5, 6.5].map((x) => <Column key={`${x}${z}`} position={[x, 0, z]} height={7} radius={0.55} order={v === 'pyramid' ? 'papyrus' : 'plain'} color={c[3] ?? '#e9d3a0'} />),
        )}
      <PaintedPlane movement={movement} painter="monument" size={[14, 7]} res={[1024, 512]} position={[-11, 4.5, -10]} rotation={[0, 0.9, 0]} />
      <PaintedPlane movement={movement} painter="monument" seed="b" size={[14, 7]} res={[1024, 512]} position={[11, 4.5, -10]} rotation={[0, -0.9, 0]} />
      {v === 'pyramid' && <Pyramid color={c[3] ?? '#e9d3a0'} cap={c[0]} />}
      {(v === 'ziggurat' || v === 'stepped') && <Stepped color={v === 'ziggurat' ? '#8d5a32' : c[3] ?? '#e7dcc0'} accent={v === 'ziggurat' ? c[0] : c[0]} temple={v === 'stepped'} />}
      {v === 'plaques' && (
        <group position={[0, 0, -14]}>
          {Array.from({ length: 24 }, (_, i) => (
            <PaintedPlane key={i} movement={movement} painter="monument" seed={`p${i}`} size={[2.2, 2.2]} res={[256, 256]} position={[((i % 8) - 3.5) * 2.5, 3 + Math.floor(i / 8) * 2.5, 0]} />
          ))}
          <Head position={[-4, 2.4, 6]} color={pal.hex.colors[0]} />
          <Head position={[0, 2.8, 5]} color={pal.hex.colors[0]} />
          <Head position={[4, 2.4, 6]} color={pal.hex.colors[0]} />
        </group>
      )}
      <mesh position={[0, 16, -30]}>
        <circleGeometry args={[2.4, 64]} />
        <meshBasicMaterial color={pal.hex.accent} toneMapped={false} />
      </mesh>
      {v !== 'plaques' && <SymbolRows color={pal.hex.accent} />}
      <Motes count={Math.round(180 * quality)} area={[30, 14, 30]} position={[0, 0, -10]} color={pal.hex.accent} size={0.05} rise={0.05} opacity={0.4} />
    </group>
  )
}
