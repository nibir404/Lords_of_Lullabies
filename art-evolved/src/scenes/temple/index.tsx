import { useMemo } from 'react'
import { ExtrudeGeometry, LatheGeometry, Shape, Vector2 } from 'three'
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

/** Round-arched opening: two piers and a half-ring. */
function Arch({ position, span, height, depth = 1.2, color }: { position: [number, number, number]; span: number; height: number; depth?: number; color: string }) {
  const pier = span * 0.28
  return (
    <group position={position}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * (span / 2 + pier / 2), height / 2, 0]}>
          <boxGeometry args={[pier, height, depth]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]}>
        <cylinderGeometry args={[span / 2 + pier, span / 2 + pier, depth, 40, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, height + (span / 2 + pier) * 0.55, 0]}>
        <boxGeometry args={[span + pier * 2, (span / 2 + pier) * 1.1, depth]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  )
}

/** Greek peristyle temple with a painted frieze (Greek marble was originally coloured). */
function Parthenon({ stone, base, accent, frieze }: { stone: string; base: string; accent: string; frieze: string[] }) {
  const front = useMemo(() => Array.from({ length: 8 }, (_, i) => -10.5 + i * 3), [])
  const sides = useMemo(() => Array.from({ length: 4 }, (_, i) => -10.6 - i * 3.6), [])
  const H = 9
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.25 + i * 0.5, -16 + i * 0.4]}>
          <boxGeometry args={[26 - i * 1.2, 0.5, 20 - i * 0.8]} />
          <meshStandardMaterial color={base} roughness={0.8} />
        </mesh>
      ))}
      {front.map((x) => <Column key={x} position={[x, 1.5, -7]} height={H} radius={0.5} order="doric" color={stone} />)}
      {sides.map((z) => [-10.5, 10.5].map((x) => <Column key={`${x}${z}`} position={[x, 1.5, z]} height={H} radius={0.5} order="doric" color={stone} />))}
      <mesh position={[0, 1.5 + H + 1.1, -16]}>
        <boxGeometry args={[23.5, 1.4, 20]} />
        <meshStandardMaterial color={stone} roughness={0.85} />
      </mesh>
      {/* triglyphs and painted metopes */}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} position={[-11.1 + i * 1.48, 1.5 + H + 1.1, -6.35]}>
          <boxGeometry args={[i % 2 ? 1.1 : 0.4, 1.1, 0.12]} />
          <meshStandardMaterial color={i % 2 ? frieze[i % frieze.length] : '#2b2a28'} roughness={0.7} />
        </mesh>
      ))}
      <Pediment width={24} height={3.6} color={stone} y={1.5 + H + 1.8} z={-7.4} />
      <mesh position={[0, 1.5 + H + 3.05, -6.15]}>
        <circleGeometry args={[0.7, 3]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.5 + H / 2, -22]}>
        <boxGeometry args={[18, H, 0.6]} />
        <meshStandardMaterial color={base} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Red-figure amphora on a stand. */
function Amphora({ position, body, figure }: { position: [number, number, number]; body: string; figure: string }) {
  const geo = useDisposable(() => {
    const pts = [
      [0.01, 0], [0.35, 0.02], [0.28, 0.25], [0.62, 0.7], [0.78, 1.2], [0.7, 1.7], [0.4, 2.05], [0.26, 2.3], [0.3, 2.55], [0.36, 2.6],
    ].map(([x, y]) => new Vector2(x, y))
    return new LatheGeometry(pts, 40)
  }, [])
  return (
    <group position={position}>
      <mesh geometry={geo}>
        <meshStandardMaterial color={body} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.5, 40, 1, true]} />
        <meshStandardMaterial color={figure} roughness={0.5} side={2} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 0.5, 2.05, 0]} rotation={[0, 0, sd * 0.3]}>
          <torusGeometry args={[0.28, 0.05, 8, 20, Math.PI]} />
          <meshStandardMaterial color={body} roughness={0.45} />
        </mesh>
      ))}
    </group>
  )
}

