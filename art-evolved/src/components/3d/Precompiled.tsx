import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { WebGLRenderTarget, type Camera, type Group, type Material, type Object3D, type Scene, type Texture, type WebGLRenderer } from 'three'

/** Longest we keep freshly mounted content hidden while its shaders compile. */
const MAX_WAIT = 2500

let offscreen: WebGLRenderTarget | null = null

/**
 * three.js keys programs on the output colour space, which differs between drawing to the screen
 * (sRGB) and into StylePass's render target (linear). Transitions switch between the two, so both
 * variants are compiled up front — otherwise the first transition through a room recompiles it.
 */
async function compileBothVariants(gl: WebGLRenderer, root: Object3D, camera: Camera, scene: Scene, alive: () => boolean) {
  offscreen ??= new WebGLRenderTarget(1, 1)
  const materials = new Set<Material>()
  for (const rt of [offscreen, null]) {
    const prev = gl.getRenderTarget()
    gl.setRenderTarget(rt)
    // compile() only starts the link; with KHR_parallel_shader_compile it completes off-thread.
    for (const m of gl.compile(root, camera, scene)) materials.add(m)
    gl.setRenderTarget(prev)
  }
  // three's own compileAsync poll throws if a material is disposed mid-compile (the chamber was left
  // before it finished), so readiness is polled here, treating vanished programs as done.
  type Props = { get: (m: Material) => { currentProgram?: { isReady: () => boolean } } }
  const props = (gl as unknown as { properties: Props }).properties
  while (materials.size && alive()) {
    for (const m of materials) {
      const program = props.get(m).currentProgram
      if (!program || program.isReady()) materials.delete(m)
    }
    if (materials.size) await new Promise((r) => setTimeout(r, 16))
  }
}

function collectTextures(root: Group) {
  const out = new Set<Texture>()
  root.traverse((o) => {
    const m = (o as { material?: Material | Material[] }).material
    if (!m) return
    for (const mat of Array.isArray(m) ? m : [m]) {
      for (const v of Object.values(mat as unknown as Record<string, unknown>)) if ((v as Texture)?.isTexture) out.add(v as Texture)
      const uniforms = (mat as { uniforms?: Record<string, { value: unknown }> }).uniforms
      if (uniforms) for (const u of Object.values(uniforms)) if ((u?.value as Texture)?.isTexture) out.add(u.value as Texture)
    }
  })
  return out
}

/**
 * Place inside the Suspense boundary, after the content. Once the content has committed it compiles
 * every material under `target` with KHR_parallel_shader_compile (off the frame path) and uploads its
 * textures, then calls `onReady`. Without this, the first frame a chamber is drawn blocks on shader
 * linking and texture uploads — the main source of transition stutter.
 */
export function Precompile({ target, onReady }: { target: RefObject<Group>; onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const root = target.current
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onReady()
    }
    const timeout = window.setTimeout(finish, MAX_WAIT)
    if (root) {
      compileBothVariants(gl, root, camera, scene, () => !done)
        .then(() => {
          if (done) return
          for (const t of collectTextures(root)) gl.initTexture(t)
          finish()
        })
        .catch(finish)
    } else finish()
    return () => {
      done = true
      clearTimeout(timeout)
    }
    // Compile once per mount; camera/scene identity is stable for the canvas lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

/** A group that stays invisible until everything inside it has been compiled. */
export function PrecompiledGroup({ children }: { children: (precompile: ReactNode) => ReactNode }) {
  const ref = useRef<Group>(null)
  const reveal = () => {
    if (ref.current) ref.current.visible = true
  }
  return (
    <group ref={ref} visible={false}>
      {children(<Precompile target={ref} onReady={reveal} />)}
    </group>
  )
}
