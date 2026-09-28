import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  NormalBlending,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type Texture,
} from 'three'
import type { Movement } from '@/data/types'
import { mulberry32, hashString } from '@/utils/random'
import { FOG_TAIL, sceneShader } from './glsl'
import { painterFor } from '@/art/painters'

export function usePalette(movement: Movement) {
  return useMemo(() => {
    const p = movement.visual.palette
    return { bg: new Color(p.bg), ink: new Color(p.ink), accent: new Color(p.accent), colors: p.colors.map((c) => new Color(c)), hex: p }
  }, [movement])
}

export function useSeed(movement: Movement, salt = '') {
  return useMemo(() => mulberry32(hashString(movement.id + salt)), [movement.id, salt])
}

/** A texture painted procedurally on a 2D canvas, disposed with the component. */
export function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, deps: unknown[] = []) {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    draw(ctx, w, h)
    const t = new CanvasTexture(canvas)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, ...deps])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

export function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const obj = useMemo(factory, deps)
  useEffect(() => () => obj.dispose(), [obj])
  return obj
}

interface MotesProps {
  count: number
  area: [number, number, number]
  position?: [number, number, number]
  color: string | Color
  size?: number
  rise?: number
  sway?: number
  opacity?: number
  additive?: boolean
  seed?: number
}

