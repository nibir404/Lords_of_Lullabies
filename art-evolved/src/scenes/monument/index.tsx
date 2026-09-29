import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ConeGeometry, type Group, InstancedMesh, Object3D } from 'three'
import type { SceneProps } from '../types'
import { Column, Floor, Motes, PaintedPlane, useDisposable, usePalette } from '../shared'

/** Repeated symbolic tokens: rows of rings and almond shapes that rise and fall in unison. */
function SymbolRows({ color, count = 60 }: { color: string; count?: number }) {
  const ref = useRef<InstancedMesh>(null)
  const o = useMemo(() => new Object3D(), [])
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    const t = s.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 20)
      const col = i % 20
      o.position.set((col - 9.5) * 1.3, 12 + row * 1.6 + Math.sin(t * 0.6 + col * 0.4) * 0.15, -16)
      o.rotation.set(0, 0, 0)
      o.scale.setScalar(row === 1 ? 0.5 : 0.35)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <torusGeometry args={[0.6, 0.12, 8, 24]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
    </instancedMesh>
  )
}

function Pyramid({ color, cap }: { color: string; cap: string }) {
  const geo = useDisposable(() => new ConeGeometry(16, 14, 4, 1), [])
  return (
    <group position={[0, 0, -48]}>
      <mesh geometry={geo} position={[0, 7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <meshStandardMaterial color={color} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 13.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.8, 1.6, 4]} />
        <meshStandardMaterial color={cap} metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  )
}

