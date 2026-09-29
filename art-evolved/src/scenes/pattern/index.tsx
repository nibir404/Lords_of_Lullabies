import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, Group, InstancedMesh, LatheGeometry, Object3D, RepeatWrapping, Vector2 } from 'three'
import type { SceneProps } from '../types'
import { Motes, PaintedPlane, useCanvasTexture, usePalette } from '../shared'
import { painterFor } from '@/art/painters'
import { mulberry32, hashString } from '@/utils/random'

/** Concentric rings of tiles rotating at different speeds — a kinetic, radially symmetric system. */
function RingSculpture({ colors, count, shape }: { colors: Color[]; count: number; shape: 'tile' | 'petal' | 'dot' | 'star' }) {
  const ref = useRef<InstancedMesh>(null)
  const o = useMemo(() => new Object3D(), [])
  const rings = 7
  const per = Math.floor(count / rings)
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    const t = s.clock.elapsedTime
    let i = 0
    for (let r = 0; r < rings; r++) {
      const R = 1.2 + r * 1.05
      const k = Math.max(6, Math.round(per * (0.4 + r / rings)))
      for (let j = 0; j < k && i < count; j++, i++) {
        const a = (j / k) * Math.PI * 2 + t * (r % 2 ? 0.08 : -0.06) * (1 + r * 0.1)
        o.position.set(Math.cos(a) * R, Math.sin(a) * R, Math.sin(t * 0.5 + r) * 0.2)
        o.rotation.set(0, 0, a + (shape === 'petal' ? Math.PI / 2 : 0))
        const s0 = shape === 'petal' ? [0.22, 0.55, 0.08] : shape === 'dot' ? [0.22, 0.22, 0.22] : shape === 'star' ? [0.4, 0.4, 0.1] : [0.35, 0.35, 0.06]
        o.scale.set(s0[0], s0[1], s0[2])
        o.updateMatrix()
        m.setMatrixAt(i, o.matrix)
        m.setColorAt(i, colors[(r + (j % 2)) % colors.length])
      }
    }
    for (; i < count; i++) {
      o.scale.setScalar(0)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      {shape === 'dot' ? <sphereGeometry args={[1, 12, 8]} /> : shape === 'star' ? <octahedronGeometry args={[1, 0]} /> : <boxGeometry args={[1, 1, 1]} />}
      <meshStandardMaterial metalness={0.35} roughness={0.45} />
    </instancedMesh>
  )
}

