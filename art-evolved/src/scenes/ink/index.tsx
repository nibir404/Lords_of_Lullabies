import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Group, LatheGeometry, Vector2 } from 'three'
import type { SceneProps } from '../types'
import { Motes, PaintedPlane, useDisposable, useInkStroke, usePalette, useSeed } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import type { Rng } from '@/utils/random'

/** Ink-wash mountain layer: an fbm ridge with a wash gradient that fades into mist. */
function MountainLayer({ z, x, width, height, color, opacity, seed }: { z: number; x: number; width: number; height: number; color: string; opacity: number; seed: number }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new Color(color) }, uOpacity: { value: opacity }, uSeed: { value: seed } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity; uniform float uSeed; varying vec2 vUv;
          void main(){
            float ridge = 0.35 + 0.45 * (fbm(vec3(vUv.x * 2.2, uSeed, 0.0)) * 0.5 + 0.5) + 0.25 * exp(-pow((vUv.x - 0.3) * 4.0, 2.0));
            float inside = smoothstep(ridge, ridge - 0.015, vUv.y);
            float wash = mix(0.25, 1.0, smoothstep(ridge - 0.45, ridge, vUv.y));
            float tex = 0.8 + 0.2 * snoise(vec3(vUv * vec2(20.0, 60.0), uSeed));
            float a = inside * wash * tex * uOpacity * smoothstep(0.0, 0.25, vUv.y);
            if (a < 0.01) discard;
            gl_FragColor = vec4(uColor, a);
            ${FOG_TAIL}
          }`,
      }),
    [color, opacity, seed],
  )
  return (
    <mesh material={mat} position={[x, height / 2 - 0.5, z]}>
      <planeGeometry args={[width, height]} />
    </mesh>
  )
}

function Bamboo({ x, z, h, lean, color, rng }: { x: number; z: number; h: number; lean: number; color: string; rng: Rng }) {
  const stroke = useInkStroke(color, 0.92, 0.6)
  const segs = Math.floor(h / 1.4)
  const leaves = useMemo(() => Array.from({ length: 7 }, () => ({ y: h * (0.45 + rng() * 0.55), a: (rng() - 0.5) * 1.8, s: 0.8 + rng() * 0.8 })), [h, rng])
  return (
    <group position={[x, 0, z]} rotation={[0, 0, lean]}>
      {Array.from({ length: segs }, (_, i) => (
        <group key={i} position={[0, i * 1.4 + 0.7, 0]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.08, 1.32, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.68, 0]}>
            <torusGeometry args={[0.085, 0.025, 6, 12]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      ))}
      {leaves.map((l, i) => (
        <mesh key={i} material={stroke} position={[l.a > 0 ? 0.55 : -0.55, l.y, 0]} rotation={[0, 0, l.a]} scale={l.s}>
          <planeGeometry args={[1.3, 0.22]} />
        </mesh>
      ))}
    </group>
  )
}

/** Ensō: a single brush circle as a ribbon whose width thins as the brush runs dry. */
function Enso({ color, radius = 3.2, position }: { color: string; radius?: number; position: [number, number, number] }) {
  const geo = useDisposable(() => {
    const seg = 220
    const pos: number[] = []
    const uv: number[] = []
    const idx: number[] = []
    const start = 0.3
    for (let i = 0; i <= seg; i++) {
      const t = i / seg
      const a = start + t * Math.PI * 2 * 0.9
      const w = 0.5 * (1 - t * 0.75) * (0.85 + 0.15 * Math.sin(t * 40))
      for (const side of [-1, 1]) {
        const r = radius + side * w * 0.5
        pos.push(Math.cos(a) * r, Math.sin(a) * r, 0)
        uv.push(t, side > 0 ? 1 : 0)
      }
      if (i < seg) {
        const k = i * 2
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2)
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
    g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
    g.setIndex(idx)
    return g
  }, [radius])
  const mat = useInkStroke(color, 0.95, 0.8)
  return <mesh geometry={geo} material={mat} position={position} />
}

function RakedGarden({ color }: { color: string }) {
  const stones = [
    [-4, -6, 1.1],
    [3, -10, 0.8],
    [-1, -14, 1.4],
  ]
  return (
    <group>
      {stones.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, s * 0.4, 0]} scale={[s, s * 0.7, s * 0.8]}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#4a4640" roughness={1} flatShading />
          </mesh>
          {Array.from({ length: 6 }, (_, r) => (
            <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[s * 1.3 + r * 0.45, s * 1.3 + r * 0.45 + 0.05, 64]} />
              <meshBasicMaterial color={color} transparent opacity={0.35} />
            </mesh>
          ))}
        </group>
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 4 - i * 0.6]}>
          <planeGeometry args={[40, 0.04]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} />
        </mesh>
      ))}
    </group>
  )
}

function Waves({ deep, light, foam }: { deep: string; light: string; foam: string }) {
  const g = useRef<Group>(null)
  const mat = useDisposable(
    () =>
      sceneShader({
        side: DoubleSide,
        uniforms: { uTime: { value: 0 }, uDeep: { value: new Color(deep) }, uLight: { value: new Color(light) }, uFoam: { value: new Color(foam) } },
        vertexShader: /* glsl */ `
          uniform float uTime; varying vec2 vUv; varying float vH;
          void main(){
            vUv = uv;
            vec3 p = position;
            float crest = exp(-pow((uv.x - 0.32) * 3.0, 2.0));
            float h = sin(uv.x * 9.0 - uTime * 0.6 + uv.y * 3.0) * 0.4 + crest * 5.0 * (1.0 - uv.y * 0.6);
            p.z += h;
            p.y += crest * sin(uv.x * 30.0 + uTime) * 0.1;
            vH = h;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uDeep; uniform vec3 uLight; uniform vec3 uFoam; varying vec2 vUv; varying float vH;
          void main(){
            float band = step(0.5, fract(vUv.y * 9.0 + vH * 0.3));
            vec3 c = mix(uDeep, uLight, band * 0.6 + smoothstep(0.0, 5.0, vH) * 0.4);
            c = mix(c, uFoam, smoothstep(3.6, 4.8, vH) * step(0.5, fract(vUv.x * 60.0)));
            gl_FragColor = vec4(c, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [deep, light, foam],
  )
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <group ref={g} position={[0, 0.2, -10]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh material={mat}>
        <planeGeometry args={[46, 26, 200, 60]} />
      </mesh>
    </group>
  )
}

function Vessel({ profile, color, position, scale = 1 }: { profile: [number, number][]; color: string; position: [number, number, number]; scale?: number }) {
  const geo = useDisposable(() => new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), 64), [profile])
  return (
    <mesh geometry={geo} position={position} scale={scale}>
      <meshStandardMaterial color={color} roughness={0.25} metalness={0.05} />
    </mesh>
  )
}

