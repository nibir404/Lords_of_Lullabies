import { MOVEMENTS } from '@/data/movements'
import { ERA_BY_ID } from '@/data/eras'
import { VIEW_CONFIG } from '@/components/3d/viewConfig'
import { useStore } from '@/state/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrambleText } from './ScrambleText'

export function TopBar() {
  const view = useStore((s) => s.view)
  const index = useStore((s) => s.activeIndex)
  const sound = useStore((s) => s.sound)
  const setSound = useStore((s) => s.setSound)
  const setView = useStore((s) => s.setView)
  const setMenuOpen = useStore((s) => s.setMenuOpen)
  const setSearchOpen = useStore((s) => s.setSearchOpen)
  const m = MOVEMENTS[index]
  const label = view === 'timeline' ? m.name : view === 'create' ? 'Create' : VIEW_CONFIG[view].label
  const eraName = ERA_BY_ID[m.eraId]?.name
  const era = view === 'timeline' ? (eraName && eraName !== m.name ? eraName : `Chamber ${index + 1} of ${MOVEMENTS.length}`) : 'ART//EVOLVED'

  return (
    <header className="hud-chrome hud-scrim-top pointer-events-none fixed inset-x-0 top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-start gap-4 px-5 pt-5 md:px-10 md:pt-7">
      <button
        onClick={() => setView('landing')}
        className="hud-title hud-text pointer-events-auto justify-self-start font-sans text-[13px] font-semibold uppercase tracking-[0.28em] text-fg"
        aria-label="ART//EVOLVED — return to the entrance"
      >
        ART<span className="text-accent">//</span>EVOLVED
      </button>

      <div className="hud-text text-center" aria-live="polite">
        <div className="t-eyebrow">{view === 'landing' ? 'The visual history of humanity' : era}</div>
        {view !== 'landing' && <ScrambleText text={label.toUpperCase()} className="hud-title mt-1 block font-sans text-[11px] font-medium uppercase tracking-museum text-fg" />}
      </div>

      <nav aria-label="Primary" className="pointer-events-auto flex items-center gap-1 justify-self-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)} aria-label="Search the archive">
              Search <kbd className="hidden font-mono text-[11px] text-muted md:inline">⌘K</kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Movements, artists, ideas</TooltipContent>
        </Tooltip>
        <Button variant="ghost" size="sm" onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>
          <span className="inline-flex h-2.5 items-end gap-[2px]" aria-hidden>
            {[0.5, 1, 0.7].map((h, i) => (
              <span key={i} className="w-[2px] bg-fg transition-all duration-500" style={{ height: sound ? `${h * 100}%` : '20%' }} />
            ))}
          </span>
          Sound {sound ? 'On' : 'Off'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMenuOpen(true)} aria-haspopup="dialog">
          Menu
        </Button>
      </nav>
    </header>
  )
}
