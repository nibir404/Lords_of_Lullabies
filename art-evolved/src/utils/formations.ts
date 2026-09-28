import { Color, Euler, Quaternion, Vector3 } from 'three'
import { createNoise3D, fbm3 } from './noise'
import { gauss, mulberry32, type Rng } from './random'
import { PHI, TAU } from './math'

/**
 * A formation is one arrangement of N instanced units: position, scale, rotation and colour.
 * Every morph in the museum interpolates between formations of the same N — the geometry
 * itself transforms, nothing is cross-faded.
 */
export interface Formation {
  n: number
  pos: Float32Array
  scl: Float32Array
  rot: Float32Array
  col: Float32Array
  /** 0..1 per instance: the order in which units depart during a morph. */
  order: Float32Array
}

export type Builder = (n: number, rng: Rng, base?: Formation) => Formation

const _c = new Color()
const _q = new Quaternion()
const _e = new Euler()
const _v = new Vector3()
const _up = new Vector3(0, 1, 0)
const noise = createNoise3D(11)

export function formation(n: number): Formation {
  return { n, pos: new Float32Array(n * 3), scl: new Float32Array(n * 3), rot: new Float32Array(n * 3), col: new Float32Array(n * 3).fill(1), order: new Float32Array(n) }
}

export function put(f: Formation, i: number, x: number, y: number, z: number, sx: number, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) {
  const k = i * 3
  f.pos[k] = x
  f.pos[k + 1] = y
  f.pos[k + 2] = z
  f.scl[k] = sx
  f.scl[k + 1] = sy
  f.scl[k + 2] = sz
  f.rot[k] = rx
  f.rot[k + 1] = ry
  f.rot[k + 2] = rz
}

export function paint(f: Formation, i: number, color: string | Color, jitter = 0, rng?: Rng) {
  _c.set(color)
  if (jitter && rng) _c.offsetHSL((rng() - 0.5) * jitter * 0.1, 0, (rng() - 0.5) * jitter)
  f.col[i * 3] = _c.r
  f.col[i * 3 + 1] = _c.g
  f.col[i * 3 + 2] = _c.b
}

export function hide(f: Formation, i: number, x = 0, y = 0, z = 0) {
  put(f, i, x, y, z, 0, 0, 0)
}

/** Euler angles that rotate the unit's local +Y onto a direction. */
export function alignY(dx: number, dy: number, dz: number): [number, number, number] {
  _v.set(dx, dy, dz).normalize()
  _q.setFromUnitVectors(_up, _v)
  _e.setFromQuaternion(_q)
  return [_e.x, _e.y, _e.z]
}

export function finalize(f: Formation, wx = 0.65, wy = 0.35) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i < f.n; i++) {
    const x = f.pos[i * 3], y = f.pos[i * 3 + 1]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  const sx = maxX - minX || 1
  const sy = maxY - minY || 1
  for (let i = 0; i < f.n; i++) f.order[i] = wx * ((f.pos[i * 3] - minX) / sx) + wy * ((f.pos[i * 3 + 1] - minY) / sy)
  return f
}

export function fib(i: number, n: number): [number, number, number] {
  const y = 1 - (2 * (i + 0.5)) / n
  const r = Math.sqrt(1 - y * y)
  const th = i * TAU * (1 - 1 / PHI)
  return [Math.cos(th) * r, y, Math.sin(th) * r]
}

const lerpHex = (a: string, b: string, t: number) => _c.set(a).lerp(new Color(b), t).clone()

// ────────────────────────────────────────────── shared shapes

function tiledShell(f: Formation, start: number, count: number, cx: number, cy: number, cz: number, radius: number, displace: number, size: number, color: (i: number, nx: number, ny: number, nz: number) => string | Color) {
  for (let j = 0; j < count; j++) {
    const i = start + j
    const [x, y, z] = fib(j, count)
    const d = displace ? 1 + displace * fbm3(noise, x * 1.3, y * 1.3, z * 1.3, 3) : 1
    const r = radius * d
    const rot = alignY(x, y, z)
    put(f, i, cx + x * r, cy + y * r, cz + z * r, size, size * 0.25, size, ...rot)
    paint(f, i, color(j, x, y, z))
  }
}

