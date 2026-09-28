import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { HalfFloatType, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget } from 'three'
import { POST_FRAGMENT, POST_MODES, POST_VERTEX, TRANSITION_KINDS } from '@/shaders/post'
import { useStore } from '@/state/store'
import { world } from '@/state/world'
import { createGlyphAtlas } from './glyphs'
import { resolveStyle, srgbVec } from './styleTarget'
import { luminance, mixHex } from '@/utils/color'
import { damp } from '@/utils/math'

/**
 * Takes over rendering (useFrame priority 1). When no stylisation is active it renders straight
 * to screen; otherwise the scene goes through one full-screen pass that implements every
 * "digital language" of the museum: pixel, ASCII, dither stages, halftone, glitch and transitions.
 */
export function StylePass() {
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)

  const target = useMemo(() => new WebGLRenderTarget(2, 2, { type: HalfFloatType, samples: 4 }), [])
  const glyphs = useMemo(() => createGlyphAtlas(), [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: POST_VERTEX,
        fragmentShader: POST_FRAGMENT,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          tScene: { value: target.texture },
          tGlyphs: { value: glyphs },
          uRes: { value: new Vector2(2, 2) },
          uTime: { value: 0 },
          uMode: { value: 0 },
          uAmount: { value: 0 },
          uPixelSize: { value: 6 },
          uColorLimit: { value: 6 },
          uDither: { value: 0.6 },
          uNoise: { value: 0.1 },
          uAsciiCell: { value: 10 },
          uContrast: { value: 1.2 },
          uCharset: { value: 0 },
          uStage: { value: 2 },
          uThreshold: { value: 0.5 },
          uPattern: { value: 0 },
          uGlitch: { value: 0.6 },
          uTear: { value: 0.5 },
          uSort: { value: 0.4 },
          uTransit: { value: 0 },
          uTransKind: { value: 0 },
          uGrain: { value: 0.025 },
          uInk: { value: new Vector3() },
          uPaper: { value: new Vector3(1, 1, 1) },
          uAccent: { value: new Vector3() },
        },
      }),
    [target, glyphs],
  )
  const post = useMemo(() => {
    const scene = new Scene()
    const quad = new Mesh(new PlaneGeometry(2, 2), material)
    quad.frustumCulled = false
    scene.add(quad)
    return { scene, quad, camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1) }
  }, [material])

  useEffect(() => {
    const w = Math.max(2, Math.floor(size.width * dpr))
    const h = Math.max(2, Math.floor(size.height * dpr))
    target.setSize(w, h)
    material.uniforms.uRes.value.set(w, h)
  }, [size, dpr, target, material])

  useEffect(
    () => () => {
      target.dispose()
      glyphs.dispose()
      material.dispose()
      post.quad.geometry.dispose()
    },
    [target, glyphs, material, post],
  )

  const cur = useMemo(() => ({ mode: 0, amount: 0 }), [])

  useFrame((state, dt) => {
    const u = material.uniforms
    const s = useStore.getState()
    const style = resolveStyle()
    let mode: number = POST_MODES[style.post.mode]
    let amount = style.post.amount
    if (world.postOverride) {
      mode = world.postOverride.mode
      amount = world.postOverride.amount
    }
    if (s.view === 'timeline' && style.instrument === 'glitch') amount *= 0.4 + s.instruments.glitch.intensity * 0.6

    // Mode changes ramp the old effect out before the new one ramps in — never a hard cut.
    if (cur.mode !== mode) {
      cur.amount -= dt * 3.2
      if (cur.amount <= 0) {
        cur.amount = 0
        cur.mode = mode
      }
    } else {
      cur.amount += (amount - cur.amount) * damp(4, dt)
    }

    const bg = mixHex(style.bgA, style.bgB, style.mix)
    const ink = mixHex(style.inkA, style.inkB, style.mix)
    const light = luminance(bg) > luminance(ink) ? bg : ink
    const dark = light === bg ? ink : bg
    if (cur.mode === POST_MODES.ascii) {
      srgbVec(bg, u.uPaper.value)
      srgbVec(style.accent, u.uInk.value)
    } else if (cur.mode === POST_MODES.halftone) {
      srgbVec(luminance(bg) > 0.6 ? bg : '#f7f1e3', u.uPaper.value)
      srgbVec(dark, u.uInk.value)
    } else if (s.view === 'timeline' && style.transition === 'fade') {
      srgbVec(bg, u.uPaper.value)
      srgbVec(ink, u.uInk.value)
    } else {
      srgbVec(light, u.uPaper.value)
      srgbVec(dark, u.uInk.value)
    }
    srgbVec(style.accent, u.uAccent.value)

    const ins = s.instruments
    const inTimeline = s.view === 'timeline'
    u.uPixelSize.value = (inTimeline && style.instrument === 'pixel' ? ins.pixel.pixelSize : 6) * Math.max(1, dpr * 0.75)
    u.uColorLimit.value = inTimeline && style.instrument === 'pixel' ? ins.pixel.colorLimit : 6
    u.uDither.value = inTimeline && style.instrument === 'pixel' ? ins.pixel.dither : 0.6
    u.uNoise.value = inTimeline && style.instrument === 'pixel' ? ins.pixel.noise : 0.05
    const asciiOn = inTimeline && style.instrument === 'ascii'
    u.uAsciiCell.value = (asciiOn ? ins.ascii.density : 11) * (asciiOn ? ins.ascii.scale : 1) * Math.max(1, dpr * 0.8)
    u.uContrast.value = asciiOn ? ins.ascii.contrast : 1.25
    u.uCharset.value = asciiOn ? ins.ascii.charset : 0
    const ditherOn = inTimeline && style.instrument === 'dither'
    u.uStage.value = ditherOn ? ins.dither.stage : 2
    u.uThreshold.value = ditherOn ? ins.dither.threshold : 0.5
    u.uPattern.value = ditherOn ? ins.dither.pattern : 0
    u.uGlitch.value = inTimeline && style.instrument === 'glitch' ? ins.glitch.intensity : 0.35
    u.uTear.value = inTimeline && style.instrument === 'glitch' ? ins.glitch.tear : 0.4
    u.uSort.value = inTimeline && style.instrument === 'glitch' ? ins.glitch.sort : 0.2

    const transit = world.transit * (s.reducedMotion ? 0.35 : 1)
    u.uTransit.value = transit
    u.uTransKind.value = TRANSITION_KINDS[style.transition]
    u.uTime.value = state.clock.elapsedTime
    u.uMode.value = cur.mode
    u.uAmount.value = cur.amount

    if (cur.amount < 0.004 && transit < 0.004) {
      gl.setRenderTarget(null)
      gl.render(state.scene, state.camera)
      return
    }
    gl.setRenderTarget(target)
    gl.render(state.scene, state.camera)
    gl.setRenderTarget(null)
    gl.render(post.scene, post.camera)
  }, 1)

  return null
}
