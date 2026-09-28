import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, Group, Mesh } from 'three'
import type { SceneProps } from '../types'
import { Motes, useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import { world } from '@/state/world'

function Float({ children, amp = 0.4, speed = 0.3, phase = 0, spin = 0 }: { children: ReactNode; amp?: number; speed?: number; phase?: number; spin?: number }) {
  const g = useRef<Group>(null)
  useFrame((s) => {
    if (!g.current) return
    const t = s.clock.elapsedTime
    g.current.position.y = Math.sin(t * speed + phase) * amp
    g.current.rotation.y += spin * 0.005
    g.current.rotation.z = Math.sin(t * speed * 0.7 + phase) * 0.05
  })
  return <group ref={g}>{children}</group>
}

/** A giant eye whose iris follows the visitor, blinking at irregular dream-intervals. */
function Eye({ position, iris }: { position: [number, number, number]; iris: string }) {
  const pupil = useRef<Group>(null)
  const lid = useRef<Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (pupil.current) {
      pupil.current.rotation.y += (world.pointer.x * 0.5 - pupil.current.rotation.y) * 0.05
      pupil.current.rotation.x += (-world.pointer.y * 0.35 - pupil.current.rotation.x) * 0.05
    }
    if (lid.current) {
      const blink = Math.pow(Math.max(0, Math.sin(t * 0.7) * Math.sin(t * 0.23)), 40)
      lid.current.scale.y = 0.05 + blink * 0.95
    }
  })
  return (
    <group position={position}>
      <group ref={pupil}>
        <mesh>
          <sphereGeometry args={[2.4, 48, 32]} />
          <meshStandardMaterial color="#f4efe6" roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 2.28]}>
          <circleGeometry args={[1, 48]} />
          <meshStandardMaterial color={iris} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 2.3]}>
          <circleGeometry args={[0.42, 32]} />
          <meshBasicMaterial color="#0c0a0e" />
        </mesh>
      </group>
      <mesh ref={lid} position={[0, 0, 0.1]}>
        <sphereGeometry args={[2.5, 48, 32]} />
        <meshStandardMaterial color="#c9876a" roughness={0.6} />
      </mesh>
    </group>
  )
}

/** A slab softening over a ledge: vertices beyond the edge droop and drip. */
function Melting({ color, position }: { color: string; position: [number, number, number] }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        uniforms: { uTime: { value: 0 }, uColor: { value: new Color(color) } },
        vertexShader: /* glsl */ `
          uniform float uTime; varying float vShade;
          void main(){
            vec3 p = position;
            float over = max(0.0, p.x - 0.5);
            float drip = over * over * (1.4 + 0.3 * sin(uTime * 0.4)) + over * (0.6 + 0.4 * snoise(vec3(p.z * 2.0, uTime * 0.1, 0.0)));
            p.y -= drip;
            p.x -= over * over * 0.25;
            vShade = 1.0 - over * 0.2;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `uniform vec3 uColor; varying float vShade; void main(){ gl_FragColor = vec4(uColor * vShade, 1.0); ${FOG_TAIL} }`,
      }),
    [color],
  )
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <group position={position}>
      <mesh position={[-1, -1.2, 0]}>
        <boxGeometry args={[3, 2.4, 2.4]} />
        <meshStandardMaterial color="#8a5a3a" roughness={0.9} />
      </mesh>
      <mesh material={mat}>
        <boxGeometry args={[4, 0.12, 2, 60, 1, 20]} />
      </mesh>
    </group>
  )
}

function Doorway({ position, rotation = 0, inner }: { position: [number, number, number]; rotation?: number; inner: string }) {
  const sky = useDisposable(
    () =>
      sceneShader({
        uniforms: { uTime: { value: 0 }, uC: { value: new Color(inner) } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition; }`,
        fragmentShader: /* glsl */ `uniform float uTime; uniform vec3 uC; varying vec2 vUv;
          void main(){ float n = fbm(vec3(vUv * 3.0, uTime * 0.05)); vec3 c = mix(uC, vec3(1.0), smoothstep(0.1, 0.6, n) * 0.7); gl_FragColor = vec4(c, 1.0);
#include <colorspace_fragment>
}`,
      }),
    [inner],
  )
  sky.fog = false
  useFrame((s) => (sky.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh material={sky} position={[0, 2.5, 0]}>
        <planeGeometry args={[2.2, 5]} />
      </mesh>
      {[
        [-1.2, 2.5, 0.2, 5.2],
        [1.2, 2.5, 0.2, 5.2],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <boxGeometry args={[w, h, 0.3]} />
          <meshStandardMaterial color="#efe6d6" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 5.1, 0]}>
        <boxGeometry args={[2.6, 0.2, 0.3]} />
        <meshStandardMaterial color="#efe6d6" roughness={0.8} />
      </mesh>
      <mesh position={[1.9, 2.5, 0.8]} rotation={[0, -1.1, 0]}>
        <boxGeometry args={[2.2, 5, 0.12]} />
        <meshStandardMaterial color="#6d8fc4" roughness={0.6} />
      </mesh>
    </group>
  )
}

