import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useStore } from '@/state/store'
import { Atmosphere } from './Atmosphere'
import { CameraController } from './CameraController'
import { LightRig } from './LightRig'
import { StylePass } from './StylePass'
import { Timeline } from './Timeline'
import { Views } from './Views'
import { VIEW_CONFIG } from './viewConfig'

const QUALITY_SCALE = { high: 1, medium: 0.6, low: 0.35 } as const

/** The single, continuous WebGL world. Everything visual lives inside this one canvas. */
export default function ArtWorld() {
  const quality = useStore((s) => s.quality)
  const view = useStore((s) => s.view)
  const device = useStore((s) => s.device)
  const maxDpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, device === 'desktop' ? 2 : 1.25)
  const [dpr, setDpr] = useState(maxDpr)
  const q = QUALITY_SCALE[quality]

  return (
    <Canvas
      flat
      dpr={dpr}
      frameloop={view === 'create' ? 'never' : 'always'}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: 50, near: 0.1, far: 700, position: VIEW_CONFIG.landing.pos }}
      aria-label="ART//EVOLVED — an explorable 3D museum of visual history"
      role="img"
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(0.7, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
        flipflops={4}
        onFallback={() => setDpr(0.75)}
      />
      <Atmosphere />
      <LightRig />
      <CameraController />
      <Timeline quality={q} />
      <Views quality={q} />
      <StylePass />
    </Canvas>
  )
}
