import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, DoubleSide, FloatType, Group, HalfFloatType, Shape, ShapeGeometry, InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry, Vector3, type WebGLRenderer } from 'three'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import { NOISE_GLSL } from '@/shaders/noise'
import type { SceneProps } from '../types'
import { Motes, useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import { isShown } from '@/utils/visibility'

/*
 * GPGPU particle field. A velocity pass evaluates a turbulent vector field (curl noise plus a few
 * point vortices); a position pass integrates particles through it. Strokes are drawn as quads
 * aligned with their velocity, so the canvas is literally painted by the field.
 */
const FIELD_GLSL = /* glsl */ `
uniform float uTime;
uniform float uJagged;
uniform float uSwirl;
uniform vec3 uVort[4];
vec3 field(vec3 p){
  vec3 v = curlNoise(p * 0.085 + vec3(0.0, 0.0, uTime * 0.025)) * 1.1;
  for (int i = 0; i < 4; i++) {
    vec2 d = p.xy - uVort[i].xy;
    float r = length(d) + 0.6;
    v.xy += vec2(-d.y, d.x) / (r * r) * uVort[i].z * 7.0 * uSwirl * exp(-r * 0.12);
    v.xy -= d / r * 0.12 * uSwirl;
  }
  v.z *= 0.25;
  if (uJagged > 0.5) {
    float a = atan(v.y, v.x);
    a = floor(a / 0.7854 + 0.5) * 0.7854;
    v.xy = vec2(cos(a), sin(a)) * length(v.xy) * 1.3;
  }
  return v;
}
`

const VEL_SHADER = /* glsl */ `
${NOISE_GLSL}
${FIELD_GLSL}
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 p = texture2D(tPos, uv).xyz;
  gl_FragColor = vec4(field(p), 1.0);
}
`

const POS_SHADER = /* glsl */ `
${NOISE_GLSL}
uniform float uTime;
uniform float uDt;
void main(){
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 p = texture2D(tPos, uv);
  vec3 v = texture2D(tVel, uv).xyz;
  p.xyz += v * uDt * 1.6;
  p.w -= uDt * (0.08 + hash21(uv) * 0.12);
  bool out_ = abs(p.x) > 22.0 || p.y < -0.5 || p.y > 18.0 || p.z > 4.0 || p.z < -24.0;
  if (p.w <= 0.0 || out_) {
    vec2 h = hash22(uv * 91.7 + fract(uTime * 0.37));
    vec2 h2 = hash22(uv * 17.3 + h);
    p = vec4((h.x - 0.5) * 40.0, h.y * 17.0, -20.0 + h2.x * 22.0, 0.5 + h2.y);
  }
  gl_FragColor = p;
}
`

function useParticleSim(gl: WebGLRenderer, size: number, jagged: boolean, swirl: number) {
  const sim = useMemo(() => {
    const gpu = new GPUComputationRenderer(size, size, gl)
    const float = gl.capabilities.isWebGL2 && gl.extensions.has('EXT_color_buffer_float')
    gpu.setDataType(float ? FloatType : HalfFloatType)
    const pos0 = gpu.createTexture()
    const vel0 = gpu.createTexture()
    const d = pos0.image.data as unknown as Float32Array
    for (let i = 0; i < size * size; i++) {
      d[i * 4] = (Math.random() - 0.5) * 40
      d[i * 4 + 1] = Math.random() * 17
      d[i * 4 + 2] = -20 + Math.random() * 22
      d[i * 4 + 3] = Math.random()
    }
    const posVar = gpu.addVariable('tPos', POS_SHADER, pos0)
    const velVar = gpu.addVariable('tVel', VEL_SHADER, vel0)
    gpu.setVariableDependencies(velVar, [posVar])
    gpu.setVariableDependencies(posVar, [posVar, velVar])
    const vort = [new Vector3(-9, 11, 1), new Vector3(6, 12.5, -1), new Vector3(13, 5, 1), new Vector3(-3, 5, -0.6)]
    Object.assign(velVar.material.uniforms, { uTime: { value: 0 }, uJagged: { value: jagged ? 1 : 0 }, uSwirl: { value: swirl }, uVort: { value: vort } })
    Object.assign(posVar.material.uniforms, { uTime: { value: 0 }, uDt: { value: 0.016 } })
    const err = gpu.init()
    if (err) console.warn('[flow] GPGPU init failed:', err)
    return { gpu, posVar, velVar, vort, ok: !err }
  }, [gl, size, jagged, swirl])
  useEffect(() => () => sim.gpu.dispose(), [sim])
  return sim
}

/** Matisse's Fauvist room: a flat red wall, a window of pure colour and drifting paper cut-outs. */
function FauveRoom({ colors }: { colors: string[] }) {
  const leaf = useDisposable(() => {
    const sh = new Shape()
    sh.moveTo(0, -1.4)
    sh.bezierCurveTo(0.9, -0.9, 0.3, -0.3, 0.9, 0.1)
    sh.bezierCurveTo(1.3, 0.5, 0.4, 0.7, 0.7, 1.3)
    sh.bezierCurveTo(0.2, 1.1, 0.1, 0.8, 0, 1.5)
    sh.bezierCurveTo(-0.1, 0.8, -0.3, 1.1, -0.8, 1.2)
    sh.bezierCurveTo(-0.4, 0.6, -1.3, 0.4, -0.9, 0)
    sh.bezierCurveTo(-0.3, -0.3, -0.9, -0.9, 0, -1.4)
    return new ShapeGeometry(sh, 24)
  }, [])
  const g = useRef<Group>(null)
  useFrame((st) => {
    g.current?.children.forEach((c, i) => {
      c.rotation.z = Math.sin(st.clock.elapsedTime * 0.3 + i) * 0.35
      c.position.y = [7, 4, 9.5, 5.5, 8][i % 5] + Math.sin(st.clock.elapsedTime * 0.4 + i * 1.7) * 0.4
    })
  })
  return (
    <group position={[0, 0, -14]}>
      <mesh position={[0, 8, -0.2]}>
        <planeGeometry args={[46, 18]} />
        <meshBasicMaterial color={colors[0]} />
      </mesh>
      <mesh position={[7, 8.5, 0]}>
        <planeGeometry args={[7, 8]} />
        <meshBasicMaterial color={colors[2]} />
      </mesh>
      <mesh position={[7, 6, 0.02]}>
        <planeGeometry args={[7, 3]} />
        <meshBasicMaterial color={colors[1]} />
      </mesh>
      <mesh position={[7, 8.5, 0.03]}>
        <planeGeometry args={[7.6, 0.25]} />
        <meshBasicMaterial color="#f7efe0" />
      </mesh>
      <mesh position={[7, 8.5, 0.03]}>
        <planeGeometry args={[0.25, 8.6]} />
        <meshBasicMaterial color="#f7efe0" />
      </mesh>
      <group ref={g}>
        {[-9, -4.5, -12, -1, 12].map((x, i) => (
          <mesh key={x} geometry={leaf} position={[x, 6, 1 + i * 0.3]} scale={1.3 + (i % 3) * 0.35}>
            <meshBasicMaterial color={[colors[1], colors[3] ?? '#1f3c88', '#f7efe0', colors[2], colors[3] ?? '#1f3c88'][i]} side={DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default function FlowScene({ movement, quality }: SceneProps) {
  const gl = useThree((s) => s.gl)
  const pal = usePalette(movement)
  const v = movement.visual.variant ?? 'swirl'
  // Fauvism is about broad flat colour, so its stroke field is sparser.
  const size = (quality > 0.8 ? 128 : quality > 0.5 ? 96 : 64) / (v === 'fauve' ? 4 : 1)
  const sim = useParticleSim(gl, size, v === 'jagged', v === 'fauve' ? 0.35 : v === 'jagged' ? 0.6 : 1)
  const count = size * size

  const geometry = useDisposable(() => {
    const base = new PlaneGeometry(1, 0.22)
    const g = new InstancedBufferGeometry()
    g.index = base.index
    g.setAttribute('position', base.attributes.position)
    g.setAttribute('uv', base.attributes.uv)
    const ref = new Float32Array(count * 2)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      ref[i * 2] = ((i % size) + 0.5) / size
      ref[i * 2 + 1] = (Math.floor(i / size) + 0.5) / size
      seed[i] = Math.random()
    }
    g.setAttribute('aRef', new InstancedBufferAttribute(ref, 2))
    g.setAttribute('aSeed', new InstancedBufferAttribute(seed, 1))
    g.instanceCount = count
    return g
  }, [count, size])

  const colors = movement.visual.palette.colors
  const material = useDisposable(
    () =>
      sceneShader({
        transparent: true,
        depthWrite: false,
        uniforms: {
          tPos: { value: null },
          tVel: { value: null },
          uPal: { value: [0, 1, 2, 3, 4].map((i) => new Color(colors[i % colors.length])) },
          uWidth: { value: v === 'fauve' ? 2.2 : 1 },
        },
        vertexShader: /* glsl */ `
          uniform sampler2D tPos; uniform sampler2D tVel; uniform vec3 uPal[5]; uniform float uWidth;
          attribute vec2 aRef; attribute float aSeed;
          varying vec3 vColor; varying vec2 vUv; varying float vLife;
          void main(){
            vUv = uv;
            vec4 p = texture2D(tPos, aRef);
            vec3 vel = texture2D(tVel, aRef).xyz;
            float speed = length(vel.xy) + 1e-3;
            vec2 dir = vel.xy / speed;
            float len = clamp(0.35 + speed * 0.35, 0.3, 1.6);
            vec2 q = vec2(position.x * len, position.y * uWidth * (0.8 + aSeed * 0.6));
            vec3 wp = p.xyz + vec3(dir.x * q.x - dir.y * q.y, dir.y * q.x + dir.x * q.y, 0.0);
            vec4 mvPosition = modelViewMatrix * vec4(wp, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            float ang = atan(dir.y, dir.x) / 6.2831 + 0.5;
            float k = fract(ang * 2.0 + aSeed * 0.35 + p.y * 0.02) * 5.0;
            int idx = int(k);
            vec3 c = uPal[0];
            if (idx == 1) c = uPal[1]; else if (idx == 2) c = uPal[2]; else if (idx == 3) c = uPal[3]; else if (idx == 4) c = uPal[4];
            vColor = c * (0.8 + 0.4 * aSeed);
            vLife = smoothstep(0.0, 0.25, p.w) * smoothstep(1.5, 1.2, p.w);
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor; varying vec2 vUv; varying float vLife;
          void main(){
            vec2 p = vUv - 0.5;
            float a = smoothstep(0.5, 0.3, abs(p.x)) * smoothstep(0.5, 0.2, abs(p.y));
            a *= 0.7 + 0.3 * sin(vUv.y * 40.0);
            a *= vLife;
            if (a < 0.05) discard;
            gl_FragColor = vec4(vColor, a);
            ${FOG_TAIL}
          }`,
      }),
    [colors.join(), v],
  )

  const root = useRef<Group>(null)
  useFrame((s, dt) => {
    if (!sim.ok) return
    // No need to advance the simulation while the chamber is hidden; it resumes where it was.
    if (material.uniforms.tPos.value && !isShown(root.current)) return
    const t = s.clock.elapsedTime
    sim.velVar.material.uniforms.uTime.value = t
    sim.posVar.material.uniforms.uTime.value = t
    sim.posVar.material.uniforms.uDt.value = Math.min(dt, 0.04)
    sim.vort.forEach((vt, i) => (vt.z = (i % 2 ? -1 : 1) * (0.8 + 0.2 * Math.sin(t * 0.2 + i))))
    sim.gpu.compute()
    material.uniforms.tPos.value = sim.gpu.getCurrentRenderTarget(sim.posVar).texture
    material.uniforms.tVel.value = sim.gpu.getCurrentRenderTarget(sim.velVar).texture
  })

  const shards = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: -14 + i * 3.5, h: 4 + ((i * 37) % 7), r: ((i % 3) - 1) * 0.25 })), [])
  return (
    <group ref={root}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={pal.bg.clone().multiplyScalar(1.3)} roughness={1} />
      </mesh>
      {sim.ok && <mesh geometry={geometry} material={material} frustumCulled={false} />}
      {v === 'swirl' && (
        <group position={[6, 12.5, -10]}>
          <mesh>
            <sphereGeometry args={[1.1, 32, 16]} />
            <meshBasicMaterial color={pal.hex.accent} toneMapped={false} />
          </mesh>
          {[1.6, 2.2, 2.9].map((r) => (
            <mesh key={r}>
              <torusGeometry args={[r, 0.05, 6, 64]} />
              <meshBasicMaterial color={pal.hex.colors[3]} transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      )}
      {v === 'fauve' && <FauveRoom colors={movement.visual.palette.colors} />}
      {v === 'jagged' &&
        shards.map((sh, i) => (
          <mesh key={i} position={[sh.x, sh.h / 2, -16 + (i % 3) * 2]} rotation={[0, 0.2 * i, sh.r]}>
            <boxGeometry args={[1.6, sh.h, 1.6]} />
            <meshStandardMaterial color={i % 2 ? pal.hex.colors[4] : pal.hex.colors[3]} roughness={0.8} flatShading />
          </mesh>
        ))}
      <Motes count={Math.round(120 * quality)} area={[40, 16, 24]} position={[0, 0, -8]} color={pal.hex.colors[1]} size={0.08} rise={0.3} sway={1.5} opacity={0.5} />
    </group>
  )
}
