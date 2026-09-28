import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ExtrudeGeometry, Group, Shape } from 'three'
import type { SceneProps } from '../types'
import { useCanvasTexture, useDisposable, usePalette, useSeed } from '../shared'
import type { Rng } from '@/utils/random'

/** De Stijl: a 3D grid of black beams; primary planes glide between cells and re-balance. */
function Neoplastic({ colors, ink, rng }: { colors: string[]; ink: string; rng: Rng }) {
  const beams = useMemo(() => {
    const xs = [-9, -4, 1.5, 7]
    const ys = [0, 3.5, 8, 12.5]
    const out: { p: [number, number, number]; s: [number, number, number] }[] = []
    xs.forEach((x) => out.push({ p: [x, 7, -10], s: [0.35, 14, 0.35] }))
    ys.forEach((y) => out.push({ p: [-1, y + 0.5, -10], s: [20, 0.35, 0.35] }))
    xs.slice(1).forEach((x) => out.push({ p: [x, 4, -6 - rng() * 4], s: [0.3, 0.3, 8] }))
    return out
  }, [rng])
  const planes = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        c: i < 4 ? colors[i % 3] : '#f3f1ea',
        w: 2 + rng() * 4,
        h: 2 + rng() * 4,
        base: [-8 + rng() * 14, 1.5 + rng() * 10, -10.2 - rng() * 0.3] as [number, number, number],
        axis: i % 2,
        phase: rng() * 6,
      })),
    [colors, rng],
  )
  const refs = useRef<(Group | null)[]>([])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    planes.forEach((p, i) => {
      const g = refs.current[i]
      if (!g) return
      const step = Math.floor((t + p.phase) / 5)
      const k = Math.sin(step * 1.7 + i) * 2.5
      const target = p.axis ? [p.base[0] + k, p.base[1]] : [p.base[0], p.base[1] + k * 0.6]
      g.position.x += (target[0] - g.position.x) * 0.03
      g.position.y += (target[1] - g.position.y) * 0.03
    })
  })
  return (
    <group>
      {beams.map((b, i) => (
        <mesh key={i} position={b.p}>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color={ink} roughness={0.6} />
        </mesh>
      ))}
      {planes.map((p, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={p.base}>
          <mesh>
            <boxGeometry args={[p.w, p.h, 0.12]} />
            <meshStandardMaterial color={p.c} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Prism({ points, depth, color, position, rotation = [0, 0, 0] }: { points: [number, number][]; depth: number; color: string; position: [number, number, number]; rotation?: [number, number, number] }) {
  const geo = useDisposable(() => {
    const s = new Shape()
    points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)))
    s.closePath()
    return new ExtrudeGeometry(s, { depth, bevelEnabled: false })
  }, [points.flat().join(), depth])
  return (
    <mesh geometry={geo} position={position} rotation={rotation}>
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  )
}

function Typeset({ text, color, position, size = [10, 2.5] }: { text: string; color: string; position: [number, number, number]; size?: [number, number] }) {
  const tex = useCanvasTexture(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = color
      ctx.font = `700 ${h * 0.78}px "Inter Tight", Helvetica, sans-serif`
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 8, h / 2)
    },
    1024,
    256,
    [text, color],
  )
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

function Bauhaus({ colors, ink }: { colors: string[]; ink: string }) {
  const g = useRef<Group>(null)
  useFrame((s) => {
    if (g.current) g.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.15) * 0.25
  })
  return (
    <group ref={g} position={[0, 0, -9]}>
      <mesh position={[-5, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 0.5, 64]} />
        <meshStandardMaterial color={colors[1]} roughness={0.6} />
      </mesh>
      <Prism points={[[-2.5, 0], [2.5, 0], [0, 4.3]]} depth={1.2} color={colors[2]} position={[4.5, 0.01, -0.6]} />
      <mesh position={[1, 1.5, 2]}>
        <boxGeometry args={[3, 3, 3]} />
        <meshStandardMaterial color={colors[0]} roughness={0.6} />
      </mesh>
      <mesh position={[0, 11, -1]}>
        <boxGeometry args={[16, 0.3, 0.3]} />
        <meshStandardMaterial color={ink} />
      </mesh>
      <mesh position={[-8, 5.5, -1]}>
        <boxGeometry args={[0.3, 11, 0.3]} />
        <meshStandardMaterial color={ink} />
      </mesh>
      <Typeset text="form · function" color={ink} position={[3, 12.4, -1]} size={[10, 1.2]} />
    </group>
  )
}

