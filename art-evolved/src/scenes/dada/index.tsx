import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import type { SceneProps } from '../types'
import { Column, Motes, PaintedPlane, useCanvasTexture, usePalette, useSeed } from '../shared'
import { pick, type Rng } from '@/utils/random'

const FRAGMENTS = ['DADA', 'ART?', 'NON', 'IDEA', 'ANTI', 'ZERO', 'CHANCE', 'OBJET', 'MERZ', '→', 'ø', '!!', 'WHY', 'READY-MADE', 'NOTHING']

function WordPlane({ text, color, bg, position, rotation, size }: { text: string; color: string; bg: string | null; position: [number, number, number]; rotation: number; size: number }) {
  const tex = useCanvasTexture(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      if (bg) {
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, w, h)
      }
      ctx.fillStyle = color
      const fonts = ['900 150px Georgia, serif', '700 150px "Inter Tight", sans-serif', '400 130px "JetBrains Mono", monospace', 'italic 150px "Instrument Serif", serif']
      ctx.font = fonts[text.length % fonts.length]
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillText(text, w / 2, h / 2)
    },
    1024,
    256,
    [text, color, bg],
  )
  return (
    <mesh position={position} rotation={[0, 0, rotation]}>
      <planeGeometry args={[size * 4, size]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

/** Collage by chance: fragments re-shuffle every few seconds, as if drawn from a hat. */
function Collage({ rng, colors, ink }: { rng: Rng; colors: string[]; ink: string }) {
  const items = useMemo(() => Array.from({ length: 18 }, () => ({ text: pick(rng, FRAGMENTS), color: rng() > 0.7 ? colors[1] : ink, bg: rng() > 0.6 ? pick(rng, colors) : null, size: 0.8 + rng() * 2 })), [rng, colors, ink])
  const refs = useRef<(Group | null)[]>([])
  const targets = useMemo(() => items.map(() => ({ x: 0, y: 0, z: 0, r: 0 })), [items])
  const epoch = useRef(-1)
  useFrame((s) => {
    const e = Math.floor(s.clock.elapsedTime / 6)
    if (e !== epoch.current) {
      epoch.current = e
      targets.forEach((t) => {
        t.x = (Math.random() - 0.5) * 22
        t.y = 1.5 + Math.random() * 12
        t.z = -6 - Math.random() * 14
        t.r = (Math.random() - 0.5) * 1.4
      })
    }
    items.forEach((_, i) => {
      const g = refs.current[i]
      const t = targets[i]
      if (!g) return
      g.position.x += (t.x - g.position.x) * 0.04
      g.position.y += (t.y - g.position.y) * 0.04
      g.position.z += (t.z - g.position.z) * 0.04
      g.rotation.z += (t.r - g.rotation.z) * 0.04
    })
  })
  return (
    <group>
      {items.map((it, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <WordPlane text={it.text} color={it.color} bg={it.bg} position={[0, 0, 0]} rotation={0} size={it.size} />
        </group>
      ))}
    </group>
  )
}

function Readymade({ color }: { color: string }) {
  const wheel = useRef<Group>(null)
  useFrame((_, dt) => {
    if (wheel.current) wheel.current.rotation.x += dt * 0.6
  })
  return (
    <group position={[0, 0, -4]}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.12, 32]} />
        <meshStandardMaterial color="#c7b58e" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 0.6, 0.4, Math.sin((i * Math.PI) / 2) * 0.6]}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
          <meshStandardMaterial color="#c7b58e" />
        </mesh>
      ))}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
      </mesh>
      <group ref={wheel} position={[0, 2.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <torusGeometry args={[0.9, 0.07, 10, 48]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 12) * Math.PI]}>
            <cylinderGeometry args={[0.012, 0.012, 1.8, 4]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** One and three: an object, its image, and its definition — the idea is the artwork. */
function Conceptual({ movement }: { movement: SceneProps['movement'] }) {
  const ink = movement.visual.palette.ink
  return (
    <group position={[0, 0, -10]}>
      <mesh position={[0, 7, -0.2]}>
        <planeGeometry args={[30, 14]} />
        <meshStandardMaterial color="#f7f6f2" roughness={1} />
      </mesh>
      <group position={[-7, 0, 1]}>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[1.6, 0.12, 1.6]} />
          <meshStandardMaterial color="#8a7a66" />
        </mesh>
        {[
          [-0.7, -0.7],
          [0.7, -0.7],
          [-0.7, 0.7],
          [0.7, 0.7],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.55, z]}>
            <boxGeometry args={[0.1, 1.1, 0.1]} />
            <meshStandardMaterial color="#8a7a66" />
          </mesh>
        ))}
        <mesh position={[0, 2, -0.75]}>
          <boxGeometry args={[1.6, 1.8, 0.1]} />
          <meshStandardMaterial color="#8a7a66" />
        </mesh>
      </group>
      <mesh position={[0, 5.5, 0]}>
        <planeGeometry args={[5, 6]} />
        <meshBasicMaterial color="#cfcfcf" />
      </mesh>
      <PaintedPlane movement={movement} painter="conceptual" size={[6, 6]} res={[768, 768]} position={[7.5, 5.5, 0]} basic />
      <mesh position={[0, 5.5, 0.01]}>
        <planeGeometry args={[4.2, 5.2]} />
        <meshBasicMaterial color="#e8e8e8" />
      </mesh>
      <mesh position={[0, 4.3, 0.02]} scale={[0.9, 0.9, 1]}>
        <planeGeometry args={[1.6, 2.6]} />
        <meshBasicMaterial color={ink} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

