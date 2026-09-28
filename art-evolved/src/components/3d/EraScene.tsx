import { Component, Suspense, useEffect, type ReactNode } from 'react'
import type { Movement } from '@/data/types'
import { getScene } from '@/scenes/registry'
import { useStore } from '@/state/store'
import { chamberZ } from '@/state/world'

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

function Ready({ id }: { id: string }) {
  const markReady = useStore((s) => s.markReady)
  useEffect(() => {
    markReady(id, true)
    return () => markReady(id, false)
  }, [id, markReady])
  return null
}

/** Mounts one chamber at its place in the corridor. Scenes are code-split and disposed on unmount. */
export function EraScene({ movement, index, quality }: { movement: Movement; index: number; quality: number }) {
  const Scene = getScene(movement.visual.scene)
  return (
    <group position={[0, 0, chamberZ(index)]}>
      <SceneBoundary id={movement.id}>
        <Suspense fallback={null}>
          <Scene movement={movement} quality={quality} />
          <Ready id={movement.id} />
        </Suspense>
      </SceneBoundary>
    </group>
  )
}
