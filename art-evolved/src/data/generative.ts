export interface GenerativeSystem {
  id: string
  label: string
  kind: 'shader' | 'sim' | '3d'
  note: string
}

/** The systems of the generative laboratory. Each reads the same seven parameters. */
export const GEN_SYSTEMS: GenerativeSystem[] = [
  { id: 'noise', label: 'Simplex noise field', kind: 'shader', note: 'Domain-warped fractal noise: noise fed back into its own coordinates.' },
  { id: 'voronoi', label: 'Voronoi diagram', kind: 'shader', note: 'Every point belongs to its nearest seed; borders are equidistant.' },
  { id: 'metaballs', label: 'Metaballs', kind: 'shader', note: 'An implicit surface where overlapping fields fuse like liquid.' },
  { id: 'waves', label: 'Wave functions', kind: 'shader', note: 'Interference of circular waves from moving sources.' },
  { id: 'fractal', label: 'Julia fractal', kind: 'shader', note: 'z → z² + c, iterated; colour counts the escape time.' },
  { id: 'reaction', label: 'Reaction–diffusion', kind: 'sim', note: 'Gray–Scott chemistry: two substances feed, kill and diffuse.' },
  { id: 'automata', label: 'Cellular automata', kind: 'sim', note: 'Conway’s Life: birth with three neighbours, survival with two or three.' },
  { id: 'attractor', label: 'Strange attractor', kind: '3d', note: 'A chaotic orbit that never repeats yet never escapes.' },
  { id: 'lsystem', label: 'L-system', kind: '3d', note: 'A grammar that rewrites branches into branches, recursively.' },
  { id: 'plotter', label: 'Plotter grid', kind: '3d', note: 'Squares in a grid, each rotated by a growing dose of disorder.' },
  { id: 'data', label: 'Data surface', kind: '3d', note: 'A synthetic dataset rendered as a field of bars.' },
]

export const VARIANT_SYSTEM: Record<string, string> = {
  plotter: 'plotter',
  fractal: 'fractal',
  data: 'data',
  reaction: 'reaction',
}
