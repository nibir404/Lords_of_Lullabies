import { useStore } from '@/state/store'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

export const FILM_SRC = `${import.meta.env.BASE_URL}media/art-evolved-film.mp4`
export const FILM_POSTER = `${import.meta.env.BASE_URL}media/art-evolved-film-poster.jpg`

// Open state lives in the store, so Radix has no Trigger to hand focus back to on close.
let opener: HTMLElement | null = null

/** The 60-second trailer, played on demand. Nothing is downloaded until the dialog opens. */
export function FilmDialog() {
  const open = useStore((s) => s.filmOpen)
  const setOpen = useStore((s) => s.setFilmOpen)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          opener?.focus()
        }}
        className="top-1/2 w-[min(1120px,calc(100vw-32px))] -translate-y-1/2 p-0">
        <div className="flex items-baseline gap-3 px-4 py-3 pr-20 md:px-5">
          <DialogTitle>The film</DialogTitle>
          <DialogDescription className="t-meta font-mono text-muted">45,000 years in one minute · 1:00</DialogDescription>
        </div>
        <video
          className="block aspect-video w-full bg-black"
          src={FILM_SRC}
          poster={FILM_POSTER}
          controls
          autoPlay
          playsInline
          preload="metadata"
          onEnded={() => setOpen(false)}
        >
          Your browser can’t play this video. <a href={FILM_SRC}>Download the film</a>.
        </video>
      </DialogContent>
    </Dialog>
  )
}

/** Poster-thumbnail button that opens the film. */
export function FilmButton({ className = '' }: { className?: string }) {
  const setOpen = useStore((s) => s.setFilmOpen)
  return (
    <button
      type="button"
      onClick={(e) => {
        opener = e.currentTarget
        setOpen(true)
      }}
      className={`group flex items-center gap-3 border border-fg/30 bg-bg/45 p-1.5 pr-4 text-left text-fg backdrop-blur-sm transition-colors hover:border-fg/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
      aria-label="Watch the film, 1 minute"
    >
      <span className="relative block h-12 w-20 shrink-0 overflow-hidden bg-black">
        <img src={FILM_POSTER} alt="" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white drop-shadow">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      <span>
        <span className="block font-sans text-[11px] uppercase tracking-museum">Watch the film</span>
        <span className="t-meta block font-mono text-muted">1:00</span>
      </span>
    </button>
  )
}
