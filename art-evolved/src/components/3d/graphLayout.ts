import { ARTISTS } from '@/data/artists'
import { MOVEMENTS } from '@/data/movements'
import { RELATIONS } from '@/data/relations'
import { TECHNOLOGIES } from '@/data/technologies'
import type { RelationType } from '@/data/types'
import { mulberry32 } from '@/utils/random'

export type NodeKind = 'movement' | 'artist' | 'technology'

export interface GraphNode {
  id: string
  label: string
  kind: NodeKind
  x: number
  y: number
  z: number
  color: string
  size: number
}

export interface GraphEdge {
  a: number
  b: number
  type: RelationType
}

export const CATEGORY_COLORS: Record<string, string> = {
  ancient: '#d9a441',
  asian: '#e0482f',
  european: '#e8dcc6',
  modern: '#5fd3b4',
  contemporary: '#6f9bff',
  digital: '#b58cff',
}

/**
 * Force-directed layout (springs + inverse-square repulsion) with a weak anchor pulling
 * movements to their chronological position, so the network still reads as a timeline.
 */
export function buildGraph() {
  const rng = mulberry32(2024)
  const nodes: GraphNode[] = []
  const index = new Map<string, number>()
  const add = (n: GraphNode) => {
    index.set(n.id, nodes.length)
    nodes.push(n)
  }
  const catAngle: Record<string, number> = { ancient: 0, asian: 1, european: 2, modern: 3, contemporary: 4, digital: 5 }
  const span = 180
  MOVEMENTS.forEach((m, i) => {
    const a = (catAngle[m.category] / 6) * Math.PI * 2
    add({ id: m.id, label: m.name, kind: 'movement', x: (i / (MOVEMENTS.length - 1) - 0.5) * span, y: Math.sin(a) * 26, z: Math.cos(a) * 26, color: CATEGORY_COLORS[m.category], size: 1.8 })
  })
  const anchors = nodes.map((n) => n.x)
  ARTISTS.forEach((ar) => {
    const home = nodes[index.get(ar.movements[0])!]
    add({ id: ar.id, label: ar.name, kind: 'artist', x: home.x + (rng() - 0.5) * 10, y: home.y + (rng() - 0.5) * 10, z: home.z + (rng() - 0.5) * 10, color: '#f2efe8', size: 0.7 })
  })
  TECHNOLOGIES.forEach((t) => {
    const home = nodes[index.get(t.movements[0])!]
    add({ id: `tech:${t.id}`, label: t.name, kind: 'technology', x: home.x, y: home.y - 30, z: home.z, color: '#9b7bff', size: 1.3 })
  })

  const edges: GraphEdge[] = RELATIONS.filter((r) => index.has(r.from) && index.has(r.to)).map((r) => ({ a: index.get(r.from)!, b: index.get(r.to)!, type: r.type }))

  const N = nodes.length
  const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N)
  for (let it = 0; it < 220; it++) {
    const cool = 1 - it / 240
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, dz = nodes[i].z - nodes[j].z
        const d2 = dx * dx + dy * dy + dz * dz + 0.5
        if (d2 > 1600) continue
        const f = 60 / d2
        vx[i] += dx * f; vy[i] += dy * f; vz[i] += dz * f
        vx[j] -= dx * f; vy[j] -= dy * f; vz[j] -= dz * f
      }
    for (const e of edges) {
      const A = nodes[e.a], B = nodes[e.b]
      const rest = e.type === 'movement' ? 7 : e.type === 'technology' ? 18 : 12
      const dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-3
      const f = ((d - rest) / d) * 0.04
      vx[e.a] += dx * f; vy[e.a] += dy * f; vz[e.a] += dz * f
      vx[e.b] -= dx * f; vy[e.b] -= dy * f; vz[e.b] -= dz * f
    }
    for (let i = 0; i < N; i++) {
      if (i < MOVEMENTS.length) vx[i] += (anchors[i] - nodes[i].x) * 0.05
      nodes[i].x += vx[i] * 0.5 * cool
      nodes[i].y += vy[i] * 0.5 * cool
      nodes[i].z += vz[i] * 0.5 * cool
      vx[i] *= 0.6; vy[i] *= 0.6; vz[i] *= 0.6
    }
  }
  return { nodes, edges, index }
}

let cached: ReturnType<typeof buildGraph> | null = null
export const getGraph = () => (cached ??= buildGraph())