function Stairs({ color }: { color: string }) {
  const steps = useMemo(() => Array.from({ length: 22 }, (_, i) => i), [])
  return (
    <group position={[-9, 1, -16]}>
      {steps.map((i) => {
        const a = i * 0.32
        return (
          <mesh key={i} position={[Math.cos(a) * 2.6, i * 0.42, Math.sin(a) * 2.6]} rotation={[0, -a, 0]}>
            <boxGeometry args={[2, 0.2, 0.8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function SurrealScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const c = movement.visual.palette.colors
  const sky = useDisposable(
    () =>
      sceneShader({
        side: BackSide,
        depthWrite: false,
        uniforms: { uA: { value: new Color(c[2]) }, uB: { value: new Color(c[1]) }, uC: { value: new Color(c[0]) } },
        vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition; }`,
        fragmentShader: /* glsl */ `uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; varying vec3 vP;
          void main(){ float h = normalize(vP).y; vec3 col = mix(uC, uB, smoothstep(-0.05, 0.12, h)); col = mix(col, uA, smoothstep(0.12, 0.6, h)); gl_FragColor = vec4(col, 1.0);
#include <colorspace_fragment>
}`,
      }),
    [c.join()],
  )
  sky.fog = false
  return (
    <group>
      <mesh material={sky} position={[0, 0, -10]} renderOrder={-1}>
        <sphereGeometry args={[44, 32, 16]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={c[0]} roughness={1} />
      </mesh>
      {[-10, -3, 5, 12].map((x, i) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, -0.5]} position={[x + 5, 0.02, -8 - i * 3]}>
          <planeGeometry args={[18, 1.2]} />
          <meshBasicMaterial color={c[3]} transparent opacity={0.35} />
        </mesh>
      ))}
      <Float amp={0.5} speed={0.25}>
        <Eye position={[4, 9, -14]} iris={pal.hex.accent} />
      </Float>
      <Melting color={c[1]} position={[-4, 2.4, -4]} />
      <Doorway position={[9, 0, -8]} rotation={-0.4} inner={c[2]} />
      <Float amp={1} speed={0.2} phase={2} spin={1}>
        <group position={[-8, 8, -10]} rotation={[0.3, 0, 0.2]}>
          <Doorway position={[0, 0, 0]} inner={pal.hex.accent} />
        </group>
      </Float>
      <Stairs color="#efe6d6" />
      <Float amp={0.6} speed={0.35} phase={1}>
        <group position={[1, 5, -6]}>
          <mesh>
            <sphereGeometry args={[1.1, 32, 24]} />
            <meshStandardMaterial color="#b3261e" roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.06, 0.08, 0.6, 8]} />
            <meshStandardMaterial color="#3a2a1a" />
          </mesh>
        </group>
      </Float>
      <Float amp={0.8} speed={0.18} phase={4} spin={0.6}>
        <group position={[12, 11, -20]}>
          <mesh scale={[2.4, 1.2, 1.8]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#8d7a6a" roughness={1} flatShading />
          </mesh>
          <mesh position={[0, 2, 0]}>
            <coneGeometry args={[0.9, 2.4, 8]} />
            <meshStandardMaterial color="#3e6a4a" roughness={0.9} />
          </mesh>
        </group>
      </Float>
      <mesh position={[-2, 0.6, 6]} scale={0.3}>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#efe6d6" />
      </mesh>
      <Motes count={Math.round(90 * quality)} area={[40, 16, 30]} position={[0, 0, -10]} color="#fff3e0" size={0.08} rise={0.03} opacity={0.4} />
    </group>
  )
}
