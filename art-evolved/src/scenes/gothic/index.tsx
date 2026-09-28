import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, ExtrudeGeometry, Path, Shape } from 'three'
import type { SceneProps } from '../types'
import { LightShaft, Motes, useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'

function archShape(w: number, h: number, pointed: boolean, thickness: number) {
  const outer = new Shape()
  const inner = new Path()
  const build = (p: Shape | Path, hw: number, hh: number) => {
    p.moveTo(-hw, 0)
    p.lineTo(-hw, hh)
    if (pointed) {
      p.absarc(hw, hh, hw * 2, Math.PI, Math.PI - Math.PI / 3, true)
      p.absarc(-hw, hh, hw * 2, Math.PI / 3, 0, true)
    } else p.absarc(0, hh, hw, Math.PI, 0, true)
    p.lineTo(hw, 0)
    p.lineTo(-hw, 0)
  }
  build(outer, w / 2, h)
  build(inner, w / 2 - thickness, h)
  outer.holes.push(inner)
  return outer
}

function Arch({ w, h, pointed, position, rotation = 0, color }: { w: number; h: number; pointed: boolean; position: [number, number, number]; rotation?: number; color: string }) {
  const geo = useDisposable(() => new ExtrudeGeometry(archShape(w, h, pointed, 0.5), { depth: 0.8, bevelEnabled: false, curveSegments: 24 }), [w, h, pointed])
  return (
    <mesh geometry={geo} position={position} rotation={[0, rotation, 0]}>
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

/** Stained glass: Voronoi cells of palette colour, lead cames at the cell borders, breathing light. */
function StainedGlass({ colors, rose, position, size }: { colors: string[]; rose: boolean; position: [number, number, number]; size: [number, number] }) {
  const mat = useDisposable(
    () =>
      sceneShader({
        transparent: true,
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uRose: { value: rose ? 1 : 0 },
          uAspect: { value: size[1] / size[0] },
          uC: { value: colors.slice(0, 4).map((c) => new Color(c)) },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uRose; uniform float uAspect; uniform vec3 uC[4]; varying vec2 vUv;
          void main(){
            vec2 p = vec2(vUv.x - 0.5, vUv.y * uAspect);
            float inside;
            vec2 q;
            if (uRose > 0.5) {
              vec2 c = vUv - 0.5;
              inside = step(length(c), 0.5);
              q = vec2(atan(c.y, c.x) / 6.2831 * 16.0, length(c) * 7.0);
            } else {
              float spring = uAspect - 0.8;
              inside = step(p.y, spring) + step(spring, p.y) * step(distance(p, vec2(0.5, spring)), 1.0) * step(distance(p, vec2(-0.5, spring)), 1.0);
              inside = min(inside, 1.0);
              q = vec2(vUv.x * 4.0, vUv.y * 4.0 * uAspect);
            }
            vec2 g = floor(q), f = fract(q);
            float d1 = 8.0, d2 = 8.0; vec2 id = vec2(0.0);
            for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
              vec2 o = vec2(float(x), float(y));
              vec2 pt = o + hash22(g + o) * 0.85;
              float d = length(pt - f);
              if (d < d1) { d2 = d1; d1 = d; id = g + o; } else if (d < d2) d2 = d;
            }
            float h = hash21(id);
            vec3 col = h < 0.25 ? uC[0] : h < 0.5 ? uC[1] : h < 0.75 ? uC[2] : uC[3];
            float lead = smoothstep(0.03, 0.08, d2 - d1);
            float glow = 1.3 + 0.35 * sin(uTime * 0.4 + h * 6.28);
            gl_FragColor = vec4(col * lead * glow, inside);
            if (inside < 0.5) discard;
            ${FOG_TAIL}
          }`,
      }),
    [colors.join(), rose, size[0], size[1]],
  )
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <mesh material={mat} position={position}>
      <planeGeometry args={size} />
    </mesh>
  )
}

export default function GothicScene({ movement, quality }: SceneProps) {
  const pal = usePalette(movement)
  const pointed = movement.visual.variant !== 'romanesque'
  const stone = pointed ? '#3a3530' : '#4a3f35'
  const bays = useMemo(() => Array.from({ length: 7 }, (_, i) => 2 - i * 4.4), [])
  const H = pointed ? 11 : 6.5
  const glass = movement.visual.palette.colors
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color="#1b1814" roughness={0.9} />
      </mesh>
      {bays.map((z, i) => (
        <group key={z}>
          {[-6.5, 6.5].map((x) => (
            <group key={x} position={[x, 0, z]}>
              {[0, 1, 2, 3].map((k) => (
                <mesh key={k} position={[Math.cos(k * 1.57) * 0.28, H / 2, Math.sin(k * 1.57) * 0.28]}>
                  <cylinderGeometry args={[0.22, 0.26, H, 10]} />
                  <meshStandardMaterial color={stone} roughness={0.95} />
                </mesh>
              ))}
            </group>
          ))}
          <Arch w={13} h={H} pointed={pointed} position={[0, 0, z - 0.4]} color={stone} />
          {i < bays.length - 1 &&
            [-1, 1].map((side) => (
              <group key={side}>
                <Arch w={4.4} h={H * 0.55} pointed={pointed} position={[side * 6.5, 0, z - 2.2]} rotation={Math.PI / 2} color={stone} />
                <StainedGlass colors={glass} rose={false} position={[side * 11, H * 0.35, z - 2.2]} size={[1.8, H * 0.8]} />
              </group>
            ))}
        </group>
      ))}
      <mesh position={[0, H + 4, -30]}>
        <boxGeometry args={[30, 34, 1]} />
        <meshStandardMaterial color={stone} roughness={1} />
      </mesh>
      <StainedGlass colors={glass} rose position={[0, H + 3, -29.4]} size={[8, 8]} />
      {pointed &&
        [-3.2, 3.2].map((x) => <StainedGlass key={x} colors={glass} rose={false} position={[x, H * 0.45, -29.4]} size={[2, H * 0.9]} />)}
      {[-9, -18, -26].map((z, i) => (
        <LightShaft key={z} position={[i % 2 ? 4 : -4, 6, z]} rotation={[0, 0, i % 2 ? 0.5 : -0.5]} radiusTop={0.6} radiusBottom={2.6} height={16} color="#f3e6c8" opacity={0.09} />
      ))}
      <Motes count={Math.round(260 * quality)} area={[14, 16, 32]} position={[0, 0, -12]} color="#f3e3b8" size={0.05} rise={0.05} sway={0.3} opacity={0.6} />
      <mesh position={[0, 1.1, -24]}>
        <boxGeometry args={[4, 2.2, 1.5]} />
        <meshStandardMaterial color={pal.hex.accent} metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  )
}
