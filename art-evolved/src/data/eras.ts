import type { Era } from './types'

/** The master timeline periods. Movements belong to one era; eras group the corridor. */
export const ERAS: Era[] = [
  { id: 'prehistory', name: 'Prehistory', startYear: -45000, endYear: -3500 },
  { id: 'ancient', name: 'Ancient', startYear: -3500, endYear: -800 },
  { id: 'classical', name: 'Classical', startYear: -800, endYear: 500 },
  { id: 'medieval', name: 'Medieval', startYear: 500, endYear: 1400 },
  { id: 'renaissance', name: 'Renaissance', startYear: 1400, endYear: 1600 },
  { id: 'baroque', name: 'Baroque', startYear: 1600, endYear: 1730 },
  { id: 'rococo', name: 'Rococo', startYear: 1730, endYear: 1760 },
  { id: 'neoclassical', name: 'Neoclassical', startYear: 1760, endYear: 1800 },
  { id: 'romanticism', name: 'Romanticism', startYear: 1800, endYear: 1860 },
  { id: 'impressionism', name: 'Impressionism', startYear: 1860, endYear: 1886 },
  { id: 'post-impressionism', name: 'Post-Impressionism', startYear: 1886, endYear: 1905 },
  { id: 'expressionism', name: 'Expressionism', startYear: 1905, endYear: 1907 },
  { id: 'cubism', name: 'Cubism', startYear: 1907, endYear: 1924 },
  { id: 'surrealism', name: 'Surrealism', startYear: 1924, endYear: 1943 },
  { id: 'abstract-expressionism', name: 'Abstract Expressionism', startYear: 1943, endYear: 1955 },
  { id: 'pop-art', name: 'Pop Art', startYear: 1955, endYear: 1960 },
  { id: 'minimalism', name: 'Minimalism', startYear: 1960, endYear: 1965 },
  { id: 'conceptual', name: 'Conceptual Art', startYear: 1965, endYear: 1972 },
  { id: 'digital', name: 'Digital Art', startYear: 1972, endYear: 2000 },
  { id: 'generative', name: 'Generative Art', startYear: 2000, endYear: 2015 },
  { id: 'ai', name: 'AI Art', startYear: 2015, endYear: 2020 },
  { id: 'post-digital', name: 'Post-Digital', startYear: 2020, endYear: null },
]

export const ERA_BY_ID = Object.fromEntries(ERAS.map((e) => [e.id, e])) as Record<string, Era>

export function formatYear(year: number | null): string {
  if (year === null) return 'NOW'
  if (year < 0) {
    const y = Math.abs(year)
    return `${y >= 10000 ? y.toLocaleString('en-US') : y} BCE`
  }
  return String(year)
}

export function formatSpan(start: number, end: number | null) {
  return `${formatYear(start)} — ${formatYear(end)}`
}