function icosaEdges(radius: number, detail = 0) {
  const t = PHI
  let verts: Vector3[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map(([x, y, z]) => new Vector3(x, y, z).normalize())
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ]
  for (let d = 0; d < detail; d++) {
    const mid = new Map<string, number>()
    const m = (a: number, b: number) => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`
      let idx = mid.get(key)
      if (idx === undefined) {
        idx = verts.length
        verts.push(verts[a].clone().add(verts[b]).normalize())
        mid.set(key, idx)
      }
      return idx
    }
    const nf: number[][] = []
    for (const [a, b, c] of faces) {
      const ab = m(a, b), bc = m(b, c), ca = m(c, a)
      nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca])
    }
    faces = nf
    verts = [...verts]
  }
  const edges = new Map<string, [Vector3, Vector3]>()
  for (const [a, b, c] of faces)
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      const key = p < q ? `${p}_${q}` : `${q}_${p}`
      if (!edges.has(key)) edges.set(key, [verts[p].clone().multiplyScalar(radius), verts[q].clone().multiplyScalar(radius)])
    }
  return { edges: [...edges.values()], faces: faces.map((fc) => fc.map((k) => verts[k].clone().multiplyScalar(radius))) }
}

/** Distributes instances along line segments as thin oriented bars — reads as a wireframe. */
function alongSegments(f: Formation, start: number, count: number, segs: [Vector3, Vector3][], thickness: number, color: (s: number, t: number) => string | Color, offset: [number, number, number] = [0, 0, 0]) {
  const lens = segs.map(([a, b]) => a.distanceTo(b))
  const total = lens.reduce((s, l) => s + l, 0)
  let i = start
  segs.forEach(([a, b], s) => {
    const k = s === segs.length - 1 ? start + count - i : Math.max(1, Math.round((lens[s] / total) * count))
    const rot = alignY(b.x - a.x, b.y - a.y, b.z - a.z)
    for (let j = 0; j < k && i < start + count; j++, i++) {
      const t = (j + 0.5) / k
      put(f, i, a.x + (b.x - a.x) * t + offset[0], a.y + (b.y - a.y) * t + offset[1], a.z + (b.z - a.z) * t + offset[2], thickness, (lens[s] / k) * 1.02, thickness, ...rot)
      paint(f, i, color(s, t))
    }
  })
  for (; i < start + count; i++) hide(f, i)
}

function lorenz(count: number, scale: number): [number, number, number][] {
  const out: [number, number, number][] = []
  let x = 0.1, y = 0, z = 0
  const dt = 0.006
  for (let i = 0; i < count * 4 + 300; i++) {
    const dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z
    x += dx * dt
    y += dy * dt
    z += dz * dt
    if (i > 300 && i % 4 === 0) out.push([x * scale, (z - 25) * scale, y * scale])
  }
  return out
}

function cliffordPoints(count: number, rng: Rng, a = -1.4, b = 1.6, c = 1.0, d = 0.7): [number, number][] {
  const pts: [number, number][] = []
  let x = rng() * 0.1, y = rng() * 0.1
  for (let i = 0; i < count + 50; i++) {
    const nx = Math.sin(a * y) + c * Math.cos(a * x)
    const ny = Math.sin(b * x) + d * Math.cos(b * y)
    x = nx
    y = ny
    if (i >= 50) pts.push([x, y])
  }
  return pts
}

function network(f: Formation, start: number, count: number, layers: number[], width: number, height: number, rng: Rng, cols: [string, string], depth = 3) {
  const nodes: Vector3[][] = layers.map((k, li) => Array.from({ length: k }, (_, j) => new Vector3(-width / 2 + (li / (layers.length - 1)) * width, (k === 1 ? 0 : -height / 2 + (j / (k - 1)) * height), Math.sin(j * 1.7 + li) * depth * 0.5)))
  let i = start
  const nodeCount = layers.reduce((s, k) => s + k, 0)
  nodes.flat().forEach((p) => {
    if (i >= start + count) return
    put(f, i, p.x, p.y, p.z, 0.34, 0.34, 0.34, 0.6, 0.6, 0)
    paint(f, i, cols[1])
    i++
  })
  const remaining = start + count - i
  const perEdge = 6
  const edges = Math.floor(remaining / perEdge)
  for (let e = 0; e < edges; e++) {
    const li = Math.floor(rng() * (layers.length - 1))
    const a = nodes[li][Math.floor(rng() * layers[li])]
    const b = nodes[li + 1][Math.floor(rng() * layers[li + 1])]
    const rot = alignY(b.x - a.x, b.y - a.y, b.z - a.z)
    const len = a.distanceTo(b)
    for (let j = 0; j < perEdge; j++, i++) {
      const t = (j + rng() * 0.5) / perEdge
      put(f, i, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t, 0.03, len / perEdge, 0.03, ...rot)
      paint(f, i, lerpHex(cols[0], cols[1], t))
    }
  }
  for (; i < start + count; i++) hide(f, i)
  return nodeCount
}

function voxelSphere(f: Formation, radius: number, cell: number, cy: number, palette: string[]) {
  const cells: [number, number, number][] = []
  const r = Math.ceil(radius / cell)
  for (let x = -r; x <= r; x++)
    for (let y = -r; y <= r; y++)
      for (let z = -r; z <= r; z++) {
        const d = Math.hypot(x, y, z) * cell
        if (d <= radius && d > radius - cell * 1.8) cells.push([x, y, z])
      }
  for (let i = 0; i < f.n; i++) {
    const c = cells[i % cells.length]
    if (i >= cells.length) {
      hide(f, i, c[0] * cell, cy + c[1] * cell, c[2] * cell)
      continue
    }
    put(f, i, c[0] * cell, cy + c[1] * cell, c[2] * cell, cell * 0.96)
    const shade = 0.5 + 0.5 * ((c[1] + c[0] * 0.5) / r)
    paint(f, i, palette[Math.min(palette.length - 1, Math.floor(shade * palette.length))])
  }
}

function dotMatrix(f: Formation, cols: number, rows: number, cell: number, cy: number, ink: string) {
  for (let i = 0; i < f.n; i++) {
    if (i >= cols * rows) {
      hide(f, i, 0, cy, 0)
      continue
    }
    const cx = i % cols, ry = Math.floor(i / cols)
    const x = (cx - cols / 2 + 0.5) * cell
    const y = (ry - rows / 2 + 0.5) * cell
    const nx = x / (cols * cell * 0.32), ny = y / (rows * cell * 0.45)
    const inside = 1 - (nx * nx + ny * ny)
    const light = inside > 0 ? Math.max(0.05, Math.sqrt(inside) * (0.6 - nx * 0.35 + ny * 0.35)) : 0.03
    const s = cell * Math.min(0.95, light)
    put(f, i, x, cy + y, 0, s, s, s * 0.3)
    paint(f, i, ink)
  }
}

// ────────────────────────────────────────────── landing + finale sculpture

export const SCULPTURE_STAGES = ['Primitive', 'Organic', 'Fragmented', 'Particles', 'Pixels', 'ASCII', 'Wireframe', 'Generative'] as const

export const sculpturePrimitive: Builder = (n, rng) => {
  const f = formation(n)
  const a = Math.floor(n * 0.42), b = Math.floor(n * 0.36)
  tiledShell(f, 0, a, 0, 2.6, 0, 2.3, 0, 0.42, (_, x, y) => (y + x * 0.3 > 0.2 ? '#f4f1ea' : '#2a2826'))
  for (let j = 0; j < b; j++) {
    const i = a + j
    const face = j % 6
    const u = (rng() - 0.5) * 3.6, v = (rng() - 0.5) * 3.6
    const p = [[1.8, u, v], [-1.8, u, v], [u, 1.8, v], [u, -1.8, v], [u, v, 1.8], [u, v, -1.8]][face]
    const nrm = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]][face]
    const cs = Math.cos(0.7854), sn = Math.sin(0.7854)
    const x = p[0] * cs - p[2] * sn, z = p[0] * sn + p[2] * cs
    const rot = alignY(nrm[0] * cs - nrm[2] * sn, nrm[1], nrm[0] * sn + nrm[2] * cs)
    put(f, i, x, p[1] - 2.2, z, 0.5, 0.1, 0.5, ...rot)
    paint(f, i, face === 2 ? '#e8e3d8' : '#1b1a19', 0.1, rng)
  }
  const c = n - a - b
  for (let j = 0; j < c; j++) {
    const i = a + b + j
    const h = rng()
    const ang = rng() * TAU
    const r = (1 - h) * 1.3
    const rot = alignY(Math.cos(ang), 0.55, Math.sin(ang))
    put(f, i, 3.4 + Math.cos(ang) * r, 3.6 + h * 3.4, Math.sin(ang) * r, 0.3, 0.08, 0.3, ...rot)
    paint(f, i, '#e0482f', 0.12, rng)
  }
  return finalize(f)
}

export const sculptureOrganic: Builder = (n) => {
  const f = formation(n)
  tiledShell(f, 0, n, 0, 1.5, 0, 3.6, 0.55, 0.36, (_, x, y, z) => lerpHex('#8a3b1c', '#efe2cc', 0.5 + 0.5 * (y * 0.7 + x * 0.3 + z * 0.1)))
  return finalize(f)
}

export const sculptureFragmented: Builder = (n, rng) => {
  const f = sculptureOrganic(n, rng)
  const clusters = 42
  const offs = Array.from({ length: clusters }, (_, k) => {
    const [x, y, z] = fib(k, clusters)
    const d = 0.8 + rng() * 2.2
    return { x: x * d, y: y * d, z: z * d, r: [(rng() - 0.5) * 1.2, (rng() - 0.5) * 1.2, (rng() - 0.5) * 1.2] }
  })
  for (let i = 0; i < n; i++) {
    const k = Math.floor((i / n) * clusters)
    const o = offs[k]
    f.pos[i * 3] += o.x
    f.pos[i * 3 + 1] += o.y
    f.pos[i * 3 + 2] += o.z
    f.rot[i * 3] += o.r[0]
    f.rot[i * 3 + 1] += o.r[1]
    f.rot[i * 3 + 2] += o.r[2]
    f.scl[i * 3 + 1] *= 2.4
    paint(f, i, k % 5 === 0 ? '#e0482f' : k % 2 ? '#d8d2c6' : '#3a3632')
  }
  return finalize(f)
}

export const sculptureParticles: Builder = (n, rng) => {
  const f = formation(n)
  for (let i = 0; i < n; i++) {
    const r = Math.abs(gauss(rng)) * 2.4 + rng() * 0.6
    const [x, y, z] = fib(Math.floor(rng() * n), n)
    const s = 0.05 + rng() * 0.07
    put(f, i, x * r, 1.5 + y * r, z * r, s)
    paint(f, i, rng() > 0.93 ? '#e0482f' : '#1b1a19')
  }
  return finalize(f)
}

export const sculpturePixels: Builder = (n) => {
  const f = formation(n)
  voxelSphere(f, 3.6, 0.52, 1.5, ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75'])
  return finalize(f)
}

export const sculptureAscii: Builder = (n) => {
  const f = formation(n)
  dotMatrix(f, 56, 40, 0.19, 1.5, '#1b1a19')
  return finalize(f)
}

export const sculptureWireframe: Builder = (n) => {
  const f = formation(n)
  const { edges } = icosaEdges(3.8, 1)
  alongSegments(f, 0, n, edges, 0.05, () => '#1b1a19', [0, 1.5, 0])
  return finalize(f)
}

export const sculptureGenerative: Builder = (n) => {
  const f = formation(n)
  const pts = lorenz(n, 0.2)
  for (let i = 0; i < n; i++) {
    const p = pts[i % pts.length]
    put(f, i, p[0], p[1] + 1.8, p[2], 0.07)
    paint(f, i, lerpHex('#e0482f', '#1d3f73', i / n))
  }
  return finalize(f)
}

export const SCULPTURE_BUILDERS: Builder[] = [sculpturePrimitive, sculptureOrganic, sculptureFragmented, sculptureParticles, sculpturePixels, sculptureAscii, sculptureWireframe, sculptureGenerative]

// ────────────────────────────────────────────── finale: every language collapses into one form

export const FINALE_STAGES = ['Brush', 'Pixel', 'ASCII', 'Geometry', 'Particle', 'Noise', 'Fractal', 'Wireframe'] as const

const finaleBrush: Builder = (n, rng) => {
  const f = formation(n)
  const cols = ['#e08a5b', '#9cc2d8', '#f1d79a', '#86a86b', '#c9a0c8', '#5d7fa8']
  for (let i = 0; i < n; i++) {
    const [x, y, z] = fib(i, n)
    const r = 3.4 + rng() * 0.3
    put(f, i, x * r, 1.5 + y * r, z * r, 0.46, 0.14, 0.04, rng() * 0.6, Math.atan2(x, z), (rng() - 0.5) * 1.2)
    paint(f, i, cols[Math.floor(rng() * cols.length)], 0.2, rng)
  }
  return finalize(f)
}

const finaleFractal: Builder = (n, rng) => {
  const f = formation(n)
  const v = [new Vector3(0, 4.2, 0), new Vector3(-3.6, -1.8, -2.1), new Vector3(3.6, -1.8, -2.1), new Vector3(0, -1.8, 4.2)]
  const p = new Vector3()
  for (let i = 0; i < n + 20; i++) {
    p.lerp(v[Math.floor(rng() * 4)], 0.5)
    if (i < 20) continue
    const k = i - 20
    put(f, k, p.x, p.y + 1.5, p.z, 0.08)
    paint(f, k, lerpHex('#f2efe8', '#e0482f', (p.y + 1.8) / 6))
  }
  return finalize(f)
}

export const FINALE_BUILDERS: Builder[] = [finaleBrush, (n, r) => recolor(sculpturePixels(n, r), '#f2efe8', '#e0482f'), (n) => recolorFlat(sculptureAscii(n, mulberry32(1)), '#f2efe8'), (n, r) => recolor(sculpturePrimitive(n, r), '#f2efe8', '#e0482f'), (n, r) => recolorFlat(sculptureParticles(n, r), '#f2efe8'), (n, r) => recolor(sculptureOrganic(n, r), '#2a2826', '#f2efe8'), finaleFractal, (n, r) => recolorFlat(sculptureWireframe(n, r), '#f2efe8')]

function recolor(f: Formation, a: string, b: string) {
  for (let i = 0; i < f.n; i++) paint(f, i, lerpHex(a, b, (f.pos[i * 3 + 1] + 2) / 8))
  return f
}
function recolorFlat(f: Formation, a: string) {
  for (let i = 0; i < f.n; i++) paint(f, i, a)
  return f
}

// ────────────────────────────────────────────── the same tree, eight ways

interface TreeSeg {
  a: Vector3
  b: Vector3
  r: number
  depth: number
}

function treeSkeleton(rng: Rng, maxDepth: number, spread = 0.52, trunk = 3.2): TreeSeg[] {
  const segs: TreeSeg[] = []
  const grow = (a: Vector3, dir: Vector3, len: number, r: number, depth: number) => {
    const b = a.clone().addScaledVector(dir, len)
    segs.push({ a, b, r, depth })
    if (depth >= maxDepth) return
    const kids = depth < 2 ? 3 : 2
    for (let k = 0; k < kids; k++) {
      const axis = new Vector3(Math.cos(k * 2.4 + depth), 0, Math.sin(k * 2.4 + depth)).normalize()
      const nd = dir.clone().applyAxisAngle(axis, spread + (rng() - 0.5) * 0.4).normalize()
      nd.y = Math.max(nd.y, 0.15)
      grow(b, nd.normalize(), len * (0.7 + rng() * 0.12), r * 0.62, depth + 1)
    }
  }
  grow(new Vector3(0, 0, 0), new Vector3(0, 1, 0), trunk, 0.34, 0)
  return segs
}

interface TreeSample {
  branch: boolean
  seg: number
  t: number
  tip: number
  off: Vector3
  r: number[]
}

function treeSamples(n: number, rng: Rng, segs: TreeSeg[]) {
  const nb = Math.floor(n * 0.34)
  const tips = segs.map((s, i) => ({ s, i })).filter(({ s }) => s.depth === Math.max(...segs.map((x) => x.depth)))
  const weights = segs.map((s) => s.a.distanceTo(s.b) * (0.4 + s.r * 3))
  const total = weights.reduce((a, b) => a + b, 0)
  const samples: TreeSample[] = []
  for (let i = 0; i < n; i++) {
    const r = [rng(), rng(), rng(), rng(), rng()]
    if (i < nb) {
      let pick = rng() * total
      let seg = 0
      while (pick > weights[seg] && seg < segs.length - 1) pick -= weights[seg++]
      samples.push({ branch: true, seg, t: rng(), tip: 0, off: new Vector3(), r })
    } else {
      const off = new Vector3(gauss(rng), gauss(rng) * 0.8, gauss(rng)).multiplyScalar(0.55)
      samples.push({ branch: false, seg: 0, t: 0, tip: tips[i % tips.length].i, off, r })
    }
  }
  return samples
}

const TREE_RNG_SEED = 1717
function treeContext(n: number) {
  const rng = mulberry32(TREE_RNG_SEED)
  const segs = treeSkeleton(rng, 5)
  return { segs, samples: treeSamples(n, rng, segs) }
}

function segPoint(s: TreeSeg, t: number) {
  return s.a.clone().lerp(s.b, t)
}

const treePrehistoric: Builder = (n) => {
  const f = formation(n)
  const { segs, samples } = treeContext(n)
  samples.forEach((sm, i) => {
    if (sm.branch) {
      const s = segs[sm.seg]
      if (s.depth > 3) return hide(f, i, 0, 4, 0)
      const p = segPoint(s, sm.t)
      const rot = alignY(s.b.x - s.a.x, s.b.y - s.a.y, 0)
      put(f, i, p.x * 1.1 + (sm.r[0] - 0.5) * 0.12, p.y, 0.1 * sm.r[1], 0.07 + s.r * 0.2, 0.5, 0.02, ...rot)
      paint(f, i, sm.r[2] > 0.3 ? '#1c120b' : '#5a2a14')
    } else {
      const a = sm.r[0] * TAU
      const rr = 3.1 + Math.sin(a * 5 + sm.r[1]) * 0.25 + (sm.r[2] - 0.5) * 0.25
      put(f, i, Math.cos(a) * rr, 7.2 + Math.sin(a) * rr * 0.85, 0.05 * sm.r[3], 0.06, 0.34, 0.02, 0, 0, a)
      paint(f, i, sm.r[3] > 0.55 ? '#c46a2b' : '#8a3b1c')
    }
  })
  return finalize(f)
}

const treeRenaissance: Builder = (n) => {
  const f = formation(n)
  const { segs, samples } = treeContext(n)
  samples.forEach((sm, i) => {
    if (sm.branch) {
      const s = segs[sm.seg]
      const p = segPoint(s, sm.t)
      const rot = alignY(s.b.x - s.a.x, s.b.y - s.a.y, s.b.z - s.a.z)
      const w = s.r * 1.6 + 0.04
      put(f, i, p.x, p.y, p.z, w, 0.34, w, ...rot)
      paint(f, i, lerpHex('#3a2616', '#8a6a48', sm.r[0] * 0.6 + (p.x > 0 ? 0.3 : 0)))
    } else {
      const tip = segs[sm.tip].b
      const p = tip.clone().add(sm.off.clone().multiplyScalar(1.5))
      const light = 0.5 + 0.5 * ((sm.off.y + sm.off.x * 0.6 + sm.off.z * 0.3) / 1.2)
      put(f, i, p.x, p.y, p.z, 0.3, 0.3, 0.3, sm.r[0] * 3, sm.r[1] * 3, 0)
      paint(f, i, lerpHex('#18301a', '#9fb56a', Math.max(0, Math.min(1, light))))
    }
  })
  return finalize(f)
}

const treeImpressionist: Builder = (n) => {
  const f = formation(n)
  const { segs, samples } = treeContext(n)
  const leaf = ['#86a86b', '#c9d77a', '#f1d79a', '#5d7fa8', '#c9a0c8', '#6fa37a', '#e8c35a']
  samples.forEach((sm, i) => {
    if (sm.branch) {
      const s = segs[sm.seg]
      const p = segPoint(s, sm.t)
      put(f, i, p.x, p.y, p.z * 0.5, 0.36, 0.13, 0.03, 0, 0, (sm.r[0] - 0.5) * 2 + Math.PI / 2)
      paint(f, i, ['#6b5aa0', '#8a6a48', '#4d6fa8'][Math.floor(sm.r[1] * 3)])
    } else {
      const tip = segs[sm.tip].b
      const p = tip.clone().add(sm.off.clone().multiplyScalar(2.1))
      put(f, i, p.x, p.y, p.z * 0.45 + 0.4, 0.5, 0.17, 0.03, 0, 0, (sm.r[0] - 0.5) * 1.6)
      paint(f, i, leaf[Math.floor(sm.r[2] * leaf.length)])
    }
  })
  return finalize(f)
}

const q8 = (a: number) => Math.round(a / (Math.PI / 6)) * (Math.PI / 6)
const treeCubist: Builder = (n) => {
  const f = formation(n)
  const { segs, samples } = treeContext(n)
  const cols = ['#b89a6a', '#6f6553', '#3e3a32', '#d7c7a4', '#7d8b6a', '#9c5b2e']
  samples.forEach((sm, i) => {
    const view = Math.floor(sm.r[4] * 3) - 1
    let p: Vector3
    if (sm.branch) p = segPoint(segs[sm.seg], sm.t)
    else p = segs[sm.tip].b.clone().add(sm.off.clone().multiplyScalar(1.8))
    const cell = 1.1
    p.set(Math.round(p.x / cell) * cell, Math.round(p.y / cell) * cell, Math.round(p.z / cell) * cell * 0.25)
    p.applyAxisAngle(_up, view * 0.45)
    p.x += view * 1.2
    const s = sm.branch ? 0.55 : 0.95
    put(f, i, p.x, p.y, p.z, s * (0.8 + sm.r[0] * 0.6), s * (0.8 + sm.r[1] * 0.6), 0.04, 0, q8(view * 0.5), q8((sm.r[2] - 0.5) * 1.4))
    paint(f, i, cols[Math.floor(sm.r[3] * cols.length)])
  })
  return finalize(f)
}

const treeSurreal: Builder = (n) => {
  const f = formation(n)
  const { segs, samples } = treeContext(n)
  samples.forEach((sm, i) => {
    if (sm.branch) {
      const s = segs[sm.seg]
      const p = segPoint(s, sm.t)
      p.applyAxisAngle(_up, p.y * 0.35)
      const rot = alignY(s.b.x - s.a.x, s.b.y - s.a.y, s.b.z - s.a.z)
      put(f, i, p.x, p.y + 2.4, p.z, s.r * 1.2 + 0.05, 0.36, s.r * 1.2 + 0.05, rot[0], rot[1] + p.y * 0.35, rot[2])
      paint(f, i, '#b35a3b')
    } else {
      const tip = segs[sm.tip].b
      const drip = Math.pow(sm.r[0], 3) * 3.4
      const p = tip.clone().add(sm.off.clone().multiplyScalar(1.4))
      put(f, i, p.x, p.y + 2.4 - drip, p.z, 0.2, 0.3 + drip * 0.5, 0.2)
      paint(f, i, lerpHex('#6d8fc4', '#f4d6a4', sm.r[1] * 0.4 + drip * 0.2))
    }
  })
  return finalize(f)
}

const treeMinimal: Builder = (n) => {
  const f = formation(n)
  const { samples } = treeContext(n)
  let bi = 0, ci = 0
  const nb = samples.filter((s) => s.branch).length
  const nc = n - nb
  samples.forEach((sm, i) => {
    if (sm.branch) {
      const y = (bi++ / nb) * 5.6
      put(f, i, 0, y, 0, 0.05, (5.6 / nb) * 1.05, 0.05)
    } else {
      const a = (ci++ / nc) * TAU
      put(f, i, Math.cos(a) * 2.6, 8.2 + Math.sin(a) * 2.6, 0, 0.05, (TAU * 2.6 / nc) * 1.1, 0.05, 0, 0, a)
    }
    paint(f, i, '#161616')
  })
  return finalize(f)
}

const treePixel: Builder = (n) => {
  const f = formation(n)
  const cell = 0.5
  const cells: { x: number; y: number; c: string }[] = []
  for (let y = 0; y < 8; y++) for (let x = -1; x <= 1; x++) cells.push({ x, y, c: x === 1 ? '#5a3a22' : '#8a5a32' })
  for (let y = -8; y <= 8; y++)
    for (let x = -9; x <= 9; x++) {
      const r = Math.hypot(x, y * 1.1)
      const ragged = 8 + Math.sin(Math.atan2(y, x) * 7) * 0.8
      if (r < ragged) {
        const light = (-x + y) / 18 + 0.5
        const edge = r > ragged - 1.1
        cells.push({ x, y: y + 15, c: edge ? '#1f4a2a' : light > 0.62 ? '#a7f070' : light > 0.4 ? '#38b764' : '#257179' })
      }
    }
  for (let i = 0; i < n; i++) {
    if (i >= cells.length) {
      hide(f, i, 0, 6, 0)
      continue
    }
    const c = cells[i]
    put(f, i, c.x * cell, c.y * cell, 0, cell * 0.96)
    paint(f, i, c.c)
  }
  return finalize(f)
}

const treeGenerative: Builder = (n) => {
  const f = formation(n)
  const rng = mulberry32(99)
  const segs = treeSkeleton(rng, 8, 0.42, 2.6)
  alongSegments(f, 0, n, segs.map((s) => [s.a, s.b] as [Vector3, Vector3]), 0.05, (s) => lerpHex('#ff6a3d', '#3dd6ff', segs[s].depth / 8))
  for (let i = 0; i < n; i++) {
    const d = segs[Math.min(segs.length - 1, Math.floor((i / n) * segs.length))]?.depth ?? 0
    f.scl[i * 3] = f.scl[i * 3 + 2] = Math.max(0.03, 0.2 - d * 0.022)
  }
  return finalize(f)
}

export const TREE_BUILDERS: Record<string, Builder> = {
  prehistoric: treePrehistoric,
  renaissance: treeRenaissance,
  impressionist: treeImpressionist,
  cubist: treeCubist,
  surrealist: treeSurreal,
  minimalist: treeMinimal,
  pixel: treePixel,
  generative: treeGenerative,
}

export const TREE_ENV: Record<string, { bg: string; ink: string }> = {
  prehistoric: { bg: '#2a1d14', ink: '#e9d6b8' },
  renaissance: { bg: '#d9ccb4', ink: '#241d16' },
  impressionist: { bg: '#dfe6ea', ink: '#20242a' },
  cubist: { bg: '#cbbd9f', ink: '#1f1c18' },
  surrealist: { bg: '#e8b98a', ink: '#221a22' },
  minimalist: { bg: '#f1efea', ink: '#161616' },
  pixel: { bg: '#1a1c2c', ink: '#f4f4f4' },
  generative: { bg: '#0a0a0c', ink: '#f0eee8' },
}

// ────────────────────────────────────────────── evolution pairs

const renArchitecture: Builder = (n, rng) => {
  const f = formation(n)
  let i = 0
  const add = (x: number, y: number, z: number, sx: number, sy: number, sz: number, col: string, rx = 0, ry = 0, rz = 0) => {
    if (i >= n) return
    put(f, i, x, y, z, sx, sy, sz, rx, ry, rz)
    paint(f, i, col, 0.06, rng)
    i++
  }
  for (let gx = -6; gx <= 6; gx++) for (let gz = 0; gz < 10; gz++) add(gx * 2, 0.04, 1 - gz * 2, 1.96, 0.08, 1.96, (gx + gz) % 2 ? '#b4583a' : '#ece2cf')
  for (const side of [-1, 1])
    for (let c = 0; c < 6; c++) {
      const z = -c * 3.4
      for (let d = 0; d < 10; d++) add(side * 8.5, 0.5 + d * 0.9, z, 0.9, 0.88, 0.9, '#efe6d6')
      add(side * 8.5, 9.4, z, 1.5, 0.4, 1.5, '#e2d6c0')
    }
  for (const side of [-1, 1]) for (let s = 0; s < 18; s++) add(side * 8.5, 10.1, 1 - s * 1.1, 1.4, 0.8, 1.14, '#d9ccb4')
  for (let c = 0; c < 6; c++)
    for (let k = 0; k < 16; k++) {
      const a = (k + 0.5) / 16 * Math.PI
      add(Math.cos(a) * 8.5, 10.5 + Math.sin(a) * 4.2, -c * 3.4, 1.0, 0.5, 0.7, '#e8dcc6', 0, 0, a + Math.PI / 2)
    }
  for (let k = 0; k < 20; k++) {
    const a = (k + 0.5) / 20 * Math.PI
    add(Math.cos(a) * 4.2, 6 + Math.sin(a) * 4.2, -19, 0.7, 0.5, 0.9, '#c9b89a', 0, 0, a + Math.PI / 2)
  }
  for (const side of [-1, 1]) for (let d = 0; d < 7; d++) add(side * 4.2, 0.5 + d * 0.86, -19, 0.9, 0.84, 0.9, '#c9b89a')
  for (let k = 0; k < 12; k++) add(0, 0.3 + k * 0.1, -19.6, 7.4 - k * 0.1, 0.1, 0.1, '#2d4f7c')
  // Figure on plinth, built from boxes.
  add(0, 0.6, -9, 1.6, 1.2, 1.6, '#d8d1c4')
  const body: [number, number, number, number, number, number][] = [
    [-0.18, 2.0, 0, 0.26, 1.5, 0.26], [0.2, 1.95, 0.1, 0.24, 1.45, 0.24], [0, 2.9, 0, 0.62, 0.4, 0.4], [0, 3.55, 0, 0.66, 1.0, 0.42], [-0.46, 3.5, 0, 0.18, 1.0, 0.18], [0.46, 3.45, 0.05, 0.18, 1.0, 0.18], [0, 4.3, 0, 0.18, 0.2, 0.18], [0, 4.6, 0, 0.36, 0.44, 0.38],
  ]
  body.forEach((b) => add(b[0], b[1], b[2] - 9, b[3], b[4], b[5], '#f4efe6'))
  const vp = new Vector3(0, 4.5, -60)
  while (i < n) {
    const line = Math.floor(rng() * 13) - 6
    const t = rng() * 0.3
    const a = new Vector3(line * 2, 0.1, 2)
    const p = a.clone().lerp(vp, t)
    const rot = alignY(vp.x - a.x, vp.y - a.y, vp.z - a.z)
    add(p.x, p.y, p.z, 0.03, 0.6, 0.03, '#6f4e37', ...rot)
  }
  return finalize(f)
}

const cubistArchitecture: Builder = (n, rng, base) => {
  const src = base ?? renArchitecture(n, rng)
  const f = formation(n)
  const cols = ['#b89a6a', '#6f6553', '#3e3a32', '#d7c7a4', '#7d8b6a', '#9c5b2e', '#1f1c18']
  const center = new Vector3(0, 5, -8)
  for (let i = 0; i < n; i++) {
    const view = (i * 7919) % 3
    const ang = [-0.55, 0.05, 0.6][view]
    const p = new Vector3(src.pos[i * 3], src.pos[i * 3 + 1], src.pos[i * 3 + 2]).sub(center)
    p.applyAxisAngle(_up, ang)
    p.z *= 0.22
    p.x = p.x * 0.58 + [-2.6, 0, 2.8][view] + 2
    p.y = p.y * 0.72 + [0.5, -0.3, 0.2][view] - 0.6
    p.add(center)
    const sx = src.scl[i * 3], sy = src.scl[i * 3 + 1], sz = src.scl[i * 3 + 2]
    const big = Math.max(sx, sy, sz)
    put(f, i, p.x, p.y, p.z, Math.max(big * 0.62, 0.3) * (0.8 + rng() * 0.7), Math.max(big * 0.55, 0.3) * (0.8 + rng() * 0.7), 0.05, q8(rng() * 0.6 - 0.3), q8(ang), q8((rng() - 0.5) * 1.6))
    const lum = 0.2126 * src.col[i * 3] + 0.7152 * src.col[i * 3 + 1] + 0.0722 * src.col[i * 3 + 2]
    paint(f, i, cols[Math.min(cols.length - 1, Math.floor((1 - lum) * cols.length * 0.9 + rng() * 1.5))])
  }
  return finalize(f)
}

const baroqueOrnament: Builder = (n, rng) => {
  const f = formation(n)
  for (let i = 0; i < n; i++) {
    const k = i % 5
    let x = 0, y = 0, z = 0
    const t = rng()
    if (k === 0) {
      const a = t * TAU * 5
      x = Math.cos(a) * 0.9 + (i % 2 ? -5 : 5)
      z = Math.sin(a) * 0.9 - 8
      y = t * 10
    } else if (k < 4) {
      const a = t * TAU * 2.2
      const r = 0.25 * Math.exp(0.28 * a)
      const cx = [-6, 0, 6][k - 1]
      x = cx + Math.cos(a) * r
      y = 6 + Math.sin(a) * r
      z = -8 + (rng() - 0.5) * 1.2
    } else {
      const a = t * Math.PI
      x = Math.cos(a) * 7
      y = 10.5 + Math.sin(a) * 3 + Math.sin(a * 9) * 0.4
      z = -8 + Math.sin(a * 5) * 0.8
    }
    put(f, i, x, y, z, 0.3, 0.2, 0.3, rng() * 3, rng() * 3, rng() * 3)
    paint(f, i, rng() > 0.7 ? '#7c1523' : '#d8a444', 0.15, rng)
  }
  return finalize(f)
}

const minimalBlock: Builder = (n) => {
  const f = formation(n)
  const side = Math.floor(Math.cbrt(n))
  const cell = 7 / side
  for (let i = 0; i < n; i++) {
    if (i >= side * side * side) {
      hide(f, i, 0, 3.5, -8)
      continue
    }
    const x = i % side, y = Math.floor(i / side) % side, z = Math.floor(i / (side * side))
    put(f, i, (x - side / 2 + 0.5) * cell, y * cell + cell / 2, -8 + (z - side / 2 + 0.5) * cell, cell)
    paint(f, i, '#1c1c1c')
  }
  return finalize(f)
}

const impressionLandscape: Builder = (n, rng) => {
  const f = formation(n)
  for (let i = 0; i < n; i++) {
    const x = (rng() - 0.5) * 28
    const y = rng() * 13
    let col: string
    const horizon = 4.2
    const tree = Math.exp(-((x + 6) ** 2) / 8) * 5 + Math.exp(-((x - 7) ** 2) / 5) * 3.5
    if (y < horizon) col = ['#5d7fa8', '#9cc2d8', '#c9a0c8', '#f1d79a'][Math.floor(rng() * (y < 1.5 ? 2 : 4))]
    else if (y < horizon + tree) col = ['#86a86b', '#4f7a52', '#c9d77a', '#6b5aa0'][Math.floor(rng() * 4)]
    else {
      const sun = Math.hypot(x - 3, y - 9.5)
      col = sun < 1.4 ? '#f7c86a' : sun < 3 ? ['#f1d79a', '#e08a5b'][Math.floor(rng() * 2)] : ['#9cc2d8', '#dfe6ea', '#c9a0c8', '#b8d0e0'][Math.floor(rng() * 4)]
    }
    put(f, i, x, y, -10 + (rng() - 0.5) * 1.5, 0.5, 0.16, 0.04, 0, 0, (y < horizon ? 0 : 1) * (rng() - 0.5) * 1.4)
    paint(f, i, col, 0.1, rng)
  }
  return finalize(f)
}

const PIXEL_PALETTE = ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4']
const pixelLandscape: Builder = (n, rng, base) => {
  const src = base ?? impressionLandscape(n, rng)
  const f = formation(n)
  const cell = 0.7
  const pal = PIXEL_PALETTE.map((h) => new Color(h))
  const tmp = new Color()
  for (let i = 0; i < n; i++) {
    const x = Math.round(src.pos[i * 3] / cell) * cell
    const y = Math.round(src.pos[i * 3 + 1] / cell) * cell
    put(f, i, x, y, -10, cell * 0.98, cell * 0.98, cell * 0.98)
    tmp.setRGB(src.col[i * 3], src.col[i * 3 + 1], src.col[i * 3 + 2])
    let best = pal[0], bd = Infinity
    for (const p of pal) {
      const d = (p.r - tmp.r) ** 2 + (p.g - tmp.g) ** 2 + (p.b - tmp.b) ** 2
      if (d < bd) {
        bd = d
        best = p
      }
    }
    paint(f, i, best)
  }
  return finalize(f)
}

export const EVOLUTION_BUILDERS: Record<string, Builder> = {
  'ren-architecture': renArchitecture,
  'cubist-architecture': cubistArchitecture,
  'baroque-ornament': baroqueOrnament,
  'minimal-block': minimalBlock,
  'impression-landscape': impressionLandscape,
  'pixel-landscape': pixelLandscape,
}

// ────────────────────────────────────────────── materials & technologies

const matStone: Builder = (n, rng) => {
  const f = formation(n)
  for (let i = 0; i < n; i++) {
    const [x, y, z] = fib(i, n)
    const r = 3 * (1 + 0.3 * fbm3(noise, x * 1.6, y * 1.6, z * 1.6, 4))
    put(f, i, x * r, 3 + y * r * 0.85, z * r, 0.55, 0.3, 0.5, rng() * 3, rng() * 3, rng() * 3)
    paint(f, i, lerpHex('#4a4540', '#a39a8e', rng()), 0.08, rng)
  }
  return finalize(f)
}
const matPigment: Builder = (n, rng) => {
  const f = formation(n)
  const cols = ['#c46a2b', '#1f3f8a', '#b3261e', '#e8b04b']
  for (let i = 0; i < n; i++) {
    const k = i % 4
    const cx = -4.5 + k * 3
    const h = Math.pow(rng(), 0.7)
    const a = rng() * TAU
    const r = (1 - h) * 1.4 * Math.sqrt(rng())
    put(f, i, cx + Math.cos(a) * r, h * 2.2, Math.sin(a) * r, 0.14)
    paint(f, i, cols[k], 0.15, rng)
  }
  return finalize(f)
}
const matPaper: Builder = (n, rng) => {
  const f = formation(n)
  const cols = 40, rows = Math.ceil(n / cols)
  for (let i = 0; i < n; i++) {
    const x = ((i % cols) / cols - 0.5) * 7
    const y = (Math.floor(i / cols) / rows) * 8.5
    put(f, i, x, 0.5 + y, Math.sin(x * 0.6) * 0.3 - y * 0.12, 0.18, 0.2, 0.02, -0.15, 0, 0)
    paint(f, i, '#efe6d2', 0.06, rng)
  }
  return finalize(f)
}
const matCanvas: Builder = (n) => {
  const f = formation(n)
  const cols = 44
  for (let i = 0; i < n; i++) {
    const cx = i % cols, cy = Math.floor(i / cols)
    const warp = (cx + cy) % 2 === 0
    const x = (cx / cols - 0.5) * 8
    const y = 0.5 + (cy / (n / cols)) * 8
    const edge = cx === 0 || cx === cols - 1 || cy === 0 || cy >= Math.floor(n / cols) - 1
    put(f, i, x, y, warp ? 0.04 : -0.04, warp ? 0.08 : 0.19, warp ? 0.19 : 0.08, 0.04)
    paint(f, i, edge ? '#6b4e32' : warp ? '#d9c9a6' : '#c7b48c')
  }
  return finalize(f)
}
const matPhoto: Builder = (n) => {
  const f = formation(n)
  const side = Math.floor(Math.sqrt(n))
  for (let i = 0; i < n; i++) {
    if (i >= side * side) {
      hide(f, i, 0, 4, 0)
      continue
    }
    const cx = i % side, cy = Math.floor(i / side)
    const u = cx / side - 0.5, v = cy / side - 0.5
    const d = 1 - (u * u + (v - 0.05) * (v - 0.05)) / 0.09
    const tone = d > 0 ? Math.sqrt(d) * (0.55 - u * 0.9 + v * 0.4) : 0.18 + v * 0.2
    const s = 7.5 / side
    put(f, i, u * 7.5, 4 + v * 7.5, 0, s * 0.96, s * 0.96, 0.05)
    paint(f, i, lerpHex('#161412', '#e9e4da', Math.max(0, Math.min(1, tone))))
  }
  return finalize(f)
}
const matFilm: Builder = (n, rng) => {
  const f = formation(n)
  for (let i = 0; i < n; i++) {
    const t = i / n
    const a = -1.2 + t * 2.4
    const x = Math.sin(a) * 7, z = Math.cos(a) * 7 - 7
    const v = rng()
    const hole = v < 0.1 || v > 0.9
    const frameEdge = (t * 8) % 1 < 0.05
    put(f, i, x, 3 + (v - 0.5) * 3.2, z, 0.16, 0.16, 0.03, 0, a, 0)
    paint(f, i, hole ? (Math.floor(t * 120) % 2 ? '#0a0806' : '#d99a3a') : frameEdge ? '#0a0806' : lerpHex('#3a1f10', '#e6a64a', 0.5 + 0.5 * Math.sin(t * 50 + v * 6)))
  }
  return finalize(f)
}
const matComputer: Builder = (n, rng) => {
  const f = formation(n)
  const screen = Math.floor(n * 0.5)
  const cols = 36
  for (let i = 0; i < n; i++) {
    if (i < screen) {
      const cx = i % cols, cy = Math.floor(i / cols)
      const x = (cx / cols - 0.5) * 5.4, y = 3.2 + (cy / (screen / cols) - 0.5) * 3.8
      put(f, i, x, y, 1.62, 0.13, 0.08, 0.02)
      paint(f, i, rng() > 0.35 && cy % 3 !== 0 ? '#6cff8a' : '#0c2410')
    } else {
      const face = i % 5
      const u = rng() - 0.5, v = rng() - 0.5
      const p = [[u * 7, 3.2 + v * 5.4, -1.6], [3.5, 3.2 + v * 5.4, u * 3.2], [-3.5, 3.2 + v * 5.4, u * 3.2], [u * 7, 5.9, v * 3.2], [u * 7, 0.2, 3 + v * 1.6]][face]
      put(f, i, p[0], p[1], p[2], 0.34, face === 4 ? 0.08 : 0.34, 0.34)
      paint(f, i, face === 4 ? '#bdb6a4' : '#d8d1bf', 0.05, rng)
    }
  }
  return finalize(f)
}
const matPixels: Builder = (n) => {
  const f = formation(n)
  const side = Math.floor(Math.cbrt(n))
  const cell = 6 / side
  for (let i = 0; i < n; i++) {
    if (i >= side ** 3) {
      hide(f, i, 0, 3, 0)
      continue
    }
    const x = i % side, y = Math.floor(i / side) % side, z = Math.floor(i / side ** 2)
    put(f, i, (x - side / 2) * cell, 0.4 + y * cell, (z - side / 2) * cell, cell * 0.9)
    f.col[i * 3] = x / side
    f.col[i * 3 + 1] = y / side
    f.col[i * 3 + 2] = z / side
  }
  return finalize(f)
}
const mat3D: Builder = (n) => {
  const f = formation(n)
  const a = icosaEdges(3.4, 0).edges
  const cube: [Vector3, Vector3][] = []
  const s = 1.5
  const v = [-s, s]
  for (const x of v) for (const y of v) cube.push([new Vector3(x, y, -s), new Vector3(x, y, s)], [new Vector3(x, -s, y), new Vector3(x, s, y)], [new Vector3(-s, x, y), new Vector3(s, x, y)])
  alongSegments(f, 0, Math.floor(n * 0.7), a, 0.05, () => '#46e0ff', [0, 3.8, 0])
  alongSegments(f, Math.floor(n * 0.7), n - Math.floor(n * 0.7), cube, 0.05, () => '#ff4fd8', [0, 3.8, 0])
  return finalize(f)
}
const matGenerative: Builder = (n, rng) => {
  const f = formation(n)
  const lines = 60
  const per = Math.floor(n / lines)
  let i = 0
  for (let l = 0; l < lines; l++) {
    let x = (rng() - 0.5) * 9, y = rng() * 8
    for (let k = 0; k < per && i < n; k++, i++) {
      const ang = noise(x * 0.25, y * 0.25, 1.3) * Math.PI * 2
      x += Math.cos(ang) * 0.16
      y += Math.sin(ang) * 0.16
      put(f, i, x, 0.5 + ((y % 8) + 8) % 8, Math.sin(l) * 0.8, 0.05, 0.2, 0.05, 0, 0, ang - Math.PI / 2)
      paint(f, i, lerpHex('#ff6a3d', '#3dd6ff', l / lines))
    }
  }
  for (; i < n; i++) hide(f, i, 0, 4, 0)
  return finalize(f)
}
const matAI: Builder = (n, rng) => {
  const f = formation(n)
  network(f, 0, n, [5, 9, 12, 12, 9, 5], 11, 6, rng, ['#43e5ff', '#9b7bff'], 3)
  for (let i = 0; i < n; i++) f.pos[i * 3 + 1] += 4
  return finalize(f)
}

export const MATERIAL_BUILDERS: Record<string, Builder> = {
  stone: matStone,
  pigment: matPigment,
  paper: matPaper,
  canvas: matCanvas,
  photography: matPhoto,
  film: matFilm,
  computer: matComputer,
  pixels: matPixels,
  '3d': mat3D,
  generative: matGenerative,
  ai: matAI,
}

const techCave: Builder = (n, rng) => {
  const f = formation(n)
  for (let i = 0; i < n; i++) {
    const u = rng(), v = rng()
    const a = -0.9 + u * 1.8
    const x = Math.sin(a) * 8, z = -Math.cos(a) * 8 + 5
    const y = v * 8
    const bx = (u - 0.45) * 3.2, by = (v - 0.5) * 4
    const body = bx * bx / 0.5 + by * by / 0.18 < 1
    const leg = Math.abs(by + 0.7) < 0.35 && [0.25, 0.45, 0.62].some((c) => Math.abs(u - c) < 0.012)
    put(f, i, x, y, z, 0.38, 0.38, 0.12, 0, -a, rng())
    paint(f, i, body || leg ? (rng() > 0.4 ? '#8a3b1c' : '#1c120b') : lerpHex('#5a4a3a', '#a08870', rng()))
  }
  return finalize(f)
}
const techPaint: Builder = (n, rng) => {
  const f = formation(n)
  const strokes = 14
  for (let i = 0; i < n; i++) {
    const s = i % strokes
    const t = rng()
    const x = -5 + t * 10
    const y = 1.2 + s * 0.52 + Math.sin(t * 3 + s) * 0.6
    put(f, i, x, y, (rng() - 0.5) * 0.2, 0.36, 0.2 + rng() * 0.1, 0.04, 0, 0, Math.cos(t * 3 + s) * 0.5)
    paint(f, i, ['#a3452c', '#2d4f7c', '#e8b04b', '#6f4e37', '#efe6d6'][s % 5], 0.12, rng)
  }
  return finalize(f)
}
const GLYPH: Record<string, string[]> = {
  A: ['01110', '10001', '11111', '10001', '10001'],
  R: ['11110', '10001', '11110', '10010', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100'],
  E: ['11111', '10000', '11110', '10000', '11111'],
  V: ['10001', '10001', '10001', '01010', '00100'],
  O: ['01110', '10001', '10001', '10001', '01110'],
  L: ['10000', '10000', '10000', '10000', '11111'],
  D: ['11110', '10001', '10001', '10001', '11110'],
}
const techPress: Builder = (n, rng) => {
  const f = formation(n)
  const text = ['ARTEVOLVED', 'EVOLVEDART', 'ARTEVOLVED', 'DEVOLVEART']
  let i = 0
  const cell = 0.19
  text.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      const g = GLYPH[ch]
      for (let gy = 0; gy < 5; gy++)
        for (let gx = 0; gx < 5; gx++) {
          if (i >= n) return
          const on = g[gy][gx] === '1'
          put(f, i, -5.3 + c * 1.12 + gx * cell, 6.5 - r * 1.4 - gy * cell, 0, cell * 0.92, cell * 0.92, on ? 0.5 : 0.18)
          paint(f, i, on ? '#1a1814' : '#b8ad94')
          i++
        }
    }),
  )
  for (; i < n; i++) {
    put(f, i, (rng() - 0.5) * 12, 8.5 + rng() * 0.4, (rng() - 0.5) * 2, 0.3, 0.3, 0.3)
    paint(f, i, '#4a4640')
  }
  return finalize(f)
}
const techCamera: Builder = (n, rng) => {
  const f = formation(n)
  for (let i = 0; i < n; i++) {
    const part = rng()
    if (part < 0.45) {
      const face = i % 6
      const u = rng() - 0.5, v = rng() - 0.5
      const p = [[u * 5, 4 + v * 3.4, 1.4], [u * 5, 4 + v * 3.4, -1.4], [2.5, 4 + v * 3.4, u * 2.8], [-2.5, 4 + v * 3.4, u * 2.8], [u * 5, 5.7, v * 2.8], [u * 5, 2.3, v * 2.8]][face]
      put(f, i, p[0], p[1], p[2], 0.3, 0.3, 0.3)
      paint(f, i, '#1d1b19', 0.05, rng)
    } else {
      const ring = Math.floor(rng() * 6)
      const a = rng() * TAU
      const r = 1.3 - ring * 0.12
      put(f, i, Math.cos(a) * r, 4 + Math.sin(a) * r, 1.6 + ring * 0.35, 0.12, 0.12, 0.2, 0, 0, a)
      paint(f, i, ring === 5 ? '#6f9bb8' : ring % 2 ? '#a8a298' : '#2a2826')
    }
  }
  return finalize(f)
}
const techFilm: Builder = (n, rng) => {
  const f = formation(n)
  for (let i = 0; i < n; i++) {
    const k = rng()
    if (k < 0.7) {
      const reel = i % 2
      const a = rng() * TAU
      const r = Math.sqrt(rng()) * 2.2
      const spoke = Math.abs(Math.sin(a * 3)) < 0.18 || r > 2.0 || r < 0.35
      put(f, i, (reel ? 2.6 : -2.6) + Math.cos(a) * r, (reel ? 6.2 : 5.2) + Math.sin(a) * r, 0, 0.14, 0.14, spoke ? 0.2 : 0.05)
      paint(f, i, spoke ? '#c9c4b8' : '#1a1816')
    } else {
      const t = rng()
      put(f, i, -2.6 + t * 5.2 + Math.sin(t * 9) * 0.2, 3 - Math.sin(t * Math.PI) * 1.4, 0.3, 0.14, 0.14, 0.02)
      paint(f, i, (t * 40) % 1 < 0.2 ? '#0c0a08' : '#d99a3a')
    }
  }
  return finalize(f)
}
const techTV: Builder = (n, rng) => {
  const f = formation(n)
  const screen = Math.floor(n * 0.6)
  const cols = 42
  for (let i = 0; i < n; i++) {
    if (i < screen) {
      const cx = i % cols, cy = Math.floor(i / cols)
      const x = (cx / cols - 0.5) * 6, y = 4 + (cy / (screen / cols) - 0.5) * 4.4
      const ch = cx % 3
      const on = 0.5 + 0.5 * Math.sin(cy * 0.6 + cx * 0.15)
      put(f, i, x, y, 1.5, 0.1, 0.24, 0.02)
      paint(f, i, lerpHex('#050608', ['#ff3030', '#30ff60', '#3070ff'][ch], on))
    } else {
      const face = i % 4
      const u = rng() - 0.5, v = rng() - 0.5
      const p = [[u * 7.6, 6.9, v * 3], [u * 7.6, 1.1, v * 3], [3.8, 4 + v * 5.8, u * 3], [-3.8, 4 + v * 5.8, u * 3]][face]
      put(f, i, p[0], p[1], p[2], 0.34)
      paint(f, i, '#4a3a2a', 0.08, rng)
    }
  }
  return finalize(f)
}
const techPunchcard: Builder = (n, rng) => {
  const f = formation(n)
  const cols = 64, rows = 20
  for (let i = 0; i < n; i++) {
    const cx = i % cols, cy = Math.floor(i / cols) % rows, card = Math.floor(i / (cols * rows))
    const hole = noise(cx * 0.9, cy * 0.9, card * 3) > 0.35
    put(f, i, (cx / cols - 0.5) * 10, 2 + cy * 0.3 + card * 0.2, -card * 1.2, hole ? 0 : 0.15, hole ? 0 : 0.28, 0.02)
    paint(f, i, card % 2 ? '#e8dcb8' : '#d9c89a', 0.04, rng)
  }
  return finalize(f)
}
const techInternet: Builder = (n, rng) => {
  const f = formation(n)
  const shell = Math.floor(n * 0.55)
  for (let i = 0; i < shell; i++) {
    const [x, y, z] = fib(i, shell)
    const land = noise(x * 2, y * 2, z * 2) > 0.05
    put(f, i, x * 3.4, 4 + y * 3.4, z * 3.4, land ? 0.12 : 0.05)
    paint(f, i, land ? '#cfe3ff' : '#2a3a5a')
  }
  let i = shell
  while (i < n) {
    const a = new Vector3(...fib(Math.floor(rng() * shell), shell))
    const b = new Vector3(...fib(Math.floor(rng() * shell), shell))
    for (let k = 0; k < 24 && i < n; k++, i++) {
      const t = k / 23
      const p = a.clone().lerp(b, t).normalize().multiplyScalar(3.4 + Math.sin(t * Math.PI) * 1.4)
      put(f, i, p.x, 4 + p.y, p.z, 0.05)
      paint(f, i, '#ff5fa2')
    }
  }
  return finalize(f)
}
const techGraphics: Builder = (n) => {
  const f = formation(n)
  const { faces, edges } = icosaEdges(3.3, 1)
  const nf = Math.min(faces.length * 6, Math.floor(n * 0.55))
  const light = new Vector3(0.5, 0.8, 0.6).normalize()
  for (let i = 0; i < nf; i++) {
    const fc = faces[i % faces.length]
    const c = fc[0].clone().add(fc[1]).add(fc[2]).divideScalar(3)
    const nrm = c.clone().normalize()
    const rot = alignY(nrm.x, nrm.y, nrm.z)
    const sub = Math.floor(i / faces.length)
    const off = [fc[0], fc[1], fc[2], c, c, c][sub].clone().lerp(c, 0.55)
    put(f, i, off.x, 4 + off.y, off.z, 0.62, 0.04, 0.62, ...rot)
    paint(f, i, lerpHex('#1d2b52', '#ffe066', Math.max(0, nrm.dot(light))))
  }
  alongSegments(f, nf, n - nf, edges.map(([a, b]) => [a.clone().multiplyScalar(1.03), b.clone().multiplyScalar(1.03)] as [Vector3, Vector3]), 0.03, () => '#46e0ff', [0, 4, 0])
  return finalize(f)
}
const techGenerative: Builder = (n, rng) => {
  const f = formation(n)
  const pts = cliffordPoints(n, rng)
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i]
    put(f, i, x * 2.6, 4 + y * 2.6, Math.sin(x * y * 2) * 0.8, 0.06)
    paint(f, i, lerpHex('#ff6a3d', '#3dd6ff', (x + 2) / 4))
  }
  return finalize(f)
}
const techAI: Builder = (n, rng) => {
  const f = formation(n)
  const nodes = network(f, 0, n, [3, 7, 11, 15, 11, 7, 3], 12, 7, rng, ['#9b7bff', '#43e5ff'], 5)
  for (let i = 0; i < n; i++) f.pos[i * 3 + 1] += 4
  void nodes
  return finalize(f)
}

export const TECH_BUILDERS: Record<string, Builder> = {
  'cave-wall': techCave,
  paint: techPaint,
  'printing-press': techPress,
  photography: techCamera,
  film: techFilm,
  television: techTV,
  computer: techPunchcard,
  internet: techInternet,
  '3d-graphics': techGraphics,
  'generative-software': techGenerative,
  ai: techAI,
}

// ────────────────────────────────────────────── AI chamber: human → algorithm → machine

export const AI_STAGES = ['Hand-drawn curve', 'Mathematical curve', 'Algorithmic composition', 'Neural structure', 'Generative system'] as const

const aiHand: Builder = (n, rng) => {
  const f = formation(n)
  let x = -6, y = 4, a = 0
  for (let i = 0; i < n; i++) {
    a += (rng() - 0.5) * 0.35 + Math.sin(i * 0.004) * 0.05
    x += Math.cos(a) * 0.012 + 0.0045
    y += Math.sin(a) * 0.012
    const jit = (rng() - 0.5) * 0.05
    const px = x + Math.sin(i * 0.011) * 1.6
    const py = y + Math.cos(i * 0.0072) * 2.4 + jit
    put(f, i, px, 1 + py, jit * 3, 0.05, 0.05 + rng() * 0.04, 0.05, 0, 0, a)
    paint(f, i, '#2a2622')
  }
  return finalize(f)
}
const aiMath: Builder = (n) => {
  const f = formation(n)
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU
    const r = 4 * Math.cos(5 * t)
    put(f, i, r * Math.cos(t), 5 + r * Math.sin(t), Math.sin(3 * t) * 1.2, 0.06)
    paint(f, i, '#eef0f7')
  }
  return finalize(f)
}
const aiAlgorithmic: Builder = (n, rng) => {
  const f = formation(n)
  const grid = 10
  const per = Math.floor(n / (grid * grid))
  let i = 0
  for (let gy = 0; gy < grid; gy++)
    for (let gx = 0; gx < grid; gx++) {
      const cx = (gx - grid / 2 + 0.5) * 1.1, cy = 5 + (gy - grid / 2 + 0.5) * 1.1
      const dis = (gy / grid) * 0.8
      const rotA = (rng() - 0.5) * dis * 1.4
      const ox = (rng() - 0.5) * dis * 0.6, oy = (rng() - 0.5) * dis * 0.6
      for (let k = 0; k < per; k++, i++) {
        const side = k % 4
        const t = (Math.floor(k / 4) + 0.5) / Math.ceil(per / 4) - 0.5
        const lx = [t, 0.45, -t, -0.45][side] * 0.9
        const ly = [0.45, t, -0.45, -t][side] * 0.9
        const x = lx * Math.cos(rotA) - ly * Math.sin(rotA)
        const y = lx * Math.sin(rotA) + ly * Math.cos(rotA)
        put(f, i, cx + ox + x, cy + oy + y, 0, 0.05, 0.05, 0.05)
        paint(f, i, '#eef0f7')
      }
    }
  for (; i < n; i++) hide(f, i, 0, 5, 0)
  return finalize(f)
}
const aiNeural: Builder = (n, rng) => {
  const f = formation(n)
  network(f, 0, n, [4, 8, 12, 12, 8, 4], 12, 7, rng, ['#43e5ff', '#9b7bff'], 4)
  for (let i = 0; i < n; i++) f.pos[i * 3 + 1] += 5
  return finalize(f)
}
const aiGenerative: Builder = (n) => {
  const f = formation(n)
  const pts = lorenz(n, 0.24)
  for (let i = 0; i < n; i++) {
    const p = pts[i % pts.length]
    put(f, i, p[0], 5 + p[1], p[2], 0.07)
    paint(f, i, lerpHex('#ff7ab6', '#43e5ff', i / n))
  }
  return finalize(f)
}

export const AI_BUILDERS: Builder[] = [aiHand, aiMath, aiAlgorithmic, aiNeural, aiGenerative]
