import { useFrame } from '@react-three/fiber'
import { Color } from 'three'
import type { SceneProps } from '../types'
import { useDisposable, usePalette } from '../shared'
import { FOG_TAIL, sceneShader } from '../glsl'

const OP_MODES = { moire: 0, stripes: 1, checker: 2 } as const

/** Optical surfaces: interfering gratings, undulating stripes, a bulging checkerboard. */
function OpSurface({ mode, ink, paper, accent, position, rotation = [0, 0, 0], size }: {
  mode: keyof typeof OP_MODES
  ink: string
  paper: string
  accent: string
  position: [number, number, number]
  rotation?: [number, number, number]
  size: [number, number]
}) {
  const mat = useDisposable(
    () =>
      sceneShader({
        uniforms: { uTime: { value: 0 }, uMode: { value: OP_MODES[mode] }, uInk: { value: new Color(ink) }, uPaper: { value: new Color(paper) }, uAccent: { value: new Color(accent) }, uAspect: { value: size[0] / size[1] } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uMode; uniform vec3 uInk; uniform vec3 uPaper; uniform vec3 uAccent; uniform float uAspect; varying vec2 vUv;
          void main(){
            vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
            float v;
            if (uMode < 0.5) {
              float a = uTime * 0.04;
              vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
              float g1 = step(0.5, fract(length(p - vec2(0.12, 0.0)) * 48.0));
              float g2 = step(0.5, fract(length(q + vec2(0.12, 0.0)) * 48.0));
              v = abs(g1 - g2);
            } else if (uMode < 1.5) {
              float w = sin(p.y * 7.0 + uTime * 0.4) * 0.05 * cos(p.x * 3.0);
              v = step(0.5, fract((p.x + w) * 30.0));
            } else {
              float r = length(p);
              vec2 q = p * (1.0 + 1.6 * exp(-r * r * 10.0) * (0.8 + 0.2 * sin(uTime * 0.3)));
              v = mod(floor(q.x * 12.0) + floor(q.y * 12.0), 2.0);
            }
            vec3 c = mix(uPaper, uInk, v);
            gl_FragColor = vec4(c, 1.0);
            ${FOG_TAIL}
          }`,
      }),
    [mode, ink, paper, accent, size[0], size[1]],
  )
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <mesh material={mat} position={position} rotation={rotation}>
      <planeGeometry args={size} />
    </mesh>
  )
}

export default function OpScene({ movement }: SceneProps) {
  const pal = usePalette(movement)
  const ink = movement.visual.palette.ink
  const paper = movement.visual.palette.bg
  return (
    <group>
      <OpSurface mode="checker" ink={ink} paper={paper} accent={pal.hex.accent} position={[0, 0.01, -8]} rotation={[-Math.PI / 2, 0, 0]} size={[60, 40]} />
      <OpSurface mode="moire" ink={ink} paper={paper} accent={pal.hex.accent} position={[0, 9, -24]} size={[30, 18]} />
      <OpSurface mode="stripes" ink={ink} paper={paper} accent={pal.hex.accent} position={[-15, 7, -10]} rotation={[0, 0.9, 0]} size={[16, 14]} />
      <OpSurface mode="stripes" ink={ink} paper={paper} accent={pal.hex.accent} position={[15, 7, -10]} rotation={[0, -0.9, 0]} size={[16, 14]} />
      <mesh position={[0, 4.5, -8]}>
        <sphereGeometry args={[2.4, 64, 32]} />
        <meshStandardMaterial color={pal.hex.accent} roughness={0.3} />
      </mesh>
    </group>
  )
}
