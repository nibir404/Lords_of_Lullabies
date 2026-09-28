import { SEARCH_ENTRIES } from '@/data/search'
import { useStore, type ViewId } from '@/state/store'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

const WINGS: { id: ViewId; label: string; keywords: string[] }[] = [
  { id: 'evolution', label: 'Art Evolution — Renaissance ⇄ Cubism', keywords: ['slider', 'transform', 'signature'] },
  { id: 'morph', label: 'How Art Changed — the tree', keywords: ['tree', 'concept', 'same object'] },
  { id: 'media', label: 'Material × Technology', keywords: ['stone', 'pigment', 'photography', 'film', 'computer', 'materials'] },
  { id: 'map', label: 'Art Map — influence graph', keywords: ['graph', 'network', 'relations', 'influence'] },
  { id: 'create', label: 'Create — generative playground', keywords: ['make', 'export', 'svg', 'playground'] },
  { id: 'finale', label: 'Coda — art never stopped evolving', keywords: ['end', 'finale'] },
]

/** Name matches outrank keyword matches; no loose subsequence matching across long keyword lists. */
function scoreEntry(value: string, search: string) {
  const q = search.toLowerCase().trim()
  if (!q) return 1
  const [label, rest = ''] = value.toLowerCase().split('|')
  if (label.startsWith(q)) return 1
  if (label.includes(q)) return 0.9
  if (rest.includes(q)) return 0.5
  const words = q.split(/\s+/)
  return words.every((w) => label.includes(w) || rest.includes(w)) ? 0.3 : 0
}

/** Global search: choosing a result flies the camera there. */
export function SearchCommand() {
  const open = useStore((s) => s.searchOpen)
  const setOpen = useStore((s) => s.setSearchOpen)
  const goToMovement = useStore((s) => s.goToMovement)
  const openArtist = useStore((s) => s.openArtist)
  const setView = useStore((s) => s.setView)
  const setExploring = useStore((s) => s.setExploring)
  const device = useStore((s) => s.device)
  const mobile = device === 'mobile'

  const go = (fn: () => void) => {
    setOpen(false)
    requestAnimationFrame(fn)
  }
  const scrollTo = (id: string) => document.getElementById(`m-${id}`)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0" hideClose>
        <DialogTitle className="sr-only">Search the archive</DialogTitle>
        <Command label="Search the archive" loop filter={scoreEntry}>
          <CommandInput placeholder="Japanese, Van Gogh, pixel, surrealism…" autoFocus />
          <CommandList>
            <CommandEmpty>Nothing in the archive matches — yet.</CommandEmpty>
            <CommandGroup heading="Movements">
              {SEARCH_ENTRIES.filter((e) => e.target.kind === 'movement').map((e) => (
                <CommandItem
                  key={e.key}
                  value={`${e.label}|${e.keywords.join(' ')}`}
                  onSelect={() =>
                    go(() => {
                      if (mobile) return scrollTo((e.target as { id: string }).id)
                      goToMovement((e.target as { id: string }).id)
                      setTimeout(() => setExploring(true), 900)
                    })
                  }
                >
                  <span>{e.label}</span>
                  <span className="truncate font-mono text-[10px] opacity-60">{e.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Artists">
              {SEARCH_ENTRIES.filter((e) => e.target.kind === 'artist').map((e) => (
                <CommandItem
                  key={e.key}
                  value={`${e.label}|${e.keywords.join(' ')}`}
                  onSelect={() =>
                    go(() => {
                      const t = e.target as { id: string; movement: string }
                      if (mobile) scrollTo(t.movement)
                      else goToMovement(t.movement)
                      setTimeout(() => openArtist(t.id), mobile ? 300 : 1200)
                    })
                  }
                >
                  <span>{e.label}</span>
                  <span className="font-mono text-[10px] opacity-60">{e.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {!mobile && (
              <CommandGroup heading="Wings of the museum">
                {WINGS.map((w) => (
                  <CommandItem key={w.id} value={`${w.label}|${w.keywords.join(' ')}`} onSelect={() => go(() => setView(w.id))}>
                    {w.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
