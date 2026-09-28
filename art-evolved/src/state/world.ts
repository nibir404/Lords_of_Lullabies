/**
 * Per-frame mutable world state. Lives outside React so the render loop can read/write
 * it at 60fps without triggering re-renders; React only hears about discrete changes.
 */
export interface Jump {
  from: number
  to: number
  start: number
  duration: number
}

export const world = {
  /** Continuous corridor position in chamber units (0 = first chamber). */
  f: 0,
  /** Where scrolling/navigation wants f to settle. */
  target: 0,
  velocity: 0,
  jump: null as Jump | null,
  /** 0..1 — how "in transit" the camera is; drives post-process transition effects. */
  transit: 0,
  orbit: { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 },
  zoom: 0,
  pointer: { x: 0, y: 0 },
  lastInput: 0,
  /** Morph/evolution sliders are mirrored here so shaders can read them without React. */
  sliders: { evolution: 0, morph: 0, media: 0 },
  /** Post-process overrides pushed by views (landing/finale sculpture cycles). */
  postOverride: null as null | { mode: number; amount: number },
  /** True while the camera flies between views. */
  tweening: false,
  /** Current auto-cycling stage per view (landing sculpture, finale). */
  autoStage: {} as Record<string, number>,
}

export const CHAMBER_SPACING = 80
export const chamberZ = (i: number) => -i * CHAMBER_SPACING