/** Floating dust, embers, pollen, ash — GPU-animated points that never touch the CPU after creation. */
export function Motes({ count, area, position = [0, 0, 0], color, size = 0.12, rise = 0.3, sway = 0.4, opacity = 0.7, additive = true, seed = 3 }: MotesProps) {
  const geometry = useDisposable(() => {
    const rng = mulberry32(seed)
    const g = new BufferGeometry()
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rng() - 0.5) * area[0]
      pos[i * 3 + 1] = rng() * area[1]
      pos[i * 3 + 2] = (rng() - 0.5) * area[2]
      s[i] = rng()
    }
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new BufferAttribute(s, 1))
    return g
  }, [count, area[0], area[1], area[2], seed])
  const material = useDisposable(
    () =>
      sceneShader({
        transparent: true,
        depthWrite: false,
        blending: additive ? AdditiveBlending : NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uRise: { value: rise },
          uSway: { value: sway },
          uHeight: { value: area[1] },
          uColor: { value: new Color(color) },
          uOpacity: { value: opacity },
        },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime, uSize, uRise, uSway, uHeight;
          varying float vAlpha;
          void main(){
            vec3 p = position;
            p.y = mod(p.y + uTime * uRise * (0.4 + aSeed), uHeight);
            p.x += sin(uTime * 0.5 + aSeed * 40.0) * uSway;
            p.z += cos(uTime * 0.37 + aSeed * 23.0) * uSway;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = uSize * (0.4 + aSeed) * (320.0 / max(-mvPosition.z, 0.5));
            vAlpha = smoothstep(0.0, 0.12 * uHeight, p.y) * smoothstep(uHeight, 0.8 * uHeight, p.y) * (0.35 + 0.65 * aSeed);
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity;
          varying float vAlpha;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            gl_FragColor = vec4(uColor, uOpacity * vAlpha * smoothstep(0.5, 0.0, d));
            ${FOG_TAIL}
          }`,
      }),
    [additive],
  )
  useLayoutEffect(() => {
    material.uniforms.uColor.value.set(color)
    material.uniforms.uSize.value = size
    material.uniforms.uOpacity.value = opacity
    material.uniforms.uRise.value = rise
    material.uniforms.uSway.value = sway
  }, [material, color, size, opacity, rise, sway])
  useFrame((s) => {
    material.uniforms.uTime.value = s.clock.elapsedTime
  })
  return <points geometry={geometry} material={material} position={position} frustumCulled={false} />
}

/** Volumetric-looking light shafts: open cones with a soft gradient, additive. */
export function LightShaft({ position, rotation = [0, 0, 0], radiusTop = 0.6, radiusBottom = 3, height = 16, color = '#fff2d8', opacity = 0.18 }: {
  position: [number, number, number]
  rotation?: [number, number, number]
  radiusTop?: number
  radiusBottom?: number
  height?: number
  color?: string
  opacity?: number
}) {
  const material = useDisposable(
    () =>
      sceneShader({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
        uniforms: { uColor: { value: new Color(color) }, uOpacity: { value: opacity }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){
            float rim = pow(abs(dot(vN, vV)), 1.5);
            float fall = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
            float dust = 0.75 + 0.25 * snoise(vec3(vUv * vec2(6.0, 3.0), uTime * 0.15));
            gl_FragColor = vec4(uColor * uOpacity * rim * fall * dust, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [color, opacity],
  )
  const geometry = useDisposable(() => new CylinderGeometry(radiusTop, radiusBottom, height, 32, 1, true), [radiusTop, radiusBottom, height])
  useFrame((s) => {
    material.uniforms.uTime.value = s.clock.elapsedTime
  })
  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} />
}

/** Fluted, slightly swelling (entasis) column shaft. */
export function useColumnGeometry(radius: number, height: number, flutes = 20, entasis = 0.04) {
  return useDisposable(() => {
    const g = new CylinderGeometry(radius * 0.86, radius, height, Math.max(24, flutes * 4), 24)
    const p = g.attributes.position as BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const z = p.getZ(i)
      const a = Math.atan2(z, x)
      const h = y / height + 0.5
      const swell = 1 + Math.sin(h * Math.PI) * entasis
      const flute = flutes > 0 ? 1 - 0.05 * Math.pow(0.5 + 0.5 * Math.cos(a * flutes), 2) : 1
      p.setX(i, x * swell * flute)
      p.setZ(i, z * swell * flute)
    }
    g.computeVertexNormals()
    return g
  }, [radius, height, flutes, entasis])
}

export function Column({ position, height = 8, radius = 0.5, color = '#efe8dc', order = 'doric', flutes = 20 }: {
  position: [number, number, number]
  height?: number
  radius?: number
  color?: string | Color
  order?: 'doric' | 'ionic' | 'papyrus' | 'plain'
  flutes?: number
}) {
  const shaft = useColumnGeometry(radius, height, order === 'plain' ? 0 : flutes)
  const capital = useDisposable(() => {
    if (order === 'papyrus') {
      const pts = [new Vector2(radius * 0.86, 0), new Vector2(radius * 1.5, height * 0.08), new Vector2(radius * 1.9, height * 0.16), new Vector2(radius * 1.6, height * 0.18)]
      return new LatheGeometry(pts, 32)
    }
    return new CylinderGeometry(radius * 1.3, radius * 0.9, radius * 0.6, 32)
  }, [order, radius, height])
  return (
    <group position={position}>
      <mesh geometry={shaft} position={[0, height / 2, 0]}>
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh geometry={capital} position={[0, order === 'papyrus' ? height : height + radius * 0.3, 0]}>
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {order !== 'papyrus' && (
        <mesh position={[0, height + radius * 0.75, 0]}>
          <boxGeometry args={[radius * 3, radius * 0.35, radius * 3]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      )}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[radius * 1.25, radius * 1.35, 0.3, 32]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  )
}

export interface FigurePose {
  contrapposto?: number
  twist?: number
  elongation?: number
  armRaise?: number
  lean?: number
}

/**
 * A human-like sculpture assembled from primitives. Pose parameters encode period conventions:
 * contrapposto (Classical/Renaissance), twist (Mannerist serpentinata), elongation.
 */
export function Figure({ position = [0, 0, 0], rotation = 0, scale = 1, color = '#efe8dc', pose = {}, roughness = 0.55, metalness = 0 }: {
  position?: [number, number, number]
  rotation?: number
  scale?: number
  color?: string | Color
  pose?: FigurePose
  roughness?: number
  metalness?: number
}) {
  const { contrapposto = 0.5, twist = 0, elongation = 1, armRaise = 0, lean = 0 } = pose
  const hip = contrapposto * 0.18
  const mat = <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
  const L = elongation
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <group rotation={[0, 0, lean]}>
        {/* legs: weight leg straight, free leg bent */}
        <mesh position={[-0.18, 0.95 * L, 0]} rotation={[0, 0, hip * 0.4]}>
          <capsuleGeometry args={[0.13, 1.5 * L, 6, 12]} />
          {mat}
        </mesh>
        <mesh position={[0.2, 0.92 * L, 0.12]} rotation={[-0.18 * contrapposto, 0, -hip * 0.5]}>
          <capsuleGeometry args={[0.12, 1.45 * L, 6, 12]} />
          {mat}
        </mesh>
        <group position={[0, 1.8 * L, 0]} rotation={[0, twist * 0.6, hip]}>
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.3, 20, 16]} />
            {mat}
          </mesh>
          <group rotation={[0, twist * 0.9, -hip * 1.6]}>
            <mesh position={[0, 0.6 * L, 0]} scale={[1, L, 0.72]}>
              <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
              {mat}
            </mesh>
            <mesh position={[-0.46, 0.66 * L, 0]} rotation={[0, 0, 0.12 + armRaise * 2.2]}>
              <capsuleGeometry args={[0.085, 1.05 * L, 6, 10]} />
              {mat}
            </mesh>
            <mesh position={[0.46, 0.62 * L, 0.06]} rotation={[0.2, 0, -0.1 - contrapposto * 0.2]}>
              <capsuleGeometry args={[0.085, 1.05 * L, 6, 10]} />
              {mat}
            </mesh>
            <mesh position={[0, 1.2 * L + 0.12, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 0.22, 12]} />
              {mat}
            </mesh>
            <mesh position={[0, 1.2 * L + 0.42, 0.02]} rotation={[0.1, twist * 0.5, contrapposto * 0.15]} scale={[0.9, 1.1, 1]}>
              <sphereGeometry args={[0.21, 24, 18]} />
              {mat}
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

export function Plinth({ position, size = [1.6, 1.2, 1.6], color = '#d8d1c4' }: { position: [number, number, number]; size?: [number, number, number]; color?: string }) {
  return (
    <mesh position={[position[0], position[1] + size[1] / 2, position[2]]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

export function Floor({ color, size = 140, y = 0, roughness = 0.95, map }: { color: string | Color; size?: number; y?: number; roughness?: number; map?: Texture }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, -8]}>
      <planeGeometry args={[size, 80]} />
      <meshStandardMaterial color={color} roughness={roughness} map={map ?? null} />
    </mesh>
  )
}

/** Continuous slow rotation for a group. */
export function Spin({ speed = 0.1, axis = 'y', children }: { speed?: number; axis?: 'x' | 'y' | 'z'; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation[axis] += speed * Math.min(dt, 0.05)
  })
  return <group ref={ref}>{children}</group>
}

/** A plane whose surface is painted by one of the 2D procedural painters. */
export function PaintedPlane({ movement, painter, size, res = [1024, 512], position, rotation = [0, 0, 0], seed = '', basic = false, opacity = 1, side = 0, repeat = [1, 1] }: {
  movement: Movement
  painter?: string
  size: [number, number]
  res?: [number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
  seed?: string
  basic?: boolean
  opacity?: number
  side?: 0 | 1 | 2
  repeat?: [number, number]
}) {
  const tex = useCanvasTexture(
    (ctx, w, h) => painterFor(movement, painter)(ctx, w, h, mulberry32(hashString(movement.id + seed + (painter ?? ''))), movement.visual.palette),
    res[0],
    res[1],
    [movement.id, painter, seed],
  )
  useLayoutEffect(() => {
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(repeat[0], repeat[1])
    tex.needsUpdate = true
  }, [tex, repeat[0], repeat[1]])
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      {basic ? (
        <meshBasicMaterial map={tex} transparent={opacity < 1} opacity={opacity} side={side} toneMapped={false} />
      ) : (
        <meshStandardMaterial map={tex} roughness={0.9} transparent={opacity < 1} opacity={opacity} side={side} />
      )}
    </mesh>
  )
}

/** Brush-stroke material: a ragged, dry-edged ink mark on a quad. */
export function useInkStroke(color: string | Color, opacity = 0.9, dryness = 0.5) {
  return useDisposable(
    () =>
      sceneShader({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: { uColor: { value: new Color(color) }, uOpacity: { value: opacity }, uDry: { value: dryness }, uSeed: { value: Math.random() * 10 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity; uniform float uDry; uniform float uSeed;
          varying vec2 vUv;
          void main(){
            float u = vUv.x, v = vUv.y - 0.5;
            float width = 0.5 * sin(3.14159 * pow(u, 0.7)) * (0.8 + 0.2 * snoise(vec3(u * 4.0, uSeed, 0.0)));
            float edge = snoise(vec3(u * 12.0, v * 30.0, uSeed)) * 0.06;
            float a = smoothstep(width + edge, width + edge - 0.04, abs(v));
            float streak = mix(1.0, smoothstep(-0.2, 0.6, snoise(vec3(u * 3.0, v * 60.0, uSeed + 3.0))), uDry * smoothstep(0.3, 1.0, u));
            a *= streak;
            if (a < 0.02) discard;
            gl_FragColor = vec4(uColor, a * uOpacity);
            ${FOG_TAIL}
          }`,
      }),
    [String(color), opacity, dryness],
  )
}
