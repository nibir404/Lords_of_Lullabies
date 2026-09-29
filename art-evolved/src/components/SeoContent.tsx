import { MOVEMENTS } from '@/data/movements'
import { ARTIST_BY_ID } from '@/data/artists'
import { formatSpan } from '@/data/eras'
import { HISTORIES } from '@/data/histories'

/** Semantic, screen-reader and crawler friendly index of the archive (visually hidden in 3D mode). */
export function SeoContent() {
  return (
    <div className="sr-only">
      <h1>ART//EVOLVED — The visual history of humanity</h1>
      <p>A procedural museum exploring how visual expression evolved across centuries, cultures, movements and technologies.</p>
      <nav aria-label="Archive index">
        <ol>
          {MOVEMENTS.map((m) => (
            <li key={m.id}>
              <article>
                <h2>{m.name}</h2>
                <p>
                  {formatSpan(m.startYear, m.endYear)} · {m.region}
                </p>
                <p>{m.origin}</p>
                {HISTORIES[m.id] && (
                  <>
                    <p>Born: {HISTORIES[m.id].born}</p>
                    <p>Why: {HISTORIES[m.id].why}</p>
                    <p>How it began: {HISTORIES[m.id].birth}</p>
                    <p>Pioneers: {HISTORIES[m.id].pioneers.map((p) => `${p.name} (${p.note})`).join('; ')}</p>
                  </>
                )}
                {m.artists.length > 0 && <p>Artists: {m.artists.map((a) => ARTIST_BY_ID[a].name).join(', ')}</p>}
              </article>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
