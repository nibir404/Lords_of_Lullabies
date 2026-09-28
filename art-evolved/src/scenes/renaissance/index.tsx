import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, Color } from 'three'
import type { SceneProps } from '../types'
import { Column, Figure, LightShaft, Motes, Plinth, useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import { PHI } from '@/utils/math'

/** Perspective floor: a checker with orthogonals converging on a single vanishing point. */
function PerspectiveFloor({ a, b, line }: { a: string; b: string; line: string }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        uniforms: { uA: { value: new Color(a) }, uB: { value: new Color(b) }, uL: { value: new Color(line) } },
        vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz - (modelMatrix * vec4(0.0,0.0,0.0,1.0)).xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `
          uniform vec3 uA; uniform vec3 uB; uniform vec3 uL; varying vec3 vW;
          void main(){
            vec2 p = vW.xz / 2.0;
            float c = mod(floor(p.x) + floor(p.y), 2.0);
            vec3 col = mix(uA, uB, c);
            vec2 g = abs(fract(p) - 0.5);
            col = mix(uL, col, smoothstep(0.0, 0.03, min(g.x, g.y)) * 0.4 + 0.6);
            gl_FragColor = vec4(col, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [a, b, line],
  )
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
      <planeGeometry args={[140, 80]} />
    </mesh>
  )
}

function lineGeometry(points: number[]) {
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(points), 3))
  return g
}

/** Construction diagram: nested golden rectangles and their spiral, drawn in space. */
function GoldenDiagram({ color, position, size }: { color: string; position: [number, number, number]; size: number }) {
  const geo = useDisposable(() => {
    const pts: number[] = []
    const rect = (x0: number, y0: number, ww: number, hh: number) =>
      pts.push(x0, y0, 0, x0 + ww, y0, 0, x0 + ww, y0, 0, x0 + ww, y0 + hh, 0, x0 + ww, y0 + hh, 0, x0, y0 + hh, 0, x0, y0 + hh, 0, x0, y0, 0)
    const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
      for (let k = 0; k < 16; k++) {
        const t0 = a0 + ((a1 - a0) * k) / 16
        const t1 = a0 + ((a1 - a0) * (k + 1)) / 16
        pts.push(cx + Math.cos(t0) * r, cy + Math.sin(t0) * r, 0, cx + Math.cos(t1) * r, cy + Math.sin(t1) * r, 0)
      }
    }
    let x = 0, y = 0, w = size * PHI, h = size
    rect(x, y, w, h)
    // Cut squares left, top, right, bottom in turn; each square carries one quarter of the spiral.
    for (let i = 0; i < 9; i++) {
      const d = i % 4
      if (d === 0) {
        const s = h
        rect(x, y, s, s)
        arc(x + s, y, s, Math.PI / 2, Math.PI)
        x += s
        w -= s
      } else if (d === 1) {
        const s = w
        rect(x, y + h - s, s, s)
        arc(x, y + h - s, s, Math.PI / 2, 0)
        h -= s
      } else if (d === 2) {
        const s = h
        rect(x + w - s, y, s, s)
        arc(x + w - s, y + s, s, 0, -Math.PI / 2)
        w -= s
      } else {
        const s = w
        rect(x, y, s, s)
        arc(x, y, s, 0, Math.PI / 2)
        y += s
        h -= s
      }
    }
    return lineGeometry(pts)
  }, [size])
  return (
    <lineSegments geometry={geo} position={position}>
      <lineBasicMaterial color={color} transparent opacity={0.8} />
    </lineSegments>
  )
}

function SquareOutline({ size, color, position }: { size: number; color: string; position: [number, number, number] }) {
  const geo = useDisposable(() => {
    const h = size / 2
    return lineGeometry([-h, -h, 0, h, -h, 0, h, -h, 0, h, h, 0, h, h, 0, -h, h, 0, -h, h, 0, -h, -h, 0])
  }, [size])
  return (
    <lineSegments geometry={geo} position={position}>
      <lineBasicMaterial color={color} transparent opacity={0.5} />
    </lineSegments>
  )
}

function Orthogonals({ color }: { color: string }) {
  const geo = useDisposable(() => {
    const pts: number[] = []
    for (let i = -8; i <= 8; i++) pts.push(i * 2.4, 0.03, 8, 0, 0.03, -60)
    return lineGeometry(pts)
  }, [])
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={0.35} />
    </lineSegments>
  )
}

export default function RenaissanceScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const mannerist = movement.visual.variant === 'mannerism'
  const c = movement.visual.palette.colors
  const bays = useMemo(() => Array.from({ length: 6 }, (_, i) => -2 - i * 4.8), [])
  const pose = mannerist ? { contrapposto: 0.8, twist: 0.9, elongation: 1.35 } : { contrapposto: 0.85 }
  return (
    <group>
      <PerspectiveFloor a={c[0]} b={mannerist ? c[3] : c[1]} line={movement.visual.palette.ink} />
      <Orthogonals color={movement.visual.palette.ink} />
      {bays.map((z, i) => (
        <group key={z}>
          {[-7.5, 7.5].map((x) => (
            <Column key={x} position={[x, 0, z]} height={mannerist ? 9 : 7.5} radius={0.45} order="plain" color={c[0]} />
          ))}
          {i < bays.length - 1 &&
            [-7.5, 7.5].map((x) => (
              <mesh key={x} position={[x, (mannerist ? 9 : 7.5) + 0.6, z - 2.4]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[2.4, 0.3, 10, 32, Math.PI]} />
                <meshStandardMaterial color={c[0]} roughness={0.85} />
              </mesh>
            ))}
        </group>
      ))}
      {[-7.5, 7.5].map((x) => (
        <mesh key={x} position={[x, (mannerist ? 9 : 7.5) + 3.3, -14]}>
          <boxGeometry args={[1.4, 0.8, 26]} />
          <meshStandardMaterial color={c[1]} roughness={0.85} />
        </mesh>
      ))}
      <group position={[0, 0, -30]}>
        <mesh position={[0, 7, 0]}>
          <boxGeometry args={[22, 14, 1]} />
          <meshStandardMaterial color={c[1]} roughness={0.9} />
        </mesh>
        <mesh position={[0, 6, 0.6]}>
          <torusGeometry args={[3.6, 0.5, 12, 48, Math.PI]} />
          <meshStandardMaterial color={c[0]} roughness={0.8} />
        </mesh>
        <mesh position={[0, 3, 0.55]}>
          <planeGeometry args={[7.2, 6]} />
          <meshStandardMaterial color={c[3]} roughness={1} />
        </mesh>
      </group>
      <GoldenDiagram color={pal.hex.accent} position={[-8.1, 1.2, -22]} size={10} />
      <group position={[0, 0, -12]}>
        <mesh position={[0, 5.2, -0.6]}>
          <torusGeometry args={[3.2, 0.04, 8, 96]} />
          <meshBasicMaterial color={movement.visual.palette.ink} transparent opacity={0.55} />
        </mesh>
        <SquareOutline size={5.6} color={movement.visual.palette.ink} position={[0, 4.6, -0.62]} />
      </group>
      {[
        [-4, 0, -4, 0.5],
        [4, 0, -4, -0.5],
        [-4, 0, -16, 0.3],
        [4, 0, -16, -0.3],
      ].map(([x, y, z, r], i) => (
        <group key={i}>
          <Plinth position={[x, y, z]} color={c[1]} />
          <Figure position={[x, 1.2, z]} rotation={r} scale={1.2} color={c[0]} pose={pose} />
        </group>
      ))}
      <Plinth position={[0, 0, -12]} size={[2, 1.4, 2]} color={c[1]} />
      <Figure position={[0, 1.4, -12]} scale={1.45} color={mannerist ? c[1] : '#f4efe6'} pose={{ ...pose, armRaise: 0.15 }} />
      {bays.slice(0, 4).map((z, i) => (
        <LightShaft key={z} position={[i % 2 ? 6 : -6, 6, z - 2.4]} rotation={[0, 0, i % 2 ? 0.45 : -0.45]} radiusTop={0.8} radiusBottom={2.8} height={14} color="#fff2d8" opacity={0.06} />
      ))}
      <Motes count={Math.round(200 * quality)} area={[16, 12, 30]} position={[0, 0, -12]} color="#fff4dc" size={0.05} rise={0.04} opacity={0.45} />
    </group>
  )
}
