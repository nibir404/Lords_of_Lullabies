import { useEffect, useState, type ReactNode } from 'react'
import { EVOLUTION_PAIRS, TREE_STYLES } from '@/data/interactions'
import { MATERIALS } from '@/data/materials'
import { TECHNOLOGIES } from '@/data/technologies'
import { MOVEMENT_BY_ID } from '@/data/movements'
import { RELATION_COLORS, RELATION_LABELS } from '@/data/relations'
import type { RelationType } from '@/data/types'
import { useStore } from '@/state/store'
import { world } from '@/state/world'
import { getGraph } from '@/components/3d/graphLayout'
import { FINALE_STAGES } from '@/utils/formations'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useWorldValue } from '@/hooks/useWorldValue'
import { cn } from '@/lib/utils'

function Heading({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="pointer-events-none fixed left-5 top-24 z-20 max-w-[min(420px,80vw)] md:left-10 md:top-28">
      <div className="font-sans text-[10px] uppercase tracking-museum text-muted">{kicker}</div>
      <h1 className="mt-3 font-sans text-[clamp(34px,4.6vw,64px)] font-semibold uppercase leading-[0.9] tracking-[-0.03em] text-fg">{title}</h1>
      {children}
    </div>
  )
}

function Dock({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('museum-panel fixed inset-x-4 bottom-4 z-30 mx-auto max-w-[980px] px-6 py-5 md:bottom-8', className)}>{children}</div>
}

function useAutoplay(key: 'morph' | 'media', on: boolean) {
  const setSlider = useStore((s) => s.setSlider)
  useEffect(() => {
    if (!on) return
    const id = window.setInterval(() => {
      const v = useStore.getState().sliders[key]
      setSlider(key, v >= 1 ? 0 : Math.min(1, v + 0.004))
    }, 40)
    return () => clearInterval(id)
  }, [on, key, setSlider])
}

