import type { ReactNode } from 'react'
import { MOVEMENTS, MOVEMENT_BY_ID, CATEGORY_LABELS } from '@/data/movements'
import { ARTIST_BY_ID } from '@/data/artists'
import { formatSpan } from '@/data/eras'
import { useStore } from '@/state/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AIStages, Instruments } from './Instruments'

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="panel-section border-t border-fg/15 py-5">
      <h3 className="panel-heading mb-3 font-sans text-[10px] font-medium uppercase tracking-museum text-muted">{label}</h3>
      {children}
    </section>
  )
}

/** The floating editorial panel: history, ideas, the chamber's visual system, and its artists. */
export function EraPanel() {
  const index = useStore((s) => s.activeIndex)
  const exploring = useStore((s) => s.exploring)
  const setExploring = useStore((s) => s.setExploring)
  const openArtist = useStore((s) => s.openArtist)
  const goToMovement = useStore((s) => s.goToMovement)
  if (!exploring) return null
  const m = MOVEMENTS[index]
  const v = m.visual
  const after = MOVEMENTS.filter((x) => x.influencedBy.includes(m.id) || x.reactionTo?.includes(m.id))
  return (
    <aside
      key={m.id}
      className="museum-panel animate-sheet-in-right fixed bottom-[168px] right-4 top-20 z-30 flex w-[min(460px,calc(100vw-32px))] flex-col md:right-10 md:top-24"
      aria-label={`${m.name} — details`}
    >
      <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
        <div>
          <div className="font-sans text-[9px] uppercase tracking-museum text-muted">
            {CATEGORY_LABELS[m.category]} · {m.region}
          </div>
          <h2 className="panel-heading mt-2 font-sans text-[34px] font-semibold uppercase leading-[0.95] tracking-[-0.02em]">{m.name}</h2>
          <div className="mt-2 font-mono text-[11px] text-fg/70">{formatSpan(m.startYear, m.endYear)}</div>
        </div>
        <span className="panel-seal hidden h-9 w-9 shrink-0 bg-accent" aria-hidden />
        <Button variant="ghost" size="sm" onClick={() => setExploring(false)} aria-label="Close panel">
          Close
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-6">
        <blockquote className="pb-6 font-serif text-[23px] italic leading-[1.25] text-fg/90">“{m.quote}”</blockquote>
        {v.instrument && <Instruments instrument={v.instrument} />}
        {v.scene === 'ai' && <AIStages movement={m} />}
        <Section label="Origin">
          <p className="font-sans text-[14px] leading-relaxed text-fg/85">{m.origin}</p>
        </Section>
        <Section label="Key ideas">
          <ol className="space-y-2">
            {m.keyIdeas.map((k, i) => (
              <li key={k} className="flex gap-3 font-sans text-[14px] leading-snug text-fg/85">
                <span className="font-mono text-[10px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                {k}
              </li>
            ))}
          </ol>
        </Section>
        <Section label="Visual language">
          <div className="flex flex-wrap gap-1.5">
            {m.visualLanguage.map((k) => (
              <Badge key={k}>{k}</Badge>
            ))}
          </div>
        </Section>
        <Section label="Technology">
          <p className="font-sans text-[14px] leading-relaxed text-fg/85">{m.technology}</p>
        </Section>
        <Section label="Influence">
          <p className="font-sans text-[14px] leading-relaxed text-fg/85">{m.influence}</p>
          {(m.influencedBy.length > 0 || after.length > 0) && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2 font-sans text-[9px] uppercase tracking-museum text-muted">Drew from</div>
                {m.influencedBy.map((id) => (
                  <button key={id} onClick={() => goToMovement(id)} className="block py-0.5 text-left font-sans text-[12px] text-fg/80 underline-offset-4 hover:text-accent hover:underline">
                    {MOVEMENT_BY_ID[id]?.name}
                  </button>
                ))}
              </div>
              <div>
                <div className="mb-2 font-sans text-[9px] uppercase tracking-museum text-muted">Led to</div>
                {after.map((x) => (
                  <button key={x.id} onClick={() => goToMovement(x.id)} className="block py-0.5 text-left font-sans text-[12px] text-fg/80 underline-offset-4 hover:text-accent hover:underline">
                    {x.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>
        <Section label="Artists">
          {m.artists.length === 0 ? (
            <p className="font-serif text-[16px] italic text-fg/70">Made by anonymous and collective hands — names unrecorded, languages inherited.</p>
          ) : (
            <ul className="divide-y divide-fg/10">
              {m.artists.map((id) => {
                const a = ARTIST_BY_ID[id]
                return (
                  <li key={id}>
                    <button onClick={() => openArtist(id)} className="group flex w-full items-baseline justify-between py-2.5 text-left transition-[padding] duration-500 ease-museum hover:pl-2">
                      <span className="font-sans text-[15px] text-fg group-hover:text-accent">{a.name}</span>
                      <span className="font-mono text-[10px] text-muted">{a.lifespan}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
        <Section label="Visual system · how this chamber is generated">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[10px]">
            {(
              [
                ['scene', v.variant ? `${v.scene}/${v.variant}` : v.scene],
                ['geometry', v.geometry],
                ['particles', v.particles],
                ['lighting', v.lighting],
                ['camera', v.camera],
                ['shader', v.post.mode === 'none' ? 'material' : v.post.mode],
                ['motion', v.motion],
                ['transition', v.transition],
                ['interface', v.ui],
                ['sound', v.sound],
              ] as const
            ).map(([k, val]) => (
              <div key={k} className="contents">
                <dt className="uppercase text-muted">{k}</dt>
                <dd className="text-fg/85">{val}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex gap-1">
            {[v.palette.bg, v.palette.ink, v.palette.accent, ...v.palette.colors].slice(0, 9).map((c, i) => (
              <span key={i} className="h-4 flex-1 border border-fg/10" style={{ background: c }} title={c} />
            ))}
          </div>
        </Section>
        <Separator className="mb-6" />
      </ScrollArea>
    </aside>
  )
}
