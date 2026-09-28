import { Vector3 } from 'three'
import { useStore } from '@/state/store'
import { chamberZ, world } from '@/state/world'
import { VIEW_CONFIG } from './viewConfig'

/** The world-space point the lights and ambience are centred on right now. */
export function focusPoint(out: Vector3) {
  const view = useStore.getState().view
  if (view === 'timeline' || view === 'create') return out.set(0, 2, chamberZ(Math.round(world.f)))
  const c = VIEW_CONFIG[view]
  return out.set(c.look[0], c.look[1] - 3, c.look[2])
}
