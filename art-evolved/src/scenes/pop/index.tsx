import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ExtrudeGeometry, Group, Shape } from 'three'
import type { SceneProps } from '../types'
import { useCanvasTexture, useDisposable, usePalette } from '../shared'

function Burst({ position, color, text, scale = 1 }: { position: [number, number, number]; color: string; text: string; scale?: number }) {
  const geo = useDisposable(() => {
    const s = new Shape()
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2
      const r = i % 2 ? 1.5 : 2.6 + (i % 4 === 0 ? 0.4 : 0)
      i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    return new ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false })
  }, [])
  const tex = useCanvasTexture(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#111'
      ctx.font = '900 190px "Inter Tight", Impact, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, w / 2, h / 2)
    },
    512,
    256,
    [text],
  )
  const g = useRef<Group>(null)
  useFrame((st) => {
    if (g.current) g.current.scale.setScalar(scale * (1 + Math.max(0, Math.sin(st.clock.elapsedTime * 2.2)) * 0.06))
  })
  return (
    <group ref={g} position={position}>
      <mesh geometry={geo} position={[0, 0, -0.2]} scale={1.08}>
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0, 0.35]}>
        <planeGeometry args={[4, 2]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
    </group>
  )
}

/** Serial repetition: the same object, silkscreened again and again in shifting colourways. */
function SerialGrid({ colors }: { colors: string[] }) {
  const cells = useMemo(() => {
    const out: { x: number; y: number; bg: string; a: string; b: string }[] = []
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) out.push({ x: (c - 2) * 5, y: 2.6 + r * 4.4, bg: colors[(r + c) % colors.length], a: colors[(r + c + 1) % colors.length], b: colors[(r * 2 + c + 2) % colors.length] })
    return out
  }, [colors])
  return (
    <group position={[0, 0, -16]}>
      {cells.map((cell, i) => (
        <group key={i} position={[cell.x, cell.y, 0]}>
          <mesh>
            <planeGeometry args={[4.8, 4.2]} />
            <meshBasicMaterial color={cell.bg} />
          </mesh>
          <mesh position={[0, -0.2, 0.9]}>
            <cylinderGeometry args={[0.9, 0.9, 2.6, 32]} />
            <meshStandardMaterial color={cell.a} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.3, 0.9]}>
            <cylinderGeometry args={[0.92, 0.92, 0.9, 32]} />
            <meshStandardMaterial color={cell.b} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.15, 0.9]}>
            <cylinderGeometry args={[0.92, 0.92, 0.08, 32]} />
            <meshStandardMaterial color="#d8d8d8" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Stars({ color }: { color: string }) {
  const geo = useDisposable(() => {
    const s = new Shape()
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2
      const r = i % 2 ? 0.4 : 1
      i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    return new ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false })
  }, [])
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    g.current?.children.forEach((c, i) => (c.rotation.y += dt * (0.5 + i * 0.1)))
  })
  return (
    <group ref={g}>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} geometry={geo} position={[-12 + i * 3, 13 + Math.sin(i) * 1.5, -8]} scale={0.7}>
          <meshStandardMaterial color={i % 2 ? color : '#111111'} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

export default function PopScene({ movement }: SceneProps) {
  const pal = usePalette(movement)
  const c = movement.visual.palette.colors
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={c[1]} roughness={1} />
      </mesh>
      <SerialGrid colors={c.slice(0, 4)} />
      <Burst position={[-7.5, 5, -4]} color={c[1]} text="POW!" />
      <Burst position={[8, 7, -7]} color={c[0]} text="WOW" scale={0.8} />
      <Stars color={pal.hex.accent} />
    </group>
  )
}
