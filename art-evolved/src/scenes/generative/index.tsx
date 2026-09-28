import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Color, DataTexture, InstancedMesh, LinearFilter, Object3D, Points, RGBAFormat, Vector3 } from 'three'
import type { SceneProps } from '../types'
import { useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import { useStore } from '@/state/store'
import { GEN_SYSTEMS, VARIANT_SYSTEM } from '@/data/generative'
import { mulberry32, pick, randomSeed } from '@/utils/random'
import { createNoise3D } from '@/utils/noise'

const SIM = 128

/** CPU simulations streamed into a texture: Gray–Scott reaction–diffusion and Conway’s Life. */
function useSimulation(system: string, seed: number, chaos: number, density: number) {
  const tex = useMemo(() => {
    const t = new DataTexture(new Uint8Array(SIM * SIM * 4), SIM, SIM, RGBAFormat)
    t.magFilter = LinearFilter
    t.minFilter = LinearFilter
    return t
  }, [])
  useEffect(() => () => tex.dispose(), [tex])
  const state = useMemo(() => {
    const rng = mulberry32(seed)
    const a = new Float32Array(SIM * SIM).fill(1)
    const b = new Float32Array(SIM * SIM)
    const life = new Uint8Array(SIM * SIM)
    for (let k = 0; k < 14; k++) {
      const cx = Math.floor(rng() * SIM), cy = Math.floor(rng() * SIM)
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) b[((cy + y + SIM) % SIM) * SIM + ((cx + x + SIM) % SIM)] = 1
    }
    for (let i = 0; i < life.length; i++) life[i] = rng() < 0.15 + density * 0.3 ? 1 : 0
    return { a, b, a2: new Float32Array(a.length), b2: new Float32Array(b.length), life, life2: new Uint8Array(life.length), acc: 0 }
  }, [seed, density])

  useFrame((_, dt) => {
    const d = tex.image.data as Uint8Array
    if (system === 'reaction') {
      // Gray–Scott in the coral/worm regime; chaos drifts toward spot-splitting.
      const f = 0.03 + chaos * 0.02
      const k = 0.0605 + chaos * 0.004
      const s = state
      for (let it = 0; it < 6; it++) {
        for (let y = 0; y < SIM; y++)
          for (let x = 0; x < SIM; x++) {
            const i = y * SIM + x
            const l = y * SIM + ((x + SIM - 1) % SIM), r = y * SIM + ((x + 1) % SIM)
            const u = ((y + SIM - 1) % SIM) * SIM + x, dn = ((y + 1) % SIM) * SIM + x
            const la = s.a[l] + s.a[r] + s.a[u] + s.a[dn] - 4 * s.a[i]
            const lb = s.b[l] + s.b[r] + s.b[u] + s.b[dn] - 4 * s.b[i]
            const abb = s.a[i] * s.b[i] * s.b[i]
            s.a2[i] = s.a[i] + (1.0 * la * 0.2 - abb + f * (1 - s.a[i]))
            s.b2[i] = s.b[i] + (0.5 * lb * 0.2 + abb - (k + f) * s.b[i])
          }
        ;[s.a, s.a2] = [s.a2, s.a]
        ;[s.b, s.b2] = [s.b2, s.b]
      }
      for (let i = 0; i < SIM * SIM; i++) {
        const v = Math.max(0, Math.min(1, (s.a[i] - s.b[i]) * 1.2))
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v * 255
        d[i * 4 + 3] = 255
      }
      tex.needsUpdate = true
    } else if (system === 'automata') {
      state.acc += dt
      if (state.acc < 0.09) return
      state.acc = 0
      const L = state.life, N = state.life2
      for (let y = 0; y < SIM; y++)
        for (let x = 0; x < SIM; x++) {
          let n = 0
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += L[((y + dy + SIM) % SIM) * SIM + ((x + dx + SIM) % SIM)]
          const i = y * SIM + x
          N[i] = n === 3 || (L[i] && n === 2) ? 1 : 0
          const age = N[i] ? 255 : Math.max(0, d[i * 4] - 40)
          d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = age
          d[i * 4 + 3] = 255
        }
      state.life.set(N)
      tex.needsUpdate = true
    }
  })
  return tex
}

