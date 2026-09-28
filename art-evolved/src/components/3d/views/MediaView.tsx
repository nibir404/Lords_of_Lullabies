import { useMemo } from 'react'
import { MATERIALS } from '@/data/materials'
import { TECHNOLOGIES } from '@/data/technologies'
import { useStore } from '@/state/store'
import { world } from '@/state/world'
import { MATERIAL_BUILDERS, TECH_BUILDERS } from '@/utils/formations'
import { mulberry32 } from '@/utils/random'
import { MorphField } from '../MorphField'
import { VIEW_CONFIG } from '../viewConfig'

/** MATERIAL EVOLUTION / TECHNOLOGY × ART — the medium itself morphs from stone to neural network. */
export default function MediaView({ quality }: { quality: number }) {
  const tab = useStore((s) => s.mediaTab)
  const n = Math.round(2200 * Math.max(0.5, quality))
  const formations = useMemo(() => {
    const list = tab === 'materials' ? MATERIALS.map((m) => MATERIAL_BUILDERS[m.id]) : TECHNOLOGIES.map((t) => TECH_BUILDERS[t.id])
    return list.map((b, i) => b(n, mulberry32(500 + i)))
  }, [tab, n])
  const [x, , z] = VIEW_CONFIG.media.look
  return (
    <group position={[x, 0, z]}>
      <MorphField key={tab} formations={formations} progress={() => world.sliders.media * (formations.length - 1)} stagger={0.7} tumble={1} scatter={1} smoothing={3.5} emissive={0.12} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[7.8, 8, 96]} />
        <meshBasicMaterial color="#efe6d8" transparent opacity={0.35} />
      </mesh>
    </group>
  )
}
