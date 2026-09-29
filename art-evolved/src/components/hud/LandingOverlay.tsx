import { SCULPTURE_STAGES } from '@/utils/formations'
import { useStore } from '@/state/store'
import { world } from '@/state/world'
import { Button } from '@/components/ui/button'
import { useWorldValue } from '@/hooks/useWorldValue'

export function LandingOverlay() {
  const setView = useStore((s) => s.setView)
  const goToIndex = useStore((s) => s.goToIndex)
  const stage = useWorldValue(() => Math.round(world.autoStage.landing ?? 0) % SCULPTURE_STAGES.length, 4)
  return (
    <section className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-end px-5 pb-10 md:px-10 md:pb-14" aria-labelledby="hero-title">
      <div className="pointer-events-auto max-w-[min(820px,92vw)] animate-rise">
        <p className="font-sans text-[11px] uppercase tracking-museum text-muted">A procedural museum · 71 chambers · 45,000 years</p>
        <h1 id="hero-title" className="mt-4 font-sans text-[clamp(56px,11vw,168px)] font-semibold leading-[0.84] tracking-[-0.045em] text-fg">
          ART<span className="text-accent">//</span>
          <br />
          EVOLVED
        </h1>
        <p className="mt-6 font-sans text-[11px] uppercase tracking-[0.32em] text-fg">The visual history of humanity</p>
        <p className="mt-3 max-w-md font-serif text-[clamp(22px,2.4vw,30px)] italic leading-snug text-fg/80">“From marks on stone to machines that imagine.”</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button variant="primary" size="lg" onClick={() => setView('timeline')}>
            Enter the archive
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setView('timeline')
              goToIndex(Math.floor(Math.random() * 20) + 20)
            }}
          >
            Explore timeline
          </Button>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-10 right-5 hidden text-right md:right-10 md:bottom-14 md:block">
        <div className="font-mono text-[11px] uppercase tracking-museum text-muted">Sculpture · form {String(stage + 1).padStart(2, '0')} / {SCULPTURE_STAGES.length}</div>
        <div className="mt-1 font-sans text-sm uppercase tracking-museum text-fg">{SCULPTURE_STAGES[stage]}</div>
        <div className="mt-3 font-sans text-[11px] uppercase tracking-museum text-muted">Scroll or press Enter to begin</div>
      </div>
    </section>
  )
}
