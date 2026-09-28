import { useFrame } from '@react-three/fiber'
import { Color } from 'three'
import type { SceneProps } from '../types'
import { Figure, Motes, useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'

/** Terrain displaced on the GPU by ridged fbm; the same function colours rock, grass and snow. */
function Terrain({ low, high, calm }: { low: string; high: string; calm: boolean }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        uniforms: { uLow: { value: new Color(low) }, uHigh: { value: new Color(high) }, uCalm: { value: calm ? 1 : 0 }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          uniform float uCalm; varying float vH; varying vec2 vXZ;
          float ridged(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * (1.0 - abs(snoise(p))); p *= 2.1; a *= 0.5; } return s; }
          void main(){
            vec3 p = position;
            float far = smoothstep(-2.0, 30.0, p.y);
            float h = uCalm > 0.5 ? (snoise(vec3(p.xy * 0.03, 1.0)) * 1.4 + snoise(vec3(p.xy * 0.1, 2.0)) * 0.3) : pow(ridged(vec3(p.xy * 0.035, 0.0)), 2.2) * 26.0 * far;
            p.z += h;
            vH = h; vXZ = p.xy;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uLow; uniform vec3 uHigh; uniform float uCalm; varying float vH; varying vec2 vXZ;
          void main(){
            float t = uCalm > 0.5 ? 0.3 + 0.2 * step(0.5, fract(vXZ.x * 0.6 + snoise(vec3(vXZ * 0.05, 3.0)) * 0.8)) : smoothstep(0.0, 18.0, vH);
            vec3 c = mix(uLow, uHigh, t);
            if (uCalm < 0.5) c = mix(c, vec3(0.92), smoothstep(14.0, 18.0, vH));
            gl_FragColor = vec4(c, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [low, high, calm],
  )
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}>
      <planeGeometry args={[150, 76, 220, 120]} />
    </mesh>
  )
}

function Sky({ top, glow, storm }: { top: string; glow: string; storm: boolean }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uTop: { value: new Color(top) }, uGlow: { value: new Color(glow) }, uStorm: { value: storm ? 1 : 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uTop; uniform vec3 uGlow; uniform float uStorm; varying vec2 vUv;
          void main(){
            float n = fbm(vec3(vUv * vec2(3.0, 1.6), uTime * 0.03));
            float clouds = smoothstep(-0.1, 0.5, n + (vUv.y - 0.5) * 0.4);
            vec3 c = mix(uGlow, uTop, smoothstep(0.1, 0.9, vUv.y));
            c = mix(c, uTop * 0.55, clouds * (0.6 + uStorm * 0.3));
            float sun = smoothstep(0.35, 0.0, distance(vUv, vec2(0.68, 0.32)));
            c += uGlow * sun * 0.8 * (1.0 - clouds * 0.7);
            float flash = uStorm * step(0.985, fract(sin(floor(uTime * 3.0) * 12.9898) * 43758.5)) * smoothstep(0.7, 0.2, distance(vUv, vec2(0.3, 0.7)));
            c += vec3(0.9, 0.92, 1.0) * flash * 0.8;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [top, glow, storm],
  )
  mat.fog = false
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <mesh material={mat} position={[0, 18, -46]} renderOrder={-1}>
      <planeGeometry args={[150, 52]} />
    </mesh>
  )
}

export default function SublimeScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const storm = movement.visual.variant !== 'fields'
  const c = movement.visual.palette.colors
  return (
    <group>
      <Sky top={c[storm ? 0 : 3] ?? '#46505c'} glow={pal.hex.accent} storm={storm} />
      <Terrain low={storm ? '#1e242b' : c[0]} high={storm ? c[1] : c[1]} calm={!storm} />
      <group position={[2, 0, -4]}>
        <mesh position={[0, 0.8, 0]} scale={[3.6, 1.6, 2.4]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#15181c" roughness={1} flatShading />
        </mesh>
        <Figure position={[0.2, 2.1, 0]} rotation={Math.PI} scale={0.42} color="#0e1013" roughness={1} pose={{ contrapposto: 0.2, lean: storm ? 0 : 0.3 }} />
      </group>
      {!storm &&
        [-12, -6, 8, 14].map((x, i) => (
          <group key={x} position={[x, 0, -14 - i * 3]}>
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[1.2, 1.4, 2.2, 16]} />
              <meshStandardMaterial color={pal.hex.accent} roughness={1} />
            </mesh>
            <mesh position={[0, 2.8, 0]}>
              <coneGeometry args={[1.25, 1.4, 16]} />
              <meshStandardMaterial color={pal.hex.accent} roughness={1} />
            </mesh>
          </group>
        ))}
      {storm && <Motes count={Math.round(900 * quality)} area={[40, 26, 30]} position={[0, 0, -8]} color="#c8d0da" size={0.05} rise={-7} sway={0.1} opacity={0.4} additive={false} />}
      <Motes count={Math.round(120 * quality)} area={[60, 8, 40]} position={[0, 0, -20]} color="#e8e2d6" size={0.35} rise={0.02} sway={2} opacity={0.08} />
    </group>
  )
}