function Postmodern({ colors, rng }: { colors: string[]; rng: Rng }) {
  const squiggles = useMemo(() => Array.from({ length: 10 }, () => ({ p: [(rng() - 0.5) * 20, 2 + rng() * 10, -6 - rng() * 12] as [number, number, number], c: pick(rng, colors), r: rng() * 3 })), [rng, colors])
  return (
    <group>
      <Column position={[-5, 0, -10]} height={8} color={colors[0]} />
      <Column position={[5, 0, -10]} height={8} color={colors[1]} />
      <mesh position={[0, 9.2, -10]}>
        <boxGeometry args={[12, 1, 1.4]} />
        <meshStandardMaterial color={colors[2]} />
      </mesh>
      <mesh position={[0, 11, -10]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[2.4, 2.4, 1]} />
        <meshStandardMaterial color={colors[3]} />
      </mesh>
      {squiggles.map((s, i) => (
        <mesh key={i} position={s.p} rotation={[0, 0, s.r]}>
          <torusGeometry args={[0.8, 0.12, 8, 24, Math.PI * 1.3]} />
          <meshStandardMaterial color={s.c} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 3, -6]}>
        <sphereGeometry args={[1.2, 32, 16]} />
        <meshStandardMaterial color={colors[4] ?? colors[0]} />
      </mesh>
    </group>
  )
}

export default function DadaScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const rng = useSeed(movement)
  const v = movement.visual.variant ?? 'dada'
  const c = movement.visual.palette.colors
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={pal.bg} roughness={1} />
      </mesh>
      {v === 'dada' && (
        <>
          <Collage rng={rng} colors={c} ink={movement.visual.palette.ink} />
          <Readymade color="#b8b8b8" />
          <PaintedPlane movement={movement} painter="dada" size={[14, 9]} res={[1024, 660]} position={[0, 7, -22]} />
        </>
      )}
      {v === 'conceptual' && <Conceptual movement={movement} />}
      {v === 'postmodern' && (
        <>
          <Postmodern colors={c} rng={rng} />
          <Collage rng={rng} colors={c} ink={movement.visual.palette.ink} />
        </>
      )}
      <Motes count={Math.round(60 * quality)} area={[30, 12, 20]} position={[0, 0, -8]} color={movement.visual.palette.ink} size={0.06} rise={0.03} opacity={0.3} additive={false} />
    </group>
  )
}
