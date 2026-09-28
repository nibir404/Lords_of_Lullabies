import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, InstancedMesh, Object3D } from 'three'
import type { SceneProps } from '../types'
import { Motes, useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'
import { mulberry32 } from '@/utils/random'

/**
 * An immersive room: glowing spheres repeated toward infinity, mirrored in a dark floor
 * (a second, inverted instance set), walls dissolving into polka-dot fields.
 */
export default function InstallationScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const count = Math.round(420 * Math.max(0.5, quality))
  const ref = useRef<InstancedMesh>(null)
  const mirror = useRef<InstancedMesh>(null)
  const data = useMemo(() => {
    const rng = mulberry32(1965)
    return Array.from({ length: count }, (_, i) => ({ x: (rng() - 0.5) * 34, y: 1 + rng() * 11, z: -2 - rng() * 30, s: 0.12 + rng() * 0.3, c: pal.colors[i % pal.colors.length].clone(), ph: rng() * 6 }))
  }, [count, pal])
  const tmp = useMemo(() => ({ o: new Object3D(), c: new Color() }), [])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    const a = ref.current, b = mirror.current
    if (!a || !b) return
    data.forEach((d, i) => {
      const pulse = 0.75 + 0.25 * Math.sin(t * 1.3 + d.ph)
      tmp.o.position.set(d.x, d.y + Math.sin(t * 0.4 + d.ph) * 0.15, d.z)
      tmp.o.scale.setScalar(d.s * pulse)
      tmp.o.updateMatrix()
      a.setMatrixAt(i, tmp.o.matrix)
      tmp.o.position.y = -tmp.o.position.y
      tmp.o.updateMatrix()
      b.setMatrixAt(i, tmp.o.matrix)
      tmp.c.copy(d.c).multiplyScalar(0.6 + pulse * 0.8)
      a.setColorAt(i, tmp.c)
      tmp.c.multiplyScalar(0.35)
      b.setColorAt(i, tmp.c)
    })
    a.instanceMatrix.needsUpdate = b.instanceMatrix.needsUpdate = true
    if (a.instanceColor) a.instanceColor.needsUpdate = true
    if (b.instanceColor) b.instanceColor.needsUpdate = true
  })
  const walls = useDisposable(
    () =>
      sceneShader({
        side: BackSide,
        uniforms: { uTime: { value: 0 }, uDot: { value: pal.accent.clone() }, uBg: { value: pal.bg.clone() } },
        vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = position; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uDot; uniform vec3 uBg; varying vec3 vP;
          void main(){
            vec2 q = abs(vP.x) > 17.9 ? vP.zy : vP.xy;
            vec2 g = q * 0.9;
            vec2 id = floor(g);
            float r = 0.18 + 0.2 * hash21(id);
            float d = length(fract(g) - 0.5);
            float dotm = smoothstep(r + 0.02, r - 0.02, d) * (0.4 + 0.6 * sin(uTime * 0.5 + hash21(id) * 6.28) * 0.5 + 0.3);
            gl_FragColor = vec4(mix(uBg, uDot, dotm * 0.7), 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [pal],
  )
  useFrame((s) => (walls.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <group>
      <mesh material={walls} position={[0, 7, -14]}>
        <boxGeometry args={[36, 14.2, 38]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -14]}>
        <planeGeometry args={[36, 38]} />
        <meshStandardMaterial color="#050508" roughness={0.1} metalness={0.9} transparent opacity={0.82} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={mirror} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <Motes count={Math.round(120 * quality)} area={[30, 12, 30]} position={[0, 0, -14]} color={pal.hex.accent} size={0.05} rise={0.1} opacity={0.6} />
    </group>
  )
}
