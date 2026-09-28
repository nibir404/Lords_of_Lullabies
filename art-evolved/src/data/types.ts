export type SceneKind =
  | 'cave'
  | 'monument'
  | 'temple'
  | 'pattern'
  | 'ink'
  | 'gothic'
  | 'renaissance'
  | 'baroque'
  | 'sublime'
  | 'impression'
  | 'flow'
  | 'nouveau'
  | 'cubism'
  | 'surreal'
  | 'construct'
  | 'dada'
  | 'abstract'
  | 'pop'
  | 'minimal'
  | 'op'
  | 'installation'
  | 'street'
  | 'digital'
  | 'generative'
  | 'ai'

export type PostMode = 'none' | 'pixel' | 'ascii' | 'dither' | 'halftone' | 'glitch'

export type UiTheme =
  | 'museum'
  | 'stone'
  | 'gilded'
  | 'ink'
  | 'fragment'
  | 'dream'
  | 'void'
  | 'mono'
  | 'pixel'
  | 'pop'
  | 'glitch'
  | 'generative'
  | 'grid'

export type Instrument = 'abstract' | 'pixel' | 'ascii' | 'dither' | 'glitch' | 'generative'

export type SoundProfile =
  | 'cave'
  | 'stone'
  | 'sacred'
  | 'ink'
  | 'acoustic'
  | 'court'
  | 'storm'
  | 'organic'
  | 'turbulent'
  | 'machine'
  | 'dream'
  | 'silence'
  | 'pop'
  | 'digital'
  | 'glitch'
  | 'generative'
  | 'neural'

export type LightingPreset = 'fire' | 'soft' | 'hard' | 'dramatic' | 'flat' | 'museum' | 'neon' | 'dawn'
export type CameraBehavior = 'still' | 'drift' | 'orbit' | 'multi-axis' | 'theatrical' | 'float' | 'slow'
export type TransitionKind = 'fade' | 'fragment' | 'dissolve' | 'pixelate' | 'ink' | 'glitch' | 'flash'

export interface Palette {
  bg: string
  ink: string
  accent: string
  colors: string[]
}

/**
 * The "visual operating system" contract. Every movement declares one of these;
 * the world, camera, lights, post-processing, sound and UI all read from it.
 */
export interface VisualSystem {
  scene: SceneKind
  variant?: string
  palette: Palette
  geometry: 'rough' | 'architectural' | 'organic' | 'fragmented' | 'planar' | 'particulate' | 'voxel' | 'typographic' | 'singular' | 'mathematical'
  particles: 'none' | 'low' | 'mid' | 'high'
  lighting: LightingPreset
  camera: CameraBehavior
  post: { mode: PostMode; amount: number }
  motion: 'still' | 'slow' | 'flowing' | 'turbulent' | 'mechanical' | 'chaotic'
  ui: UiTheme
  transition: TransitionKind
  sound: SoundProfile
  fog: [near: number, far: number]
  instrument?: Instrument
}

export type CategoryId = 'ancient' | 'asian' | 'european' | 'modern' | 'contemporary' | 'digital'

export interface Movement {
  id: string
  name: string
  startYear: number
  endYear: number | null
  region: string
  category: CategoryId
  eraId: string
  quote: string
  origin: string
  keyIdeas: string[]
  visualLanguage: string[]
  technology: string
  influence: string
  artists: string[]
  keywords: string[]
  visualSystems: string[]
  influencedBy: string[]
  reactionTo?: string[]
  visual: VisualSystem
}

export interface Era {
  id: string
  name: string
  startYear: number
  endYear: number | null
}

export interface Artist {
  id: string
  name: string
  lifespan: string
  movements: string[]
  region: string
  coreIdeas: string
  visualLanguage: string[]
  influence: string
  /** Optional procedural painter override for the artist's interpretation. */
  painter?: string
  note?: string
}

export type RelationType = 'influence' | 'reaction' | 'evolution' | 'collaboration' | 'movement' | 'technology'

export interface Relation {
  from: string
  to: string
  type: RelationType
}

export interface Medium {
  id: string
  name: string
  year: string
  description: string
}