function Screen({ system, colors }: { system: string; colors: Color[] }) {
  const p = useStore((s) => s.instruments.generative)
  const sim = useSimulation(system, p.seed, p.chaos, p.density)
  const idx = GEN_SYSTEMS.findIndex((s) => s.id === system)
  const mat = useDisposable(
    () =>
      sceneShader({
        uniforms: {
          uTime: { value: 0 },
          uSystem: { value: 0 },
          uSeed: { value: 0 },
          uChaos: { value: 0.5 },
          uIter: { value: 0.5 },
          uDensity: { value: 0.5 },
          uScale: { value: 0.5 },
          uHue: { value: 0 },
          uSym: { value: 0 },
          tSim: { value: null },
          uC: { value: colors.slice(0, 3) },
          uAspect: { value: 16 / 10 },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uSystem, uSeed, uChaos, uIter, uDensity, uScale, uHue, uSym, uAspect;
          uniform sampler2D tSim; uniform vec3 uC[3]; varying vec2 vUv;
          vec3 hueShift(vec3 c, float h){ const vec3 k = vec3(0.57735); float a = h * 6.2831; float ca = cos(a); return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca); }
          vec3 pal(float t){ t = clamp(t, 0.0, 1.0); vec3 c = mix(uC[0] * 0.08, uC[0], smoothstep(0.0, 0.35, t)); c = mix(c, uC[1], smoothstep(0.35, 0.7, t)); c = mix(c, uC[2], smoothstep(0.7, 1.0, t)); return hueShift(c, uHue); }
          vec2 kaleido(vec2 p, float n){ if (n < 2.0) return p; float a = atan(p.y, p.x); float r = length(p); float s = 6.2831 / n; a = mod(a, s); a = abs(a - s * 0.5); return vec2(cos(a), sin(a)) * r; }
          void main(){
            vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
            p = kaleido(p, floor(uSym * 10.0));
            float sc = mix(0.6, 5.0, uScale);
            vec2 so = vec2(fract(uSeed * 0.00013) * 100.0, fract(uSeed * 0.00071) * 100.0);
            float v = 0.0;
            float t = uTime;
            if (uSystem < 0.5) {
              vec2 q = p * sc + so;
              int warps = int(1.0 + uIter * 3.0);
              for (int i = 0; i < 4; i++) { if (i >= warps) break; q += vec2(fbm(vec3(q, t * 0.04)), fbm(vec3(q + 5.2, t * 0.04))) * uChaos * 1.6; }
              v = fbm(vec3(q, t * 0.02)) * 0.5 + 0.5;
            } else if (uSystem < 1.5) {
              vec2 q = p * (3.0 + uDensity * 18.0) * mix(0.5, 1.5, uScale);
              vec2 g = floor(q), f = fract(q);
              float d1 = 9.0, d2 = 9.0; vec2 id = vec2(0.0);
              for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
                vec2 o = vec2(float(x), float(y));
                vec2 h = hash22(g + o + so);
                vec2 pt = o + 0.5 + 0.5 * sin(t * 0.3 * uChaos * 3.0 + h * 6.2831);
                float d = length(pt - f);
                if (d < d1) { d2 = d1; d1 = d; id = g + o; } else if (d < d2) d2 = d;
              }
              v = hash21(id + so) * 0.85 * smoothstep(0.0, 0.08 + uIter * 0.1, d2 - d1) + 0.08;
            } else if (uSystem < 2.5) {
              float field = 0.0;
              int n = int(3.0 + uDensity * 13.0);
              for (int i = 0; i < 16; i++) {
                if (i >= n) break;
                vec2 h = hash22(vec2(float(i), 7.0) + so);
                vec2 c = (h - 0.5) * vec2(uAspect, 1.0) * 0.8 + 0.25 * vec2(sin(t * (0.2 + h.x * 0.4) * (0.5 + uChaos)), cos(t * (0.3 + h.y * 0.3) * (0.5 + uChaos)));
                float r = 0.04 + 0.08 * uScale * h.y;
                field += r * r / max(dot(p - c, p - c), 1e-4);
              }
              v = smoothstep(0.8, 1.2 + uIter * 2.0, field) * 0.7 + smoothstep(0.2, 1.0, field) * 0.3;
            } else if (uSystem < 3.5) {
              float s = 0.0;
              int n = int(2.0 + uDensity * 6.0);
              for (int i = 0; i < 8; i++) {
                if (i >= n) break;
                vec2 h = hash22(vec2(float(i), 3.0) + so);
                vec2 c = (h - 0.5) * vec2(uAspect, 1.0) + 0.1 * uChaos * vec2(sin(t * 0.5 + h.x * 9.0), cos(t * 0.4 + h.y * 9.0));
                s += sin(length(p - c) * (20.0 + sc * 20.0) - t * 2.0);
              }
              v = s / float(n) * 0.5 + 0.5;
              v = mix(v, step(0.5, v), uIter);
            } else if (uSystem < 4.5) {
              vec2 z = p * (1.6 / (0.4 + uScale));
              vec2 c = vec2(-0.8 + 0.25 * cos(uSeed * 0.001 + t * 0.03 * uChaos), 0.156 + 0.35 * sin(uSeed * 0.0013 + t * 0.02 * uChaos));
              float it = 0.0;
              int maxIt = int(30.0 + uIter * 170.0);
              for (int i = 0; i < 200; i++) {
                if (i >= maxIt) break;
                z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
                if (dot(z, z) > 16.0) break;
                it += 1.0;
              }
              v = it >= float(maxIt) ? 0.0 : sqrt(it / float(maxIt));
            } else {
              v = texture2D(tSim, vUv * mix(1.0, 0.5, uScale) + 0.25 * uScale).r;
              v = 1.0 - v;
            }
            gl_FragColor = vec4(pal(v), 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [colors],
  )
  useFrame((s) => {
    const u = mat.uniforms
    const g = useStore.getState().instruments.generative
    u.uTime.value = s.clock.elapsedTime
    u.uSystem.value = idx
    u.uSeed.value = g.seed % 100000
    u.uChaos.value = g.chaos
    u.uIter.value = g.iterations
    u.uDensity.value = g.density
    u.uScale.value = g.scale
    u.uHue.value = g.color
    u.uSym.value = g.symmetry
    u.tSim.value = sim
  })
  return (
    <group position={[0, 6.5, -10]}>
      <mesh material={mat}>
        <planeGeometry args={[19.2, 12]} />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[19.8, 12.6, 0.1]} />
        <meshBasicMaterial color="#1a1a1c" />
      </mesh>
    </group>
  )
}

function lineGeo(pts: number[], cols?: number[]) {
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3))
  if (cols) g.setAttribute('color', new BufferAttribute(new Float32Array(cols), 3))
  return g
}

