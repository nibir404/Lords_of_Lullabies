import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, CylinderGeometry, DodecahedronGeometry, PlaneGeometry, SphereGeometry } from 'three'
import { fbm3, noise3 } from '@/utils/noise'
import type { SceneProps } from '../types'
import { Motes, useCanvasTexture, useDisposable, usePalette, useSeed } from '../shared'
import { painterFor } from '@/art/painters'
import { mulberry32 } from '@/utils/random'
import { FOG_TAIL, sceneShader } from '../glsl'

function roughen<T extends BufferGeometry>(g: T, amount: number, freq: number, radial = false) {
  const p = g.attributes.position as BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const n = fbm3(noise3, x * freq, y * freq, z * freq, 4) * amount
    if (radial) {
      const len = Math.hypot(x, z) || 1
      p.setX(i, x + (x / len) * n)
      p.setZ(i, z + (z / len) * n)
      p.setY(i, y + n * 0.3)
    } else p.setZ(i, z + n)
  }
  g.computeVertexNormals()
  return g
}

function Fire() {
  const mat = useDisposable(
    () =>
      sceneShader({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv; uniform float uTime;
          void main(){
            vUv = uv;
            vec3 p = position;
            p.x += snoise(vec3(p.y * 2.0, uTime * 2.0, 0.0)) * 0.12 * uv.y;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          varying vec2 vUv; uniform float uTime;
          void main(){
            float n = snoise(vec3(vUv * vec2(3.0, 4.0) - vec2(0.0, uTime * 2.4), uTime * 0.5));
            float body = smoothstep(0.5, 0.0, abs(vUv.x - 0.5) * (1.4 + vUv.y * 2.0) + n * 0.12) * smoothstep(1.0, 0.1, vUv.y + n * 0.15);
            vec3 col = mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.85, 0.45), body);
            gl_FragColor = vec4(col * body * 1.6, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [],
  )
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <group position={[-5, 0, 2]}>
      {[0, 1.2, 2.4].map((r) => (
        <mesh key={r} material={mat} rotation={[0, r, 0]} position={[0, 0.9, 0]}>
          <planeGeometry args={[1.4, 2]} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i) * 0.7, 0.12, Math.sin(i) * 0.7]} rotation={[0, i, 0.3]}>
          <boxGeometry args={[0.9, 0.12, 0.12]} />
          <meshStandardMaterial color="#1b120c" roughness={1} />
        </mesh>
      ))}
      <Motes count={90} area={[1.2, 6, 1.2]} color="#ffae5a" size={0.07} rise={1.3} sway={0.3} opacity={0.9} seed={9} />
    </group>
  )
}

function PaintedCave({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const tex = useCanvasTexture((ctx, w, h) => painterFor(movement, 'cave')(ctx, w, h, mulberry32(12), movement.visual.palette), 2048, 512, [movement.id])
  const wall = useDisposable(() => roughen(new CylinderGeometry(15, 15, 16, 160, 40, true, Math.PI * 0.55, Math.PI * 0.9), 1.6, 0.18, true), [])
  const roof = useDisposable(() => {
    const g = new SphereGeometry(16, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2)
    return roughen(g, 2.2, 0.15, true)
  }, [])
  const floor = useDisposable(() => roughen(new PlaneGeometry(40, 40, 80, 80), 0.5, 0.25), [])
  return (
    <group position={[0, 0, -6]}>
      <mesh geometry={wall} position={[0, 7.5, 0]}>
        <meshStandardMaterial map={tex} side={BackSide} roughness={1} />
      </mesh>
      <mesh geometry={roof} position={[0, 14, 0]} scale={[1, 0.45, 1]}>
        <meshStandardMaterial color={pal.bg} side={BackSide} roughness={1} />
      </mesh>
      <mesh geometry={floor} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#2a1d14" roughness={1} />
      </mesh>
      <group position={[0, 0, 6]}>
        <Fire />
      </group>
      <Motes count={Math.round(220 * quality)} area={[24, 12, 20]} color="#e0b27a" size={0.05} rise={0.08} opacity={0.35} />
    </group>
  )
}

function Megaliths({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const rng = useSeed(movement)
  const stone = useDisposable(() => roughen(new DodecahedronGeometry(1, 2), 0.25, 1.4, true), [])
  const stones = useMemo(
    () =>
      Array.from({ length: 13 }, (_, i) => {
        const a = (i / 13) * Math.PI * 2
        return { x: Math.cos(a) * 11, z: Math.sin(a) * 11 - 10, h: 3 + rng() * 2.5, w: 0.9 + rng() * 0.6, r: -a + Math.PI / 2 + (rng() - 0.5) * 0.2, lintel: i % 3 === 0 }
      }),
    [rng],
  )
  const sky = useDisposable(
    () =>
      sceneShader({
        side: BackSide,
        depthWrite: false,
        uniforms: { uTop: { value: pal.colors[0].clone().multiplyScalar(0.6) }, uGlow: { value: pal.accent.clone() } },
        vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `uniform vec3 uTop; uniform vec3 uGlow; varying vec3 vP;
          void main(){ float h = normalize(vP).y; vec3 c = mix(uGlow, uTop, smoothstep(-0.02, 0.35, h)); gl_FragColor = vec4(c, 1.0);
#include <colorspace_fragment>
}`,
      }),
    [pal],
  )
  sky.fog = false
  return (
    <group>
      <mesh material={sky} position={[0, 0, -10]} renderOrder={-1}>
        <sphereGeometry args={[46, 32, 16]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color="#231e1a" roughness={1} />
      </mesh>
      {stones.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation={[0, s.r, 0]}>
          <mesh geometry={stone} position={[0, s.h / 2, 0]} scale={[s.w, s.h / 2, 0.55]}>
            <meshStandardMaterial color={pal.colors[i % 3]} roughness={1} flatShading />
          </mesh>
          {s.lintel && (
            <mesh geometry={stone} position={[1.4, s.h + 0.3, 0]} scale={[2.4, 0.4, 0.5]}>
              <meshStandardMaterial color={pal.colors[1]} roughness={1} flatShading />
            </mesh>
          )}
        </group>
      ))}
      <mesh geometry={stone} position={[0, 0.5, -10]} scale={[2, 0.5, 1.2]}>
        <meshStandardMaterial color={pal.colors[2]} roughness={1} flatShading />
      </mesh>
      <Motes count={Math.round(160 * quality)} area={[40, 10, 40]} position={[0, 0, -10]} color={pal.accent} size={0.06} rise={0.05} opacity={0.4} />
    </group>
  )
}

export default function CaveScene(props: SceneProps) {
  return props.movement.visual.variant === 'megalith' ? <Megaliths {...props} /> : <PaintedCave {...props} />
}
