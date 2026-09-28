import { useMemo } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import type { SceneProps } from '../types'
import { Motes, PaintedPlane, useDisposable, usePalette } from '../shared'

function Stencil({ position, color }: { position: [number, number, number]; color: string }) {
  const geo = useDisposable(() => {
    const s = new Shape()
    s.absellipse(0, 1.4, 0.9, 1.1, 0, Math.PI * 2, false, 0)
    const str = new Shape()
    str.moveTo(-0.04, 0.3)
    str.bezierCurveTo(0.4, -0.6, -0.5, -1.4, 0.1, -2.6)
    str.lineTo(0.16, -2.6)
    str.bezierCurveTo(-0.4, -1.4, 0.5, -0.6, 0.04, 0.3)
    return new ExtrudeGeometry([s, str], { depth: 0.02, bevelEnabled: false })
  }, [])
  return (
    <mesh geometry={geo} position={position}>
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

export default function StreetScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const v = movement.visual.variant ?? 'graffiti'
  const painter = v === 'neo' ? 'crown' : 'street'
  const panels = useMemo(() => [-1, 0, 1], [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={v === 'neo' ? '#2a2620' : '#1d1d20'} roughness={0.95} />
      </mesh>
      {panels.map((k) => (
        <PaintedPlane key={k} movement={movement} painter={painter} seed={String(k)} size={[12, 9]} res={[1024, 768]} position={[k * 12, 4.5, -14 + Math.abs(k) * 2]} rotation={[0, -k * 0.35, 0]} />
      ))}
      {v === 'stencil' && (
        <>
          <Stencil position={[-4, 4, -13.9]} color={pal.hex.accent} />
          <Stencil position={[5, 3.4, -13.9]} color="#111111" />
        </>
      )}
      <group position={[9, 0, -4]}>
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[0.1, 0.14, 8, 12]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-0.8, 8, 0]}>
          <boxGeometry args={[1.8, 0.2, 0.5]} />
          <meshStandardMaterial color="#2a2a2e" />
        </mesh>
        <mesh position={[-1.4, 7.85, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.4]} />
          <meshBasicMaterial color="#fff2c8" toneMapped={false} />
        </mesh>
      </group>
      <Motes count={Math.round(260 * quality)} area={[30, 10, 10]} position={[0, 0, -11]} color={pal.hex.colors[0]} size={0.06} rise={0.05} sway={0.8} opacity={0.4} />
      <Motes count={Math.round(160 * quality)} area={[30, 10, 10]} position={[0, 0, -11]} color={pal.hex.colors[1]} size={0.06} rise={0.04} sway={0.8} opacity={0.4} seed={11} />
    </group>
  )
}