function KnotSculpture({ colors }: { colors: Color[] }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.z += dt * 0.05
  })
  return (
    <group ref={g}>
      {[
        [2, 3],
        [3, 5],
        [2, 5],
      ].map(([p, q], i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
          <torusKnotGeometry args={[3.2 - i * 0.4, 0.16, 400, 12, p, q]} />
          <meshStandardMaterial color={colors[i % colors.length]} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function LayeredPlanes({ movement }: { movement: SceneProps['movement'] }) {
  const g = useRef<Group>(null)
  useFrame((s) => {
    if (!g.current) return
    g.current.children.forEach((c, i) => (c.position.z = -i * 1.1 + Math.sin(s.clock.elapsedTime * 0.4 + i) * 0.15))
  })
  const tex = useCanvasTexture((ctx, w, h) => painterFor(movement)(ctx, w, h, mulberry32(hashString(movement.id)), movement.visual.palette), 1024, 768, [movement.id])
  return (
    <group ref={g}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} scale={1 - i * 0.12}>
          <planeGeometry args={[9, 6.75]} />
          <meshStandardMaterial map={tex} transparent opacity={i === 0 ? 1 : 0.55} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** Papunya-style ground painting: concentric waterholes joined by dotted tracks, laid on red earth. */
function drawGroundPainting(ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[]) {
  ctx.fillStyle = '#3a1a10'
  ctx.fillRect(0, 0, w, h)
  const rng = mulberry32(7)
  const sites = [
    [0.25, 0.3],
    [0.72, 0.28],
    [0.5, 0.62],
    [0.2, 0.78],
    [0.8, 0.76],
  ].map(([x, y]) => [x * w, y * h])
  const dot = (x: number, y: number, r: number, c: string) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // background dot field
  for (let i = 0; i < 5200; i++) dot(rng() * w, rng() * h, 2.2, colors[(i % 3) + 1] + '88')
  // tracks between sites
  for (let a = 0; a < sites.length; a++)
    for (let b = a + 1; b < sites.length; b++) {
      if ((a + b) % 2) continue
      const [x0, y0] = sites[a]
      const [x1, y1] = sites[b]
      const n = Math.hypot(x1 - x0, y1 - y0) / 9
      for (let k = 0; k <= n; k++) for (const off of [-7, 7]) dot(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n + off, 3.2, colors[0])
    }
  // concentric circles (waterholes / camps)
  for (const [x, y] of sites)
    for (let r = 10; r < 70; r += 12) {
      const n = Math.round((r * Math.PI * 2) / 9)
      for (let k = 0; k < n; k++) dot(x + Math.cos((k / n) * Math.PI * 2) * r, y + Math.sin((k / n) * Math.PI * 2) * r, 3.4, colors[(r / 12) % 2 ? 0 : 3] ?? '#f4efe6')
    }
}

function DesertNight({ movement }: { movement: SceneProps['movement'] }) {
  const c = movement.visual.palette.colors
  const tex = useCanvasTexture((ctx, w, h) => drawGroundPainting(ctx, w, h, c), 1024, 1024, [movement.id])
  const stars = useMemo(() => {
    const rng = mulberry32(3)
    return Array.from({ length: 220 }, () => [(rng() - 0.5) * 90, 8 + rng() * 30, -40 - rng() * 10] as [number, number, number])
  }, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color="#5a2a18" roughness={1} />
      </mesh>
      {/* the painting is tilted up slightly toward the visitor so it can be read */}
      <mesh rotation={[-Math.PI / 2 + 0.28, 0, 0]} position={[0, 1.2, -5]}>
        <planeGeometry args={[15, 15]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      {stars.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.06 + (i % 5) * 0.03, 6, 4]} />
          <meshBasicMaterial color="#f4efe6" toneMapped={false} />
        </mesh>
      ))}
      {/* a low ridge on the horizon */}
      <mesh position={[8, 0, -34]} scale={[26, 4, 6]}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a1410" roughness={1} />
      </mesh>
    </group>
  )
}

/** Nagara temple tower (shikhara): stacked, tapering, curving courses crowned by an amalaka. */
function Shikhara({ position, color, accent }: { position: [number, number, number]; color: string; accent: string }) {
  const courses = 14
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[10, 3, 10]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {Array.from({ length: courses }, (_, i) => {
        const t = i / courses
        const r = 4.4 * Math.cos(t * Math.PI * 0.46)
        return (
          <mesh key={i} position={[0, 3.4 + i * 0.95, 0]} rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[r * 0.97, r, 0.9, 8]} />
            <meshStandardMaterial color={color} roughness={0.9} flatShading />
          </mesh>
        )
      })}
      <mesh position={[0, 3.4 + courses * 0.95 + 0.3, 0]} scale={[1.4, 0.55, 1.4]}>
        <torusGeometry args={[0.8, 0.45, 12, 24]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.4 + courses * 0.95 + 1.2, 0]}>
        <coneGeometry args={[0.3, 1.2, 12]} />
        <meshStandardMaterial color={accent} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Seated figure in meditation on a lotus pedestal, with a halo. */
function SeatedFigure({ position, color, petal, halo }: { position: [number, number, number]; color: string; petal: string; halo: string }) {
  return (
    <group position={position}>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 1.5, 0.35, Math.sin(a) * 1.5]} rotation={[0.9, -a + Math.PI / 2, 0]} scale={[0.45, 0.8, 0.12]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={petal} roughness={0.6} />
          </mesh>
        )
      })}
      <mesh position={[0, 1.05, 0]} scale={[1.5, 0.55, 1.1]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 2.25, 0]} scale={[0.75, 1.05, 0.55]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 3.55, 0]} scale={[0.42, 0.5, 0.42]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 3.95, 0]}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 3.4, -0.6]}>
        <torusGeometry args={[1.05, 0.06, 8, 48]} />
        <meshStandardMaterial color={halo} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.4, -0.65]}>
        <circleGeometry args={[1.05, 48]} />
        <meshStandardMaterial color={halo} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

