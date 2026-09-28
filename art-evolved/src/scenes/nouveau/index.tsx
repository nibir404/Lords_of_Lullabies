import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import type { SceneProps } from '../types'
import { Motes, useDisposable, usePalette, useSeed } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'

/** Whiplash vines: sinuous tubes that grow upward, revealed along their length by a shader. */
export default function NouveauScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const rng = useSeed(movement)
  const symbolism = movement.visual.variant === 'symbolism'
  const vines = useMemo(() => {
    return Array.from({ length: 16 }, (_, k) => {
      const x0 = -14 + (k / 15) * 28 + (rng() - 0.5) * 2
      const z0 = -6 - rng() * 14
      const amp = 1.2 + rng() * 2.2
      const freq = 1.5 + rng() * 2
      const h = 6 + rng() * 9
      const pts: Vector3[] = []
      for (let i = 0; i <= 40; i++) {
        const t = i / 40
        const whip = Math.sin(t * Math.PI * freq + k) * amp * t + Math.sin(t * 13 + k) * 0.15
        pts.push(new Vector3(x0 + whip, t * h, z0 + Math.cos(t * Math.PI * freq * 0.7 + k) * amp * 0.5 * t))
      }
      const curve = new CatmullRomCurve3(pts)
      return { geo: new TubeGeometry(curve, 120, 0.05 + rng() * 0.09, 8, false), tip: pts[pts.length - 1], delay: rng() * 4 }
    })
  }, [rng])
  useEffect(() => () => vines.forEach((v) => v.geo.dispose()), [vines])

  const frame = useDisposable(() => {
    const pts: Vector3[] = []
    for (let i = 0; i <= 60; i++) {
      const t = i / 60
      const a = Math.PI * t
      pts.push(new Vector3(-Math.cos(a) * 12 + Math.sin(t * 20) * 0.3, Math.sin(a) * 15 * (1 - 0.15 * Math.sin(t * Math.PI * 4)), -22))
    }
    return new TubeGeometry(new CatmullRomCurve3(pts), 200, 0.35, 10, false)
  }, [])

  const material = useDisposable(
    () =>
      sceneShader({
        uniforms: { uTime: { value: 0 }, uA: { value: pal.colors[1].clone() }, uB: { value: pal.accent.clone() } },
        vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uA; uniform vec3 uB; varying vec2 vUv; varying vec3 vN;
          void main(){
            float grow = fract(uTime * 0.045) * 1.6;
            if (vUv.x > grow) discard;
            float light = 0.45 + 0.55 * max(dot(vN, normalize(vec3(0.3, 0.8, 0.6))), 0.0);
            vec3 c = mix(uA, uB, smoothstep(0.2, 1.0, vUv.x));
            c *= light + smoothstep(grow - 0.05, grow, vUv.x) * 1.5;
            gl_FragColor = vec4(c, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [pal],
  )
  useFrame((s) => (material.uniforms.uTime.value = s.clock.elapsedTime + 6))

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color={pal.bg.clone().multiplyScalar(1.4)} roughness={0.8} />
      </mesh>
      {vines.map((v, i) => (
        <group key={i}>
          <mesh geometry={v.geo} material={material} />
          <group position={v.tip}>
            {Array.from({ length: 7 }, (_, p) => (
              <mesh key={p} position={[Math.cos((p / 7) * Math.PI * 2) * 0.32, Math.sin((p / 7) * Math.PI * 2) * 0.32, 0]} scale={[0.22, 0.12, 0.08]}>
                <sphereGeometry args={[1, 10, 8]} />
                <meshStandardMaterial color={pal.hex.accent} metalness={0.6} roughness={0.3} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      <mesh geometry={frame}>
        <meshStandardMaterial color={pal.hex.accent} metalness={0.85} roughness={0.25} />
      </mesh>
      {symbolism &&
        [
          [-6, 9, -12, 1.2],
          [7, 11, -16, 0.8],
          [0, 14, -20, 2],
        ].map(([x, y, z, r], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[r, 32, 16]} />
              <meshBasicMaterial color={i === 2 ? '#f4efe6' : pal.hex.accent} toneMapped={false} />
            </mesh>
            {i === 2 && (
              <mesh position={[0, 0, r * 0.98]}>
                <circleGeometry args={[r * 0.45, 48]} />
                <meshBasicMaterial color={pal.hex.colors[0]} />
              </mesh>
            )}
          </group>
        ))}
      <Motes count={Math.round(200 * quality)} area={[30, 14, 24]} position={[0, 0, -10]} color={symbolism ? '#c6a3e8' : '#f1e9d2'} size={0.07} rise={0.12} opacity={0.6} />
    </group>
  )
}

