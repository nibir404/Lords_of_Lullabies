import type { Object3D } from 'three'

/**
 * True when the object and all its ancestors are visible. Mounted-but-hidden content (cached
 * chambers, rooms still compiling) uses this to skip per-frame work nobody can see.
 */
export function isShown(o: Object3D | null | undefined) {
  for (let n = o; n; n = n.parent) if (!n.visible) return false
  return !!o
}
