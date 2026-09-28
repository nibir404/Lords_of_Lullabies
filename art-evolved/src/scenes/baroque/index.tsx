import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, CatmullRomCurve3, Color, CylinderGeometry, DoubleSide, Group, TubeGeometry, Vector3 } from 'three'
import type { SceneProps } from '../types'
import { Motes, useDisposable, usePalette, useSeed } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import type { Rng } from '@/utils/random'

/** Volutes: logarithmic spirals swept into tubes, twisting upward around a central axis. */
function useScrollwork(rng: Rng, count: number, rococo: boolean) {
  return useMemo(() => {
    const out: TubeGeometry[] = []
    for (let k = 0; k < count; k++) {
      const pts: Vector3[] = []
      const phase = (k / count) * Math.PI * 2
      const turns = rococo ? 1.4 : 2.2
      for (let i = 0; i <= 80; i++) {
        const t = i / 80
        const a = phase + t * Math.PI * 2 * turns
        const r = (rococo ? 1.2 : 0.6) + Math.exp(t * 1.4) * (rococo ? 0.7 : 1.1) * (1 - t * 0.4)
        const curl = Math.sin(t * Math.PI * (rococo ? 3 : 5)) * (rococo ? 0.8 : 0.5)
        pts.push(new Vector3(Math.cos(a) * (r + curl), 0.5 + t * (rococo ? 7 : 10) + Math.sin(a * 2) * 0.4, Math.sin(a) * (r + curl)))
      }
      out.push(new TubeGeometry(new CatmullRomCurve3(pts), 160, 0.07 + rng() * (rococo ? 0.07 : 0.11), 8, false))
    }
    return out
  }, [rng, count, rococo])
}

function SolomonicColumn({ position, color }: { position: [number, number, number]; color: string }) {
  const geo = useDisposable(() => {
    const g = new CylinderGeometry(0.55, 0.6, 10, 32, 80)
    const p = g.attributes.position as BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i)
      const a = Math.atan2(p.getZ(i), p.getX(i))
      const r = Math.hypot(p.getX(i), p.getZ(i)) * (1 + 0.22 * Math.sin(a * 2 + y * 2.2))
      p.setX(i, Math.cos(a) * r)
      p.setZ(i, Math.sin(a) * r)
    }
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geo} position={[position[0], position[1] + 5, position[2]]}>
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.28} />
    </mesh>
  )
}

function Drapery({ color, position }: { color: string; position: [number, number, number] }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        side: DoubleSide,
        lights: false,
        uniforms: { uTime: { value: 0 }, uColor: { value: new Color(color) } },
        vertexShader: /* glsl */ `
          uniform float uTime; varying float vFold; varying vec2 vUv;
          void main(){
            vUv = uv;
            vec3 p = position;
            float fold = sin(p.x * 1.6 + sin(p.y * 0.35 + uTime * 0.3) * 1.5) + 0.4 * sin(p.x * 4.1 + uTime * 0.5);
            p.z += fold * (0.6 + (1.0 - uv.y) * 0.8);
            vFold = fold;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; varying float vFold; varying vec2 vUv;
          void main(){
            float shade = 0.25 + 0.75 * smoothstep(-1.4, 1.4, vFold);
            float spot = smoothstep(0.9, 0.1, distance(vUv, vec2(0.5, 0.55)));
            vec3 c = uColor * shade * (0.25 + spot * 1.3);
            gl_FragColor = vec4(c, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [color],
  )
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <mesh material={mat} position={position}>
      <planeGeometry args={[34, 22, 160, 60]} />
    </mesh>
  )
}

/** Rococo shell (rocaille): a fluted fan whose ribs ripple outward. */
function Shell({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ribs = 11
  return (
    <group position={position} scale={scale}>
      {Array.from({ length: ribs }, (_, i) => {
        const a = -Math.PI / 2 + (i / (ribs - 1) - 0.5) * 2.4
        return (
          <mesh key={i} position={[Math.cos(a + Math.PI / 2) * 0.9, Math.sin(a + Math.PI / 2) * 0.9, 0]} rotation={[0, 0, a]}>
            <capsuleGeometry args={[0.16, 1.5, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.3} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function BaroqueScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const rng = useSeed(movement)
  const rococo = movement.visual.variant === 'rococo'
  const c = movement.visual.palette.colors
  const tubes = useScrollwork(rng, rococo ? 10 : 14, rococo)
  useEffect(() => () => tubes.forEach((t) => t.dispose()), [tubes])
  const spin = useRef<Group>(null)
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * (rococo ? 0.12 : 0.18)
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={rococo ? '#e8dcd8' : '#0c0a0a'} roughness={rococo ? 0.6 : 0.35} metalness={rococo ? 0 : 0.3} />
      </mesh>
      <Drapery color={rococo ? c[0] : c[1]} position={[0, 10, -22]} />
      <group ref={spin} position={[0, 0.8, -6]}>
        {tubes.map((g, i) => (
          <mesh key={i} geometry={g}>
            <meshStandardMaterial color={i % 4 === 0 ? (rococo ? c[1] : c[1]) : pal.hex.accent} metalness={rococo ? 0.25 : 0.9} roughness={rococo ? 0.4 : 0.22} />
          </mesh>
        ))}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[2.2, 2.6, 0.8, 48]} />
          <meshStandardMaterial color={rococo ? '#f7f0e8' : '#1a1210'} metalness={0.4} roughness={0.4} />
        </mesh>
      </group>
      {rococo ? (
        <>
          <Shell position={[-8, 8, -12]} color={c[2]} scale={1.4} />
          <Shell position={[8, 8, -12]} color={c[1]} scale={1.4} />
          <Shell position={[0, 14, -18]} color={c[2]} scale={2} />
        </>
      ) : (
        <>
          <SolomonicColumn position={[-8, 0, -10]} color={pal.hex.accent} />
          <SolomonicColumn position={[8, 0, -10]} color={pal.hex.accent} />
          <mesh position={[0, 10.8, -10]}>
            <torusGeometry args={[8, 0.35, 12, 64, Math.PI]} />
            <meshStandardMaterial color={pal.hex.accent} metalness={0.9} roughness={0.25} />
          </mesh>
        </>
      )}
      <Motes count={Math.round((rococo ? 300 : 700) * quality)} area={[20, 16, 20]} position={[0, 0, -6]} color={rococo ? '#fff2e0' : pal.hex.accent} size={rococo ? 0.07 : 0.06} rise={0.25} sway={1.2} opacity={0.8} />
    </group>
  )
}
