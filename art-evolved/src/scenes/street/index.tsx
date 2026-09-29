import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ExtrudeGeometry, type Group, Shape } from 'three'
import type { SceneProps } from '../types'
import { Figure, Motes, PaintedPlane, useCanvasTexture, useDisposable, usePalette } from '../shared'

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

/** A 1970s New York subway car wearing a whole-car piece, rolling slowly through the station. */
function SubwayCar({ movement }: { movement: SceneProps['movement'] }) {
  const ref = useRef<Group>(null)
  useFrame((st) => {
    if (ref.current) ref.current.position.x = ((st.clock.elapsedTime * 1.2) % 19.2) - 9.6
  })
  return (
    <group position={[0, 0, -8]} scale={1.15}>
      {[-0.75, 0.75].map((z) => (
        <mesh key={z} position={[0, 0.08, z]}>
          <boxGeometry args={[80, 0.16, 0.18]} />
          <meshStandardMaterial color="#6b6b70" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      {/* three coupled cars, looping seamlessly so a painted car always fills the platform */}
      <group ref={ref}>
        {[-19.2, 0, 19.2].map((cx, car) => (
          <group key={cx} position={[cx, 0, 0]}>
            <mesh position={[0, 2.5, 0]}>
              <boxGeometry args={[18.6, 3.8, 3]} />
              <meshStandardMaterial color="#9ea2a8" metalness={0.7} roughness={0.35} />
            </mesh>
            <PaintedPlane movement={movement} painter="street" seed={`car${car}`} size={[18.2, 2.5]} res={[1536, 220]} position={[0, 2.05, 1.52]} basic />
            {Array.from({ length: 8 }, (_, i) => (
              <mesh key={i} position={[-7.7 + i * 2.2, 3.7, 1.53]}>
                <planeGeometry args={[1.3, 0.8]} />
                <meshBasicMaterial color="#fff1c2" toneMapped={false} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {/* platform pillars with tags */}
      {[-10, -3.5, 3.5, 10].map((x, i) => (
        <group key={x} position={[x, 0, 3.5]}>
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[0.6, 8, 0.6]} />
            <meshStandardMaterial color="#1f1f22" roughness={0.9} />
          </mesh>
          <PaintedPlane movement={movement} painter="street" seed={`tag${i}`} size={[0.6, 1.4]} res={[96, 224]} position={[0, 2.2, 0.31]} />
        </group>
      ))}
    </group>
  )
}

function drawBricks(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#6d3a2c'
  ctx.fillRect(0, 0, w, h)
  const bw = 64
  const bh = 24
  for (let y = 0, r = 0; y < h; y += bh, r++)
    for (let x = r % 2 ? -bw / 2 : 0; x < w; x += bw) {
      const shade = 0.85 + ((x * 13 + y * 7) % 17) / 60
      ctx.fillStyle = `rgb(${Math.round(128 * shade)},${Math.round(66 * shade)},${Math.round(50 * shade)})`
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4)
    }
}

/** Keith Haring-style chalk figures on a black subway advertising panel. */
function drawChalk(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0d0d0d'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#f5f3ec'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const fig = (cx: number, cy: number, s: number, arms: number) => {
    ctx.beginPath()
    ctx.arc(cx, cy - 70 * s, 22 * s, 0, Math.PI * 2)
    ctx.moveTo(cx, cy - 48 * s)
    ctx.quadraticCurveTo(cx + 6 * s, cy, cx, cy + 20 * s)
    ctx.moveTo(cx, cy + 20 * s)
    ctx.lineTo(cx - 30 * s, cy + 70 * s)
    ctx.moveTo(cx, cy + 20 * s)
    ctx.lineTo(cx + 34 * s, cy + 66 * s)
    ctx.moveTo(cx, cy - 30 * s)
    ctx.lineTo(cx - 44 * s, cy - 30 * s - arms * 40 * s)
    ctx.moveTo(cx, cy - 30 * s)
    ctx.lineTo(cx + 44 * s, cy - 30 * s - arms * 40 * s)
    ctx.stroke()
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k - 2.5) * 0.35
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * 34 * s, cy - 70 * s + Math.sin(a) * 34 * s)
      ctx.lineTo(cx + Math.cos(a) * 50 * s, cy - 70 * s + Math.sin(a) * 50 * s)
      ctx.stroke()
    }
  }
  fig(w * 0.28, h * 0.55, 1.3, 1)
  fig(w * 0.52, h * 0.58, 1.1, -0.2)
  fig(w * 0.76, h * 0.55, 1.3, 1)
  ctx.strokeRect(10, 10, w - 20, h - 20)
}

function StreetWall({ movement, accent }: { movement: SceneProps['movement']; accent: string }) {
  const bricks = useCanvasTexture(drawBricks, 1024, 512)
  const chalk = useCanvasTexture(drawChalk, 768, 512)
  return (
    <group position={[0, 0, -12]}>
      <mesh position={[0, 5, 0]}>
        <planeGeometry args={[32, 10]} />
        <meshStandardMaterial map={bricks} roughness={0.95} />
      </mesh>
      <Stencil position={[-9, 4.6, 0.05]} color={accent} />
      <Stencil position={[-5.5, 3.9, 0.05]} color="#111111" />
      {/* paste-up poster */}
      <mesh position={[-0.5, 5.4, 0.04]}>
        <planeGeometry args={[3.4, 4.6]} />
        <meshBasicMaterial color="#f1ece0" />
      </mesh>
      <PaintedPlane movement={movement} painter="stencil" seed="poster" size={[3, 3.6]} res={[300, 360]} position={[-0.5, 5.7, 0.06]} basic />
      <mesh position={[-0.5, 3.55, 0.06]}>
        <planeGeometry args={[3, 0.7]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh position={[7.5, 4.8, 0.05]}>
        <planeGeometry args={[7.2, 4.8]} />
        <meshBasicMaterial map={chalk} />
      </mesh>
      {[-3, -2.4, 2.6].map((x, i) => (
        <group key={x} position={[x, 0.45, 2.5 + i * 0.4]} rotation={[0, 0, i === 1 ? Math.PI / 2 : 0]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.9, 16]} />
            <meshStandardMaterial color={i === 2 ? accent : '#d8d8d8'} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Neo-Expressionist studio: giant raw canvases, an upside-down figure (after Baselitz), paint cans. */
function Studio({ movement, colors }: { movement: SceneProps['movement']; colors: string[] }) {
  return (
    <group position={[0, 0, -12]}>
      <mesh position={[0, 6, -2]}>
        <planeGeometry args={[40, 14]} />
        <meshStandardMaterial color="#d9cfbd" roughness={1} />
      </mesh>
      {[
        { x: -8.5, w: 7, h: 9, r: 0.35, p: 'crown' },
        { x: 0, w: 8, h: 10.5, r: 0, p: 'jagged' },
        { x: 8.5, w: 7, h: 9, r: -0.35, p: 'crown' },
      ].map((c, i) => (
        <group key={i} position={[c.x, c.h / 2 + 0.1, 0]} rotation={[-0.06, c.r, 0]}>
          <mesh position={[0, 0, -0.08]}>
            <boxGeometry args={[c.w + 0.3, c.h + 0.3, 0.15]} />
            <meshStandardMaterial color="#3a2e22" roughness={0.9} />
          </mesh>
          <PaintedPlane movement={movement} painter={c.p} seed={`canvas${i}`} size={[c.w, c.h]} res={[640, 820]} position={[0, 0, 0]} />
        </group>
      ))}
      <group position={[0, 5.2, 0.2]} rotation={[0, 0, Math.PI]}>
        <Figure scale={1.6} color={colors[2]} roughness={0.9} pose={{ contrapposto: 0.3, armRaise: 0.5 }} position={[0, -1.4, 0]} />
      </group>
      {[
        [-3, colors[1]],
        [-2.2, colors[2]],
        [3.4, colors[3]],
      ].map(([x, col], i) => (
        <group key={i} position={[x as number, 0.4, 4 + i * 0.3]}>
          <mesh>
            <cylinderGeometry args={[0.38, 0.34, 0.8, 20]} />
            <meshStandardMaterial color="#b9b6ad" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.36, 20]} />
            <meshStandardMaterial color={col as string} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[((i * 37) % 22) - 11, 0.02, 1 + ((i * 17) % 7)]}>
          <circleGeometry args={[0.2 + ((i * 7) % 5) * 0.12, 16]} />
          <meshBasicMaterial color={colors[1 + (i % 3)]} />
        </mesh>
      ))}
    </group>
  )
}

export default function StreetScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const v = movement.visual.variant ?? 'graffiti'
  const colors = movement.visual.palette.colors
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={v === 'neo' ? '#8a7f6d' : '#1d1d20'} roughness={0.95} />
      </mesh>
      {v === 'graffiti' && <SubwayCar movement={movement} />}
      {v === 'stencil' && <StreetWall movement={movement} accent={pal.hex.accent} />}
      {v === 'neo' && <Studio movement={movement} colors={colors} />}
      {v !== 'neo' && (
        <group position={[11, 0, -4]}>
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
      )}
      <Motes count={Math.round(200 * quality)} area={[30, 10, 10]} position={[0, 0, -9]} color={pal.hex.colors[0]} size={0.06} rise={0.05} sway={0.8} opacity={0.35} />
    </group>
  )
}
