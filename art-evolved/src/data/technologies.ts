import type { Medium, PostMode } from './types'

export interface Technology extends Medium {
  post: PostMode
  bg: string
  ink: string
  movements: string[]
}

export const TECHNOLOGIES: Technology[] = [
  { id: 'cave-wall', name: 'Cave Wall', year: '45,000 BCE', description: 'Art begins on architecture we did not build. Firelight makes it move.', post: 'none', bg: '#1a120c', ink: '#e9d6b8', movements: ['cave-art', 'prehistoric'] },
  { id: 'paint', name: 'Paint', year: '3000 BCE → 1400', description: 'Binders — egg, oil, lime — turn pigment into a controllable, layered skin.', post: 'none', bg: '#2a1f16', ink: '#f0e2c8', movements: ['egyptian', 'renaissance'] },
  { id: 'printing-press', name: 'Printing Press', year: '1440', description: 'Woodcut and movable type multiply images. A picture can reach thousands.', post: 'halftone', bg: '#ece6d8', ink: '#1a1814', movements: ['renaissance', 'ukiyo-e'] },
  { id: 'photography', name: 'Photography', year: '1839', description: 'The camera takes over likeness — painting is pushed toward light, feeling and form.', post: 'dither', bg: '#d8d4cc', ink: '#161616', movements: ['realism', 'impressionism'] },
  { id: 'film', name: 'Film', year: '1895', description: 'Montage, motion, the close-up: sequence becomes a way of seeing.', post: 'none', bg: '#101010', ink: '#f2f0ea', movements: ['futurism', 'surrealism', 'constructivism'] },
  { id: 'television', name: 'Television', year: '1936', description: 'Images arrive as scanlines in the living room — broadcast, repeated, everywhere.', post: 'glitch', bg: '#0b0e14', ink: '#dfe8ff', movements: ['pop-art', 'installation'] },
  { id: 'computer', name: 'Computer', year: '1950s', description: 'The plotter draws what the program decides.', post: 'pixel', bg: '#0c120c', ink: '#9dff9d', movements: ['algorithmic', 'pixel-art'] },
  { id: 'internet', name: 'Internet', year: '1990s', description: 'Images become links, copies, remixes — circulating faster than they can be made.', post: 'ascii', bg: '#05070d', ink: '#cfe3ff', movements: ['net-art', 'glitch-art'] },
  { id: '3d-graphics', name: '3D Graphics', year: '1970s → 1990s', description: 'Simulated space, simulated light, simulated matter.', post: 'none', bg: '#090b12', ink: '#e6f0ff', movements: ['3d-art'] },
  { id: 'generative-software', name: 'Generative Software', year: '2000s', description: 'Processing, shaders, GPUs — the system itself becomes the artwork.', post: 'none', bg: '#0a0a0c', ink: '#f0eee8', movements: ['generative-art', 'computational'] },
  { id: 'ai', name: 'AI', year: '2015 →', description: 'Learned models of images; latent space as a new landscape to explore.', post: 'none', bg: '#07080c', ink: '#eef0f7', movements: ['ai-art', 'post-digital'] },
]