function Attractor({ colors, quality }: { colors: Color[]; quality: number }) {
  const p = useStore((s) => s.instruments.generative)
  const n = Math.round(60000 * quality)
  const geo = useDisposable(() => {
    const rng = mulberry32(p.seed)
    const a = 0.95 + p.chaos * 0.2, b = 0.7, c = 0.6, d = 3.5, e = 0.25 + p.iterations * 0.1, f = 0.1
    let x = 0.1 + rng() * 0.01, y = 0, z = 0
    const pts = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const tmp = new Color()
    const dt = 0.01
    for (let i = 0; i < n + 200; i++) {
      const dx = (z - b) * x - d * y
      const dy = d * x + (z - b) * y
      const dz = c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x
      x += dx * dt; y += dy * dt; z += dz * dt
      if (i < 200) continue
      const k = i - 200
      const s = 3.2 * (0.6 + p.scale)
      pts[k * 3] = x * s; pts[k * 3 + 1] = z * s; pts[k * 3 + 2] = y * s
      tmp.copy(colors[0]).lerp(colors[1], (z + 1) / 2).lerp(colors[2], k / n * 0.5)
      col.set([tmp.r, tmp.g, tmp.b], k * 3)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pts, 3))
    g.setAttribute('color', new BufferAttribute(col, 3))
    return g
  }, [p.seed, p.chaos, p.iterations, p.scale, n, colors])
  const ref = useRef<Points>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15
  })
  return (
    <group position={[0, 5, -8]}>
      <points ref={ref} geometry={geo}>
        <pointsMaterial size={0.035} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}

function LSystem({ colors }: { colors: Color[] }) {
  const p = useStore((s) => s.instruments.generative)
  const geo = useDisposable(() => {
    const rng = mulberry32(p.seed)
    const pts: number[] = []
    const cols: number[] = []
    const depth = 4 + Math.round(p.iterations * 4)
    const spread = 0.3 + p.chaos * 0.7
    const tmp = new Color()
    const branch = (a: Vector3, dir: Vector3, len: number, d: number) => {
      const b = a.clone().addScaledVector(dir, len)
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z)
      tmp.copy(colors[0]).lerp(colors[1], d / depth).lerp(colors[2], Math.max(0, d / depth - 0.6))
      cols.push(tmp.r, tmp.g, tmp.b, tmp.r, tmp.g, tmp.b)
      if (d >= depth) return
      const kids = 2 + (rng() < p.density * 0.6 ? 1 : 0)
      for (let k = 0; k < kids; k++) {
        const axis = new Vector3(Math.cos(k * 2.4 + d + rng()), 0, Math.sin(k * 2.4 + d + rng())).normalize()
        const nd = dir.clone().applyAxisAngle(axis, spread * (0.6 + rng() * 0.8)).normalize()
        branch(b, nd, len * (0.68 + rng() * 0.12), d + 1)
      }
    }
    const trunks = 1 + Math.floor(p.symmetry * 5)
    for (let t = 0; t < trunks; t++) {
      const a = (t / trunks) * Math.PI * 2
      const dir = trunks > 1 ? new Vector3(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5).normalize() : new Vector3(0, 1, 0)
      branch(new Vector3(0, 0, 0), dir, 2.4 * (0.6 + p.scale), 0)
    }
    return lineGeo(pts, cols)
  }, [p.seed, p.iterations, p.chaos, p.density, p.symmetry, p.scale, colors])
  return (
    <lineSegments geometry={geo} position={[0, 0, -8]}>
      <lineBasicMaterial vertexColors />
    </lineSegments>
  )
}

