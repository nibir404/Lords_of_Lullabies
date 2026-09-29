import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore } from '@/state/store'
import { TooltipProvider } from '@/components/ui/tooltip'
import { HUD } from '@/components/hud/HUD'
import { Loader } from '@/components/hud/Loader'
import { SearchCommand } from '@/components/hud/SearchCommand'
import { MenuSheet } from '@/components/hud/MenuSheet'
import { ArtistSheet, ArtistsIndex } from '@/components/hud/ArtistSheet'
import { FilmDialog } from '@/components/hud/FilmDialog'
import { SeoContent } from '@/components/SeoContent'
import { useEnvironment } from '@/hooks/useEnvironment'
import { useThemeSync } from '@/hooks/useThemeSync'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useSoundSync } from '@/hooks/useSoundSync'
import { useIdle } from '@/hooks/useIdle'
import { useWorldInput } from '@/hooks/useWorldInput'

const ArtWorld = lazy(() => import('@/components/3d/ArtWorld'))
const MobileExperience = lazy(() => import('@/components/mobile/MobileExperience'))
const CreateStudio = lazy(() => import('@/components/create/CreateStudio'))

class WorldBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error('[ART//EVOLVED] the 3D world failed; falling back to the 2D archive', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function Stage() {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  useWorldInput(ref)
  return (
    <>
      <div ref={ref} className="fixed inset-0 touch-none" onPointerDown={() => (document.activeElement as HTMLElement | null)?.blur?.()}>
        <Suspense fallback={null}>
          <ArtWorldReady onReady={onReady} />
        </Suspense>
      </div>
      <HUD />
      <Loader done={ready} />
    </>
  )
}

function ArtWorldReady({ onReady }: { onReady: () => void }) {
  // Mounting means the chunk and the Canvas are live; give the first frames a moment to compile.
  useEffect(() => {
    const t = setTimeout(onReady, 700)
    return () => clearTimeout(t)
  }, [onReady])
  return <ArtWorld />
}

export default function App() {
  useEnvironment()
  useThemeSync()
  useKeyboard()
  useSoundSync()
  useIdle()
  const device = useStore((s) => s.device)
  const webgl = useStore((s) => s.webgl)
  const view = useStore((s) => s.view)
  const threeD = webgl && device !== 'mobile'

  return (
    <TooltipProvider delayDuration={200}>
      {threeD ? (
        <WorldBoundary
          fallback={
            <Suspense fallback={null}>
              <MobileExperience fallback />
            </Suspense>
          }
        >
          <Stage />
        </WorldBoundary>
      ) : (
        <Suspense fallback={<Loader done={false} />}>
          <MobileExperience fallback={!webgl} />
        </Suspense>
      )}
      {view === 'create' && (
        <Suspense fallback={null}>
          <CreateStudio />
        </Suspense>
      )}
      <SearchCommand />
      <MenuSheet />
      <ArtistSheet />
      <ArtistsIndex />
      <FilmDialog />
      <div className="grain" aria-hidden />
      <SeoContent />
    </TooltipProvider>
  )
}
