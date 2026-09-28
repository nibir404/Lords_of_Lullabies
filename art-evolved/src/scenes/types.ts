import type { Movement } from '@/data/types'

export interface SceneProps {
  movement: Movement
  /** 0.3–1: scales particle counts and geometric detail. */
  quality: number
}
