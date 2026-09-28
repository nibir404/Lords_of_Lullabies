import { useMemo } from 'react'
import { EVOLUTION_PAIRS } from '@/data/interactions'
import { useStore } from '@/state/store'
import { world } from '@/state/world'
import { EVOLUTION_BUILDERS } from '@/utils/formations'
import { mulberry32 } from '@/utils/random'
import { MorphField } from '../MorphField'
import { VIEW_CONFIG } from '../viewConfig'

/**
 * ART EVOLUTION: two movements on opposite ends of a slider. The target formation is derived
 * from the source (e.g. every Renaissance block is re-projected into Cubist planes), so dragging
 * genuinely transforms one architecture into the other.
 */
export default function EvolutionView({ quality }: { quality: number }) {
  const pairId = useStore((s) => s.evolutionPair)
  const pair = EVOLUTION_PAIRS.find((p) => p.id === pairId) ?? EVOLUTION_PAIRS[0]
  const n = Math.round(2400 * Math.max(0.5, quality))
  const formations = useMemo(() => {
    const rng = mulberry32(7)
    const from = EVOLUTION_BUILDERS[pair.from.formation](n, rng)
    const to = EVOLUTION_BUILDERS[pair.to.formation](n, mulberry32(8), from)
    return [from, to]
  }, [pair, n])
  const [x, , z] = VIEW_CONFIG.evolution.look
  return (
    <group position={[x, 0, z + 6]}>
      <MorphField key={pair.id} formations={formations} progress={() => world.sliders.evolution} stagger={0.8} shrink={0.35} tumble={1.1} scatter={1.2} smoothing={5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -8]}>
        <planeGeometry args={[200, 120]} />
        <meshStandardMaterial color="#cfc4b2" roughness={1} />
      </mesh>
    </group>
  )
}