export function EvolutionOverlay() {
  const pairId = useStore((s) => s.evolutionPair)
  const setPair = useStore((s) => s.setEvolutionPair)
  const value = useStore((s) => s.sliders.evolution)
  const setSlider = useStore((s) => s.setSlider)
  const pair = EVOLUTION_PAIRS.find((p) => p.id === pairId) ?? EVOLUTION_PAIRS[0]
  const stage = pair.stages[Math.min(pair.stages.length - 1, Math.round(value * (pair.stages.length - 1)))]
  return (
    <>
      <Heading kicker="Signature interaction" title="Art Evolution">
        <p className="mt-4 font-serif text-[20px] italic leading-snug text-fg/80">Not a crossfade. Every block of one world is re-projected into the grammar of the next.</p>
      </Heading>
      <Dock>
        <Tabs value={pairId} onValueChange={(v) => { setPair(v); setSlider('evolution', 0) }}>
          <TabsList className="mb-5 flex-wrap">
            {EVOLUTION_PAIRS.map((p) => (
              <TabsTrigger key={p.id} value={p.id}>
                {p.from.label} → {p.to.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5">
          <button className="text-left" onClick={() => setSlider('evolution', 0)}>
            <div className="font-mono text-[9px] text-muted">{MOVEMENT_BY_ID[pair.from.movement].startYear}</div>
            <div className="font-sans text-[clamp(16px,2vw,26px)] font-semibold uppercase tracking-[-0.01em]">{pair.from.label}</div>
          </button>
          <Slider value={[value]} min={0} max={1} step={0.001} onValueChange={([v]) => setSlider('evolution', v)} thumbLabel={`Transform ${pair.from.label} into ${pair.to.label}`} />
          <button className="text-right" onClick={() => setSlider('evolution', 1)}>
            <div className="font-mono text-[9px] text-muted">{MOVEMENT_BY_ID[pair.to.movement].startYear}</div>
            <div className="font-sans text-[clamp(16px,2vw,26px)] font-semibold uppercase tracking-[-0.01em]">{pair.to.label}</div>
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-serif text-[18px] italic text-fg/85" aria-live="polite">
            {stage}
          </span>
          <span className="font-mono text-[10px] text-muted">{Math.round(value * 100)}% · drag · scroll · ← →</span>
        </div>
      </Dock>
    </>
  )
}

export function MorphOverlay() {
  const value = useStore((s) => s.sliders.morph)
  const setSlider = useStore((s) => s.setSlider)
  const [play, setPlay] = useState(false)
  useAutoplay('morph', play)
  const i = Math.min(TREE_STYLES.length - 1, Math.round(value * (TREE_STYLES.length - 1)))
  const style = TREE_STYLES[i]
  return (
    <>
      <Heading kicker="How art changed · concept 01" title="Tree">
        <p className="mt-4 font-serif text-[20px] italic leading-snug text-fg/80" aria-live="polite">
          {style.caption}
        </p>
      </Heading>
      <Dock>
        <div className="mb-4 grid grid-cols-4 gap-1 sm:grid-cols-8" role="radiogroup" aria-label="Period">
          {TREE_STYLES.map((s, k) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={k === i}
              onClick={() => setSlider('morph', k / (TREE_STYLES.length - 1))}
              className={cn('border-t py-2 text-left font-sans text-[9px] uppercase tracking-[0.14em] transition-colors duration-500', k === i ? 'border-accent text-fg' : 'border-fg/15 text-fg/45 hover:text-fg')}
            >
              <span className="block font-mono text-[9px] text-muted">{String(k + 1).padStart(2, '0')}</span>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Button variant={play ? 'primary' : 'outline'} size="sm" onClick={() => setPlay(!play)} aria-pressed={play}>
            {play ? 'Pause' : 'Play'}
          </Button>
          <Slider value={[value]} min={0} max={1} step={0.001} onValueChange={([v]) => setSlider('morph', v)} thumbLabel="Period" />
        </div>
      </Dock>
    </>
  )
}

export function MediaOverlay() {
  const tab = useStore((s) => s.mediaTab)
  const setTab = useStore((s) => s.setMediaTab)
  const value = useStore((s) => s.sliders.media)
  const setSlider = useStore((s) => s.setSlider)
  const [play, setPlay] = useState(false)
  useAutoplay('media', play)
  const list = tab === 'materials' ? MATERIALS : TECHNOLOGIES
  const i = Math.min(list.length - 1, Math.round(value * (list.length - 1)))
  const item = list[i]
  return (
    <>
      <Heading kicker={tab === 'materials' ? 'Material evolution' : 'Technology × art'} title={item.name}>
        <div className="mt-3 font-mono text-[11px] text-muted">{item.year}</div>
        <p className="mt-3 font-serif text-[20px] italic leading-snug text-fg/80" aria-live="polite">
          {item.description}
        </p>
      </Heading>
      <Dock>
        <Tabs value={tab} onValueChange={(v) => { setTab(v as 'materials' | 'technology'); setSlider('media', 0) }}>
          <TabsList className="mb-4">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mb-3 flex justify-between gap-1 overflow-hidden" aria-hidden>
          {list.map((m, k) => (
            <button key={m.id} onClick={() => setSlider('media', k / (list.length - 1))} className={cn('truncate font-sans text-[8px] uppercase tracking-[0.1em] transition-colors', k === i ? 'text-fg' : 'text-fg/35 hover:text-fg')}>
              {m.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Button variant={play ? 'primary' : 'outline'} size="sm" onClick={() => setPlay(!play)} aria-pressed={play}>
            {play ? 'Pause' : 'Play'}
          </Button>
          <Slider value={[value]} min={0} max={1} step={0.001} onValueChange={([v]) => setSlider('media', v)} thumbLabel={tab} />
        </div>
      </Dock>
    </>
  )
}

export function MapOverlay() {
  const filters = useStore((s) => s.mapFilters)
  const toggle = useStore((s) => s.toggleMapFilter)
  const selected = useStore((s) => s.mapSelected)
  const select = useStore((s) => s.selectMapNode)
  const goToMovement = useStore((s) => s.goToMovement)
  const openArtist = useStore((s) => s.openArtist)
  const graph = getGraph()
  const node = selected ? graph.nodes[graph.index.get(selected)!] : null
  const rels = node
    ? graph.edges
        .filter((e) => graph.nodes[e.a].id === node.id || graph.nodes[e.b].id === node.id)
        .map((e) => {
          const outgoing = graph.nodes[e.a].id === node.id
          return { type: e.type, other: graph.nodes[outgoing ? e.b : e.a], outgoing }
        })
    : []
  return (
    <>
      <Heading kicker="Relationships" title="Art Map">
        <p className="mt-4 font-serif text-[19px] italic leading-snug text-fg/80">Drag to rotate the network · scroll to zoom · select a node.</p>
      </Heading>
      <div className="museum-panel fixed bottom-6 left-5 z-30 w-[260px] px-5 py-4 md:left-10">
        <div className="mb-3 font-sans text-[9px] uppercase tracking-museum text-muted">Connections</div>
        <ul className="space-y-1.5">
          {(Object.keys(RELATION_LABELS) as RelationType[]).map((t) => (
            <li key={t}>
              <button onClick={() => toggle(t)} aria-pressed={filters[t]} className={cn('flex w-full items-center gap-3 font-sans text-[11px] uppercase tracking-[0.12em] transition-opacity', filters[t] ? 'opacity-100' : 'opacity-35')}>
                <span className="h-[2px] w-6" style={{ background: RELATION_COLORS[t] }} />
                {RELATION_LABELS[t]}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-3 gap-2 font-sans text-[9px] uppercase tracking-[0.12em] text-fg/70">
          <span>◆ Movement</span>
          <span>● Artist</span>
          <span>■ Technology</span>
        </div>
      </div>
      {node && (
        <aside className="museum-panel animate-sheet-in-right fixed bottom-6 right-4 top-24 z-30 flex w-[min(360px,calc(100vw-32px))] flex-col md:right-10">
          <div className="px-6 pt-6">
            <div className="font-sans text-[9px] uppercase tracking-museum text-muted">{node.kind}</div>
            <h2 className="mt-2 font-sans text-[28px] font-semibold uppercase leading-none tracking-[-0.02em]">{node.label}</h2>
            <div className="mt-4 flex gap-2">
              {node.kind === 'movement' && (
                <Button variant="primary" size="sm" onClick={() => goToMovement(node.id)}>
                  Enter chamber
                </Button>
              )}
              {node.kind === 'artist' && (
                <Button variant="primary" size="sm" onClick={() => openArtist(node.id)}>
                  Open profile
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => select(null)}>
                Clear
              </Button>
            </div>
          </div>
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            {(Object.keys(RELATION_LABELS) as RelationType[]).map((t) => {
              const items = rels.filter((r) => r.type === t)
              if (!items.length) return null
              return (
                <div key={t} className="border-t border-fg/15 py-3">
                  <div className="mb-2 flex items-center gap-2 font-sans text-[9px] uppercase tracking-museum" style={{ color: RELATION_COLORS[t] }}>
                    {RELATION_LABELS[t]}
                  </div>
                  {items.map((r) => (
                    <button key={r.other.id + r.type} onClick={() => select(r.other.id)} className="flex w-full items-baseline justify-between py-1 text-left font-sans text-[13px] text-fg/85 hover:text-accent">
                      <span>{r.other.label}</span>
                      <span className="font-mono text-[9px] text-muted">{r.outgoing ? '→' : '←'}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </aside>
      )}
    </>
  )
}

export function FinaleOverlay() {
  const goToIndex = useStore((s) => s.goToIndex)
  const setView = useStore((s) => s.setView)
  const stage = useWorldValue(() => Math.round(world.autoStage.finale ?? 0) % FINALE_STAGES.length, 4)
  return (
    <section className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-end px-6 pb-16 text-center" aria-labelledby="finale-title">
      <div className="font-mono text-[10px] uppercase tracking-museum text-muted">{FINALE_STAGES[stage]}</div>
      <h1 id="finale-title" className="mt-5 max-w-[16ch] animate-rise font-sans text-[clamp(40px,7vw,104px)] font-semibold uppercase leading-[0.88] tracking-[-0.035em] text-fg">
        Art never stopped evolving.
      </h1>
      <p className="mt-6 animate-rise font-serif text-[clamp(20px,2.4vw,30px)] italic text-fg/80">“Neither did the tools we used to make it.”</p>
      <div className="pointer-events-auto mt-10 flex flex-wrap justify-center gap-3">
        <Button variant="outline" size="lg" onClick={() => goToIndex(0)}>
          Explore again
        </Button>
        <Button variant="primary" size="lg" onClick={() => setView('create')}>
          Create your own
        </Button>
      </div>
    </section>
  )
}

