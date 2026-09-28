import { create } from 'zustand'
import { MOVEMENTS, movementIndex } from '@/data/movements'
import type { RelationType } from '@/data/types'
import { EVOLUTION_PAIRS } from '@/data/interactions'
import { randomSeed } from '@/utils/random'
import { world } from './world'

export type ViewId = 'landing' | 'timeline' | 'evolution' | 'morph' | 'media' | 'map' | 'finale' | 'create'
export type Quality = 'high' | 'medium' | 'low'
export type Device = 'desktop' | 'tablet' | 'mobile'

export interface Instruments {
  abstract: { form: number; density: number; chaos: number; color: number; movement: number; scale: number }
  pixel: { pixelSize: number; colorLimit: number; dither: number; noise: number }
  ascii: { charset: number; density: number; contrast: number; scale: number }
  dither: { stage: number; threshold: number; pattern: number }
  glitch: { intensity: number; tear: number; sort: number }
  generative: { system: string; seed: number; chaos: number; iterations: number; density: number; scale: number; color: number; symmetry: number }
}

export const DEFAULT_INSTRUMENTS: Instruments = {
  abstract: { form: 0.2, density: 0.38, chaos: 0.45, color: 0, movement: 0.35, scale: 0.28 },
  pixel: { pixelSize: 6, colorLimit: 6, dither: 0.6, noise: 0.1 },
  ascii: { charset: 0, density: 10, contrast: 1.2, scale: 1 },
  dither: { stage: 2, threshold: 0.5, pattern: 0 },
  glitch: { intensity: 0.6, tear: 0.5, sort: 0.4 },
  generative: { system: 'noise', seed: randomSeed(), chaos: 0.5, iterations: 0.5, density: 0.6, scale: 0.5, color: 0, symmetry: 0 },
}

interface Surprise {
  id: string
  at: number
}

interface State {
  view: ViewId
  prevView: ViewId
  viewChangedAt: number
  activeIndex: number
  exploring: boolean
  device: Device
  quality: Quality
  webgl: boolean
  reducedMotion: boolean
  sound: boolean
  searchOpen: boolean
  menuOpen: boolean
  artistsOpen: boolean
  artistId: string | null
  surprise: Surprise | null
  instruments: Instruments
  evolutionPair: string
  mediaTab: 'materials' | 'technology'
  mapSelected: string | null
  mapFilters: Record<RelationType, boolean>
  ready: Record<string, boolean>
  uiIdle: boolean
  sliders: { evolution: number; morph: number; media: number }

  setView: (view: ViewId) => void
  goToIndex: (index: number) => void
  goToMovement: (id: string) => void
  next: () => void
  prev: () => void
  setActiveIndex: (i: number) => void
  setExploring: (v: boolean) => void
  toggleExplore: () => void
  setEnv: (env: Partial<Pick<State, 'device' | 'quality' | 'webgl' | 'reducedMotion'>>) => void
  setSound: (v: boolean) => void
  setSearchOpen: (v: boolean) => void
  setMenuOpen: (v: boolean) => void
  setArtistsOpen: (v: boolean) => void
  openArtist: (id: string | null) => void
  surpriseMe: () => void
  clearSurprise: () => void
  setInstrument: <K extends keyof Instruments>(key: K, patch: Partial<Instruments[K]>) => void
  resetInstrument: (key: keyof Instruments) => void
  setEvolutionPair: (id: string) => void
  setMediaTab: (t: 'materials' | 'technology') => void
  selectMapNode: (id: string | null) => void
  toggleMapFilter: (t: RelationType) => void
  markReady: (id: string, v: boolean) => void
  setUiIdle: (v: boolean) => void
  setSlider: (key: 'evolution' | 'morph' | 'media', v: number) => void
}

const clampIndex = (i: number) => Math.max(0, Math.min(MOVEMENTS.length - 1, Math.round(i)))