function Stepped({ color, accent, temple }: { color: string; accent: string; temple: boolean }) {
  const tiers = temple ? 7 : 5
  return (
    <group position={[0, 0, -42]}>
      {Array.from({ length: tiers }, (_, i) => (
        <mesh key={i} position={[0, i * 2 + 1, 0]}>
          <boxGeometry args={[26 - i * 3.4, 2, 22 - i * 3]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, tiers + 0.5, 10.5 - tiers * 0.3]} rotation={[-0.62, 0, 0]}>
        <boxGeometry args={[4, tiers * 2.6, 0.4]} />
        <meshStandardMaterial color={accent} roughness={0.9} />
      </mesh>
      {temple && (
        <mesh position={[0, tiers * 2 + 1.5, 0]}>
          <boxGeometry args={[4, 3, 3]} />
          <meshStandardMaterial color={accent} roughness={0.8} />
        </mesh>
      )}
    </group>
  )
}

/** Abstracted cast heads: concentric striations on a serene ovoid. */
function Head({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh scale={[0.8, 1.05, 0.9]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.35} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0, -0.6 + i * 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.83, 0.92, 1]}>
          <torusGeometry args={[Math.sqrt(Math.max(0.05, 1 - ((-0.6 + i * 0.14) / 1.05) ** 2)) * 0.98, 0.018, 6, 40]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -1.4, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 0.8, 24]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** Glazed-brick gate with registers of striding animals (after the Ishtar Gate of Babylon). */
function IshtarGate({ brick, relief }: { brick: string; relief: string }) {
  const beasts = useMemo(() => {
    const out: { x: number; y: number; dir: number }[] = []
    for (const y of [3.2, 6.4, 9.6]) for (const side of [-1, 1]) for (let k = 0; k < 3; k++) out.push({ x: side * (6.6 + k * 2.6), y, dir: -side })
    return out
  }, [])
  return (
    <group position={[0, 0, -13]}>
      {/* towers and the wall between them, leaving an arched passage */}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[sd * 9.5, 6.5, 0]}>
            <boxGeometry args={[9, 13, 2.4]} />
            <meshStandardMaterial color={brick} roughness={0.35} metalness={0.15} />
          </mesh>
          <mesh position={[sd * 3.4, 5, 0]}>
            <boxGeometry args={[3.2, 10, 2]} />
            <meshStandardMaterial color={brick} roughness={0.35} metalness={0.15} />
          </mesh>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} position={[sd * (6 + i * 1.75), 13.6, 0]}>
              <boxGeometry args={[0.9, 1.2, 2.4]} />
              <meshStandardMaterial color={brick} roughness={0.35} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 10.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 2, 32, 1, false, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={brick} roughness={0.35} side={2} />
      </mesh>
      <mesh position={[0, 11.9, 0]}>
        <boxGeometry args={[3.6, 2.2, 2]} />
        <meshStandardMaterial color={brick} roughness={0.35} />
      </mesh>
      {/* yellow-glazed relief bands and beasts */}
      {[1.6, 4.8, 8, 11.2].map((y) => (
        <mesh key={y} position={[0, y, 1.25]}>
          <boxGeometry args={[27.6, 0.18, 0.1]} />
          <meshStandardMaterial color={relief} roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
      {beasts.map((b, i) => (
        <group key={i} position={[b.x, b.y, 1.3]} scale={[b.dir, 1, 1]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.7, 0.7, 0.14]} />
            <meshStandardMaterial color={relief} roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[1.05, 0.35, 0]}>
            <boxGeometry args={[0.55, 0.55, 0.14]} />
            <meshStandardMaterial color={relief} roughness={0.4} metalness={0.3} />
          </mesh>
          {[-0.65, -0.2, 0.3, 0.7].map((lx) => (
            <mesh key={lx} position={[lx, -0.62, 0]}>
              <boxGeometry args={[0.16, 0.6, 0.14]} />
              <meshStandardMaterial color={relief} roughness={0.4} metalness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** A cylinder seal rolling out its frieze on a clay tablet. */
function CylinderSeal({ movement, clay, stone }: { movement: SceneProps['movement']; clay: string; stone: string }) {
  const ref = useRef<Group>(null)
  useFrame((s) => {
    const g = ref.current
    if (!g) return
    const t = s.clock.elapsedTime * 0.35
    const x = Math.sin(t) * 1.6
    g.position.x = x
    g.rotation.x = -x / 0.45
  })
  return (
    <group position={[7.5, 0, 1]} rotation={[0, -0.5, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[4.6, 1, 2.4]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.04, 0]}>
        <boxGeometry args={[4.2, 0.08, 1.8]} />
        <meshStandardMaterial color={clay} roughness={1} />
      </mesh>
      <PaintedPlane movement={movement} painter="monument" seed="seal" size={[4.2, 1.2]} res={[512, 128]} position={[0, 1.09, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <group ref={ref} position={[0, 1.55, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.45, 0.45, 1.5, 32]} />
          <meshStandardMaterial color={stone} roughness={0.5} metalness={0.1} />
        </mesh>
      </group>
    </group>
  )
}

function Obelisk({ position, color, cap }: { position: [number, number, number]; color: string; cap: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.55, 0.85, 10, 4, 1]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 10.5, 0]}>
        <coneGeometry args={[0.55, 1, 4]} />
        <meshStandardMaterial color={cap} metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  )
}

/** Olmec colossal head: a basalt boulder with a close-fitting helmet. */
function ColossalHead({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position} rotation={[0, 0.45, 0]}>
      <mesh position={[0, 2.2, 0]} scale={[1.9, 2.2, 1.7]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.3, 0]} scale={[2.05, 1.25, 1.85]}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.3, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[2.08, 1.88, 1]}>
        <torusGeometry args={[1, 0.12, 8, 40]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.1, 1.62]} scale={[0.5, 0.45, 0.45]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 2.75, 1.45]} scale={[0.42, 0.16, 0.2]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#1c1a18" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 1.35, 1.45]} scale={[0.7, 0.2, 0.25]}>
        <sphereGeometry args={[1, 16, 8]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </group>
  )
}

/** Aztec Sun Stone: concentric calendar rings turning at different rates. */
function SunStone({ position, color, accent }: { position: [number, number, number]; color: string; accent: string }) {
  const rings = useRef<(Group | null)[]>([])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    rings.current.forEach((g, i) => g && (g.rotation.z = t * (i % 2 ? -0.04 : 0.03) * (i + 1)))
  })
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[3.6, 3.6, 0.5, 64]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {[1.2, 2.1, 2.9].map((r, i) => (
        <group key={r} ref={(g) => (rings.current[i] = g)} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[r, 0.07, 6, 64]} />
            <meshStandardMaterial color={accent} roughness={0.6} />
          </mesh>
          {Array.from({ length: 8 + i * 6 }, (_, k) => {
            const a = (k / (8 + i * 6)) * Math.PI * 2
            return (
              <mesh key={k} position={[Math.cos(a) * (r - 0.35), Math.sin(a) * (r - 0.35), 0]} rotation={[0, 0, a]}>
                <boxGeometry args={[0.35, 0.18, 0.12]} />
                <meshStandardMaterial color={accent} roughness={0.6} />
              </mesh>
            )
          })}
        </group>
      ))}
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Step-fret (xicalcoliuhqui) meander band. */
function StepFret({ y, z, width, color }: { y: number; z: number; width: number; color: string }) {
  const n = Math.floor(width / 1.6)
  return (
    <group position={[-(n * 1.6) / 2 + 0.8, y, z]}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[i * 1.6, 0, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[1.2, 0.18, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0.5, 0.05, 0]}>
            <boxGeometry args={[0.18, 0.7, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0.2, 0.35, 0]}>
            <boxGeometry args={[0.6, 0.18, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function MonumentScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const v = movement.visual.variant
  const c = movement.visual.palette.colors
  const colRows = useMemo(() => Array.from({ length: 4 }, (_, i) => -1 - i * 4.4), [])
  return (
    <group>
      <Floor color={v === 'plaques' ? '#2a1d14' : c[3] ?? '#c9a26a'} />

      {v === 'ziggurat' && (
        <>
          <IshtarGate brick={c[0]} relief={pal.hex.accent} />
          <group position={[0, 0, 33.2]} scale={1.6}>
            <Stepped color="#8d5a32" accent={c[1]} temple={false} />
          </group>
          <CylinderSeal movement={movement} clay={c[4] ?? '#e8d3a8'} stone={c[2] ?? '#8d5a32'} />
        </>
      )}

      {v === 'pyramid' && (
        <>
          {colRows.map((z) =>
            [-5.2, -8.4, 5.2, 8.4].map((x) => <Column key={`${x}${z}`} position={[x, 0, z]} height={8} radius={0.75} order="papyrus" color={c[3] ?? '#e9d3a0'} />),
          )}
          <PaintedPlane movement={movement} painter="monument" size={[12, 7]} res={[1024, 512]} position={[-12, 4.5, -8]} rotation={[0, 0.8, 0]} />
          <PaintedPlane movement={movement} painter="monument" seed="b" size={[12, 7]} res={[1024, 512]} position={[12, 4.5, -8]} rotation={[0, -0.8, 0]} />
          <Obelisk position={[-2.6, 0, -18]} color={c[3] ?? '#e9d3a0'} cap={c[0]} />
          <Obelisk position={[2.6, 0, -18]} color={c[3] ?? '#e9d3a0'} cap={c[0]} />
          <group position={[0, 0, 20]}>
            <Pyramid color={c[3] ?? '#e9d3a0'} cap={c[0]} />
          </group>
          <group position={[-14, 0, 24]} scale={0.55}>
            <Pyramid color={c[3] ?? '#e9d3a0'} cap={c[0]} />
          </group>
        </>
      )}

      {v === 'stepped' && (
        <>
          <group position={[0, 0, 18]}>
            <Stepped color={c[3] ?? '#e7dcc0'} accent={c[0]} temple />
          </group>
          <StepFret y={2.4} z={-12.4} width={22} color={c[1]} />
          <StepFret y={6.4} z={-9.4} width={12} color={c[1]} />
          <ColossalHead position={[-8.5, 0, -2]} color="#4a4a44" />
          <SunStone position={[8.5, 5.5, -6]} color={c[3] ?? '#e7dcc0'} accent={c[1]} />
        </>
      )}

      {v === 'plaques' && (
        <group position={[0, 0, -14]}>
          {Array.from({ length: 24 }, (_, i) => (
            <PaintedPlane key={i} movement={movement} painter="monument" seed={`p${i}`} size={[2.2, 2.2]} res={[256, 256]} position={[((i % 8) - 3.5) * 2.5, 3 + Math.floor(i / 8) * 2.5, 0]} />
          ))}
          <Head position={[-4, 2.4, 6]} color={pal.hex.colors[0]} />
          <Head position={[0, 2.8, 5]} color={pal.hex.colors[0]} />
          <Head position={[4, 2.4, 6]} color={pal.hex.colors[0]} />
        </group>
      )}

      {v !== 'plaques' && (
        <mesh position={[0, v === 'pyramid' ? 17 : 16, -34]}>
          <circleGeometry args={[2.4, 64]} />
          <meshBasicMaterial color={pal.hex.accent} toneMapped={false} />
        </mesh>
      )}
      {v === 'pyramid' && <SymbolRows color={pal.hex.accent} count={40} />}
      <Motes count={Math.round(180 * quality)} area={[30, 14, 30]} position={[0, 0, -10]} color={pal.hex.accent} size={0.05} rise={0.05} opacity={0.4} />
    </group>
  )
}
