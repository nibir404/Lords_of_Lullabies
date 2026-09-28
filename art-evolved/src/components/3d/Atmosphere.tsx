import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Fog } from 'three'
import { damp } from '@/utils/math'
import { resolveStyle } from './styleTarget'

/** Background and fog follow the corridor position, blending between neighbouring chambers. */
export function Atmosphere() {
  const scene = useThree((s) => s.scene)
  const state = useMemo(() => ({ bg: new Color('#efece6'), a: new Color(), b: new Color(), fog: new Fog('#efece6', 30, 120) }), [])

  useEffect(() => {
    scene.background = state.bg
    scene.fog = state.fog
    return () => {
      scene.background = null
      scene.fog = null
    }
  }, [scene, state])

  useFrame((_, dt) => {
    const st = resolveStyle()
    state.a.set(st.bgA)
    state.b.set(st.bgB)
    state.a.lerp(state.b, st.mix)
    const k = damp(3, Math.min(dt, 0.05))
    state.bg.lerp(state.a, k)
    state.fog.color.copy(state.bg)
    state.fog.near += (st.fog[0] - state.fog.near) * k
    state.fog.far += (st.fog[1] - state.fog.far) * k
  })
  return null
}