function LatticeTower({ color, accent }: { color: string; accent: string }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.08
  })
  const bars = useMemo(() => {
    const out: { p: [number, number, number]; r: [number, number, number]; l: number }[] = []
    for (let i = 0; i < 64; i++) {
      const t = i / 64
      const a = t * Math.PI * 6
      const r = 4.5 * (1 - t * 0.7)
      out.push({ p: [Math.cos(a) * r, t * 16, Math.sin(a) * r], r: [0.5, -a, 0.35], l: 2.8 * (1 - t * 0.5) })
    }
    return out
  }, [])
  return (
    <group ref={g} position={[6, 0, -12]} rotation={[0, 0, -0.18]}>
      {bars.map((b, i) => (
        <mesh key={i} position={b.p} rotation={b.r}>
          <boxGeometry args={[b.l, 0.12, 0.12]} />
          <meshStandardMaterial color={i % 9 === 0 ? accent : color} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Suprematist({ colors, rng }: { colors: string[]; rng: Rng }) {
  const shapes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        p: [(rng() - 0.5) * 20, 2 + rng() * 12, -6 - rng() * 14] as [number, number, number],
        r: (rng() - 0.5) * 1.2,
        s: i === 0 ? [5, 5] : [0.6 + rng() * 5, 0.3 + rng() * 1.4],
        c: i === 0 ? colors[0] : colors[i % colors.length],
        sp: rng() * 6,
      })),
    [colors, rng],
  )
  const refs = useRef<(Group | null)[]>([])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    shapes.forEach((sh, i) => {
      const g = refs.current[i]
      if (g) {
        g.position.y = sh.p[1] + Math.sin(t * 0.2 + sh.sp) * 0.4
        g.rotation.z = sh.r + Math.sin(t * 0.1 + sh.sp) * 0.05
      }
    })
  })
  return (
    <group>
      {shapes.map((sh, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={sh.p}>
          <mesh>
            <boxGeometry args={[sh.s[0], sh.s[1], 0.08]} />
            <meshStandardMaterial color={sh.c} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function ConstructScene({ movement }: SceneProps) {
  const pal = usePalette(movement)
  const rng = useSeed(movement)
  const v = movement.visual.variant ?? 'destijl'
  const c = movement.visual.palette.colors
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={pal.bg} roughness={1} />
      </mesh>
      {v === 'destijl' && <Neoplastic colors={c} ink={movement.visual.palette.ink} rng={rng} />}
      {v === 'bauhaus' && <Bauhaus colors={c} ink={movement.visual.palette.ink} />}
      {v === 'constructivism' && (
        <group>
          <LatticeTower color={movement.visual.palette.ink} accent={pal.hex.accent} />
          <mesh position={[-4, 6, -10]} rotation={[0, 0, -0.55]}>
            <boxGeometry args={[18, 1.6, 0.3]} />
            <meshStandardMaterial color={pal.hex.accent} roughness={0.7} />
          </mesh>
          <mesh position={[-5, 3.4, -9]} rotation={[0, 0, -0.55]}>
            <boxGeometry args={[12, 0.5, 0.3]} />
            <meshStandardMaterial color={movement.visual.palette.ink} roughness={0.7} />
          </mesh>
          <mesh position={[-7, 10, -12]}>
            <cylinderGeometry args={[2.6, 2.6, 0.3, 64]} />
            <meshStandardMaterial color={movement.visual.palette.ink} roughness={0.7} />
          </mesh>
          <Typeset text="CONSTRUCT" color={pal.hex.accent} position={[-6, 14, -12]} size={[12, 3]} />
        </group>
      )}
      {v === 'suprematism' && <Suprematist colors={c} rng={rng} />}
    </group>
  )
}
