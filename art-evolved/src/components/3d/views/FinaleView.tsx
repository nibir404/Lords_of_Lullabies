import { useMemo } from 'react'
import { FINALE_BUILDERS } from '@/utils/formations'
import { mulberry32 } from '@/utils/random'
import { MorphField } from '../MorphField'
import { Motes, Spin } from '@/scenes/shared'
import { useAutoStage } from './useAutoStage'
import { FINALE_Z } from '../viewConfig'

/** The end of the corridor: the museum is gone; every language collapses into one changing form. */
export default function FinaleView({ quality }: { quality: number }) {
  const n = Math.round(3000 * Math.max(0.5, quality))
  const formations = useMemo(() => {
    const list = FINALE_BUILDERS.map((b, i) => b(n, mulberry32(90 + i)))
    return [...list, list[0]]
  }, [n])
  const progress = useAutoStage('finale', formations.length - 1, 2.6, 2, { 1: 'pixel', 2: 'ascii' })
  return (
    <group position={[0, 0, FINALE_Z]}>
      <group position={[0, 4, 0]}>
        <Spin speed={0.18}>
          <MorphField formations={formations} progress={() => progress.current} stagger={0.8} tumble={1.6} scatter={1.4} emissive={0.25} />
        </Spin>
      </group>
      <Motes count={Math.round(500 * quality)} area={[60, 30, 60]} position={[0, -4, 0]} color="#f2efe8" size={0.08} rise={0.15} opacity={0.35} />
    </group>
  )
}
