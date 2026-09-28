/** Configuration for the signature interactions. Each entry is data; formations live in utils/formations. */

export interface EvolutionPair {
  id: string
  from: { movement: string; formation: string; label: string }
  to: { movement: string; formation: string; label: string }
  stages: string[]
}

export const EVOLUTION_PAIRS: EvolutionPair[] = [
  {
    id: 'renaissance-cubism',
    from: { movement: 'renaissance', formation: 'ren-architecture', label: 'Renaissance' },
    to: { movement: 'cubism', formation: 'cubist-architecture', label: 'Cubism' },
    stages: ['Perspective holds', 'Architecture fractures', 'Perspective breaks', 'Planes separate', 'Geometry becomes Cubist'],
  },
  {
    id: 'baroque-minimalism',
    from: { movement: 'baroque', formation: 'baroque-ornament', label: 'Baroque' },
    to: { movement: 'minimalism', formation: 'minimal-block', label: 'Minimalism' },
    stages: ['Ornament everywhere', 'Curves unwind', 'Gold drains away', 'Units align', 'One object remains'],
  },
  {
    id: 'impressionism-pixel',
    from: { movement: 'impressionism', formation: 'impression-landscape', label: 'Impressionism' },
    to: { movement: 'pixel-art', formation: 'pixel-landscape', label: 'Pixel Art' },
    stages: ['Strokes of light', 'Dabs harden', 'Colour quantises', 'Grid asserts itself', 'Every mark is a pixel'],
  },
]

export interface MorphStyle {
  id: string
  label: string
  movement: string
  caption: string
}

export const TREE_STYLES: MorphStyle[] = [
  { id: 'prehistoric', label: 'Prehistoric', movement: 'cave-art', caption: 'A few scratched lines in charcoal: the idea of “tree” as sign.' },
  { id: 'renaissance', label: 'Renaissance', movement: 'renaissance', caption: 'Volume, light and anatomy — the tree as an object in measured space.' },
  { id: 'impressionist', label: 'Impressionist', movement: 'impressionism', caption: 'Not a tree but the light on it: dabs of colour that merge in the eye.' },
  { id: 'cubist', label: 'Cubist', movement: 'cubism', caption: 'Seen from many sides at once, reduced to faceted planes.' },
  { id: 'surrealist', label: 'Surrealist', movement: 'surrealism', caption: 'Uprooted, floating, melting — the tree as it appears in a dream.' },
  { id: 'minimalist', label: 'Minimalist', movement: 'minimalism', caption: 'One line, one circle. The least that can still be a tree.' },
  { id: 'pixel', label: 'Pixel', movement: 'pixel-art', caption: 'Quantised into a grid of addressable units.' },
  { id: 'generative', label: 'Generative', movement: 'generative-art', caption: 'A recursive rule that grows a different tree on every run.' },
]
