import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Group, InstancedMesh, Object3D } from 'three'
import type { SceneProps } from '../types'
import { Figure, Motes, PaintedPlane, useDisposable, usePalette, useSeed } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import { createNoise3D } from '@/utils/noise'
import type { Rng } from '@/utils/random'

function Spin({ children, speed = 0.3, axis = [0.3, 1, 0] }: { children: ReactNode; speed?: number; axis?: [number, number, number] }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    if (!g.current) return
    g.current.rotation.x += dt * speed * axis[0]
    g.current.rotation.y += dt * speed * axis[1]
    g.current.rotation.z += dt * speed * axis[2]
  })
  return <group ref={g}>{children}</group>
}

/** Terraced voxel terrain from quantised noise — a landscape built of addressable units. */
function VoxelWorld({ colors, rng }: { colors: string[]; rng: Rng }) {
  const ref = useRef<InstancedMesh>(null)
  const cells = useMemo(() => {
    const noise = createNoise3D(Math.floor(rng() * 1000))
    const out: { x: number; y: number; z: number; c: string }[] = []
    for (let x = -22; x <= 22; x++)
      for (let z = -26; z <= 6; z++) {
        const n = noise(x * 0.07, z * 0.07, 0) * 0.7 + noise(x * 0.2, z * 0.2, 1) * 0.3
        const h = Math.max(0, Math.floor((n + 0.3) * 5))
        for (let y = 0; y <= h; y++) {
          if (y < h - 1) continue
          const c = h === 0 ? colors[9] : h === 1 ? colors[4] : h < 4 ? colors[7] : h < 5 ? colors[8] : colors[10] ?? '#f4f4f4'
          out.push({ x, y, z, c })
        }
        if (h >= 2 && h < 4 && rng() > 0.965) for (let t = 1; t <= 3; t++) out.push({ x, y: h + t, z, c: t === 3 ? colors[6] : '#5a3a22' })
      }
    return out
  }, [colors, rng])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new Object3D()
    const c = new Color()
    cells.forEach((cell, i) => {
      o.position.set(cell.x, cell.y * 0.8 + 0.4, cell.z)
      o.scale.set(1, 0.8, 1)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      m.setColorAt(i, c.set(cell.c))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [cells])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cells.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={1} flatShading />
    </instancedMesh>
  )
}

/** A symmetric sprite generated from random bits, extruded into voxels. */
function Sprite({ colors, rng, position }: { colors: string[]; rng: Rng; position: [number, number, number] }) {
  const bits = useMemo(() => Array.from({ length: 8 }, () => Array.from({ length: 4 }, () => rng() > 0.48)), [rng])
  const g = useRef<Group>(null)
  useFrame((s) => {
    if (g.current) g.current.position.y = position[1] + Math.round(Math.sin(s.clock.elapsedTime * 2) * 2) * 0.25
  })
  return (
    <group ref={g} position={position}>
      {bits.flatMap((row, y) =>
        Array.from({ length: 8 }, (_, x) =>
          row[x < 4 ? x : 7 - x] ? (
            <mesh key={`${x}-${y}`} position={[(x - 3.5) * 0.6, (7 - y) * 0.6, 0]}>
              <boxGeometry args={[0.6, 0.6, 0.6]} />
              <meshStandardMaterial color={y < 3 ? colors[3] : colors[2]} flatShading />
            </mesh>
          ) : null,
        ),
      )}
    </group>
  )
}

