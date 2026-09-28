import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AI_BUILDERS, FINALE_BUILDERS } from '@/utils/formations'
import { mulberry32 } from '@/utils/random'
import type { SceneProps } from '../types'
import { Motes, usePalette } from '../shared'
import { MorphField } from '@/components/3d/MorphField'
import { world } from '@/state/world'

/**
 * HUMAN → ALGORITHM → MACHINE. Thousands of units continuously re-form: a wavering hand-drawn line,
 * a clean mathematical rose, a rule-based grid, a neural lattice, a generative attractor.
 */
export default function AIScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const post = movement.visual.variant === 'postdigital'
  const n = Math.round(2800 * Math.max(0.5, quality))
  const formations = useMemo(() => {
    const list = post
      ? [AI_BUILDERS[0], FINALE_BUILDERS[0], FINALE_BUILDERS[1], AI_BUILDERS[2], FINALE_BUILDERS[6], AI_BUILDERS[4]].map((b, i) => b(n, mulberry32(700 + i)))
      : AI_BUILDERS.map((b, i) => b(n, mulberry32(600 + i)))
    if (!post) for (let i = 0; i < n; i++) if (list[0]) list[0].col.set([0.85, 0.83, 0.8], i * 3)
    return [...list, list[0]]
  }, [n, post])
  const stages = formations.length - 1
  const t0 = useRef(performance.now())
  const progress = useRef(0)
  useFrame(() => {
    const span = 5.2
    const tt = (performance.now() - t0.current) / 1000 / span
    const stage = Math.floor(tt) % stages
    const fr = tt - Math.floor(tt)
    progress.current = stage + Math.max(0, (fr - 0.55) / 0.45)
    world.autoStage[movement.id] = progress.current
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={pal.bg.clone().multiplyScalar(post ? 0.92 : 2.2)} roughness={0.9} />
      </mesh>
      <group position={[0, 0, -6]}>
        <MorphField formations={formations} progress={() => progress.current} stagger={0.8} tumble={1.3} scatter={1.2} emissive={post ? 0.05 : 0.3} smoothing={5} />
      </group>
      <Motes count={Math.round(260 * quality)} area={[30, 14, 20]} position={[0, 0, -8]} color={pal.hex.accent} size={0.06} rise={0.15} opacity={0.6} />
    </group>
  )
}
