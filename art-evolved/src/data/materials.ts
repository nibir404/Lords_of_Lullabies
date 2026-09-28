import type { Medium } from './types'

export const MATERIALS: Medium[] = [
  { id: 'stone', name: 'Stone', year: '45,000 BCE', description: 'The first surface: a wall that already had a shape. Marks were scratched, blown and rubbed into it.' },
  { id: 'pigment', name: 'Pigment', year: '40,000 BCE', description: 'Earth ground into colour — ochre, charcoal, lapis. Colour became portable, then precious.' },
  { id: 'paper', name: 'Paper', year: '105 CE', description: 'Fibre pressed into sheets in Han China. Images became light, cheap and able to travel.' },
  { id: 'canvas', name: 'Canvas', year: '1500', description: 'Woven linen stretched on a frame: the painting became a mobile object with its own body.' },
  { id: 'photography', name: 'Photography', year: '1839', description: 'Light fixed by chemistry. Painting no longer had to record — so it began to interpret.' },
  { id: 'film', name: 'Film', year: '1895', description: 'Images in sequence: time itself became an artistic material.' },
  { id: 'computer', name: 'Computer', year: '1950s', description: 'The image as calculation. A drawing could now be described before it was seen.' },
  { id: 'pixels', name: 'Pixels', year: '1970s', description: 'The grid returns — every picture element addressed, stored, copied without loss.' },
  { id: '3d', name: '3D', year: '1980s', description: 'Vertices, polygons and simulated light: a whole world modelled in memory.' },
  { id: 'generative', name: 'Generative Systems', year: '2000s', description: 'The artist writes a system; the system writes endless images.' },
  { id: 'ai', name: 'AI', year: '2015–', description: 'Models trained on the visual past recombine it — the archive begins to imagine.' },
]
