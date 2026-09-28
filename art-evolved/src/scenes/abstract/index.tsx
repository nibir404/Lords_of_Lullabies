import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, BufferAttribute, BufferGeometry, Color, InstancedBufferAttribute, InstancedBufferGeometry, SphereGeometry, TorusGeometry } from 'three'
import type { SceneProps } from '../types'
import { useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import { useStore } from '@/state/store'
import { mulberry32 } from '@/utils/random'

const HUE_GLSL = /* glsl */ `
vec3 hueShift(vec3 c, float h){
  const vec3 k = vec3(0.57735);
  float a = h * 6.2831;
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}
`

function instanced(base: BufferGeometry, count: number, seed: number) {
  const rng = mulberry32(seed)
  const g = new InstancedBufferGeometry()
  g.index = base.index
  g.setAttribute('position', base.attributes.position)
  g.setAttribute('normal', base.attributes.normal)
  const pos = new Float32Array(count * 3)
  const s = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const th = rng() * Math.PI * 2
    const r = Math.sqrt(rng()) * 13
    pos.set([Math.cos(th) * r, 1 + rng() * 13, -8 + Math.sin(th) * r * 0.8], i * 3)
    s[i] = rng()
  }
  g.setAttribute('aBase', new InstancedBufferAttribute(pos, 3))
  g.setAttribute('aSeed', new InstancedBufferAttribute(s, 1))
  g.instanceCount = count
  return g
}

/**
 * Pure form with no subject. Every parameter — form, density, chaos, colour, movement, scale —
 * is a uniform, so the whole field responds in real time on the GPU.
 */
