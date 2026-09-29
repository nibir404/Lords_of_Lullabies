import { lazy, Suspense, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore, type ViewId } from '@/state/store'
import { world } from '@/state/world'
import { PrecompiledGroup } from './Precompiled'

const LandingView = lazy(() => import('./views/LandingView'))
const EvolutionView = lazy(() => import('./views/EvolutionView'))
const MorphView = lazy(() => import('./views/MorphView'))
const MediaView = lazy(() => import('./views/MediaView'))
const MapView = lazy(() => import('./views/MapView'))
const FinaleView = lazy(() => import('./views/FinaleView'))

function ViewScene({ id, quality }: { id: ViewId; quality: number }) {
  switch (id) {
    case 'landing':
      return <LandingView quality={quality} />
    case 'evolution':
      return <EvolutionView quality={quality} />
    case 'morph':
      return <MorphView quality={quality} />
    case 'media':
      return <MediaView quality={quality} />
    case 'map':
      return <MapView />
    case 'finale':
      return <FinaleView quality={quality} />
    default:
      return null
  }
}

/** Mounts the active wing, and keeps the one being left alive until the flight completes. */
export function Views({ quality }: { quality: number }) {
  const view = useStore((s) => s.view)
  const prev = useStore((s) => s.prevView)
  const [keepPrev, setKeepPrev] = useState(false)

  useEffect(() => {
    setKeepPrev(prev !== view)
  }, [view, prev])

  useFrame(() => {
    if (keepPrev && !world.tweening && useStore.getState().viewChangedAt < performance.now() - 200) setKeepPrev(false)
  })

  const ids = new Set<ViewId>([view])
  if (keepPrev) ids.add(prev)
  return (
    <>
      {[...ids].map((id) => (
        <PrecompiledGroup key={id}>
          {(precompile) => (
            <Suspense fallback={null}>
              <ViewScene id={id} quality={quality} />
              {precompile}
            </Suspense>
          )}
        </PrecompiledGroup>
      ))}
    </>
  )
}