function Plotter({ ink, accent }: { ink: Color; accent: Color }) {
  const p = useStore((s) => s.instruments.generative)
  const geo = useDisposable(() => {
    const rng = mulberry32(p.seed)
    const n = 6 + Math.round(p.density * 14)
    const size = 16 * (0.6 + p.scale * 0.6)
    const cell = size / n
    const pts: number[] = []
    const cols: number[] = []
    const nest = 1 + Math.round(p.iterations * 4)
    for (let gy = 0; gy < n; gy++)
      for (let gx = 0; gx < n; gx++) {
        const dis = (gy / n) * p.chaos * 1.8
        const cx = (gx - n / 2 + 0.5) * cell + (rng() - 0.5) * dis * cell * 0.5
        const cy = (gy - n / 2 + 0.5) * cell + (rng() - 0.5) * dis * cell * 0.5
        const rot = (rng() - 0.5) * dis * 1.6
        const red = rng() < 0.03
        for (let k = 0; k < nest; k++) {
          const h = cell * 0.42 * (1 - k / (nest + 1))
          const corners = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, y]) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)])
          for (let e = 0; e < 4; e++) {
            const a = corners[e], b = corners[(e + 1) % 4]
            pts.push(a[0], a[1], 0, b[0], b[1], 0)
            const c = red ? accent : ink
            cols.push(c.r, c.g, c.b, c.r, c.g, c.b)
          }
        }
      }
    return lineGeo(pts, cols)
  }, [p.seed, p.density, p.chaos, p.iterations, p.scale, ink, accent])
  return (
    <group position={[0, 7, -9]}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[22, 22]} />
        <meshBasicMaterial color="#f1efe8" />
      </mesh>
      <lineSegments geometry={geo}>
        <lineBasicMaterial vertexColors />
      </lineSegments>
    </group>
  )
}

function DataSurface({ colors }: { colors: Color[] }) {
  const p = useStore((s) => s.instruments.generative)
  const ref = useRef<InstancedMesh>(null)
  const N = 36
  const noise = useMemo(() => createNoise3D(p.seed % 9999), [p.seed])
  const tmp = useMemo(() => ({ o: new Object3D(), c: new Color() }), [])
  useFrame((s) => {
    const m = ref.current
    if (!m) return
    const t = s.clock.elapsedTime * (0.05 + p.chaos * 0.3)
    for (let i = 0; i < N * N; i++) {
      const x = i % N, z = Math.floor(i / N)
      const v = noise(x * 0.08 * (0.5 + p.scale), z * 0.08 * (0.5 + p.scale), t) * 0.5 + 0.5
      const h = 0.1 + Math.pow(v, 1 + p.iterations * 2) * 9 * (0.3 + p.density)
      tmp.o.position.set((x - N / 2) * 0.55, h / 2, -8 + (z - N / 2) * 0.55)
      tmp.o.scale.set(0.42, h, 0.42)
      tmp.o.updateMatrix()
      m.setMatrixAt(i, tmp.o.matrix)
      tmp.c.copy(colors[0]).lerp(colors[1], v).lerp(colors[2], Math.max(0, v - 0.7) * 3)
      m.setColorAt(i, tmp.c)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N * N]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  )
}

/**
 * The generative laboratory. The chamber's variant picks a default system; every visit re-seeds,
 * so no two visits produce the same composition.
 */
export default function GenerativeScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const system = useStore((s) => s.instruments.generative.system)
  const setInstrument = useStore((s) => s.setInstrument)
  useEffect(() => {
    const v = movement.visual.variant ?? 'lab'
    const def = VARIANT_SYSTEM[v] ?? pick(mulberry32(randomSeed()), GEN_SYSTEMS.filter((s) => s.id !== 'data' && s.id !== 'plotter')).id
    setInstrument('generative', { system: def, seed: randomSeed() })
  }, [movement, setInstrument])
  const kind = GEN_SYSTEMS.find((s) => s.id === system)?.kind ?? 'shader'
  const cols = useMemo(() => [pal.colors[0], pal.colors[1] ?? pal.ink, pal.colors[2] ?? pal.accent], [pal])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={pal.bg.clone().multiplyScalar(1.5)} roughness={0.6} metalness={0.2} />
      </mesh>
      {kind !== '3d' && <Screen system={system} colors={cols} />}
      {system === 'attractor' && <Attractor colors={cols} quality={quality} />}
      {system === 'lsystem' && <LSystem colors={cols} />}
      {system === 'plotter' && <Plotter ink={pal.ink.clone().lerp(new Color('#141414'), 0.9)} accent={pal.accent} />}
      {system === 'data' && <DataSurface colors={cols} />}
    </group>
  )
}
