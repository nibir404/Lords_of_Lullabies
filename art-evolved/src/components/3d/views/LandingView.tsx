import { useMemo } from 'react'
import { SCULPTURE_BUILDERS } from '@/utils/formations'
import { mulberry32 } from '@/utils/random'
import { MorphField } from '../MorphField'
import { Spin } from '@/scenes/shared'
import { useAutoStage } from './useAutoStage'

/** The entrance: an empty architectural hall, a procedural sculpture, and a corridor of frames. */
export default function LandingView({ quality }: { quality: number }) {
  const n = Math.round(2600 * Math.max(0.5, quality))
  const formations = useMemo(() => {
    const list = SCULPTURE_BUILDERS.map((b, i) => b(n, mulberry32(40 + i)))
    return [...list, list[0]]
  }, [n])
  const progress = useAutoStage('landing', formations.length - 1, 3.4, 2.4, { 4: 'pixel', 5: 'ascii' })
  const frames = useMemo(() => Array.from({ length: 14 }, (_, i) => 112 - i * 6.5), [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 90]}>
        <planeGeometry args={[220, 200]} />
        <meshStandardMaterial color="#e6e2da" roughness={0.95} />
      </mesh>
      {[-34, 34].map((x) => (
        <mesh key={x} position={[x, 16, 96]}>
          <boxGeometry args={[0.6, 32, 70]} />
          <meshStandardMaterial color="#dcd7cd" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 31.7, 96]}>
        <boxGeometry args={[68, 0.6, 70]} />
        <meshStandardMaterial color="#ebe7df" roughness={1} />
      </mesh>
      {frames.map((z, i) => (
        <group key={z} position={[0, 0, z - 30]}>
          {[-11, 11].map((x) => (
            <mesh key={x} position={[x, 8, 0]}>
              <boxGeometry args={[0.14, 16, 0.14]} />
              <meshBasicMaterial color={i % 4 === 0 ? '#e0482f' : '#1b1a19'} />
            </mesh>
          ))}
          <mesh position={[0, 16, 0]}>
            <boxGeometry args={[22.14, 0.14, 0.14]} />
            <meshBasicMaterial color={i % 4 === 0 ? '#e0482f' : '#1b1a19'} />
          </mesh>
        </group>
      ))}
      <group position={[4.2, 5.2, 100]} scale={1.25}>
        <Spin speed={0.12}>
          <MorphField formations={formations} progress={() => progress.current} stagger={0.7} shrink={0.2} tumble={1.2} scatter={0.9} />
        </Spin>
      </group>
      <mesh position={[4.2, 0.02, 100]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.5, 64]} />
        <meshBasicMaterial color="#d8d2c6" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}
