import { useStore } from '@/state/store'
import { TopBar } from './TopBar'
import { LandingOverlay } from './LandingOverlay'
import { BottomTimeline } from './BottomTimeline'
import { EraPanel } from './EraPanel'
import { SurpriseOverlay } from './SurpriseOverlay'
import { ChamberStatus } from './ChamberStatus'
import { EvolutionOverlay, FinaleOverlay, MapOverlay, MediaOverlay, MorphOverlay } from './ViewOverlays'

/** The HTML layer above the world. Which chrome appears depends on the wing being visited. */
export function HUD() {
  const view = useStore((s) => s.view)
  if (view === 'create') return null
  return (
    <>
      <TopBar />
      {view === 'landing' && <LandingOverlay />}
      {view === 'timeline' && (
        <>
          <BottomTimeline />
          <EraPanel />
          <ChamberStatus />
        </>
      )}
      {view === 'evolution' && <EvolutionOverlay />}
      {view === 'morph' && <MorphOverlay />}
      {view === 'media' && <MediaOverlay />}
      {view === 'map' && <MapOverlay />}
      {view === 'finale' && <FinaleOverlay />}
      <SurpriseOverlay />
    </>
  )
}
