import { useMemo } from 'react'
import { TREE_STYLES } from '@/data/interactions'
import { world } from '@/state/world'
import { TREE_BUILDERS } from '@/utils/formations'
import { mulberry32 } from '@/utils/random'
import { MorphField } from '../MorphField'
import { VIEW_CONFIG } from '../viewConfig'

/** HOW ART CHANGED: one conceptual object — a tree — continuously re-drawn by each period. */
export default function MorphView({ quality }: { quality: number }) {
  const n = Math.round(2200 * Math.max(0.5, quality))
  const formations = useMemo(() => TREE_STYLES.map((s, i) => TREE_BUILDERS[s.id](n, mulberry32(300 + i))), [n])
  const [x, , z] = VIEW_CONFIG.morph.look
  return (
    <group position={[x, 0.5, z]}>
      <MorphField formations={formations} progress={() => world.sliders.morph * (formations.length - 1)} stagger={0.6} shrink={0.2} tumble={0.9} scatter={0.8} smoothing={3.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial color="#8a8074" transparent opacity={0.25} roughness={1} />
      </mesh>
    </group>
  )
}
