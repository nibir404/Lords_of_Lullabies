import { useEffect } from 'react'
import { useStore, type Device, type Quality } from '@/state/store'

export function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    const ok = !!gl
    ;(gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext()
    return ok
  } catch {
    return false
  }
}

function detectDevice(): Device {
  const w = window.innerWidth
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (w < 768) return 'mobile'
  if (w < 1100 || (coarse && w < 1400)) return 'tablet'
  return 'desktop'
}

function detectQuality(device: Device): Quality {
  if (device === 'mobile') return 'low'
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if (device === 'tablet' || cores <= 4 || mem <= 4) return 'medium'
  return 'high'
}

/** Capability detection: WebGL support, device class, quality tier and reduced-motion preference. */
export function useEnvironment() {
  const setEnv = useStore((s) => s.setEnv)
  useEffect(() => {
    const webgl = detectWebGL()
    const apply = () => {
      const device = detectDevice()
      setEnv({ device, quality: detectQuality(device), webgl })
    }
    apply()
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setEnv({ reducedMotion: mq.matches })
    const onMq = () => setEnv({ reducedMotion: mq.matches })
    mq.addEventListener('change', onMq)
    let t = 0
    const onResize = () => {
      clearTimeout(t)
      t = window.setTimeout(apply, 250)
    }
    window.addEventListener('resize', onResize)
    return () => {
      mq.removeEventListener('change', onMq)
      window.removeEventListener('resize', onResize)
    }
  }, [setEnv])
}
