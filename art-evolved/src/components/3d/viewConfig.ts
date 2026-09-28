import type { LightingPreset, PostMode } from '@/data/types'
import type { ViewId } from '@/state/store'
import { MOVEMENTS } from '@/data/movements'
import { chamberZ } from '@/state/world'

export interface ViewConfig {
  label: string
  pos: [number, number, number]
  look: [number, number, number]
  bg: string
  ink: string
  accent: string
  fog: [number, number]
  lighting: LightingPreset
  post: { mode: PostMode; amount: number }
}

export const FINALE_Z = chamberZ(MOVEMENTS.length - 1) - 260

/** Each non-timeline view is a wing of the same world, reached by a cinematic flight. */
export const VIEW_CONFIG: Record<Exclude<ViewId, 'timeline' | 'create'>, ViewConfig> = {
  landing: { label: 'Entrance', pos: [0, 4.2, 142], look: [0, 6, 100], bg: '#efece6', ink: '#161514', accent: '#e0482f', fog: [30, 120], lighting: 'museum', post: { mode: 'none', amount: 0 } },
  evolution: { label: 'Art Evolution', pos: [-1600, 6, 24], look: [-1600, 4.5, -6], bg: '#e6dccb', ink: '#241d16', accent: '#a3452c', fog: [30, 110], lighting: 'museum', post: { mode: 'none', amount: 0 } },
  morph: { label: 'How Art Changed', pos: [1600, 7, 24], look: [1600, 6, 0], bg: '#2a2622', ink: '#efe6d8', accent: '#e0873a', fog: [30, 110], lighting: 'soft', post: { mode: 'none', amount: 0 } },
  media: { label: 'Material × Technology', pos: [3200, 5, 22], look: [3200, 4, 0], bg: '#15130f', ink: '#efe6d8', accent: '#e0873a', fog: [30, 110], lighting: 'soft', post: { mode: 'none', amount: 0 } },
  map: { label: 'Art Map', pos: [0, 1400, 150], look: [0, 1400, 0], bg: '#0d0d0f', ink: '#f2efe8', accent: '#e8a13a', fog: [120, 420], lighting: 'flat', post: { mode: 'none', amount: 0 } },
  finale: { label: 'Coda', pos: [0, 5, FINALE_Z + 30], look: [0, 5, FINALE_Z], bg: '#0a0a0b', ink: '#f2efe8', accent: '#e0482f', fog: [30, 120], lighting: 'dramatic', post: { mode: 'none', amount: 0 } },
}

export const VIEW_ORDER: ViewId[] = ['landing', 'timeline', 'evolution', 'morph', 'media', 'map', 'create', 'finale']
