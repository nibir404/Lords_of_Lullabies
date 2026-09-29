import { useMemo, useState, type ReactNode } from 'react'
import { ARTISTS, ARTIST_BY_ID } from '@/data/artists'
import { MOVEMENT_BY_ID, CATEGORY_LABELS } from '@/data/movements'
import { useStore } from '@/state/store'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ProceduralCanvas } from './ProceduralCanvas'
import type { CategoryId } from '@/data/types'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 border-t border-fg/10 py-3.5">
      <dt className="font-sans text-[11px] uppercase tracking-museum text-muted">{label}</dt>
      <dd className="font-sans text-[15px] leading-relaxed text-fg/85">{children}</dd>
    </div>
  )
}

/** Artist profile with a procedural interpretation of their visual language (never their works). */
export function ArtistSheet() {
  const id = useStore((s) => s.artistId)
  const openArtist = useStore((s) => s.openArtist)
  const goToMovement = useStore((s) => s.goToMovement)
  const device = useStore((s) => s.device)
  const [variant, setVariant] = useState(0)
  const a = id ? ARTIST_BY_ID[id] : null
  const home = a ? MOVEMENT_BY_ID[a.movements[0]] : null
  return (
    <Sheet open={!!a} onOpenChange={(o) => !o && openArtist(null)}>
      <SheetContent side="right" className="p-0">
        {a && home && (
          <ScrollArea className="h-full">
            <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-fg/15">
              <ProceduralCanvas key={`${a.id}-${variant}`} movement={home} seed={`${a.id}-${variant}`} painter={a.painter} width={720} height={540} label={`Procedural interpretation of the visual language of ${a.name}`} />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <span className="bg-bg/80 px-2 py-1 font-mono text-[11px] uppercase tracking-museum text-fg/80">Procedural interpretation · no. {String(variant + 1).padStart(3, '0')}</span>
                <Button variant="primary" size="sm" onClick={() => setVariant((v) => v + 1)}>
                  Regenerate
                </Button>
              </div>
            </div>
            <div className="px-8 pb-10 pt-7">
              <div className="font-sans text-[11px] uppercase tracking-museum text-muted">Artist</div>
              <SheetTitle className="mt-2 font-sans text-[36px] font-semibold leading-[0.95] tracking-[-0.02em]">{a.name}</SheetTitle>
              <SheetDescription className="mt-4 font-serif text-[22px] italic leading-snug text-fg/85">{a.coreIdeas}</SheetDescription>
              <dl className="mt-6">
                <Field label="Name">{a.name}</Field>
                <Field label="Period">{a.lifespan}</Field>
                <Field label="Movement">
                  <span className="flex flex-wrap gap-x-3">
                    {a.movements.map((mid) => (
                      <button
                        key={mid}
                        className="underline-offset-4 hover:text-accent hover:underline"
                        onClick={() => {
                          openArtist(null)
                          if (device === 'mobile') document.getElementById(`m-${mid}`)?.scrollIntoView({ behavior: 'smooth' })
                          else goToMovement(mid)
                        }}
                      >
                        {MOVEMENT_BY_ID[mid]?.name}
                      </button>
                    ))}
                  </span>
                </Field>
                <Field label="Country / region">{a.region}</Field>
                <Field label="Core ideas">{a.coreIdeas}</Field>
                <Field label="Visual language">
                  <span className="flex flex-wrap gap-1.5">
                    {a.visualLanguage.map((v) => (
                      <Badge key={v}>{v}</Badge>
                    ))}
                  </span>
                </Field>
                <Field label="Influence">{a.influence}</Field>
                {a.note && <Field label="Note">{a.note}</Field>}
              </dl>
              <p className="mt-6 font-mono text-[11px] leading-relaxed text-muted">
                The image above is generated from the grammar of {home.name.toLowerCase()} — it is not, and does not imitate, any work by {a.name}.
              </p>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}

const CATS: (CategoryId | 'all')[] = ['all', 'ancient', 'asian', 'european', 'modern', 'contemporary', 'digital']

export function ArtistsIndex() {
  const open = useStore((s) => s.artistsOpen)
  const setOpen = useStore((s) => s.setArtistsOpen)
  const openArtist = useStore((s) => s.openArtist)
  const [cat, setCat] = useState<CategoryId | 'all'>('all')
  const list = useMemo(() => ARTISTS.filter((a) => cat === 'all' || MOVEMENT_BY_ID[a.movements[0]]?.category === cat).sort((x, y) => x.name.localeCompare(y.name)), [cat])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[8vh] w-[min(920px,calc(100vw-32px))] p-0">
        <div className="px-8 pb-4 pt-8">
          <DialogTitle className="text-[11px] text-muted">Artist explorer</DialogTitle>
          <DialogDescription className="mt-2 text-[26px] text-fg">{ARTISTS.length} artists across cultures and centuries.</DialogDescription>
          <div className="mt-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by tradition">
            {CATS.map((c) => (
              <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={`border px-2.5 py-1 font-sans text-[11px] uppercase tracking-museum transition-colors ${cat === c ? 'border-fg bg-fg text-bg' : 'border-fg/20 text-fg/70 hover:border-fg/60'}`}>
                {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-[60vh]">
          <ul className="grid grid-cols-1 gap-x-8 px-8 py-4 sm:grid-cols-2">
            {list.map((a) => (
              <li key={a.id} className="border-b border-fg/10">
                <button
                  onClick={() => {
                    setOpen(false)
                    openArtist(a.id)
                  }}
                  className="group flex w-full items-baseline justify-between gap-3 py-3 text-left transition-[padding] duration-500 ease-museum hover:pl-2"
                >
                  <span className="font-sans text-[15px] group-hover:text-accent">{a.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">{MOVEMENT_BY_ID[a.movements[0]]?.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