/** The Pantheon: portico, drum and a coffered dome open to the sky. */
function Pantheon({ stone, dome, accent }: { stone: string; dome: string; accent: string }) {
  const coffers = useMemo(() => {
    const out: { p: [number, number, number]; r: [number, number, number] }[] = []
    for (let ring = 0; ring < 4; ring++)
      for (let k = 0; k < 20; k++) {
        const phi = 0.35 + ring * 0.24
        const th = (k / 20) * Math.PI * 2
        out.push({ p: [Math.sin(phi) * Math.cos(th) * 8.95, Math.cos(phi) * 8.95, Math.sin(phi) * Math.sin(th) * 8.95], r: [0, -th, 0] })
      }
    return out
  }, [])
  return (
    <group position={[0, 0, -24]}>
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[9.4, 9.4, 10, 64]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      <group position={[0, 10, 0]}>
        <mesh>
          <sphereGeometry args={[9.4, 64, 24, 0, Math.PI * 2, 0.16, Math.PI / 2 - 0.16]} />
          <meshStandardMaterial color={dome} roughness={0.75} side={2} />
        </mesh>
        {coffers.map((c, i) => (
          <mesh key={i} position={c.p} rotation={c.r}>
            <boxGeometry args={[0.7, 0.5, 0.2]} />
            <meshStandardMaterial color={stone} roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* portico */}
      {Array.from({ length: 8 }, (_, i) => (
        <Column key={i} position={[-8.4 + i * 2.4, 0, 11]} height={8} radius={0.45} order="plain" color={stone} />
      ))}
      <mesh position={[0, 8.9, 10.5]}>
        <boxGeometry args={[19.6, 1.4, 4]} />
        <meshStandardMaterial color={stone} roughness={0.85} />
      </mesh>
      <Pediment width={19.6} height={3} color={stone} y={9.6} z={10.5} />
      <mesh position={[0, 8.9, 12.52]}>
        <boxGeometry args={[12, 0.35, 0.05]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
    </group>
  )
}

/** Trajan's Column: a spiral frieze wound around a shaft. */
function SpiralColumn({ position, color, band }: { position: [number, number, number]; color: string; band: string }) {
  const turns = 8
  const n = 96
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.6, 1.4, 2.6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 7.4, 0]}>
        <cylinderGeometry args={[0.8, 0.9, 12, 32]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const t = i / n
        const a = t * turns * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.92, 1.8 + t * 11, Math.sin(a) * 0.92]} rotation={[0, -a, 0.14]}>
            <boxGeometry args={[0.07, 0.2, 0.62]} />
            <meshStandardMaterial color={band} roughness={0.8} />
          </mesh>
        )
      })}
      <mesh position={[0, 13.8, 0]}>
        <boxGeometry args={[2, 0.5, 2]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <Figure position={[0, 14, 0]} scale={0.9} color={band} pose={{ contrapposto: 0.5, armRaise: 0.4 }} />
    </group>
  )
}

export default function TempleScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const v = movement.visual.variant
  const c = movement.visual.palette.colors
  const stone = c[0]
  return (
    <group>
      <Floor color={c[1]} roughness={0.6} />

      {v === 'greek' && (
        <>
          <Parthenon stone={stone} base={c[1]} accent={pal.hex.accent} frieze={[pal.hex.accent, c[3] ?? '#3b5a78']} />
          <Plinth position={[-5, 0, 3]} color={c[1]} />
          <Figure position={[-5, 1.2, 3]} rotation={0.4} scale={1.25} color={stone} pose={{ contrapposto: 0.9 }} />
          <Plinth position={[5.4, 0, 3]} size={[1.4, 1.2, 1.4]} color={c[1]} />
          <Amphora position={[5.4, 1.2, 3]} body="#1d1b18" figure={pal.hex.accent} />
        </>
      )}

      {v === 'roman' && (
        <>
          <Pantheon stone={stone} dome={c[2]} accent={pal.hex.accent} />
          <Arch position={[0, 0, -3]} span={4.2} height={6} depth={2} color={c[1]} />
          <SpiralColumn position={[9.5, 0, -6]} color={stone} band={c[2]} />
          <Plinth position={[-7, 0, 1]} size={[1.4, 1.5, 1.4]} color={c[1]} />
          <mesh position={[-7, 2.35, 1]} scale={[0.5, 0.62, 0.55]}>
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color={stone} roughness={0.6} />
          </mesh>
          <mesh position={[-7, 1.75, 1]}>
            <cylinderGeometry args={[0.3, 0.75, 0.6, 24]} />
            <meshStandardMaterial color={stone} roughness={0.6} />
          </mesh>
        </>
      )}

      {v === 'neoclassical' && (
        <>
          {/* the severe arcade of David's Oath of the Horatii */}
          {[-7.5, 0, 7.5].map((x) => (
            <Arch key={x} position={[x, 0, -14]} span={4.6} height={7} depth={1.4} color={stone} />
          ))}
          <mesh position={[0, 8, -15.2]}>
            <boxGeometry args={[26, 16, 0.6]} />
            <meshStandardMaterial color={c[2]} roughness={0.95} />
          </mesh>
          {[-3.2, -1.8, -0.4].map((x, i) => (
            <Figure key={x} position={[x, 0, -7]} rotation={0.9} scale={1.2} color={c[3] ?? '#b8462f'} pose={{ contrapposto: 0.2, armRaise: 0.75, lean: -0.08 * i }} />
          ))}
          <Plinth position={[4.5, 0, -2]} size={[2.2, 1.8, 2.2]} color={c[1]} />
          <Figure position={[4.5, 1.8, -2]} rotation={-0.6} scale={1.45} color="#f7f4ee" roughness={0.3} pose={{ contrapposto: 0.7, twist: 0.4 }} />
        </>
      )}
      <Motes count={Math.round(160 * quality)} area={[30, 14, 24]} position={[0, 0, -8]} color="#fff6e0" size={0.05} rise={0.04} opacity={0.35} />
    </group>
  )
}