function ScreenBars({ position, rotation = [0, 0, 0], colors }: { position: [number, number, number]; rotation?: [number, number, number]; colors: string[] }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        uniforms: { uTime: { value: 0 }, uA: { value: new Color(colors[0]) }, uB: { value: new Color(colors[1]) } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `uniform float uTime; uniform vec3 uA; uniform vec3 uB; varying vec2 vUv;
          void main(){
            float row = floor(vUv.y * 24.0);
            float bar = step(0.5, fract(vUv.x * (2.0 + hash11(row) * 10.0) - uTime * (0.2 + hash11(row + 3.0))));
            vec3 c = mix(uA, uB, bar) * (0.6 + 0.4 * step(0.5, fract(vUv.y * 120.0)));
            gl_FragColor = vec4(c, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [colors.join()],
  )
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <mesh material={mat} position={position} rotation={rotation}>
      <planeGeometry args={[6, 3.6]} />
    </mesh>
  )
}

function CheckerFloor({ a, b }: { a: string; b: string }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        uniforms: { uA: { value: new Color(a) }, uB: { value: new Color(b) } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `uniform vec3 uA; uniform vec3 uB; varying vec2 vUv;
          void main(){ vec2 g = floor(vUv * vec2(70.0, 40.0)); vec3 c = mix(uA, uB, mod(g.x + g.y, 2.0)); gl_FragColor = vec4(c, 1.0); ${FOG_TAIL} }`,
      }),
    [a, b],
  )
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
      <planeGeometry args={[140, 80]} />
    </mesh>
  )
}

export default function DigitalScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const rng = useSeed(movement)
  const v = movement.visual.variant ?? 'pixel'
  const c = movement.visual.palette.colors
  if (v === 'pixel')
    return (
      <group>
        <VoxelWorld colors={c} rng={rng} />
        <Sprite colors={c} rng={rng} position={[0, 7, -2]} />
        <mesh position={[12, 14, -24]}>
          <boxGeometry args={[3, 3, 3]} />
          <meshBasicMaterial color={c[4]} toneMapped={false} />
        </mesh>
      </group>
    )
  if (v === 'ascii')
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
          <planeGeometry args={[140, 80]} />
          <meshStandardMaterial color="#20261f" roughness={1} />
        </mesh>
        <group position={[0, 5, -8]}>
          <Spin speed={0.35}>
            <mesh>
              <torusKnotGeometry args={[3, 0.9, 200, 24, 2, 3]} />
              <meshStandardMaterial color="#e8e8e0" roughness={0.4} />
            </mesh>
          </Spin>
          <Spin speed={0.2} axis={[0, 1, 0]}>
            {Array.from({ length: 6 }, (_, i) => (
              <mesh key={i} position={[Math.cos(i) * 7, Math.sin(i * 2) * 2, Math.sin(i) * 7]}>
                <sphereGeometry args={[0.8, 24, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
            ))}
          </Spin>
        </group>
        <Motes count={Math.round(300 * quality)} area={[30, 14, 20]} position={[0, 0, -8]} color="#ffffff" size={0.15} rise={0.4} opacity={0.9} />
      </group>
    )
  if (v === 'dither')
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
          <planeGeometry args={[140, 80]} />
          <meshStandardMaterial color="#bdb8ad" roughness={1} />
        </mesh>
        <mesh position={[0, 12, -30]}>
          <planeGeometry args={[90, 30]} />
          <meshStandardMaterial color="#e9e6dc" roughness={1} />
        </mesh>
        <group position={[0, 0, -7]}>
          <Figure position={[-3.4, 0, 0]} scale={2.1} rotation={0.4} color="#f4f1ea" pose={{ contrapposto: 0.9 }} />
          <mesh position={[3.4, 3, 0]}>
            <sphereGeometry args={[2.2, 64, 32]} />
            <meshStandardMaterial color="#f4f1ea" roughness={0.35} />
          </mesh>
          <Spin speed={0.25}>
            <mesh position={[0, 6.5, -3]}>
              <torusGeometry args={[2.2, 0.7, 32, 64]} />
              <meshStandardMaterial color="#d8d4ca" roughness={0.3} />
            </mesh>
          </Spin>
          <mesh position={[0, 0.6, 2]}>
            <boxGeometry args={[14, 1.2, 1.2]} />
            <meshStandardMaterial color="#8a867c" roughness={0.8} />
          </mesh>
        </group>
      </group>
    )
  if (v === 'glitch')
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
          <planeGeometry args={[140, 80]} />
          <meshStandardMaterial color="#0d0d12" roughness={0.3} metalness={0.5} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i}>
            <mesh position={[i % 2 ? 7 : -7, 5, -2 - i * 4.5]}>
              <boxGeometry args={[1.2, 10, 1.2]} />
              <meshStandardMaterial color="#1a1a22" metalness={0.6} roughness={0.35} />
            </mesh>
            <ScreenBars position={[i % 2 ? 5.9 : -5.9, 5, -2 - i * 4.5]} rotation={[0, i % 2 ? -Math.PI / 2 : Math.PI / 2, 0]} colors={[c[i % c.length], c[(i + 1) % c.length]]} />
          </group>
        ))}
        <group position={[0, 5, -12]}>
          <Spin speed={0.5}>
            <mesh>
              <icosahedronGeometry args={[3, 0]} />
              <meshStandardMaterial color={c[0]} flatShading metalness={0.4} roughness={0.3} />
            </mesh>
          </Spin>
        </group>
      </group>
    )
  if (v === 'net')
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
          <planeGeometry args={[140, 80]} />
          <meshStandardMaterial color="#9a9a9a" roughness={1} />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <PaintedPlane key={i} movement={movement} painter="net" seed={String(i)} size={[7, 5]} res={[512, 368]} position={[((i % 4) - 1.5) * 6, 3.5 + Math.floor(i / 4) * 5.5, -8 - (i % 3) * 3]} rotation={[0, (i % 3 - 1) * 0.25, 0]} basic />
        ))}
        <Motes count={Math.round(160 * quality)} area={[30, 14, 20]} position={[0, 0, -8]} color={pal.hex.accent} size={0.12} rise={0.2} opacity={0.8} additive={false} />
      </group>
    )
  return (
    <group>
      <CheckerFloor a="#0b0d12" b={c[0]} />
      {[
        [-6, 4, -8, 'icosa'],
        [0, 5, -12, 'knot'],
        [6, 4, -8, 'octa'],
      ].map(([x, y, z, k], i) => (
        <group key={i} position={[x as number, y as number, z as number]}>
          <Spin speed={0.3 + i * 0.1}>
            <mesh>
              {k === 'icosa' ? <icosahedronGeometry args={[2.2, 1]} /> : k === 'knot' ? <torusKnotGeometry args={[2, 0.5, 100, 12]} /> : <octahedronGeometry args={[2.2, 0]} />}
              <meshBasicMaterial color={c[i % c.length]} wireframe />
            </mesh>
          </Spin>
        </group>
      ))}
      {[-3, 3].map((x) => (
        <mesh key={x} position={[x, 1.5, -3]}>
          <sphereGeometry args={[1.5, 48, 32]} />
          <meshNormalMaterial />
        </mesh>
      ))}
    </group>
  )
}
