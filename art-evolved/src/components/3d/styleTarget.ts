import { Color, SRGBColorSpace, Vector3 } from 'three'
import { MOVEMENTS, MOVEMENT_BY_ID } from '@/data/movements'
import { EVOLUTION_PAIRS, TREE_STYLES } from '@/data/interactions'
import { TECHNOLOGIES } from '@/data/technologies'
import { TREE_ENV } from '@/utils/formations'
import type { CameraBehavior, LightingPreset, PostMode, TransitionKind } from '@/data/types'
import { useStore } from '@/state/store'
import { world } from '@/state/world'
import { VIEW_CONFIG } from './viewConfig'

export interface StyleTarget {
  bgA: string
  bgB: string
  mix: number
  inkA: string
  inkB: string
  accent: string
  fog: [number, number]
  lighting: LightingPreset
  post: { mode: PostMode; amount: number }
  transition: TransitionKind
  camera: CameraBehavior
  instrument?: string
}

const clampIdx = (i: number) => Math.max(0, Math.min(MOVEMENTS.length - 1, i))

/** Resolves what the world should look like right now, from the active view or corridor position. */
export function resolveStyle(): StyleTarget {
  const s = useStore.getState()
  if (s.view === 'timeline' || s.view === 'create') {
    const f = Math.max(0, Math.min(MOVEMENTS.length - 1, world.f))
    const a = MOVEMENTS[clampIdx(Math.floor(f))]
    const b = MOVEMENTS[clampIdx(Math.ceil(f))]
    const t = f - Math.floor(f)
    const near = t < 0.5 ? a : b
    const dest = MOVEMENTS[clampIdx(Math.round(world.target))]
    const v = near.visual
    return {
      bgA: a.visual.palette.bg,
      bgB: b.visual.palette.bg,
      mix: t,
      inkA: a.visual.palette.ink,
      inkB: b.visual.palette.ink,
      accent: v.palette.accent,
      // Neighbouring chambers sit ~65 units from the camera; capping the fog keeps each room a room.
      fog: [Math.min(v.fog[0], 40), Math.min(v.fog[1], 66)],
      lighting: v.lighting,
      post: v.post,
      transition: dest.visual.transition,
      camera: v.camera,
      instrument: v.instrument,
    }
  }
  const c = VIEW_CONFIG[s.view]
  let bgA = c.bg, bgB = c.bg, inkA = c.ink, inkB = c.ink, mix = 0
  if (s.view === 'evolution') {
    const pair = EVOLUTION_PAIRS.find((p) => p.id === s.evolutionPair) ?? EVOLUTION_PAIRS[0]
    const a = MOVEMENT_BY_ID[pair.from.movement].visual.palette
    const b = MOVEMENT_BY_ID[pair.to.movement].visual.palette
    ;[bgA, bgB, inkA, inkB, mix] = [a.bg, b.bg, a.ink, b.ink, world.sliders.evolution]
  } else if (s.view === 'morph') {
    const f = world.sliders.morph * (TREE_STYLES.length - 1)
    const a = TREE_ENV[TREE_STYLES[Math.floor(f)].id]
    const b = TREE_ENV[TREE_STYLES[Math.min(TREE_STYLES.length - 1, Math.ceil(f))].id]
    ;[bgA, bgB, inkA, inkB, mix] = [a.bg, b.bg, a.ink, b.ink, f - Math.floor(f)]
  } else if (s.view === 'media' && s.mediaTab === 'technology') {
    const f = world.sliders.media * (TECHNOLOGIES.length - 1)
    const a = TECHNOLOGIES[Math.floor(f)]
    const b = TECHNOLOGIES[Math.min(TECHNOLOGIES.length - 1, Math.ceil(f))]
    ;[bgA, bgB, inkA, inkB, mix] = [a.bg, b.bg, a.ink, b.ink, f - Math.floor(f)]
  }
  return {
    bgA,
    bgB,
    mix,
    inkA,
    inkB,
    accent: c.accent,
    fog: c.fog,
    lighting: c.lighting,
    post: c.post,
    transition: 'dissolve',
    camera: 'slow',
  }
}

const tmp = new Color()
export function srgbVec(hex: string, out: Vector3) {
  tmp.set(hex)
  const o = { r: 0, g: 0, b: 0 }
  tmp.getRGB(o, SRGBColorSpace)
  return out.set(o.r, o.g, o.b)
}
