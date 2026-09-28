import { useMemo } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import type { SceneProps } from '../types'
import { Column, Figure, Floor, Motes, Plinth, useDisposable, usePalette } from '../shared'

function Pediment({ width, height, color, y, z }: { width: number; height: number; color: string; y: number; z: number }) {
  const geo = useDisposable(() => {
    const s = new Shape()
    s.moveTo(-width / 2, 0)
    s.lineTo(0, height)
    s.lineTo(width / 2, 0)
    s.closePath()
    return new ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false })
  }, [width, height])
  return (
    <mesh geometry={geo} position={[0, y, z]}>
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  )
}

export default function TempleScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const v = movement.visual.variant
  const c = movement.visual.palette.colors
  const stone = c[0]
  const front = useMemo(() => Array.from({ length: 8 }, (_, i) => -10.5 + i * 3), [])
  const sides = useMemo(() => Array.from({ length: 4 }, (_, i) => -14 - i * 3.6), [])
  const H = 9
  return (
    <group>
      <Floor color={c[1]} roughness={0.6} />
      <group position={[0, 0, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.25 + i * 0.5, -16 + i * 0.4]}>
            <boxGeometry args={[26 - i * 1.2, 0.5, 20 - i * 0.8]} />
            <meshStandardMaterial color={stone} roughness={0.8} />
          </mesh>
        ))}
        {v === 'roman'
          ? front.slice(0, 7).map((x, i) => (
              <group key={x} position={[x + 1.5, 1.5, -7]}>
                {i < 6 && (
                  <mesh position={[1.5, H - 1.6, 0]} rotation={[0, 0, 0]}>
                    <torusGeometry args={[1.5, 0.35, 10, 24, Math.PI]} />
                    <meshStandardMaterial color={stone} roughness={0.85} />
                  </mesh>
                )}
                <Column position={[0, 0, 0]} height={H - 1.6} radius={0.42} order="plain" color={stone} />
              </group>
            ))
          : front.map((x) => <Column key={x} position={[x, 1.5, -7]} height={H} radius={0.5} order={v === 'neoclassical' ? 'ionic' : 'doric'} color={stone} />)}
        {sides.map((z) => [-10.5, 10.5].map((x) => <Column key={`${x}${z}`} position={[x, 1.5, z]} height={H} radius={0.5} color={stone} />))}
        <mesh position={[0, 1.5 + H + 1.1, -16]}>
          <boxGeometry args={[23.5, 1.4, 20]} />
          <meshStandardMaterial color={stone} roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.5 + H + 0.5, -6.45]}>
          <boxGeometry args={[23.5, 0.18, 0.1]} />
          <meshStandardMaterial color={pal.hex.accent} roughness={0.6} />
        </mesh>
        {v !== 'roman' && <Pediment width={24} height={v === 'neoclassical' ? 2.8 : 3.6} color={stone} y={1.5 + H + 1.8} z={-7.4} />}
        {v === 'roman' && (
          <mesh position={[0, 1.5 + H + 1.8, -18]}>
            <sphereGeometry args={[8, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={c[2]} roughness={0.8} />
          </mesh>
        )}
        <mesh position={[0, 1.5 + H / 2, -24]}>
          <boxGeometry args={[18, H, 0.6]} />
          <meshStandardMaterial color={c[2]} roughness={0.9} />
        </mesh>
      </group>
      <Plinth position={[-5, 0, 3]} color={c[1]} />
      <Figure position={[-5, 1.2, 3]} rotation={0.4} scale={1.25} color={stone} pose={{ contrapposto: 0.9 }} />
      <Plinth position={[5, 0, 3]} color={c[1]} />
      <Figure position={[5, 1.2, 3]} rotation={-0.5} scale={1.25} color={stone} pose={{ contrapposto: 0.6, armRaise: v === 'roman' ? 0.6 : 0.1 }} />
      {v === 'neoclassical' && (
        <>
          <Plinth position={[0, 0, -2]} size={[2.2, 1.6, 2.2]} color={c[1]} />
          <Figure position={[0, 1.6, -2]} scale={1.5} color={stone} pose={{ contrapposto: 0.3 }} />
        </>
      )}
      <Motes count={Math.round(160 * quality)} area={[30, 14, 24]} position={[0, 0, -8]} color="#fff6e0" size={0.05} rise={0.04} opacity={0.35} />
    </group>
  )
}
