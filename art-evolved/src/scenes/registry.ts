import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { SceneKind } from '@/data/types'
import type { SceneProps } from './types'

type Loader = () => Promise<{ default: ComponentType<SceneProps> }>

/** Every scene archetype is its own chunk, fetched only when the visitor approaches a chamber. */
const LOADERS: Record<SceneKind, Loader> = {
  cave: () => import('./cave'),
  monument: () => import('./monument'),
  temple: () => import('./temple'),
  pattern: () => import('./pattern'),
  ink: () => import('./ink'),
  gothic: () => import('./gothic'),
  renaissance: () => import('./renaissance'),
  baroque: () => import('./baroque'),
  sublime: () => import('./sublime'),
  impression: () => import('./impression'),
  flow: () => import('./flow'),
  nouveau: () => import('./nouveau'),
  cubism: () => import('./cubism'),
  surreal: () => import('./surreal'),
  construct: () => import('./construct'),
  dada: () => import('./dada'),
  abstract: () => import('./abstract'),
  pop: () => import('./pop'),
  minimal: () => import('./minimal'),
  op: () => import('./op'),
  installation: () => import('./installation'),
  street: () => import('./street'),
  digital: () => import('./digital'),
  generative: () => import('./generative'),
  ai: () => import('./ai'),
}

const cache = new Map<SceneKind, LazyExoticComponent<ComponentType<SceneProps>>>()

export function getScene(kind: SceneKind) {
  let c = cache.get(kind)
  if (!c) {
    c = lazy(LOADERS[kind])
    cache.set(kind, c)
  }
  return c
}

export function preloadScene(kind: SceneKind) {
  void LOADERS[kind]()
}
