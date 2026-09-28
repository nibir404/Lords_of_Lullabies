import { ShaderMaterial, UniformsLib, type ShaderMaterialParameters } from 'three'
import { NOISE_GLSL } from '@/shaders/noise'

export const FOG_TAIL = /* glsl */ `
#include <colorspace_fragment>
#include <fog_fragment>
`

/** ShaderMaterial pre-wired for scene fog and correct colour-space output. */
export function sceneShader(params: ShaderMaterialParameters & { uniforms: Record<string, { value: unknown }> }) {
  const vertexShader = `#include <fog_pars_vertex>\n${NOISE_GLSL}\n${params.vertexShader ?? ''}`
  const fragmentShader = `#include <fog_pars_fragment>\n${NOISE_GLSL}\n${params.fragmentShader ?? ''}`
  return new ShaderMaterial({
    ...params,
    vertexShader,
    fragmentShader,
    fog: true,
    uniforms: { ...UniformsLib.fog, ...params.uniforms },
  })
}
