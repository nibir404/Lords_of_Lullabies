import { useLayoutEffect, useRef } from 'react'
import { mulberry32 } from '@/utils/random'
import { useFrame } from '@react-three/fiber'
import { Group, InstancedMesh, Object3D } from 'three'
import type { SceneProps } from '../types'
import { usePalette } from '../shared'

/** One object. One light. One colour. Everything else is space and time. */
function Monolith({ color }: { color: string }) {
  const g = useRef<Group>(null)
  useFrame((s) => {
    if (g.current) g.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.03) * 0.6
  })
  return (
    <group ref={g} position={[0, 0, -6]}>
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[4.8, 4.8, 4.8]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
      </mesh>
    </group>
  )
}

function SpiralJetty({ colors }: { colors: string[] }) {
  const ref = useRef<InstancedMesh>(null)
  const count = 900
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const rng = mulberry32(1970)
    const o = new Object3D()
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 * 3.2
      const r = 0.6 + a * 0.62
      o.position.set(Math.cos(a) * r + (rng() - 0.5) * 0.6, 0.15, -8 + Math.sin(a) * r * 0.9 + (rng() - 0.5) * 0.6)
      o.rotation.set(rng() * 3, rng() * 5, rng() * 2)
      o.scale.set(0.35 + rng() * 0.3, 0.25, 0.3 + rng() * 0.3)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -8]}>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color={colors[1]} roughness={0.25} metalness={0.2} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={colors[0]} roughness={1} flatShading />
      </instancedMesh>
    </group>
  )
}

export default function MinimalScene({ movement }: SceneProps) {
  const pal = usePalette(movement)
  const land = movement.visual.variant === 'land'
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={pal.bg} roughness={1} />
      </mesh>
      {land ? <SpiralJetty colors={movement.visual.palette.colors} /> : <Monolith color={pal.hex.ink} />}
    </group>
  )
}