const MOON_JAR: [number, number][] = [[0.01, 0], [0.55, 0.02], [0.9, 0.35], [1.12, 0.95], [1.05, 1.45], [0.7, 1.85], [0.6, 1.95], [0.62, 2.0]]
const MAEBYEONG: [number, number][] = [[0.01, 0], [0.4, 0.02], [0.45, 0.6], [0.75, 1.6], [0.8, 2.0], [0.5, 2.4], [0.2, 2.55], [0.25, 2.7]]

export default function InkScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const rng = useSeed(movement)
  const v = movement.visual.variant ?? 'japanese'
  const ink = movement.visual.palette.ink
  const showMountains = v === 'mountains' || v === 'japanese' || v === 'korean' || v === 'sumie'
  const showBamboo = v === 'sumie' || v === 'japanese'
  const showSun = v === 'japanese' || v === 'ukiyo'
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshBasicMaterial color={pal.bg} />
      </mesh>
      {showMountains &&
        [0, 1, 2, 3].map((i) => (
          <MountainLayer key={i} z={-12 - i * 9} x={(i % 2 ? 4 : -6) + (v === 'mountains' ? 0 : -4)} width={50 + i * 10} height={14 + i * 6} color={ink} opacity={0.75 - i * 0.16} seed={i * 3.1 + 1} />
        ))}
      {showSun && (
        <mesh position={[9, 11, -30]}>
          <circleGeometry args={[3.2, 64]} />
          <meshBasicMaterial color={pal.hex.accent} />
        </mesh>
      )}
      {showBamboo && (
        <group position={[-9, 0, -4]}>
          <Bamboo x={0} z={0} h={13} lean={0.04} color={ink} rng={rng} />
          <Bamboo x={1.5} z={-1.5} h={11} lean={-0.05} color={ink} rng={rng} />
          <Bamboo x={-1.4} z={-3} h={15} lean={0.08} color={ink} rng={rng} />
        </group>
      )}
      {v === 'zen' && (
        <>
          <RakedGarden color={ink} />
          <Enso color={ink} position={[3.5, 6, -9]} radius={3.4} />
        </>
      )}
      {v === 'ukiyo' && <Waves deep={pal.hex.colors[0]} light={pal.hex.colors[1]} foam={pal.hex.colors[2]} />}
      {v === 'calligraphy' && (
        <group>
          <PaintedPlane movement={movement} painter="calligraphy" size={[5, 11]} res={[512, 1100]} position={[-3.5, 6.5, -6]} basic />
          <PaintedPlane movement={movement} painter="calligraphy" seed="2" size={[5, 11]} res={[512, 1100]} position={[3, 6.5, -9]} basic />
          <mesh position={[-3.5, 12.2, -5.95]}>
            <boxGeometry args={[5.6, 0.25, 0.25]} />
            <meshStandardMaterial color="#3a2a20" />
          </mesh>
          <mesh position={[3, 12.2, -8.95]}>
            <boxGeometry args={[5.6, 0.25, 0.25]} />
            <meshStandardMaterial color="#3a2a20" />
          </mesh>
        </group>
      )}
      {v === 'korean' && (
        <group position={[-3, 0, -3]}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[7, 0.2, 2.6]} />
            <meshStandardMaterial color="#5a3f2a" roughness={0.6} />
          </mesh>
          <Vessel profile={MOON_JAR} color="#f3f1ea" position={[-1.6, 0.7, 0]} scale={1.2} />
          <Vessel profile={MAEBYEONG} color={pal.hex.accent} position={[1.8, 0.7, 0]} scale={1.05} />
        </group>
      )}
      <Motes count={Math.round(90 * quality)} area={[30, 12, 20]} position={[0, 0, -6]} color={ink} size={0.09} rise={0.03} sway={0.8} opacity={0.35} additive={false} />
    </group>
  )
}