/** Hagia Sophia: a ring of windows at the base of the dome, an icon and hanging polycandela. */
function ByzantineInterior({ gold, colors }: { gold: string; colors: Color[] }) {
  return (
    <group>
      {Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 20.4, 1.6, -10 + Math.sin(a) * 20.4]} rotation={[0, -a - Math.PI / 2, 0]}>
            <planeGeometry args={[0.9, 2.2]} />
            <meshBasicMaterial color="#fff2cf" toneMapped={false} side={2} />
          </mesh>
        )
      })}
      <group position={[0, 6.5, -12]}>
        <mesh position={[0, 0, -0.1]}>
          <boxGeometry args={[5.4, 7, 0.2]} />
          <meshStandardMaterial color={gold} metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, 1.6, 0.02]}>
          <circleGeometry args={[1.3, 48]} />
          <meshStandardMaterial color="#f6d77a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.55, 0.05]} scale={[0.62, 0.8, 1]}>
          <circleGeometry args={[1, 32]} />
          <meshStandardMaterial color="#c89a74" roughness={0.6} />
        </mesh>
        <mesh position={[0, -1.4, 0.05]}>
          <planeGeometry args={[2.8, 3.6]} />
          <meshStandardMaterial color={colors[1]?.getStyle() ?? '#1d3f73'} roughness={0.7} />
        </mesh>
        <mesh position={[0.6, -1.4, 0.07]}>
          <planeGeometry args={[1, 3.6]} />
          <meshStandardMaterial color={colors[2]?.getStyle() ?? '#7b2d26'} roughness={0.7} />
        </mesh>
      </group>
      {[-6, 6].map((x) => (
        <group key={x} position={[x, 5, -7]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 6, 4]} />
            <meshBasicMaterial color="#2a2418" />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.05, 6, 32]} />
            <meshStandardMaterial color={gold} metalness={0.8} roughness={0.3} />
          </mesh>
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2
            return (
              <mesh key={k} position={[Math.cos(a) * 1.2, 0.1, Math.sin(a) * 1.2]}>
                <sphereGeometry args={[0.1, 8, 6]} />
                <meshBasicMaterial color="#ffd27a" toneMapped={false} />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

/** A sand mandala laid on the floor: palace square with four gates inside nested circles. */
function SandMandala({ colors }: { colors: Color[] }) {
  const cols = colors.map((c) => c.getStyle())
  return (
    <group position={[0, 0.03, -5]} rotation={[-Math.PI / 2, 0, 0]}>
      {[6, 5.4, 4.8].map((r, i) => (
        <mesh key={r} position={[0, 0, i * 0.002]}>
          <ringGeometry args={[r - 0.45, r, 96]} />
          <meshStandardMaterial color={cols[i % cols.length]} roughness={1} />
        </mesh>
      ))}
      {[4.1, 3.3].map((sq, i) => (
        <mesh key={sq} position={[0, 0, 0.01 + i * 0.002]}>
          <planeGeometry args={[sq * 2 * 0.72, sq * 2 * 0.72]} />
          <meshStandardMaterial color={cols[(i + 2) % cols.length]} roughness={1} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} position={[Math.cos((k * Math.PI) / 2) * 2.9, Math.sin((k * Math.PI) / 2) * 2.9, 0.016]} rotation={[0, 0, (k * Math.PI) / 2]}>
          <planeGeometry args={[0.6, 1.6]} />
          <meshStandardMaterial color={cols[0]} roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[1.6, 64]} />
        <meshStandardMaterial color={cols[1 % cols.length]} roughness={1} />
      </mesh>
      {Array.from({ length: 8 }, (_, k) => (
        <mesh key={k} position={[0, 0, 0.024]} rotation={[0, 0, (k * Math.PI) / 4]}>
          <planeGeometry args={[0.35, 2.6]} />
          <meshStandardMaterial color={cols[3 % cols.length]} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function PrayerFlags({ z, y, span }: { z: number; y: number; span: number }) {
  const flagCols = ['#2f5fb3', '#f4f1ea', '#c8372d', '#2e8a4f', '#e8b52a']
  const n = 22
  return (
    <group position={[0, y, z]}>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1)
        const x = (t - 0.5) * span
        const sag = -Math.sin(t * Math.PI) * 2.2
        return (
          <mesh key={i} position={[x, sag - 0.45, 0]}>
            <planeGeometry args={[0.7, 0.9]} />
            <meshStandardMaterial color={flagCols[i % 5]} side={2} roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Borobudur-style bell stupas on a terrace. */
function BellStupas({ color }: { color: string }) {
  const geo = useMemo(() => {
    const pts = [[0.01, 0], [1.3, 0], [1.3, 0.3], [1.15, 0.5], [1.2, 1.2], [1.0, 1.8], [0.6, 2.2], [0.35, 2.3], [0.3, 2.6], [0.2, 3.1], [0.01, 3.4]].map(([x, y]) => new Vector2(x, y))
    return new LatheGeometry(pts, 40)
  }, [])
  useEffect(() => () => geo.dispose(), [geo])
  const spots = useMemo(() => {
    const out: [number, number, number][] = []
    for (const [r, n, y] of [
      [9, 12, 1.6],
      [6, 8, 3.2],
      [3, 4, 4.8],
    ] as const)
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI + Math.PI
        out.push([Math.cos(a) * r, y, -12 + Math.sin(a) * r * 0.5])
      }
    return out
  }, [])
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * 1.6 + 0.8, -14 + i * 1.2]}>
          <boxGeometry args={[26 - i * 6, 1.6, 12 - i * 2.4]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
      {spots.map((p, i) => (
        <mesh key={i} geometry={geo} position={p} scale={0.9}>
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
      <mesh geometry={geo} position={[0, 6.4, -14]} scale={1.6}>
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Mughal charbagh: four-part garden with water channels leading to an onion-domed pavilion. */
function Charbagh({ marble, water, accent }: { marble: string; water: string; accent: string }) {
  return (
    <group>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, r]} position={[0, 0.04, -8]}>
          <planeGeometry args={[r ? 26 : 1.4, r ? 1.4 : 26]} />
          <meshStandardMaterial color={water} metalness={0.6} roughness={0.15} />
        </mesh>
      ))}
      <group position={[0, 0, -20]}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[12, 6, 8]} />
          <meshStandardMaterial color={marble} roughness={0.5} />
        </mesh>
        <mesh position={[0, 3, 4.02]}>
          <planeGeometry args={[3, 4.6]} />
          <meshStandardMaterial color="#d8d0c2" roughness={0.6} />
        </mesh>
        <mesh position={[0, 8.2, 0]} scale={[1, 1.2, 1]}>
          <sphereGeometry args={[3.4, 40, 24]} />
          <meshStandardMaterial color={marble} roughness={0.45} />
        </mesh>
        <mesh position={[0, 12.4, 0]}>
          <coneGeometry args={[0.35, 2, 16]} />
          <meshStandardMaterial color={accent} metalness={0.8} roughness={0.3} />
        </mesh>
        {[-7.5, 7.5].map((x) => (
          <group key={x} position={[x, 0, 3]}>
            <mesh position={[0, 5, 0]}>
              <cylinderGeometry args={[0.45, 0.55, 10, 16]} />
              <meshStandardMaterial color={marble} roughness={0.5} />
            </mesh>
            <mesh position={[0, 10.4, 0]}>
              <sphereGeometry args={[0.8, 16, 12]} />
              <meshStandardMaterial color={marble} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** Celtic high cross: shaft, arms and the ring around the crossing. */
function HighCross({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2, 1.2, 1.2]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <boxGeometry args={[0.9, 6.4, 0.5]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[3.6, 0.8, 0.5]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <torusGeometry args={[1.25, 0.2, 8, 32]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </group>
  )
}

export default function PatternScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const v = movement.visual.variant ?? 'mosaic'
  const tex = useCanvasTexture((ctx, w, h) => painterFor(movement)(ctx, w, h, mulberry32(hashString(movement.id + 'dome')), movement.visual.palette), 1024, 512, [movement.id])
  const floorTex = useCanvasTexture((ctx, w, h) => painterFor(movement)(ctx, w, h, mulberry32(hashString(movement.id + 'floor')), movement.visual.palette), 1024, 1024, [movement.id])
  useMemo(() => {
    tex.wrapS = RepeatWrapping
    tex.repeat.set(3, 1)
  }, [tex])
  const hex = movement.visual.palette.colors
  // Open-air traditions leave the dome behind.
  const outdoors = v === 'dots' || v === 'mandala' || v === 'batik' || v === 'jali'
  const shape = v === 'girih' ? 'star' : 'tile'
  const count = Math.round(520 * Math.max(0.5, quality))
  return (
    <group>
      {!outdoors && (
        <>
          <mesh position={[0, 0, -10]}>
            <sphereGeometry args={[21, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial map={tex} side={BackSide} roughness={0.7} metalness={v === 'mosaic' ? 0.5 : 0.1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -10]}>
            <circleGeometry args={[21, 96]} />
            <meshStandardMaterial map={floorTex} roughness={0.85} />
          </mesh>
        </>
      )}
      {v === 'dots' && <DesertNight movement={movement} />}
      {v === 'mandala' && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
            <planeGeometry args={[140, 80]} />
            <meshStandardMaterial color="#7a6a58" roughness={1} />
          </mesh>
          {[-18, 4, 20].map((x, i) => (
            <mesh key={x} position={[x, 0, -40]}>
              <coneGeometry args={[12 + i * 2, 16 + (i % 2) * 6, 5]} />
              <meshStandardMaterial color="#e8ecef" roughness={0.8} flatShading />
            </mesh>
          ))}
          <SandMandala colors={pal.colors} />
          <PrayerFlags z={-12} y={12} span={30} />
          <PaintedPlane movement={movement} painter="mandala" seed="thangka-a" size={[3.2, 4.6]} res={[320, 460]} position={[-9, 5, -9]} rotation={[0, 0.5, 0]} />
          <PaintedPlane movement={movement} painter="mandala" seed="thangka-b" size={[3.2, 4.6]} res={[320, 460]} position={[9, 5, -9]} rotation={[0, -0.5, 0]} />
        </>
      )}
      {v === 'batik' && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
            <planeGeometry args={[140, 80]} />
            <meshStandardMaterial color="#3d4a2e" roughness={1} />
          </mesh>
          <BellStupas color="#8d8577" />
          {[-7, 7].map((x, i) => (
            <PaintedPlane key={x} movement={movement} painter="batik" seed={`cloth${i}`} size={[3.4, 6]} res={[340, 600]} position={[x, 3.6, -3]} rotation={[0, x > 0 ? -0.4 : 0.4, 0]} />
          ))}
        </>
      )}
      {v === 'jali' && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
            <planeGeometry args={[140, 80]} />
            <meshStandardMaterial color="#6f7a4c" roughness={1} />
          </mesh>
          <Charbagh marble="#f1ece2" water="#5f8fa8" accent={pal.hex.accent} />
          {[-1, 1].map((sd) => (
            <PaintedPlane key={sd} movement={movement} painter="jali" seed={`jali${sd}`} size={[4.2, 6]} res={[420, 600]} position={[sd * 9, 3.2, -4]} rotation={[0, -sd * 0.55, 0]} />
          ))}
        </>
      )}
      {v === 'lotus' && (
        <>
          <Shikhara position={[0, 0, -20]} color={hex[1] ?? '#b5532a'} accent={pal.hex.accent} />
          <SeatedFigure position={[0, 0, -5]} color={hex[0] ?? '#e8c07a'} petal={hex[2] ?? '#f4efe6'} halo={pal.hex.accent} />
        </>
      )}
      {v === 'mosaic' && <ByzantineInterior gold={pal.hex.accent} colors={pal.colors} />}
      {v === 'knot' && (
        <>
          <group position={[0, 6.5, -8]}>
            <KnotSculpture colors={pal.colors} />
          </group>
          <HighCross position={[-8, 0, -6]} color="#5c5a52" />
          <HighCross position={[8, 0, -6]} color="#5c5a52" />
        </>
      )}
      {v === 'miniature' && (
        <group position={[0, 6.5, -8]}>
          <LayeredPlanes movement={movement} />
        </group>
      )}
      {v === 'girih' && (
        <group position={[0, 6.5, -8]}>
          <RingSculpture colors={[pal.accent, ...pal.colors]} count={count} shape={shape} />
        </group>
      )}
      <Motes count={Math.round(150 * quality)} area={[24, 14, 24]} position={[0, 0, -8]} color={pal.hex.accent} size={0.06} rise={0.06} opacity={0.5} />
    </group>
  )
}
