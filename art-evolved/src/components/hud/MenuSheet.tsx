import { useStore, type Quality, type ViewId } from '@/state/store'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@/components/ui/navigation-menu'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { MOVEMENTS } from '@/data/movements'
import { ARTISTS } from '@/data/artists'

const LINKS: { id: ViewId | 'artists'; label: string; hint: string }[] = [
  { id: 'timeline', label: 'The Archive', hint: `${MOVEMENTS.length} chambers` },
  { id: 'evolution', label: 'Art Evolution', hint: 'Signature' },
  { id: 'morph', label: 'How Art Changed', hint: 'One tree, eight ways' },
  { id: 'media', label: 'Material × Technology', hint: 'Stone → AI' },
  { id: 'map', label: 'Art Map', hint: 'Influence graph' },
  { id: 'artists', label: 'Artists', hint: `${ARTISTS.length} profiles` },
  { id: 'create', label: 'Create', hint: 'Generative playground' },
  { id: 'finale', label: 'Coda', hint: 'The end of the corridor' },
]

const SHORTCUTS = [
  ['← →', 'Travel the corridor'],
  ['Enter', 'Explore chamber'],
  ['Esc', 'Step back'],
  ['⌘K  /', 'Search'],
  ['R', 'Surprise me'],
  ['M', 'Menu'],
  ['+ −', 'Zoom'],
  ['Drag', 'Orbit'],
]

export function MenuSheet() {
  const open = useStore((s) => s.menuOpen)
  const setOpen = useStore((s) => s.setMenuOpen)
  const setView = useStore((s) => s.setView)
  const setArtistsOpen = useStore((s) => s.setArtistsOpen)
  const view = useStore((s) => s.view)
  const quality = useStore((s) => s.quality)
  const setEnv = useStore((s) => s.setEnv)
  const sound = useStore((s) => s.sound)
  const setSound = useStore((s) => s.setSound)
  const device = useStore((s) => s.device)
  const links = device === 'mobile' ? LINKS.filter((l) => l.id === 'artists' || l.id === 'create' || l.id === 'timeline') : LINKS

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="overflow-y-auto px-8 pb-10 pt-16">
        <SheetTitle className="font-sans text-[11px] uppercase tracking-museum text-muted">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navigate the wings of the museum and adjust settings.</SheetDescription>
        <NavigationMenu orientation="vertical" className="mt-6">
          <NavigationMenuList>
            {links.map((l, i) => (
              <NavigationMenuItem key={l.id}>
                <NavigationMenuLink
                  active={l.id === view}
                  onSelect={() => {
                    setOpen(false)
                    if (l.id === 'artists') setArtistsOpen(true)
                    else setView(l.id)
                  }}
                  href={`#${l.id}`}
                  onClick={(e) => e.preventDefault()}
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                    {l.label}
                  </span>
                  <span className="font-sans text-[11px] uppercase tracking-museum text-muted">{l.hint}</span>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <Separator className="my-8" />
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] uppercase tracking-museum text-muted">Sound</span>
            <Button variant="outline" size="sm" onClick={() => setSound(!sound)} aria-pressed={sound}>
              {sound ? 'On' : 'Off'}
            </Button>
          </div>
          {device !== 'mobile' && (
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] uppercase tracking-museum text-muted">Rendering</span>
              <div className="flex gap-1" role="radiogroup" aria-label="Rendering quality">
                {(['high', 'medium', 'low'] as Quality[]).map((q) => (
                  <Button key={q} role="radio" aria-checked={quality === q} variant={quality === q ? 'primary' : 'outline'} size="sm" onClick={() => setEnv({ quality: q })}>
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="mb-3 font-sans text-[11px] uppercase tracking-museum text-muted">Keyboard</div>
            <dl className="grid grid-cols-[80px_1fr] gap-y-1.5 font-mono text-[11px]">
              {SHORTCUTS.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-fg">{k}</dt>
                  <dd className="text-fg/65">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <Separator className="my-8" />
        <p className="font-serif text-[18px] italic leading-snug text-fg/75">
          Art is not a style. Art is a continuously evolving language. Every image in this museum is generated by code — no photographs, no reproductions.
        </p>
      </SheetContent>
    </Sheet>
  )
}
