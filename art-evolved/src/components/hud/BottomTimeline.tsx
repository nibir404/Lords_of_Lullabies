import { memo } from 'react'
import { MOVEMENTS } from '@/data/movements'
import { ERAS, ERA_BY_ID, formatSpan } from '@/data/eras'
import { HISTORIES } from '@/data/histories'
import { useStore } from '@/state/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ProceduralCanvas } from './ProceduralCanvas'
import { cn } from '@/lib/utils'

function progressGlyphs(i: number, total: number, width = 24) {
  const filled = Math.round(((i + 1) / total) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const Tick = memo(function Tick({ index, active, onSelect }: { index: number; active: number; onSelect: (i: number) => void }) {
  const m = MOVEMENTS[index]
  const d = Math.abs(index - active)
  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>
        <button
          onClick={() => onSelect(index)}
          aria-label={`${m.name}, ${formatSpan(m.startYear, m.endYear)}`}
          aria-current={d === 0 ? 'step' : undefined}
          className="group relative flex h-9 flex-1 items-end justify-center focus-visible:outline-none"
        >
          <span
            className={cn('tick block w-px bg-fg group-hover:bg-accent group-focus-visible:bg-accent', d === 0 ? 'bg-accent' : '')}
            style={{ height: d === 0 ? 30 : Math.max(6, 20 - d * 3), opacity: d === 0 ? 1 : Math.max(0.25, 1 - d * 0.1) }}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="w-[220px] p-0">
        <div className="aspect-[16/10] w-full overflow-hidden border-b border-fg/15">
          <ProceduralCanvas movement={m} seed={`tick-${m.id}`} width={220} height={138} />
        </div>
        <div className="px-3 py-2">
          <div className="font-sans text-[11px] font-medium uppercase tracking-museum">{m.name}</div>
          <div className="mt-0.5 font-mono text-[11px] text-muted">{formatSpan(m.startYear, m.endYear)}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
})

export function BottomTimeline() {
  const index = useStore((s) => s.activeIndex)
  const exploring = useStore((s) => s.exploring)
  const toggleExplore = useStore((s) => s.toggleExplore)
  const goToIndex = useStore((s) => s.goToIndex)
  const next = useStore((s) => s.next)
  const prev = useStore((s) => s.prev)
  const surpriseMe = useStore((s) => s.surpriseMe)
  const m = MOVEMENTS[index]
  const h = HISTORIES[m.id]
  const total = MOVEMENTS.length
  // Era labels under the ticks, skipping any that would collide with the previous one.
  const eraStarts: { e: (typeof ERAS)[number]; i: number }[] = []
  for (const e of ERAS) {
    const i = MOVEMENTS.findIndex((mv) => mv.eraId === e.id)
    if (i < 0) continue
    const last = eraStarts[eraStarts.length - 1]
    if (!last || (i - last.i) / MOVEMENTS.length > 0.085) eraStarts.push({ e, i })
  }

  return (
    <footer className="hud-chrome hud-bottom hud-scrim-bottom pointer-events-none fixed inset-x-0 bottom-0 z-30 px-5 pb-4 md:px-10 md:pb-6" aria-label="Timeline">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="pointer-events-auto hud-text min-w-0 max-w-[min(640px,62vw)]" aria-live="polite">
          <div className="t-eyebrow">
            {ERA_BY_ID[m.eraId]?.name} · {formatSpan(m.startYear, m.endYear)}
          </div>
          <h2 className="hud-era-name mt-1.5 truncate font-sans text-[clamp(28px,3.6vw,52px)] font-semibold uppercase leading-none tracking-[-0.02em] text-fg">{m.name}</h2>
          {h && (
            <p className="mt-2.5 line-clamp-2 font-sans text-[14px] leading-snug text-fg/90">
              <span className="font-medium text-fg">Pioneers: </span>
              {h.pioneers
                .slice(0, 3)
                .map((p) => p.name)
                .join(' · ')}
            </p>
          )}
          <div className="t-meta mt-2 flex items-center gap-3" aria-label={`Chamber ${index + 1} of ${total}`}>
            <span className="progress-glyphs" aria-hidden>
              {progressGlyphs(index, total)}
            </span>
            <span>
              {String(index + 1).padStart(2, '0')} / {total}
            </span>
          </div>
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={surpriseMe} className="hidden md:inline-flex">
            ✦ Surprise me
          </Button>
          <Button variant="outline" size="md" onClick={prev} disabled={index === 0} aria-label="Previous chamber">
            ← Previous
          </Button>
          <Button variant={exploring ? 'primary' : 'outline'} size="md" onClick={toggleExplore} aria-pressed={exploring}>
            {exploring ? 'Close story' : 'Read the story'}
          </Button>
          <Button variant="outline" size="md" onClick={next} aria-label={index === total - 1 ? 'Enter the coda' : 'Next chamber'}>
            {index === total - 1 ? 'Coda →' : 'Next →'}
          </Button>
        </div>
      </div>
      <div className="hud-ticks pointer-events-auto relative mt-4">
        <div className="flex items-end" role="list">
          {MOVEMENTS.map((mv, i) => (
            <Tick key={mv.id} index={i} active={index} onSelect={goToIndex} />
          ))}
        </div>
        <div className="relative mt-1 hidden h-3 md:block" aria-hidden>
          {eraStarts.map(({ e, i }) => (
            <span key={e.id} className="absolute top-0 whitespace-nowrap font-sans text-[11px] uppercase tracking-[0.12em] text-fg/75" style={{ left: `${(i / total) * 100}%` }}>
              {e.name}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}
