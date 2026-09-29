import { Component, Suspense, useEffect, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Movement } from '@/data/types'
import { getScene } from '@/scenes/registry'
import { useStore } from '@/state/store'
import { chamberZ, world } from '@/state/world'
import { Precompile } from './Precompiled'

class SceneBoundary extends Component<{ children: ReactNode; id: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error(`[ART//EVOLVED] chamber "${this.props.id}" failed to render`, error)
  }
  render() {
    return this.state.failed ? <FallbackChamber /> : this.props.children
  }
}

function FallbackChamber() {
  return (
    <mesh position={[0, 4, -6]}>
      <icosahedronGeometry args={[3, 1]} />
      <meshBasicMaterial wireframe color="#888" />
    </mesh>
  )
}

/**
 * Mounts one chamber at its place in the corridor. Scenes are code-split and disposed on unmount.
 * A chamber stays hidden until its shaders are compiled, and while it sits in the Timeline's cache
 * (mounted but out of reach of the camera) it is not drawn at all.
 */
export function EraScene({ movement, index, quality }: { movement: Movement; index: number; quality: number }) {
  const Scene = getScene(movement.visual.scene)
  const ref = useRef<Group>(null)
  const compiled = useRef(false)
  const markReady = useStore((s) => s.markReady)
  useEffect(() => () => markReady(movement.id, false), [movement.id, markReady])

  useFrame(() => {
    const g = ref.current
    if (!g) return
    const view = useStore.getState().view
    const near = view === 'timeline' || view === 'create' ? Math.abs(index - world.f) <= 1 : true
    g.visible = compiled.current && near
  })

  return (
    <group ref={ref} position={[0, 0, chamberZ(index)]} visible={false}>
      <SceneBoundary id={movement.id}>
        <Suspense fallback={null}>
          <Scene movement={movement} quality={quality} />
          <Precompile
            target={ref}
            onReady={() => {
              compiled.current = true
              markReady(movement.id, true)
            }}
          />
        </Suspense>
      </SceneBoundary>
    </group>
  )
}
