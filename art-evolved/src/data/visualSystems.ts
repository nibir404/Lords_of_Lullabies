import type { Palette, SceneKind, VisualSystem } from './types'

type Preset = Omit<VisualSystem, 'scene' | 'palette' | 'variant'>

/**
 * Default behaviour for each procedural scene archetype. A movement only needs a scene kind
 * and palette; everything else is inherited and can be overridden per movement.
 */
export const SCENE_PRESETS: Record<SceneKind, Preset> = {
  cave: { geometry: 'rough', particles: 'low', lighting: 'fire', camera: 'drift', post: { mode: 'none', amount: 0 }, motion: 'slow', ui: 'stone', transition: 'fade', sound: 'cave', fog: [8, 60] },
  monument: { geometry: 'architectural', particles: 'low', lighting: 'hard', camera: 'slow', post: { mode: 'none', amount: 0 }, motion: 'still', ui: 'gilded', transition: 'dissolve', sound: 'stone', fog: [20, 90] },
  temple: { geometry: 'architectural', particles: 'low', lighting: 'museum', camera: 'slow', post: { mode: 'none', amount: 0 }, motion: 'still', ui: 'museum', transition: 'fade', sound: 'stone', fog: [20, 95] },
  pattern: { geometry: 'mathematical', particles: 'low', lighting: 'soft', camera: 'orbit', post: { mode: 'none', amount: 0 }, motion: 'slow', ui: 'gilded', transition: 'dissolve', sound: 'sacred', fog: [18, 80] },
  ink: { geometry: 'organic', particles: 'low', lighting: 'flat', camera: 'still', post: { mode: 'none', amount: 0 }, motion: 'slow', ui: 'ink', transition: 'ink', sound: 'ink', fog: [14, 70] },
  gothic: { geometry: 'architectural', particles: 'mid', lighting: 'dramatic', camera: 'slow', post: { mode: 'none', amount: 0 }, motion: 'slow', ui: 'gilded', transition: 'fade', sound: 'sacred', fog: [12, 75] },
  renaissance: { geometry: 'architectural', particles: 'low', lighting: 'museum', camera: 'slow', post: { mode: 'none', amount: 0 }, motion: 'still', ui: 'museum', transition: 'fade', sound: 'acoustic', fog: [24, 100] },
  baroque: { geometry: 'organic', particles: 'high', lighting: 'dramatic', camera: 'theatrical', post: { mode: 'none', amount: 0 }, motion: 'flowing', ui: 'gilded', transition: 'flash', sound: 'court', fog: [10, 60] },
  sublime: { geometry: 'organic', particles: 'mid', lighting: 'dawn', camera: 'drift', post: { mode: 'none', amount: 0 }, motion: 'slow', ui: 'museum', transition: 'fade', sound: 'storm', fog: [10, 110] },
  impression: { geometry: 'particulate', particles: 'high', lighting: 'soft', camera: 'drift', post: { mode: 'none', amount: 0 }, motion: 'flowing', ui: 'museum', transition: 'dissolve', sound: 'organic', fog: [20, 90] },
  flow: { geometry: 'particulate', particles: 'high', lighting: 'soft', camera: 'drift', post: { mode: 'none', amount: 0 }, motion: 'turbulent', ui: 'museum', transition: 'dissolve', sound: 'turbulent', fog: [18, 80] },
  nouveau: { geometry: 'organic', particles: 'low', lighting: 'soft', camera: 'orbit', post: { mode: 'none', amount: 0 }, motion: 'flowing', ui: 'gilded', transition: 'dissolve', sound: 'organic', fog: [14, 75] },
  cubism: { geometry: 'fragmented', particles: 'low', lighting: 'hard', camera: 'multi-axis', post: { mode: 'none', amount: 0 }, motion: 'mechanical', ui: 'fragment', transition: 'fragment', sound: 'machine', fog: [16, 80] },
  surreal: { geometry: 'organic', particles: 'low', lighting: 'dawn', camera: 'float', post: { mode: 'none', amount: 0 }, motion: 'slow', ui: 'dream', transition: 'dissolve', sound: 'dream', fog: [30, 140] },
  construct: { geometry: 'planar', particles: 'none', lighting: 'flat', camera: 'multi-axis', post: { mode: 'none', amount: 0 }, motion: 'mechanical', ui: 'grid', transition: 'fragment', sound: 'machine', fog: [30, 110] },
  dada: { geometry: 'typographic', particles: 'low', lighting: 'flat', camera: 'drift', post: { mode: 'none', amount: 0 }, motion: 'chaotic', ui: 'fragment', transition: 'fragment', sound: 'machine', fog: [20, 90] },
  abstract: { geometry: 'mathematical', particles: 'high', lighting: 'soft', camera: 'orbit', post: { mode: 'none', amount: 0 }, motion: 'flowing', ui: 'museum', transition: 'dissolve', sound: 'turbulent', fog: [16, 80], instrument: 'abstract' },
  pop: { geometry: 'planar', particles: 'low', lighting: 'flat', camera: 'drift', post: { mode: 'halftone', amount: 0.85 }, motion: 'mechanical', ui: 'pop', transition: 'flash', sound: 'pop', fog: [30, 120] },
  minimal: { geometry: 'singular', particles: 'none', lighting: 'museum', camera: 'still', post: { mode: 'none', amount: 0 }, motion: 'still', ui: 'void', transition: 'fade', sound: 'silence', fog: [40, 160] },
  op: { geometry: 'mathematical', particles: 'none', lighting: 'flat', camera: 'slow', post: { mode: 'none', amount: 0 }, motion: 'mechanical', ui: 'mono', transition: 'flash', sound: 'machine', fog: [30, 120] },
  installation: { geometry: 'singular', particles: 'mid', lighting: 'neon', camera: 'orbit', post: { mode: 'none', amount: 0 }, motion: 'slow', ui: 'dream', transition: 'fade', sound: 'dream', fog: [6, 70] },
  street: { geometry: 'planar', particles: 'mid', lighting: 'neon', camera: 'drift', post: { mode: 'none', amount: 0 }, motion: 'chaotic', ui: 'pop', transition: 'glitch', sound: 'pop', fog: [14, 70] },
  digital: { geometry: 'voxel', particles: 'low', lighting: 'flat', camera: 'orbit', post: { mode: 'pixel', amount: 1 }, motion: 'mechanical', ui: 'pixel', transition: 'pixelate', sound: 'digital', fog: [20, 90] },
  generative: { geometry: 'mathematical', particles: 'high', lighting: 'flat', camera: 'orbit', post: { mode: 'none', amount: 0 }, motion: 'flowing', ui: 'generative', transition: 'dissolve', sound: 'generative', fog: [20, 100], instrument: 'generative' },
  ai: { geometry: 'mathematical', particles: 'high', lighting: 'soft', camera: 'orbit', post: { mode: 'none', amount: 0 }, motion: 'flowing', ui: 'generative', transition: 'glitch', sound: 'neural', fog: [16, 90] },
}

export function vs(scene: SceneKind, palette: Palette, overrides: Partial<VisualSystem> = {}): VisualSystem {
  return { scene, palette, ...SCENE_PRESETS[scene], ...overrides }
}

export const pal = (bg: string, ink: string, accent: string, ...colors: string[]): Palette => ({ bg, ink, accent, colors })
