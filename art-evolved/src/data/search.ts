import { ARTISTS } from './artists'
import { MOVEMENTS } from './movements'

export type SearchTarget =
  | { kind: 'movement'; id: string }
  | { kind: 'artist'; id: string; movement: string }
  | { kind: 'view'; id: string }

export interface SearchEntry {
  key: string
  label: string
  hint: string
  keywords: string[]
  target: SearchTarget
}

export const SEARCH_ENTRIES: SearchEntry[] = [
  ...MOVEMENTS.map<SearchEntry>((mv) => ({
    key: `m:${mv.id}`,
    label: mv.name,
    hint: `${mv.region}`,
    keywords: [...mv.keywords, mv.category, mv.region, ...mv.visualSystems],
    target: { kind: 'movement', id: mv.id },
  })),
  ...ARTISTS.map<SearchEntry>((ar) => ({
    key: `a:${ar.id}`,
    label: ar.name,
    hint: ar.lifespan,
    keywords: [ar.region, ...ar.movements],
    target: { kind: 'artist', id: ar.id, movement: ar.movements[0] },
  })),
]