export const useStore = create<State>((set, get) => ({
  view: 'landing',
  prevView: 'landing',
  viewChangedAt: 0,
  activeIndex: 0,
  exploring: false,
  device: 'desktop',
  quality: 'high',
  webgl: true,
  reducedMotion: false,
  sound: false,
  searchOpen: false,
  menuOpen: false,
  artistsOpen: false,
  artistId: null,
  surprise: null,
  instruments: structuredClone(DEFAULT_INSTRUMENTS),
  evolutionPair: EVOLUTION_PAIRS[0].id,
  mediaTab: 'materials',
  mapSelected: null,
  mapFilters: { influence: true, reaction: true, evolution: true, collaboration: true, movement: true, technology: true },
  ready: {},
  uiIdle: false,
  sliders: { evolution: 0, morph: 0, media: 0 },

  setView: (view) => {
    const cur = get().view
    if (cur === view) return
    set({ view, prevView: cur, viewChangedAt: performance.now(), exploring: false, menuOpen: false })
  },
  goToIndex: (index) => {
    const i = clampIndex(index)
    const distance = Math.abs(i - world.f)
    world.target = i
    world.jump = distance > 2.5 ? { from: world.f, to: i, start: performance.now(), duration: Math.min(4200, 1600 + distance * 120) } : null
    const s = get()
    if (s.view !== 'timeline') s.setView('timeline')
  },
  goToMovement: (id) => {
    const i = movementIndex(id)
    if (i >= 0) get().goToIndex(i)
  },
  next: () => {
    if (Math.round(world.target) >= MOVEMENTS.length - 1) get().setView('finale')
    else get().goToIndex(Math.round(world.target) + 1)
  },
  prev: () => get().goToIndex(Math.round(world.target) - 1),
  setActiveIndex: (i) => {
    if (get().activeIndex !== i) set({ activeIndex: i })
  },
  setExploring: (v) => set({ exploring: v }),
  toggleExplore: () => set((s) => ({ exploring: !s.exploring })),
  setEnv: (env) => set(env),
  setSound: (v) => set({ sound: v }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setMenuOpen: (v) => set({ menuOpen: v }),
  setArtistsOpen: (v) => set({ artistsOpen: v }),
  openArtist: (id) => set({ artistId: id }),
  surpriseMe: () => {
    const cur = get().activeIndex
    let i = cur
    while (i === cur) i = Math.floor(Math.random() * MOVEMENTS.length)
    set({ surprise: { id: MOVEMENTS[i].id, at: performance.now() }, exploring: false })
    get().goToIndex(i)
    if (world.jump === null) world.jump = { from: world.f, to: i, start: performance.now(), duration: 2200 }
  },
  clearSurprise: () => set({ surprise: null }),
  setInstrument: (key, patch) => set((s) => ({ instruments: { ...s.instruments, [key]: { ...s.instruments[key], ...patch } } })),
  resetInstrument: (key) =>
    set((s) => ({
      instruments: {
        ...s.instruments,
        [key]: key === 'generative' ? { ...DEFAULT_INSTRUMENTS.generative, seed: randomSeed() } : { ...DEFAULT_INSTRUMENTS[key] },
      },
    })),
  setEvolutionPair: (id) => set({ evolutionPair: id }),
  setMediaTab: (t) => set({ mediaTab: t }),
  selectMapNode: (id) => set({ mapSelected: id }),
  toggleMapFilter: (t) => set((s) => ({ mapFilters: { ...s.mapFilters, [t]: !s.mapFilters[t] } })),
  markReady: (id, v) => set((s) => ({ ready: { ...s.ready, [id]: v } })),
  setUiIdle: (v) => {
    if (get().uiIdle !== v) set({ uiIdle: v })
  },
  setSlider: (key, v) => {
    world.sliders[key] = v
    set((s) => ({ sliders: { ...s.sliders, [key]: v } }))
  },
}))

export const useActiveMovement = () => useStore((s) => MOVEMENTS[s.activeIndex])
