import { useEffect, useRef, useState } from 'react'
import { MOVEMENTS, CATEGORY_LABELS } from '@/data/movements'
import { ARTIST_BY_ID } from '@/data/artists'
import { ERAS, formatSpan } from '@/data/eras'
import { useStore } from '@/state/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProceduralCanvas } from '@/components/hud/ProceduralCanvas'

function Chamber({ index }: { index: number }) {
  const m = MOVEMENTS[index]
  const [seed, setSeed] = useState(0)
  const openArtist = useStore((s) => s.openArtist)
  return (
    <article id={`m-${m.id}`} data-index={index} className="scroll-mt-16 border-t border-fg/15 pb-14 pt-6" aria-labelledby={`t-${m.id}`}>
      <div className="flex items-baseline justify-between px-5 font-mono text-[10px] text-muted">
        <span>
          {String(index + 1).padStart(2, '0')} / {MOVEMENTS.length}
        </span>
        <span>{formatSpan(m.startYear, m.endYear)}</span>
      </div>
      <button className="relative mt-3 block aspect-[4/3] w-full overflow-hidden" onClick={() => setSeed((s) => s + 1)} aria-label={`Regenerate the ${m.name} artwork`}>
        <ProceduralCanvas key={seed} movement={m} seed={`${m.id}-m-${seed}`} width={720} height={540} />
        <span className="absolute bottom-2 right-3 bg-bg/80 px-2 py-1 font-mono text-[9px] uppercase tracking-museum text-fg/70">Tap to regenerate</span>
      </button>
      <div className="px-5">
        <div className="mt-5 font-sans text-[9px] uppercase tracking-museum text-muted">
          {CATEGORY_LABELS[m.category]} · {m.region}
        </div>
        <h2 id={`t-${m.id}`} className="hud-era-name panel-heading mt-2 font-sans text-[40px] font-semibold uppercase leading-[0.92] tracking-[-0.02em]">
          {m.name}
        </h2>
        <blockquote className="mt-4 font-serif text-[22px] italic leading-snug text-fg/85">“{m.quote}”</blockquote>
        <p className="mt-4 font-sans text-[15px] leading-relaxed text-fg/80">{m.origin}</p>
        <ol className="mt-5 space-y-1.5">
          {m.keyIdeas.map((k, i) => (
            <li key={k} className="flex gap-3 font-sans text-[14px] text-fg/85">
              <span className="font-mono text-[10px] text-muted">{String(i + 1).padStart(2, '0')}</span>
              {k}
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {m.visualLanguage.map((v) => (
            <Badge key={v}>{v}</Badge>
          ))}
        </div>
        {m.artists.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 font-sans text-[9px] uppercase tracking-museum text-muted">Artists</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {m.artists.map((id) => (
                <button key={id} onClick={() => openArtist(id)} className="font-sans text-[14px] text-fg underline decoration-fg/30 underline-offset-4">
                  {ARTIST_BY_ID[id].name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

/**
 * Mobile (and no-WebGL) experience: a vertical timeline. Every chamber keeps its procedural
 * artwork, and the interface theme still follows the chamber in view.
 */
export default function MobileExperience({ fallback }: { fallback?: boolean }) {
  const setActiveIndex = useStore((s) => s.setActiveIndex)
  const setSearchOpen = useStore((s) => s.setSearchOpen)
  const setMenuOpen = useStore((s) => s.setMenuOpen)
  const setView = useStore((s) => s.setView)
  const index = useStore((s) => s.activeIndex)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveIndex(0)
    document.documentElement.classList.add('mobile-root')
    return () => document.documentElement.classList.remove('mobile-root')
  }, [setActiveIndex])

  useEffect(() => {
    const els = rootRef.current?.querySelectorAll('article[data-index]')
    if (!els) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiveIndex(Number((e.target as HTMLElement).dataset.index))
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [setActiveIndex])

  const m = MOVEMENTS[index]
  return (
    <div ref={rootRef} className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-fg/10 bg-bg/90 px-5 py-3 backdrop-blur-sm">
        <span className="hud-title font-sans text-[12px] font-semibold uppercase tracking-[0.26em]">
          ART<span className="text-accent">//</span>EVOLVED
        </span>
        <span className="truncate px-2 font-sans text-[9px] uppercase tracking-museum text-muted">{m.name}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)}>
            Search
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMenuOpen(true)}>
            Menu
          </Button>
        </div>
      </header>
      <section className="px-5 pb-16 pt-14" aria-labelledby="m-hero">
        <p className="font-sans text-[10px] uppercase tracking-museum text-muted">The visual history of humanity</p>
        <h1 id="m-hero" className="mt-4 font-sans text-[72px] font-semibold leading-[0.84] tracking-[-0.045em]">
          ART<span className="text-accent">//</span>
          <br />
          EVOLVED
        </h1>
        <p className="mt-6 font-serif text-[24px] italic leading-snug text-fg/80">“From marks on stone to machines that imagine.”</p>
        {fallback && <p className="mt-6 border border-fg/20 p-3 font-mono text-[11px] text-fg/70">WebGL is unavailable on this device, so the archive is presented as a vertical timeline. Every artwork is still generated by code.</p>}
        <div className="mt-8 flex gap-2">
          <Button variant="primary" onClick={() => document.getElementById(`m-${MOVEMENTS[0].id}`)?.scrollIntoView({ behavior: 'smooth' })}>
            Enter the archive
          </Button>
          <Button variant="outline" onClick={() => setView('create')}>
            Create
          </Button>
        </div>
      </section>
      <main>
        {ERAS.map((era) => {
          const items = MOVEMENTS.map((mv, i) => ({ mv, i })).filter(({ mv }) => mv.eraId === era.id)
          if (!items.length) return null
          return (
            <section key={era.id} aria-label={era.name}>
              <h2 className="sticky top-[49px] z-20 bg-bg/90 px-5 py-2 font-sans text-[10px] uppercase tracking-museum text-fg backdrop-blur-sm">
                {era.name} <span className="font-mono text-muted">· {formatSpan(era.startYear, era.endYear)}</span>
              </h2>
              {items.map(({ i }) => (
                <Chamber key={MOVEMENTS[i].id} index={i} />
              ))}
            </section>
          )
        })}
      </main>
      <section className="px-5 py-24 text-center">
        <h2 className="font-sans text-[44px] font-semibold uppercase leading-[0.9] tracking-[-0.03em]">Art never stopped evolving.</h2>
        <p className="mt-5 font-serif text-[22px] italic text-fg/80">“Neither did the tools we used to make it.”</p>
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Explore again
          </Button>
          <Button variant="primary" onClick={() => setView('create')}>
            Create your own
          </Button>
        </div>
      </section>
    </div>
  )
}
