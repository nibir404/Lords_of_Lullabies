import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry } from 'three'
import type { SceneProps } from '../types'
import { Motes, useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import { mulberry32, pick } from '@/utils/random'
import { noise3 } from '@/utils/noise'

/**
 * Thousands of camera-facing brush strokes sample a procedural landscape. From afar their colours
 * merge optically; as the camera approaches, strokes shrink relative to their spacing and the
 * image breaks back into individual marks.
 */
export default function ImpressionScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const count = Math.round(22000 * quality)
  const geometry = useDisposable(() => {
    const rng = mulberry32(1874)
    const base = new PlaneGeometry(1, 0.34)
    const g = new InstancedBufferGeometry()
    g.index = base.index
    g.setAttribute('position', base.attributes.position)
    g.setAttribute('uv', base.attributes.uv)
    const off = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const ang = new Float32Array(count)
    const size = new Float32Array(count)
    const kind = new Float32Array(count)
    const c = new Color()
    const P = movement.visual.palette.colors
    const sun = { x: 9, y: 13, z: -40 }
    for (let i = 0; i < count; i++) {
      const r = rng()
      let x = 0, y = 0, z = 0, a = 0, s = 1, k = 0
      if (r < 0.38) {
        x = (rng() - 0.5) * 60
        z = -30 + rng() * 32
        y = 0.05 + rng() * 0.1
        const streak = Math.exp(-((x - sun.x) ** 2) / 10)
        c.set(rng() < streak * 0.8 ? pick(rng, ['#f7c86a', '#f1d79a', '#e08a5b']) : pick(rng, [P[0], P[5], P[4], P[0], '#b8d0e0']))
        a = (rng() - 0.5) * 0.25
        s = 0.9 + rng() * 0.6
        k = 1
      } else if (r < 0.68) {
        const cluster = Math.floor(rng() * 9)
        const cx = -26 + cluster * 6.5 + noise3(cluster, 0, 0) * 3
        const h = 5 + noise3(cluster * 0.7, 3, 0) * 3
        x = cx + (rng() - 0.5) * 7
        y = Math.pow(rng(), 0.8) * h * 1.6 + 0.2
        z = -31 + (rng() - 0.5) * 4
        const shade = y / (h * 1.6)
        c.set(shade > 0.7 && rng() > 0.5 ? pick(rng, [P[1], '#e8c35a']) : shade < 0.25 ? pick(rng, [P[4], '#4d6fa8', P[3]]) : pick(rng, [P[3], '#6fa37a', P[4], '#c9d77a']))
        a = (rng() - 0.5) * 3
        k = 2
      } else if (r < 0.94) {
        x = (rng() - 0.5) * 90
        y = 9 + rng() * 26
        z = -42 - rng() * 6
        const d = Math.hypot(x - sun.x, y - sun.y)
        c.set(d < 2.2 ? '#fff0c0' : d < 6 ? pick(rng, ['#f7c86a', P[1], '#e08a5b']) : pick(rng, [P[0], '#dfe6ea', P[4], '#b8d0e0', P[1]]))
        a = (rng() - 0.5) * 1.2
        s = 1.4 + rng()
        k = 3
      } else {
        x = (rng() - 0.5) * 30
        z = rng() * 8 - 2
        y = 0.1 + rng() * 0.8
        c.set(pick(rng, [P[5], '#d8413a', P[1], '#f4efe6']))
        a = rng() * 3
        s = 0.5
        k = 4
      }
      off.set([x, y, z], i * 3)
      c.offsetHSL((rng() - 0.5) * 0.03, 0, (rng() - 0.5) * 0.08)
      col.set([c.r, c.g, c.b], i * 3)
      ang[i] = a
      size[i] = s * (0.6 + rng() * 0.6)
      kind[i] = k + rng() * 0.99
    }
    g.setAttribute('aOffset', new InstancedBufferAttribute(off, 3))
    g.setAttribute('aColor', new InstancedBufferAttribute(col, 3))
    g.setAttribute('aAngle', new InstancedBufferAttribute(ang, 1))
    g.setAttribute('aSize', new InstancedBufferAttribute(size, 1))
    g.setAttribute('aKind', new InstancedBufferAttribute(kind, 1))
    g.instanceCount = count
    return g
  }, [count, movement.id])

  const material = useDisposable(
    () =>
      sceneShader({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute vec3 aOffset; attribute vec3 aColor; attribute float aAngle; attribute float aSize; attribute float aKind;
          uniform float uTime;
          varying vec3 vColor; varying vec2 vUv; varying float vSeed;
          void main(){
            vUv = uv;
            float seed = fract(aKind);
            vSeed = seed;
            vec3 wp = aOffset;
            float k = floor(aKind);
            if (k < 1.5) wp.y += sin(uTime * 0.8 + wp.x * 0.4 + seed * 6.0) * 0.03;
            if (k > 1.5 && k < 2.5) wp.x += sin(uTime * 0.6 + wp.y * 0.5 + seed * 4.0) * 0.08;
            vec4 mv = modelViewMatrix * vec4(wp, 1.0);
            float dist = -mv.z;
            // Near: strokes shrink relative to spacing, so the painting dissolves into marks.
            float scale = aSize * mix(0.45, 1.25, smoothstep(6.0, 40.0, dist));
            float a = aAngle + sin(uTime * 0.5 + seed * 10.0) * 0.08;
            vec2 q = position.xy * scale;
            q = vec2(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a));
            vec4 mvPosition = mv + vec4(q, 0.0, 0.0);
            gl_Position = projectionMatrix * mvPosition;
            float shimmer = k < 1.5 ? 0.9 + 0.2 * sin(uTime * 2.0 + seed * 30.0) : 1.0;
            vColor = aColor * shimmer;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor; varying vec2 vUv; varying float vSeed;
          void main(){
            vec2 p = vUv - 0.5;
            float body = smoothstep(0.5, 0.36, abs(p.x) + p.y * p.y * 0.6) * smoothstep(0.5, 0.3, abs(p.y));
            float bristle = 0.65 + 0.35 * snoise(vec3(vUv.x * 3.0, vUv.y * 22.0, vSeed * 10.0));
            float a = body * bristle;
            if (a < 0.08) discard;
            gl_FragColor = vec4(vColor * (0.85 + 0.25 * bristle), a);
            ${FOG_TAIL}
          }`,
      }),
    [],
  )
  useFrame((s) => (material.uniforms.uTime.value = s.clock.elapsedTime))
  const floor = useMemo(() => pal.colors[0].clone().multiplyScalar(0.55), [pal])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={floor} roughness={1} />
      </mesh>
      <mesh geometry={geometry} material={material} frustumCulled={false} />
      <Motes count={Math.round(240 * quality)} area={[40, 10, 30]} position={[0, 0, -10]} color="#fff6d8" size={0.08} rise={0.08} sway={1} opacity={0.5} />
    </group>
  )
}