function FormField({ kind, count, colors, index }: { kind: 'sphere' | 'box' | 'torus'; count: number; colors: Color[]; index: number }) {
  const geometry = useDisposable(() => {
    const base = kind === 'sphere' ? new SphereGeometry(0.5, 14, 10) : kind === 'box' ? new BoxGeometry(0.8, 0.8, 0.8) : new TorusGeometry(0.4, 0.14, 8, 18)
    return instanced(base, count, 11 + index)
  }, [kind, count])
  const material = useDisposable(
    () =>
      sceneShader({
        uniforms: {
          uTime: { value: 0 },
          uWeight: { value: 1 },
          uDensity: { value: 0.7 },
          uChaos: { value: 0.3 },
          uHue: { value: 0 },
          uScale: { value: 0.5 },
          uPal: { value: colors.slice(0, 4).concat(colors).slice(0, 4) },
        },
        vertexShader: /* glsl */ `
          attribute vec3 aBase; attribute float aSeed;
          uniform float uTime, uWeight, uDensity, uChaos, uScale;
          varying vec3 vN; varying float vSeed; varying float vH;
          mat3 rot(vec3 a){ float cx=cos(a.x),sx=sin(a.x),cy=cos(a.y),sy=sin(a.y),cz=cos(a.z),sz=sin(a.z);
            return mat3(cy*cz, cy*sz, -sy, sx*sy*cz-cx*sz, sx*sy*sz+cx*cz, sx*cy, cx*sy*cz+sx*sz, cx*sy*sz-sx*cz, cx*cy); }
          void main(){
            float visible = step(aSeed, uDensity) * uWeight;
            vec3 disp = snoiseVec3(aBase * 0.12 + uTime * 0.15) * uChaos * 6.0;
            vec3 order = vec3(floor(aBase.x / 2.0) * 2.0 + 1.0, floor(aBase.y / 2.0) * 2.0 + 1.0, floor(aBase.z / 2.0) * 2.0 + 1.0);
            vec3 c = mix(order, aBase, clamp(uChaos * 2.0, 0.0, 1.0)) + disp;
            mat3 R = rot(vec3(aSeed * 6.0 + uTime * 0.3, aSeed * 3.0 + uTime * 0.2, uChaos * aSeed * 6.0));
            float s = (0.3 + uScale * 1.6) * (0.5 + aSeed) * visible;
            vec3 p = c + R * (position * s);
            vN = normalize(normalMatrix * (R * normal));
            vSeed = aSeed; vH = c.y;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uPal[4]; uniform float uHue; varying vec3 vN; varying float vSeed; varying float vH;
          ${HUE_GLSL}
          void main(){
            float k = fract(vSeed * 3.7 + vH * 0.03) * 4.0;
            vec3 c = k < 1.0 ? uPal[0] : k < 2.0 ? uPal[1] : k < 3.0 ? uPal[2] : uPal[3];
            c = hueShift(c, uHue);
            float l = 0.35 + 0.65 * max(dot(vN, normalize(vec3(0.4, 0.8, 0.5))), 0.0);
            gl_FragColor = vec4(c * l, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [colors.map((c) => c.getHexString()).join()],
  )
  useFrame((_, dt) => {
    const p = useStore.getState().instruments.abstract
    const u = material.uniforms
    u.uTime.value += Math.min(dt, 0.05) * (0.1 + p.movement * 2)
    const f = p.form * 2
    u.uWeight.value = Math.max(0, 1 - Math.abs(f - index))
    u.uDensity.value = p.density
    u.uChaos.value = p.chaos
    u.uHue.value = p.color
    u.uScale.value = p.scale
  })
  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}

function ColorField({ colors }: { colors: Color[] }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        uniforms: { uA: { value: colors[0] }, uB: { value: colors[1] }, uC: { value: colors[2] }, uHue: { value: 0 }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `
          uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uHue; uniform float uTime; varying vec2 vUv;
          ${HUE_GLSL}
          float box(vec2 p, vec2 c, vec2 s){ vec2 d = abs(p - c) - s; float n = snoise(vec3(p * 8.0, uTime * 0.05)) * 0.012; return smoothstep(0.03, -0.01, max(d.x, d.y) + n); }
          void main(){
            vec3 col = hueShift(uC * 0.6, uHue);
            col = mix(col, hueShift(uA, uHue), box(vUv, vec2(0.5, 0.7), vec2(0.36, 0.17)));
            col = mix(col, hueShift(uB, uHue), box(vUv, vec2(0.5, 0.32), vec2(0.36, 0.14)));
            gl_FragColor = vec4(col, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [colors],
  )
  useFrame((s) => {
    mat.uniforms.uHue.value = useStore.getState().instruments.abstract.color
    mat.uniforms.uTime.value = s.clock.elapsedTime
  })
  return (
    <mesh material={mat} position={[0, 10, -26]}>
      <planeGeometry args={[34, 22]} />
    </mesh>
  )
}

/** Gesture: flung skeins of paint as 3D random-walk lines. */
function Skeins({ colors }: { colors: Color[] }) {
  const geo = useDisposable(() => {
    const rng = mulberry32(1947)
    const pts: number[] = []
    const cols: number[] = []
    for (let k = 0; k < 60; k++) {
      let x = (rng() - 0.5) * 26, y = 1 + rng() * 14, z = -18 + rng() * 4
      let vx = (rng() - 0.5) * 0.8, vy = (rng() - 0.5) * 0.8
      const c = colors[k % colors.length]
      for (let i = 0; i < 60; i++) {
        vx += (rng() - 0.5) * 0.3
        vy += (rng() - 0.5) * 0.3 - 0.01
        const nx = x + vx, ny = y + vy, nz = z + (rng() - 0.5) * 0.3
        pts.push(x, y, z, nx, ny, nz)
        cols.push(c.r, c.g, c.b, c.r, c.g, c.b)
        x = nx; y = ny; z = nz
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3))
    g.setAttribute('color', new BufferAttribute(new Float32Array(cols), 3))
    return g
  }, [colors])
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial vertexColors transparent opacity={0.85} />
    </lineSegments>
  )
}

export default function AbstractScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const count = Math.round(2200 * Math.max(0.4, quality))
  const cols = useMemo(() => pal.colors, [pal])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={pal.bg.clone().multiplyScalar(1.6)} roughness={1} />
      </mesh>
      <ColorField colors={cols} />
      <Skeins colors={cols} />
      {(['sphere', 'box', 'torus'] as const).map((k, i) => (
        <FormField key={k} kind={k} count={count} colors={cols} index={i} />
      ))}
    </group>
  )
}
