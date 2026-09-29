import type { Movement, Palette } from '@/data/types'
import { createNoise3D } from '@/utils/noise'
import { gauss, hashString, mulberry32, pick, type Rng } from '@/utils/random'

/**
 * 2D procedural painters. Each translates a visual language into canvas operations — they
 * feed 3D textures, artist interpretations, hover previews and the mobile timeline.
 */
export type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number, rng: Rng, p: Palette) => void

const noise = createNoise3D(5)
const TAU = Math.PI * 2

function fill(ctx: CanvasRenderingContext2D, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(0, 0, w, h)
}

const GRAIN_LEVELS = 16

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, rng: Rng, amount = 0.06, count = 0) {
  // Specks are bucketed by colour and quantised alpha and drawn as one path per bucket: a handful of
  // fills instead of tens of thousands of fillStyle parses, which made texture painting a mount hitch.
  const n = count || Math.floor((w * h) / 40)
  const buckets: number[][] = Array.from({ length: GRAIN_LEVELS * 2 }, () => [])
  for (let i = 0; i < n; i++) {
    const light = rng() > 0.5
    const level = Math.min(GRAIN_LEVELS - 1, Math.floor(rng() * GRAIN_LEVELS))
    buckets[(light ? GRAIN_LEVELS : 0) + level].push(rng() * w, rng() * h)
  }
  for (let b = 0; b < buckets.length; b++) {
    const pts = buckets[b]
    if (!pts.length) continue
    const level = b % GRAIN_LEVELS
    const alpha = (amount * (level + 0.5)) / GRAIN_LEVELS
    ctx.fillStyle = b >= GRAIN_LEVELS ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`
    ctx.beginPath()
    for (let i = 0; i < pts.length; i += 2) ctx.rect(pts[i], pts[i + 1], 1.5, 1.5)
    ctx.fill()
  }
}

function roughPath(ctx: CanvasRenderingContext2D, pts: [number, number][], rng: Rng, jitter: number) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => {
    const jx = x + (rng() - 0.5) * jitter
    const jy = y + (rng() - 0.5) * jitter
    if (i === 0) ctx.moveTo(jx, jy)
    else ctx.lineTo(jx, jy)
  })
}

function brushStroke(ctx: CanvasRenderingContext2D, pts: [number, number][], width: number, color: string, rng: Rng, dry = 0.3) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let k = 0; k < 4; k++) {
    ctx.globalAlpha = 0.25 + (1 - dry) * 0.5
    ctx.lineWidth = width * (0.4 + rng() * 0.6)
    roughPath(ctx, pts, rng, width * 0.3)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function animal(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rng: Rng, color: string, charcoal: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s * (rng() > 0.5 ? 1 : -1), s)
  ctx.fillStyle = color
  ctx.globalAlpha = 0.75
  ctx.beginPath()
  for (let a = 0; a <= TAU + 0.01; a += 0.25) {
    const r = 1 + noise(Math.cos(a), Math.sin(a), x) * 0.12
    const px = Math.cos(a) * 1.3 * r
    const py = Math.sin(a) * 0.55 * r - (Math.sin(a) < 0 ? Math.abs(Math.cos(a)) * 0.15 : 0)
    if (a === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.fill()
  ctx.globalAlpha = 0.9
  ctx.strokeStyle = charcoal
  ctx.lineWidth = 0.08
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-1.35, -0.1)
  ctx.quadraticCurveTo(-0.2, -0.95, 1.1, -0.35)
  ctx.quadraticCurveTo(1.6, -0.6, 1.85, -0.2)
  ctx.stroke()
  for (const lx of [-0.8, -0.5, 0.6, 0.9]) {
    ctx.beginPath()
    ctx.moveTo(lx, 0.35)
    ctx.lineTo(lx + (rng() - 0.5) * 0.2, 1.15)
    ctx.stroke()
  }
  if (rng() > 0.4) {
    ctx.beginPath()
    ctx.moveTo(1.6, -0.45)
    ctx.quadraticCurveTo(1.4, -1.2, 0.9, -1.35)
    ctx.stroke()
  }
  ctx.restore()
}

function handStencil(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rng: Rng, color: string) {
  const inside = (px: number, py: number) => {
    const dx = (px - x) / s, dy = (py - y) / s
    if (dx * dx + (dy - 0.3) ** 2 < 0.3) return true
    for (let f = 0; f < 5; f++) {
      const a = -1.2 + f * 0.42 - (f === 0 ? 0.35 : 0)
      const len = f === 0 ? 0.8 : 1.25
      const t = Math.max(0, Math.min(len, dx * Math.sin(a) - dy * Math.cos(a)))
      const cx = Math.sin(a) * t, cy = -Math.cos(a) * t
      if ((dx - cx) ** 2 + (dy - cy) ** 2 < 0.028) return true
    }
    return false
  }
  ctx.fillStyle = color
  for (let i = 0; i < 2600; i++) {
    const r = Math.abs(gauss(rng)) * s * 1.3
    const a = rng() * TAU
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r - s * 0.3
    if (inside(px, py)) continue
    ctx.globalAlpha = 0.5 * rng()
    ctx.fillRect(px, py, 1.6, 1.6)
  }
  ctx.globalAlpha = 1
}

const cave: Painter = (ctx, w, h, rng, p) => {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.6, 10, w * 0.5, h * 0.5, w * 0.8)
  g.addColorStop(0, '#8a6a4a')
  g.addColorStop(1, '#2a1a10')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(${rng() > 0.5 ? '255,220,180' : '20,10,5'},${0.05 * rng()})`
    ctx.beginPath()
    ctx.ellipse(rng() * w, rng() * h, rng() * w * 0.15, rng() * h * 0.08, rng() * 3, 0, TAU)
    ctx.fill()
  }
  const s = Math.min(w, h)
  for (let i = 0; i < 5; i++) animal(ctx, w * (0.15 + rng() * 0.7), h * (0.3 + rng() * 0.4), s * (0.06 + rng() * 0.05), rng, pick(rng, [p.colors[0], p.colors[1], p.accent]), '#150c06')
  for (let i = 0; i < 3; i++) handStencil(ctx, w * (0.1 + rng() * 0.8), h * (0.25 + rng() * 0.5), s * 0.05, rng, pick(rng, [p.accent, '#e8d0b0']))
  ctx.fillStyle = p.accent
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.arc(w * 0.1 + i * (w * 0.02), h * 0.85 + Math.sin(i) * 4, s * 0.006, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  grain(ctx, w, h, rng, 0.12)
}

const megalith: Painter = (ctx, w, h, rng, p) => {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#3a3a4a')
  g.addColorStop(0.62, p.accent)
  g.addColorStop(0.63, '#2b2622')
  g.addColorStop(1, '#171411')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const n = 9
  for (let i = 0; i < n; i++) {
    const x = w * (0.08 + (i / (n - 1)) * 0.84)
    const sh = h * (0.18 + rng() * 0.2)
    ctx.fillStyle = '#1b1714'
    ctx.beginPath()
    ctx.moveTo(x - w * 0.025, h * 0.64)
    ctx.lineTo(x - w * 0.02 + rng() * 4, h * 0.64 - sh)
    ctx.lineTo(x + w * 0.02, h * 0.64 - sh * (0.9 + rng() * 0.1))
    ctx.lineTo(x + w * 0.028, h * 0.64)
    ctx.fill()
  }
  ctx.strokeStyle = p.ink
  ctx.globalAlpha = 0.5
  ctx.lineWidth = Math.max(1, w * 0.003)
  ctx.beginPath()
  for (let a = 0; a < TAU * 3; a += 0.1) ctx.lineTo(w * 0.5 + Math.cos(a) * a * w * 0.006, h * 0.84 + Math.sin(a) * a * h * 0.006)
  ctx.stroke()
  ctx.globalAlpha = 1
  grain(ctx, w, h, rng, 0.08)
}

const dots: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.min(w, h)
  const r = s * 0.008
  for (let k = 0; k < 7; k++) {
    const cx = rng() * w, cy = rng() * h
    const rings = 4 + Math.floor(rng() * 5)
    for (let ring = 0; ring < rings; ring++) {
      const rr = (ring + 1) * r * 3.2
      const count = Math.floor((TAU * rr) / (r * 2.8))
      ctx.fillStyle = p.colors[(ring + k) % p.colors.length]
      for (let j = 0; j < count; j++) {
        const a = (j / count) * TAU
        ctx.beginPath()
        ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r, 0, TAU)
        ctx.fill()
      }
    }
  }
  for (let i = 0; i < 700; i++) {
    const x = rng() * w, y = rng() * h
    ctx.fillStyle = p.colors[Math.floor(noise(x * 0.01, y * 0.01, 2) * 2 + 2) % p.colors.length]
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.arc(x, y, r * 0.8, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

const dotsEarth: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, '#3a2016')
  const s = Math.min(w, h)
  const cols = ['#f2e3cc', '#e3a23c', '#b5532a', '#e8c07a', '#f4efe6', '#9e7bb5', '#d86a8a']
  for (let layer = 0; layer < 4; layer++)
    for (let i = 0; i < 1800; i++) {
      const x = rng() * w, y = rng() * h
      const n = noise(x * 0.006, y * 0.006, layer)
      ctx.fillStyle = cols[Math.floor((n + 1) * 3.5 + layer) % cols.length]
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(x, y, s * (0.004 + rng() * 0.006), 0, TAU)
      ctx.fill()
    }
  ctx.globalAlpha = 1
  void p
}

function glyph(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rng: Rng) {
  const k = Math.floor(rng() * 8)
  ctx.beginPath()
  switch (k) {
    case 0:
      ctx.ellipse(x, y, s * 0.4, s * 0.18, 0, 0, TAU)
      ctx.moveTo(x + s * 0.12, y)
      ctx.arc(x, y, s * 0.12, 0, TAU)
      break
    case 1:
      for (let i = 0; i < 4; i++) ctx.lineTo(x - s * 0.4 + i * s * 0.27, y + (i % 2 ? -s * 0.15 : s * 0.15))
      break
    case 2:
      ctx.arc(x, y - s * 0.2, s * 0.14, 0, TAU)
      ctx.moveTo(x, y - s * 0.06)
      ctx.lineTo(x, y + s * 0.4)
      ctx.moveTo(x - s * 0.22, y + s * 0.05)
      ctx.lineTo(x + s * 0.22, y + s * 0.05)
      break
    case 3:
      ctx.moveTo(x - s * 0.35, y + s * 0.2)
      ctx.lineTo(x, y - s * 0.3)
      ctx.lineTo(x + s * 0.35, y + s * 0.2)
      ctx.closePath()
      break
    case 4:
      ctx.arc(x, y, s * 0.3, Math.PI, TAU)
      break
    case 5:
      ctx.rect(x - s * 0.25, y - s * 0.25, s * 0.5, s * 0.5)
      ctx.moveTo(x - s * 0.25, y)
      ctx.lineTo(x + s * 0.25, y)
      break
    case 6:
      ctx.moveTo(x - s * 0.3, y + s * 0.3)
      ctx.quadraticCurveTo(x, y - s * 0.6, x + s * 0.3, y + s * 0.3)
      break
    default:
      ctx.moveTo(x, y - s * 0.35)
      ctx.lineTo(x, y + s * 0.35)
      ctx.moveTo(x - s * 0.1, y - s * 0.25)
      ctx.lineTo(x + s * 0.15, y - s * 0.35)
  }
  ctx.stroke()
}

const monument: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.colors[3] ?? p.ink)
  const rows = 5
  const s = h / rows
  ctx.lineWidth = Math.max(1.5, s * 0.06)
  for (let r = 0; r < rows; r++) {
    ctx.fillStyle = r % 2 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
    ctx.fillRect(0, r * s, w, s)
    ctx.strokeStyle = p.colors[0]
    ctx.beginPath()
    ctx.moveTo(0, r * s + 2)
    ctx.lineTo(w, r * s + 2)
    ctx.stroke()
    for (let x = s * 0.6; x < w; x += s * 0.8) {
      ctx.strokeStyle = rng() > 0.8 ? p.colors[1] : '#2a1a10'
      glyph(ctx, x, r * s + s * 0.55, s * 0.7, rng)
    }
  }
  grain(ctx, w, h, rng, 0.08)
}

const temple: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  ctx.fillStyle = p.colors[0]
  ctx.strokeStyle = p.ink
  ctx.lineWidth = 1.2
  const base = h * 0.82
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(w * (0.14 - i * 0.02), base + i * h * 0.03, w * (0.72 + i * 0.04), h * 0.03)
    ctx.strokeRect(w * (0.14 - i * 0.02), base + i * h * 0.03, w * (0.72 + i * 0.04), h * 0.03)
  }
  const n = 8
  for (let i = 0; i < n; i++) {
    const x = w * 0.18 + (i / (n - 1)) * w * 0.64
    ctx.fillRect(x - w * 0.018, h * 0.38, w * 0.036, base - h * 0.38)
    for (let f = -2; f <= 2; f++) {
      ctx.beginPath()
      ctx.moveTo(x + f * w * 0.006, h * 0.39)
      ctx.lineTo(x + f * w * 0.006, base)
      ctx.stroke()
    }
  }
  ctx.fillRect(w * 0.14, h * 0.32, w * 0.72, h * 0.06)
  ctx.strokeRect(w * 0.14, h * 0.32, w * 0.72, h * 0.06)
  ctx.beginPath()
  ctx.moveTo(w * 0.12, h * 0.32)
  ctx.lineTo(w * 0.5, h * 0.14)
  ctx.lineTo(w * 0.88, h * 0.32)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = p.accent
  ctx.fillRect(w * 0.14, h * 0.345, w * 0.72, h * 0.008)
  grain(ctx, w, h, rng, 0.04)
}

const mosaic: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.max(4, Math.min(w, h) / 40)
  for (let y = 0; y < h; y += s)
    for (let x = 0; x < w; x += s) {
      const nx = (x - w / 2) / w, ny = (y - h * 0.45) / h
      const halo = Math.hypot(nx, ny * 1.2) < 0.18
      const n = noise(x * 0.02, y * 0.02, 1)
      ctx.fillStyle = halo ? p.colors[0] : n > 0.3 ? p.colors[1] : n < -0.4 ? p.colors[2] : p.accent
      ctx.globalAlpha = 0.75 + rng() * 0.25
      ctx.fillRect(x + (rng() - 0.5) * 1.5, y + (rng() - 0.5) * 1.5, s - 1.5, s - 1.5)
    }
  ctx.globalAlpha = 1
}

const knot: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const bands = 6
  ctx.lineCap = 'round'
  for (let pass = 0; pass < 2; pass++)
    for (let b = 0; b < bands; b++) {
      ctx.strokeStyle = pass === 0 ? p.bg : p.colors[b % p.colors.length]
      ctx.lineWidth = pass === 0 ? h * 0.07 : h * 0.035
      ctx.beginPath()
      for (let x = 0; x <= w; x += 4) {
        const y = h * 0.5 + Math.sin((x / w) * TAU * 3 + (b * TAU) / bands) * h * 0.3
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  ctx.strokeStyle = p.accent
  ctx.lineWidth = 3
  ctx.strokeRect(8, 8, w - 16, h - 16)
  void rng
}

function radial(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, p: Palette, petals: number, rings: number) {
  for (let r = rings; r > 0; r--) {
    const rr = (r / rings) * R
    ctx.fillStyle = p.colors[r % p.colors.length]
    ctx.beginPath()
    for (let i = 0; i <= petals * 8; i++) {
      const a = (i / (petals * 8)) * TAU
      const m = rr * (0.82 + 0.18 * Math.abs(Math.cos((a * petals) / 2)))
      ctx.lineTo(cx + Math.cos(a) * m, cy + Math.sin(a) * m)
    }
    ctx.fill()
  }
}

const lotus: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.bg)
  radial(ctx, w / 2, h / 2, Math.min(w, h) * 0.45, p, 16, 7)
}

const mandala: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.bg)
  const R = Math.min(w, h) * 0.46
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.fillStyle = p.colors[1]
  ctx.fillRect(-R * 0.72, -R * 0.72, R * 1.44, R * 1.44)
  ctx.fillStyle = p.colors[0]
  for (let k = 0; k < 4; k++) {
    ctx.rotate(Math.PI / 2)
    ctx.fillRect(-R * 0.14, -R * 0.82, R * 0.28, R * 0.12)
  }
  ctx.restore()
  radial(ctx, w / 2, h / 2, R * 0.6, p, 8, 6)
  ctx.strokeStyle = p.accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, R, 0, TAU)
  ctx.stroke()
}

const girih: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.min(w, h) / 4
  ctx.lineWidth = Math.max(1.5, s * 0.05)
  for (let y = -s; y < h + s; y += s)
    for (let x = -s; x < w + s; x += s) {
      ctx.fillStyle = p.colors[(Math.round(x / s) + Math.round(y / s)) % 3 === 0 ? 1 : 2]
      ctx.strokeStyle = p.accent
      ctx.beginPath()
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * TAU + Math.PI / 8
        const r = i % 2 ? s * 0.22 : s * 0.46
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
      }
      ctx.fill()
      ctx.stroke()
    }
}

const miniature: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.colors[0])
  ctx.fillStyle = p.bg
  ctx.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88)
  ctx.strokeStyle = p.accent
  ctx.lineWidth = 3
  ctx.strokeRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88)
  const layers = 5
  for (let i = 0; i < layers; i++) {
    ctx.fillStyle = p.colors[(i + 1) % p.colors.length]
    const y = h * (0.2 + i * 0.14)
    ctx.beginPath()
    ctx.moveTo(w * 0.08, y)
    for (let x = 0; x <= 1; x += 0.05) ctx.lineTo(w * (0.08 + x * 0.84), y + Math.sin(x * 9 + i) * h * 0.03)
    ctx.lineTo(w * 0.92, h * 0.92)
    ctx.lineTo(w * 0.08, h * 0.92)
    ctx.fill()
  }
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = pick(rng, p.colors)
    ctx.beginPath()
    ctx.arc(w * (0.12 + rng() * 0.76), h * (0.3 + rng() * 0.58), Math.min(w, h) * 0.012, 0, TAU)
    ctx.fill()
  }
}

const jali: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.min(w, h) / 7
  ctx.fillStyle = p.colors[1]
  for (let y = 0; y < h + s; y += s * 0.87)
    for (let x = 0; x < w + s; x += s) {
      const ox = (Math.round(y / (s * 0.87)) % 2) * s * 0.5
      ctx.beginPath()
      for (let i = 0; i < 6; i++) ctx.lineTo(x + ox + Math.cos((i / 6) * TAU) * s * 0.32, y + Math.sin((i / 6) * TAU) * s * 0.32)
      ctx.fill()
    }
  ctx.strokeStyle = p.accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w * 0.2, h)
  ctx.lineTo(w * 0.2, h * 0.4)
  ctx.quadraticCurveTo(w * 0.5, h * 0.02, w * 0.8, h * 0.4)
  ctx.lineTo(w * 0.8, h)
  ctx.stroke()
}

const batik: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.colors[0])
  for (let i = 0; i < 22; i++) {
    ctx.strokeStyle = p.colors[1 + (i % (p.colors.length - 1))]
    ctx.lineWidth = Math.min(w, h) * 0.02
    ctx.beginPath()
    for (let x = 0; x <= w; x += 6) ctx.lineTo(x, (i / 22) * h + Math.sin(x * 0.03 + i) * 10 + noise(x * 0.01, i, 0) * 12)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 0.8
  for (let i = 0; i < 60; i++) {
    let x = rng() * w, y = rng() * h
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let k = 0; k < 8; k++) {
      x += (rng() - 0.5) * 30
      y += (rng() - 0.5) * 30
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

const fret: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = h / 5
  ctx.strokeStyle = p.colors[1]
  ctx.lineWidth = s * 0.14
  for (let row = 0; row < 5; row++) {
    ctx.strokeStyle = p.colors[row % p.colors.length]
    ctx.beginPath()
    for (let x = 0; x < w; x += s) {
      const y = row * s + s * 0.2
      ctx.moveTo(x, y + s * 0.6)
      ctx.lineTo(x, y)
      ctx.lineTo(x + s * 0.6, y)
      ctx.lineTo(x + s * 0.6, y + s * 0.4)
      ctx.lineTo(x + s * 0.3, y + s * 0.4)
      ctx.lineTo(x + s * 0.3, y + s * 0.2)
    }
    ctx.stroke()
  }
}

const inkMountains: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let layer = 0; layer < 5; layer++) {
    ctx.fillStyle = p.ink
    ctx.globalAlpha = 0.12 + layer * 0.14
    ctx.beginPath()
    ctx.moveTo(0, h)
    const base = h * (0.35 + layer * 0.12)
    for (let x = 0; x <= w; x += 4) {
      const n = noise(x * 0.006, layer * 3, 1) * 0.5 + noise(x * 0.02, layer * 3, 2) * 0.15
      ctx.lineTo(x, base - Math.max(0, n) * h * 0.5 - (layer === 1 ? Math.exp(-((x - w * 0.3) ** 2) / (w * w * 0.004)) * h * 0.3 : 0))
    }
    ctx.lineTo(w, h)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = p.accent
  ctx.fillRect(w * 0.86, h * 0.08, w * 0.035, w * 0.035)
  grain(ctx, w, h, rng, 0.04)
}

const japanese: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  ctx.fillStyle = p.accent
  ctx.beginPath()
  ctx.arc(w * 0.72, h * 0.34, Math.min(w, h) * 0.14, 0, TAU)
  ctx.fill()
  for (let k = 0; k < 3; k++) {
    const x = w * (0.1 + k * 0.05)
    brushStroke(ctx, Array.from({ length: 12 }, (_, i) => [x + Math.sin(i * 0.3) * 4, h - (i / 11) * h * (0.7 + k * 0.1)] as [number, number]), Math.min(w, h) * 0.018, p.ink, rng, 0.2)
    for (let j = 0; j < 4; j++) {
      const y = h * (0.3 + rng() * 0.5)
      brushStroke(ctx, [[x, y], [x + w * 0.06, y - h * 0.03], [x + w * 0.12, y - h * 0.02]], Math.min(w, h) * 0.01, p.ink, rng, 0.4)
    }
  }
  ctx.strokeStyle = p.ink
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 1.2
  for (let k = 0; k < 4; k++) {
    ctx.beginPath()
    for (let x = w * 0.35; x < w; x += 4) ctx.lineTo(x, h * (0.8 + k * 0.04) + Math.sin(x * 0.04 + k) * h * 0.015)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

const enso: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const R = Math.min(w, h) * 0.34
  const start = rng() * TAU
  ctx.strokeStyle = p.ink
  ctx.lineCap = 'round'
  for (let i = 0; i < 90; i++) {
    const t = i / 90
    const a = start + t * TAU * 0.92
    ctx.globalAlpha = 0.8 - t * 0.3
    ctx.lineWidth = R * (0.22 - t * 0.14) * (0.8 + rng() * 0.3)
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, R + (rng() - 0.5) * 3, a, a + 0.09)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = p.accent
  ctx.fillRect(w * 0.82, h * 0.78, w * 0.04, w * 0.04)
}

const calligraphy: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const cols = 4
  for (let c = 0; c < cols; c++) {
    const x = w * (0.78 - c * 0.18)
    for (let k = 0; k < 4; k++) {
      const y = h * (0.12 + k * 0.2)
      const s = Math.min(w, h) * 0.07
      for (let st = 0; st < 3 + Math.floor(rng() * 3); st++) {
        const a = rng() * TAU
        const len = s * (0.5 + rng())
        brushStroke(ctx, [[x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5], [x - Math.cos(a) * len * 0.5, y - Math.sin(a) * len * 0.5 + s * 0.2]], s * 0.2, p.ink, rng, 0.5)
      }
    }
  }
  ctx.fillStyle = p.accent
  ctx.fillRect(w * 0.08, h * 0.82, w * 0.05, w * 0.05)
}

const wave: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let k = 0; k < 6; k++) {
    ctx.fillStyle = k % 2 ? p.colors[0] : p.colors[1]
    ctx.beginPath()
    ctx.moveTo(0, h)
    for (let x = 0; x <= w; x += 3) {
      const crest = Math.exp(-((x - w * 0.35) ** 2) / (w * w * 0.02)) * h * 0.45
      ctx.lineTo(x, h * (0.55 + k * 0.08) - (k === 0 ? crest : 0) + Math.sin(x * 0.03 + k) * h * 0.03)
    }
    ctx.lineTo(w, h)
    ctx.fill()
  }
  ctx.fillStyle = p.colors[2] ?? '#fff'
  for (let i = 0; i < 70; i++) {
    const a = rng() * Math.PI
    ctx.beginPath()
    ctx.arc(w * 0.35 + Math.cos(a) * w * 0.12, h * 0.12 + Math.sin(a) * h * 0.05 + rng() * h * 0.1, Math.min(w, h) * 0.01, 0, TAU)
    ctx.fill()
  }
  ctx.fillStyle = p.accent
  ctx.beginPath()
  ctx.moveTo(w * 0.7, h * 0.56)
  ctx.lineTo(w * 0.78, h * 0.34)
  ctx.lineTo(w * 0.86, h * 0.56)
  ctx.fill()
}

const korean: Painter = (ctx, w, h, rng, p) => {
  inkMountains(ctx, w, h, rng, { ...p, ink: '#44524c' })
  ctx.fillStyle = p.colors[1]
  ctx.beginPath()
  ctx.ellipse(w * 0.62, h * 0.62, w * 0.14, h * 0.2, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = p.accent
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.ellipse(w * 0.62, h * 0.62, w * 0.12, h * 0.18, 0, 0, TAU)
  ctx.fill()
  ctx.globalAlpha = 1
}

const gothic: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(w * 0.25, h)
  ctx.lineTo(w * 0.25, h * 0.45)
  ctx.quadraticCurveTo(w * 0.27, h * 0.12, w * 0.5, h * 0.04)
  ctx.quadraticCurveTo(w * 0.73, h * 0.12, w * 0.75, h * 0.45)
  ctx.lineTo(w * 0.75, h)
  ctx.clip()
  const s = Math.min(w, h) / 12
  for (let y = 0; y < h; y += s)
    for (let x = 0; x < w; x += s) {
      ctx.fillStyle = pick(rng, p.colors)
      ctx.beginPath()
      ctx.moveTo(x + rng() * s * 0.3, y)
      ctx.lineTo(x + s, y + rng() * s * 0.3)
      ctx.lineTo(x + s - rng() * s * 0.3, y + s)
      ctx.lineTo(x, y + s - rng() * s * 0.3)
      ctx.fill()
      ctx.strokeStyle = '#0b0a10'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  ctx.restore()
}

const renaissance: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.bg)
  const vx = w / 2, vy = h * 0.42
  ctx.strokeStyle = p.ink
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 1
  for (let i = -10; i <= 10; i++) {
    ctx.beginPath()
    ctx.moveTo(vx, vy)
    ctx.lineTo(vx + i * w * 0.12, h)
    ctx.stroke()
  }
  for (let k = 1; k < 10; k++) {
    const y = vy + (h - vy) * Math.pow(k / 10, 2)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = p.accent
  ctx.lineWidth = 2
  let size = Math.min(w, h) * 0.5
  let x = w * 0.2, y = h * 0.1
  ctx.beginPath()
  for (let i = 0; i < 7; i++) {
    const s = size
    const dir = i % 4
    const cx = [x + s, x + s, x, x][dir]
    const cy = [y + s, y, y, y + s][dir]
    ctx.arc(cx, cy, s, [Math.PI, Math.PI / 2, 0, -Math.PI / 2][dir] + Math.PI, [Math.PI, Math.PI / 2, 0, -Math.PI / 2][dir] + Math.PI * 1.5)
    size /= 1.618
    x = [x + s, x + s - size, x, x][dir]
    y = [y, y + s, y + s - size, y][dir]
  }
  ctx.stroke()
}

const baroque: Painter = (ctx, w, h, rng, p) => {
  const g = ctx.createRadialGradient(w * 0.45, h * 0.4, 0, w * 0.45, h * 0.4, w * 0.6)
  g.addColorStop(0, '#6a4a2a')
  g.addColorStop(0.4, '#1a0f0a')
  g.addColorStop(1, p.bg)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.lineCap = 'round'
  for (let k = 0; k < 7; k++) {
    ctx.strokeStyle = k % 3 === 0 ? p.colors[1] : p.accent
    ctx.lineWidth = Math.min(w, h) * (0.006 + rng() * 0.012)
    ctx.beginPath()
    const cx = w * (0.2 + rng() * 0.6), cy = h * (0.2 + rng() * 0.6)
    for (let a = 0; a < TAU * 2.2; a += 0.05) {
      const r = Math.min(w, h) * 0.01 * Math.exp(a * 0.34)
      ctx.lineTo(cx + Math.cos(a + k) * r, cy + Math.sin(a + k) * r)
    }
    ctx.stroke()
  }
  grain(ctx, w, h, rng, 0.06)
}

const sublime: Painter = (ctx, w, h, rng, p) => {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#2b323b')
  g.addColorStop(0.5, p.accent)
  g.addColorStop(1, '#1a1f26')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(230,225,215,${0.05 + rng() * 0.08})`
    ctx.beginPath()
    ctx.ellipse(rng() * w, rng() * h * 0.5, w * 0.2 * rng(), h * 0.05, rng(), 0, TAU)
    ctx.fill()
  }
  ctx.fillStyle = '#12161b'
  ctx.beginPath()
  ctx.moveTo(0, h)
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, h * 0.7 - Math.max(0, noise(x * 0.008, 0, 3)) * h * 0.35)
  ctx.lineTo(w, h)
  ctx.fill()
  ctx.fillRect(w * 0.48, h * 0.62, w * 0.008, h * 0.05)
  grain(ctx, w, h, rng, 0.05)
}

const impression: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.min(w, h) * 0.02
  for (let i = 0; i < (w * h) / (s * s) * 2.2; i++) {
    const x = rng() * w, y = rng() * h
    const horizon = h * 0.55
    const c = y > horizon ? pick(rng, [p.colors[0], p.colors[4], p.colors[5]]) : Math.hypot(x - w * 0.7, y - h * 0.25) < s * 5 ? p.accent : pick(rng, [p.colors[1], p.colors[0], p.colors[3], p.bg])
    ctx.fillStyle = c
    ctx.globalAlpha = 0.8
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(y > horizon ? (rng() - 0.5) * 0.3 : rng() * 3)
    ctx.fillRect(-s, -s * 0.3, s * 2, s * 0.6)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}

function flowField(ctx: CanvasRenderingContext2D, w: number, h: number, rng: Rng, colors: string[], opts: { swirl: number; count: number; len: number; width: number; jagged?: boolean }) {
  const vort = Array.from({ length: 4 }, () => ({ x: rng() * w, y: rng() * h * 0.6, s: rng() > 0.5 ? 1 : -1 }))
  ctx.lineCap = 'round'
  for (let i = 0; i < opts.count; i++) {
    let x = rng() * w, y = rng() * h
    ctx.strokeStyle = pick(rng, colors)
    ctx.lineWidth = opts.width * (0.5 + rng())
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let k = 0; k < opts.len; k++) {
      let a = noise(x * 0.004, y * 0.004, 0.5) * Math.PI * 2
      for (const v of vort) {
        const dx = x - v.x, dy = y - v.y
        const d = Math.hypot(dx, dy) + 1
        a += (v.s * opts.swirl * 60) / d
        if (d < 120) a = Math.atan2(dy, dx) + (v.s * Math.PI) / 2
      }
      if (opts.jagged) a = Math.round(a / (Math.PI / 4)) * (Math.PI / 4)
      x += Math.cos(a) * 3
      y += Math.sin(a) * 3
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

const swirl: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  flowField(ctx, w, h, rng, p.colors, { swirl: 1, count: Math.floor((w * h) / 90), len: 8, width: Math.min(w, h) * 0.006 })
  ctx.fillStyle = p.accent
  ctx.beginPath()
  ctx.arc(w * 0.8, h * 0.2, Math.min(w, h) * 0.06, 0, TAU)
  ctx.fill()
}

const fauve: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = pick(rng, p.colors)
    ctx.beginPath()
    const cx = rng() * w, cy = rng() * h
    for (let a = 0; a < TAU; a += 0.5) ctx.lineTo(cx + Math.cos(a) * w * (0.08 + rng() * 0.12), cy + Math.sin(a) * h * (0.08 + rng() * 0.1))
    ctx.fill()
  }
  flowField(ctx, w, h, rng, p.colors, { swirl: 0.2, count: Math.floor((w * h) / 400), len: 6, width: Math.min(w, h) * 0.012 })
}

const jaggedFlow: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = pick(rng, p.colors)
    ctx.beginPath()
    ctx.moveTo(rng() * w, rng() * h)
    for (let k = 0; k < 3; k++) ctx.lineTo(rng() * w, rng() * h)
    ctx.fill()
  }
  flowField(ctx, w, h, rng, p.colors, { swirl: 0.3, count: Math.floor((w * h) / 200), len: 7, width: Math.min(w, h) * 0.008, jagged: true })
}

const nouveau: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  ctx.lineCap = 'round'
  for (let k = 0; k < 14; k++) {
    ctx.strokeStyle = k % 3 ? p.colors[1] : p.accent
    ctx.lineWidth = Math.min(w, h) * (0.004 + rng() * 0.01)
    ctx.beginPath()
    const x0 = rng() * w
    for (let t = 0; t <= 1; t += 0.01) {
      const y = h - t * h * (0.6 + rng() * 0.02)
      ctx.lineTo(x0 + Math.sin(t * 7 + k) * w * 0.08 * t + Math.sin(t * 19) * 3, y)
    }
    ctx.stroke()
    ctx.fillStyle = p.accent
    ctx.beginPath()
    ctx.arc(x0 + Math.sin(7 + k) * w * 0.08, h * 0.38, Math.min(w, h) * 0.018, 0, TAU)
    ctx.fill()
  }
  ctx.strokeStyle = p.accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w * 0.06, h)
  ctx.bezierCurveTo(w * 0.06, h * 0.1, w * 0.94, h * 0.1, w * 0.94, h)
  ctx.stroke()
}

const cubism: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = pick(rng, p.colors)
    ctx.globalAlpha = 0.55 + rng() * 0.45
    ctx.beginPath()
    const cx = w * (0.2 + rng() * 0.6), cy = h * (0.1 + rng() * 0.8)
    const n = 3 + Math.floor(rng() * 3)
    for (let k = 0; k < n; k++) {
      const a = Math.round(((k / n) * TAU + rng() * 0.8) / (Math.PI / 6)) * (Math.PI / 6)
      const r = Math.min(w, h) * (0.05 + rng() * 0.12)
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    }
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = p.ink
    ctx.globalAlpha = 0.6
    ctx.lineWidth = 1
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  grain(ctx, w, h, rng, 0.05)
}

const surreal: Painter = (ctx, w, h, rng, p) => {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, p.colors[2])
  g.addColorStop(0.62, p.colors[1])
  g.addColorStop(0.63, p.bg)
  g.addColorStop(1, p.colors[3])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const s = Math.min(w, h)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(w * 0.7, h * 0.8, s * 0.3, s * 0.02, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#f4efe6'
  ctx.beginPath()
  ctx.arc(w * 0.62, h * 0.42, s * 0.12, 0, TAU)
  ctx.fill()
  ctx.fillStyle = p.accent
  ctx.beginPath()
  ctx.arc(w * 0.62, h * 0.42, s * 0.05, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(w * 0.62, h * 0.42, s * 0.022, 0, TAU)
  ctx.fill()
  ctx.strokeStyle = p.ink
  ctx.lineWidth = 3
  ctx.strokeRect(w * 0.18, h * 0.3, s * 0.14, s * 0.3)
  ctx.fillStyle = p.colors[2]
  ctx.fillRect(w * 0.18, h * 0.3, s * 0.14, s * 0.3)
  void rng
}

const destijl: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const xs = [0, ...Array.from({ length: 3 }, () => rng() * w).sort((a, b) => a - b), w]
  const ys = [0, ...Array.from({ length: 3 }, () => rng() * h).sort((a, b) => a - b), h]
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < ys.length - 1; j++)
      if (rng() > 0.72) {
        ctx.fillStyle = pick(rng, [p.colors[0], p.colors[1], p.colors[2]])
        ctx.fillRect(xs[i], ys[j], xs[i + 1] - xs[i], ys[j + 1] - ys[j])
      }
  ctx.fillStyle = p.ink
  const lw = Math.min(w, h) * 0.022
  xs.forEach((x) => ctx.fillRect(x - lw / 2, 0, lw, h))
  ys.forEach((y) => ctx.fillRect(0, y - lw / 2, w, lw))
}

const suprematism: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let i = 0; i < 9; i++) {
    ctx.save()
    ctx.translate(w * (0.2 + rng() * 0.6), h * (0.2 + rng() * 0.6))
    ctx.rotate((rng() - 0.5) * 1.2)
    ctx.fillStyle = i === 0 ? p.ink : pick(rng, p.colors)
    const s = Math.min(w, h) * (i === 0 ? 0.28 : 0.04 + rng() * 0.1)
    ctx.fillRect(-s / 2, -s / (i === 0 ? 2 : 6), s, i === 0 ? s : s / 3)
    ctx.restore()
  }
}

const bauhaus: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.min(w, h)
  ctx.fillStyle = p.colors[2]
  ctx.beginPath()
  ctx.arc(w * 0.32, h * 0.4, s * 0.22, 0, TAU)
  ctx.fill()
  ctx.fillStyle = p.colors[0]
  ctx.beginPath()
  ctx.moveTo(w * 0.55, h * 0.78)
  ctx.lineTo(w * 0.72, h * 0.3)
  ctx.lineTo(w * 0.9, h * 0.78)
  ctx.fill()
  ctx.fillStyle = p.colors[1]
  ctx.fillRect(w * 0.12, h * 0.68, s * 0.2, s * 0.2)
  ctx.fillStyle = p.ink
  ctx.fillRect(w * 0.08, h * 0.12, w * 0.84, s * 0.012)
  ctx.fillRect(w * 0.08, h * 0.9, w * 0.5, s * 0.03)
  void rng
}

const constructivism: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-0.5)
  ctx.fillStyle = p.accent
  ctx.fillRect(-w, -h * 0.08, w * 2, h * 0.16)
  ctx.fillStyle = p.ink
  ctx.fillRect(-w * 0.4, h * 0.14, w * 0.9, h * 0.05)
  ctx.restore()
  ctx.fillStyle = p.ink
  ctx.beginPath()
  ctx.arc(w * 0.72, h * 0.3, Math.min(w, h) * 0.12, 0, TAU)
  ctx.fill()
  ctx.strokeStyle = p.ink
  ctx.lineWidth = 1.5
  for (let i = 0; i < 12; i++) {
    ctx.beginPath()
    ctx.moveTo(w * 0.15 + i * 6, h)
    ctx.lineTo(w * 0.3 + i * 3, h * 0.15)
    ctx.stroke()
  }
  void rng
}

const WORDS = ['ART', 'DADA', 'NON', 'IDEA', 'OBJET', '?', 'ZERO', 'CHANCE', 'READY', 'MADE', 'ANTI', 'Ø', 'MERZ', 'WHY']
const dada: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const fonts = ['900 {s}px Georgia, serif', '700 {s}px "Inter Tight", sans-serif', '400 {s}px "JetBrains Mono", monospace', 'italic 400 {s}px "Instrument Serif", serif']
  for (let i = 0; i < 26; i++) {
    ctx.save()
    ctx.translate(rng() * w, rng() * h)
    ctx.rotate((rng() - 0.5) * 1.4)
    if (rng() > 0.6) {
      ctx.fillStyle = pick(rng, p.colors)
      ctx.fillRect(-w * 0.1, -h * 0.05, w * (0.1 + rng() * 0.2), h * (0.05 + rng() * 0.1))
    }
    ctx.fillStyle = rng() > 0.7 ? p.accent : p.ink
    ctx.font = pick(rng, fonts).replace('{s}', String(Math.floor(Math.min(w, h) * (0.04 + rng() * 0.12))))
    ctx.fillText(pick(rng, WORDS), 0, 0)
    ctx.restore()
  }
}

const conceptual: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.min(w, h)
  ctx.fillStyle = p.ink
  ctx.font = `600 ${s * 0.1}px "Inter Tight", sans-serif`
  ctx.fillText('art', w * 0.08, h * 0.28)
  ctx.font = `400 ${s * 0.04}px "JetBrains Mono", monospace`
  ;['(n.) 1. the conscious use of', 'skill and imagination in the', 'creation of — an idea, first.', '', '2. see: this text.'].forEach((line, i) => ctx.fillText(line, w * 0.08, h * (0.42 + i * 0.08)))
  ctx.strokeStyle = p.ink
  ctx.lineWidth = 1
  ctx.strokeRect(w * 0.7, h * 0.12, s * 0.2, s * 0.2)
}

const drip: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  ctx.lineCap = 'round'
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = pick(rng, p.colors)
    ctx.lineWidth = Math.min(w, h) * (0.002 + rng() * 0.008)
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    let x = rng() * w, y = rng() * h
    ctx.moveTo(x, y)
    for (let k = 0; k < 18; k++) {
      x += (rng() - 0.5) * w * 0.2
      y += (rng() - 0.5) * h * 0.2
      ctx.quadraticCurveTo(x + (rng() - 0.5) * 60, y + (rng() - 0.5) * 60, x, y)
    }
    ctx.stroke()
  }
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = pick(rng, p.colors)
    ctx.beginPath()
    ctx.arc(rng() * w, rng() * h, rng() * Math.min(w, h) * 0.008, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

const field: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.colors[4] ?? p.bg)
  const bands = [p.colors[0], p.colors[2], p.colors[1]]
  bands.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.filter = `blur(${Math.min(w, h) * 0.012}px)`
    ctx.globalAlpha = 0.9
    ctx.fillRect(w * 0.12, h * (0.08 + i * 0.3), w * 0.76, h * 0.26)
  })
  ctx.filter = 'none'
  ctx.globalAlpha = 1
  grain(ctx, w, h, rng, 0.06)
}

const pop: Painter = (ctx, w, h, rng, p) => {
  const cols = 3, rows = 2
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) {
      const x = (c / cols) * w, y = (r / rows) * h
      const cw = w / cols, ch = h / rows
      ctx.fillStyle = p.colors[(c + r) % p.colors.length]
      ctx.fillRect(x, y, cw, ch)
      ctx.fillStyle = p.colors[(c + r + 2) % p.colors.length]
      const s = Math.min(cw, ch)
      for (let dy = 0; dy < ch; dy += s * 0.08)
        for (let dx = 0; dx < cw; dx += s * 0.08) {
          const d = Math.hypot(dx - cw / 2, dy - ch / 2) / s
          ctx.beginPath()
          ctx.arc(x + dx, y + dy, s * 0.03 * Math.max(0, 1 - d), 0, TAU)
          ctx.fill()
        }
      ctx.fillStyle = p.ink
      ctx.fillRect(x + cw * 0.38, y + ch * 0.25, cw * 0.24, ch * 0.5)
      ctx.fillStyle = '#f7f7f2'
      ctx.fillRect(x + cw * 0.38, y + ch * 0.4, cw * 0.24, ch * 0.12)
    }
  void rng
}

const benday: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, '#fff4d6')
  const s = Math.min(w, h) * 0.035
  ctx.fillStyle = p.colors[0]
  for (let y = 0; y < h; y += s)
    for (let x = (y / s) % 2 ? s / 2 : 0; x < w; x += s) {
      ctx.beginPath()
      ctx.arc(x, y, s * 0.3, 0, TAU)
      ctx.fill()
    }
  ctx.fillStyle = p.colors[1]
  ctx.strokeStyle = p.ink
  ctx.lineWidth = Math.min(w, h) * 0.015
  ctx.beginPath()
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU
    const r = Math.min(w, h) * (i % 2 ? 0.2 : 0.36)
    ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = p.ink
  ctx.font = `900 ${Math.min(w, h) * 0.14}px "Inter Tight", sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('POW', w / 2, h / 2 + Math.min(w, h) * 0.05)
  ctx.textAlign = 'left'
}

const minimal: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.min(w, h) * 0.3
  ctx.fillStyle = p.ink
  ctx.fillRect(w / 2 - s / 2, h / 2 - s / 2, s, s)
}

const grid: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, '#efece6')
  ctx.strokeStyle = p.ink
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 0.8
  for (let y = h * 0.1; y < h * 0.9; y += h * 0.03) {
    ctx.beginPath()
    for (let x = w * 0.1; x < w * 0.9; x += 6) ctx.lineTo(x, y + (rng() - 0.5) * 0.8)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

const land: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  ctx.fillStyle = p.colors[2]
  ctx.fillRect(0, 0, w, h * 0.3)
  ctx.fillStyle = p.colors[0]
  for (let a = 0; a < TAU * 3.2; a += 0.04) {
    const r = Math.min(w, h) * 0.02 * a
    ctx.beginPath()
    ctx.arc(w * 0.5 + Math.cos(a) * r, h * 0.62 + Math.sin(a) * r * 0.5, Math.min(w, h) * 0.012 * (0.6 + rng()), 0, TAU)
    ctx.fill()
  }
}

const op: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.colors[1] ?? '#f2f2f0')
  ctx.fillStyle = p.ink
  const n = 40
  for (let i = 0; i < n; i++) {
    ctx.beginPath()
    for (let y = 0; y <= h; y += 4) {
      const x = (i / n) * w + Math.sin(y * 0.02 + i * 0.3) * w * 0.02 * Math.sin((y / h) * Math.PI)
      ctx.lineTo(x, y)
    }
    for (let y = h; y >= 0; y -= 4) {
      const x = ((i + 0.5) / n) * w + Math.sin(y * 0.02 + i * 0.3) * w * 0.02 * Math.sin((y / h) * Math.PI)
      ctx.lineTo(x, y)
    }
    ctx.fill()
  }
}

const installation: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let i = 0; i < 400; i++) {
    const z = rng()
    ctx.fillStyle = pick(rng, p.colors)
    ctx.globalAlpha = 0.3 + z * 0.7
    ctx.beginPath()
    ctx.arc(rng() * w, rng() * h, Math.min(w, h) * 0.02 * z * z + 1, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

const polka: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, '#f2c230')
  ctx.fillStyle = '#111'
  for (let i = 0; i < 90; i++) {
    const r = Math.min(w, h) * (0.01 + rng() * 0.05)
    ctx.beginPath()
    ctx.arc(rng() * w, rng() * h, r, 0, TAU)
    ctx.fill()
  }
  ctx.strokeStyle = p.accent
  void p
}

const street: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, '#2a2a2e')
  const bw = w / 12, bh = h / 16
  for (let y = 0; y < h; y += bh)
    for (let x = (y / bh) % 2 ? -bw / 2 : 0; x < w; x += bw) {
      ctx.fillStyle = `rgb(${60 + rng() * 30},${45 + rng() * 20},${45 + rng() * 20})`
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2)
    }
  const s = Math.min(w, h)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let k = 0; k < 3; k++) {
    const col = p.colors[k % p.colors.length]
    const cx = w * (0.2 + k * 0.3), cy = h * (0.4 + rng() * 0.2)
    const pts: [number, number][] = Array.from({ length: 10 }, (_, i) => [cx + (i - 5) * s * 0.04 + (rng() - 0.5) * s * 0.05, cy + (rng() - 0.5) * s * 0.2])
    for (const [lw, c] of [[s * 0.06, '#111'], [s * 0.045, col], [s * 0.012, '#fff']] as [number, string][]) {
      ctx.strokeStyle = c
      ctx.lineWidth = lw
      ctx.beginPath()
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
    }
    ctx.strokeStyle = col
    ctx.lineWidth = s * 0.006
    for (let d = 0; d < 5; d++) {
      const [x, y] = pts[Math.floor(rng() * pts.length)]
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + s * (0.05 + rng() * 0.15))
      ctx.stroke()
    }
  }
}

const crown: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.min(w, h)
  ctx.lineCap = 'round'
  ctx.strokeStyle = p.ink
  ctx.lineWidth = s * 0.012
  ctx.beginPath()
  const cx = w * 0.5, cy = h * 0.4
  ctx.moveTo(cx - s * 0.18, cy + s * 0.08)
  ctx.lineTo(cx - s * 0.2, cy - s * 0.1)
  ctx.lineTo(cx - s * 0.08, cy)
  ctx.lineTo(cx, cy - s * 0.16)
  ctx.lineTo(cx + s * 0.08, cy)
  ctx.lineTo(cx + s * 0.2, cy - s * 0.1)
  ctx.lineTo(cx + s * 0.18, cy + s * 0.08)
  ctx.closePath()
  ctx.stroke()
  ctx.fillStyle = p.colors[1]
  ctx.globalAlpha = 0.8
  ctx.fillRect(w * 0.05, h * 0.65, w * 0.4, h * 0.2)
  ctx.globalAlpha = 1
  ctx.fillStyle = p.ink
  ctx.font = `700 ${s * 0.06}px "JetBrains Mono", monospace`
  ;['SAMO©', 'ORIGIN', 'TIME', 'HISTORY'].forEach((word, i) => {
    const x = w * (0.1 + rng() * 0.5), y = h * (0.7 + i * 0.07)
    ctx.fillText(word, x, y)
    if (rng() > 0.4) ctx.fillRect(x, y - s * 0.02, ctx.measureText(word).width, s * 0.006)
  })
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = pick(rng, p.colors)
    ctx.lineWidth = s * 0.006
    ctx.beginPath()
    ctx.moveTo(rng() * w, rng() * h)
    for (let k = 0; k < 6; k++) ctx.lineTo(rng() * w, rng() * h)
    ctx.stroke()
  }
}

const pixel: Painter = (ctx, w, h, rng, p) => {
  const cell = Math.max(4, Math.floor(Math.min(w, h) / 32))
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell)
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const ground = rows * 0.62 + noise(x * 0.12, 0, 1) * rows * 0.1
      const c = y > ground ? (y > ground + 2 ? p.colors[7] : p.colors[6]) : y > rows * 0.5 && ((x + y) % 5 === 0) ? p.colors[5] : p.colors[y < rows * 0.2 ? 8 : 9] ?? p.bg
      ctx.fillStyle = c
      ctx.fillRect(x * cell, y * cell, cell, cell)
    }
  const sprite = Array.from({ length: 8 }, () => Array.from({ length: 4 }, () => rng() > 0.45))
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      if (!sprite[y][x < 4 ? x : 7 - x]) continue
      ctx.fillStyle = y < 3 ? p.colors[3] : p.colors[2]
      ctx.fillRect(cols * 0.45 * cell + x * cell, rows * 0.3 * cell + y * cell, cell, cell)
    }
  ctx.fillStyle = p.colors[4]
  ctx.fillRect(cols * 0.8 * cell, rows * 0.12 * cell, cell * 3, cell * 3)
}

const ascii: Painter = (ctx, w, h, _rng, p) => {
  fill(ctx, w, h, p.bg)
  const ramp = ' .:-=+*#%@'
  const cell = Math.max(6, Math.floor(Math.min(w, h) / 24))
  ctx.font = `${cell}px "JetBrains Mono", monospace`
  ctx.fillStyle = p.accent
  for (let y = 0; y < h; y += cell)
    for (let x = 0; x < w; x += cell * 0.6) {
      const nx = (x - w / 2) / (h * 0.35), ny = (y - h / 2) / (h * 0.35)
      const d = 1 - (nx * nx + ny * ny)
      const l = d > 0 ? Math.sqrt(d) * (0.6 - nx * 0.4 - ny * 0.3) : 0.05
      ctx.fillText(ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(l * ramp.length)))], x, y + cell)
    }
}

const dither: Painter = (ctx, w, h, _rng, p) => {
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
  const cell = Math.max(2, Math.floor(Math.min(w, h) / 90))
  for (let y = 0; y < h; y += cell)
    for (let x = 0; x < w; x += cell) {
      const nx = (x - w * 0.45) / (h * 0.35), ny = (y - h * 0.45) / (h * 0.35)
      const d = 1 - (nx * nx + ny * ny)
      const l = d > 0 ? Math.sqrt(d) * (0.7 - nx * 0.5 - ny * 0.4) : 0.2 + (y / h) * 0.3
      const t = bayer[((y / cell) % 4) * 4 + ((x / cell) % 4)] / 16
      ctx.fillStyle = l > t ? p.bg : p.ink
      ctx.fillRect(x, y, cell, cell)
    }
}

const glitch: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = pick(rng, p.colors)
    ctx.globalAlpha = 0.7
    ctx.fillRect(rng() * w - w * 0.1, rng() * h, rng() * w * 0.6, rng() * h * 0.04)
  }
  ctx.globalAlpha = 1
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(0, y, w, 1)
  }
  ctx.fillStyle = p.accent
  ctx.font = `700 ${Math.min(w, h) * 0.14}px "JetBrains Mono", monospace`
  ctx.fillText('ERR0R', w * 0.2 + (rng() - 0.5) * 8, h * 0.55)
  ctx.fillStyle = p.colors[1]
  ctx.fillText('ERR0R', w * 0.2 + 5, h * 0.55 + 2)
}

const net: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let i = 0; i < 5; i++) {
    const x = rng() * w * 0.6, y = rng() * h * 0.6
    const ww = w * 0.4, hh = h * 0.35
    ctx.fillStyle = '#fff'
    ctx.fillRect(x, y, ww, hh)
    ctx.fillStyle = '#000080'
    ctx.fillRect(x, y, ww, h * 0.05)
    ctx.strokeStyle = '#000'
    ctx.strokeRect(x, y, ww, hh)
    ctx.fillStyle = p.accent
    ctx.font = `${Math.min(w, h) * 0.035}px "Times New Roman", serif`
    ctx.fillText('click here', x + 6, y + hh * 0.5)
    ctx.fillRect(x + 6, y + hh * 0.5 + 2, ctx.measureText('click here').width, 1)
  }
}

const wireframe3d: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  ctx.strokeStyle = p.colors[0]
  ctx.lineWidth = 1
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath()
    ctx.moveTo(w / 2 + i * w * 0.02, h * 0.6)
    ctx.lineTo(w / 2 + i * w * 0.12, h)
    ctx.stroke()
  }
  for (let k = 0; k < 8; k++) {
    const y = h * 0.6 + (h * 0.4) * Math.pow(k / 8, 2)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.strokeStyle = p.colors[1]
  const R = Math.min(w, h) * 0.2
  for (let a = 0; a < Math.PI; a += Math.PI / 8) {
    ctx.beginPath()
    ctx.ellipse(w / 2, h * 0.38, R * Math.abs(Math.cos(a)), R, 0, 0, TAU)
    ctx.stroke()
  }
  for (let b = -3; b <= 3; b++) {
    ctx.beginPath()
    ctx.ellipse(w / 2, h * 0.38 + (b / 4) * R, R * Math.sqrt(1 - (b / 4) ** 2), R * 0.2 * Math.sqrt(1 - (b / 4) ** 2), 0, 0, TAU)
    ctx.stroke()
  }
  void rng
}

const plotter: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const n = 10
  const s = Math.min(w, h) / (n + 2)
  ctx.strokeStyle = p.ink
  ctx.lineWidth = 1
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dis = y / n
      ctx.save()
      ctx.translate((w - n * s) / 2 + (x + 0.5) * s + (rng() - 0.5) * dis * s * 0.5, (h - n * s) / 2 + (y + 0.5) * s + (rng() - 0.5) * dis * s * 0.5)
      ctx.rotate((rng() - 0.5) * dis * 1.4)
      ctx.strokeStyle = rng() > 0.97 ? p.accent : p.ink
      ctx.strokeRect(-s * 0.42, -s * 0.42, s * 0.84, s * 0.84)
      ctx.restore()
    }
}

const fractal: Painter = (ctx, w, h, _rng, p) => {
  const img = ctx.createImageData(w, h)
  const cr = -0.8, ci = 0.156
  const pal = p.colors.length ? p.colors : ['#7c5cff', '#16d6c2', '#ffb13b']
  const rgb = pal.map((c) => {
    const n = parseInt(c.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  })
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let zr = ((x - w / 2) / h) * 3, zi = ((y - h / 2) / h) * 3
      let i = 0
      for (; i < 60 && zr * zr + zi * zi < 4; i++) {
        const t = zr * zr - zi * zi + cr
        zi = 2 * zr * zi + ci
        zr = t
      }
      const k = (y * w + x) * 4
      const c = rgb[i % rgb.length]
      const f = i === 60 ? 0 : Math.sqrt(i / 60)
      img.data[k] = c[0] * f
      img.data[k + 1] = c[1] * f
      img.data[k + 2] = c[2] * f
      img.data[k + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
}

const data: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  for (let i = 0; i < 2500; i++) {
    const x = rng()
    const y = 0.5 + Math.sin(x * 12) * 0.15 * Math.cos(x * 3) + gauss(rng) * 0.05
    ctx.fillStyle = pick(rng, p.colors)
    ctx.fillRect(x * w, y * h, 2, 2)
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = p.colors[i % p.colors.length]
    ctx.globalAlpha = 0.5
    const bh = (0.1 + Math.abs(noise(i * 0.2, 0, 0))) * h * 0.4
    ctx.fillRect((i / 40) * w, h - bh, w / 44, bh)
  }
  ctx.globalAlpha = 1
}

const generative: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  flowField(ctx, w, h, rng, p.colors, { swirl: 0.1, count: Math.floor((w * h) / 120), len: 20, width: 1 })
}

const reaction: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const s = Math.max(3, Math.min(w, h) / 70)
  for (let y = 0; y < h; y += s)
    for (let x = 0; x < w; x += s) {
      const v = Math.sin(noise(x * 0.02, y * 0.02, 4) * 12)
      if (v > 0.2) {
        ctx.fillStyle = p.colors[Math.floor(rng() * 2)]
        ctx.fillRect(x, y, s, s)
      }
    }
}

const ai: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const layers = [4, 7, 9, 7, 4]
  const pts = layers.map((k, li) => Array.from({ length: k }, (_, j) => [w * (0.12 + (li / (layers.length - 1)) * 0.76), h * (0.15 + ((j + 0.5) / k) * 0.7)] as [number, number]))
  ctx.lineWidth = 0.6
  for (let li = 0; li < pts.length - 1; li++)
    for (const a of pts[li])
      for (const b of pts[li + 1]) {
        if (rng() > 0.55) continue
        ctx.strokeStyle = pick(rng, p.colors)
        ctx.globalAlpha = 0.4
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(b[0], b[1])
        ctx.stroke()
      }
  ctx.globalAlpha = 1
  pts.flat().forEach(([x, y]) => {
    ctx.fillStyle = p.ink
    ctx.beginPath()
    ctx.arc(x, y, Math.min(w, h) * 0.012, 0, TAU)
    ctx.fill()
  })
}

const postdigital: Painter = (ctx, w, h, rng, p) => {
  impression(ctx, w, h, rng, { ...p, colors: [p.colors[1], p.colors[2], p.colors[3], p.bg, p.colors[1], p.colors[2]] })
  const cell = Math.min(w, h) / 20
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = pick(rng, p.colors)
    ctx.fillRect(Math.floor((rng() * w) / cell) * cell, Math.floor((rng() * h) / cell) * cell, cell, cell)
  }
  ctx.strokeStyle = p.ink
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = 0; x < w; x += 3) ctx.lineTo(x, h / 2 + Math.sin(x * 0.03) * h * 0.2 + (rng() - 0.5) * 3)
  ctx.stroke()
}

const kandinsky: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, '#efe6d2')
  const s = Math.min(w, h)
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 1 + rng() * 3
    ctx.beginPath()
    ctx.moveTo(rng() * w, rng() * h)
    ctx.lineTo(rng() * w, rng() * h)
    ctx.stroke()
  }
  for (let i = 0; i < 9; i++) {
    const x = rng() * w, y = rng() * h, r = s * (0.02 + rng() * 0.1)
    for (let k = 3; k > 0; k--) {
      ctx.fillStyle = pick(rng, ['#d23a26', '#23479b', '#e1a92d', '#111', '#2e7d5b'])
      ctx.beginPath()
      ctx.arc(x, y, (r * k) / 3, 0, TAU)
      ctx.fill()
    }
  }
  void p
}

const squares: Painter = (ctx, w, h, rng, p) => {
  const cols = ['#e1a92d', '#d23a26', '#ece7dc', '#23479b', '#6b8f5a']
  const s = Math.min(w, h) * 0.9
  const c = [pick(rng, cols), pick(rng, cols), pick(rng, cols), pick(rng, cols)]
  fill(ctx, w, h, c[0])
  for (let i = 1; i < 4; i++) {
    const k = s * (1 - i * 0.2)
    ctx.fillStyle = c[i]
    ctx.fillRect(w / 2 - k / 2, h / 2 - k / 2 + (s * i * 0.04), k, k)
  }
  void p
}

const weave: Painter = (ctx, w, h, rng, p) => {
  const s = Math.max(4, Math.min(w, h) / 30)
  for (let y = 0; y < h; y += s)
    for (let x = 0; x < w; x += s) {
      const over = (Math.floor(x / s) + Math.floor(y / s)) % 2 === 0
      ctx.fillStyle = over ? pick(rng, p.colors) : '#1a1410'
      ctx.fillRect(x, y, over ? s : s * 0.9, over ? s * 0.9 : s)
    }
}

const pointillism: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, '#f1ead6')
  const r = Math.max(1.5, Math.min(w, h) * 0.006)
  for (let i = 0; i < (w * h) / (r * r * 3); i++) {
    const x = rng() * w, y = rng() * h
    const water = y > h * 0.6
    ctx.fillStyle = water ? pick(rng, ['#3f8fc9', '#1f3c88', '#f6e7a2']) : y < h * 0.3 ? pick(rng, ['#f6e7a2', '#f2c230', '#9cc2d8']) : pick(rng, ['#2f6b4f', '#86a86b', '#e27d34'])
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()
  }
  void p
}

const lewitt: Painter = (ctx, w, h, rng, p) => {
  fill(ctx, w, h, p.bg)
  const dirs = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]
  for (let q = 0; q < 4; q++) {
    const x0 = (q % 2) * (w / 2), y0 = Math.floor(q / 2) * (h / 2)
    ctx.save()
    ctx.beginPath()
    ctx.rect(x0, y0, w / 2, h / 2)
    ctx.clip()
    ctx.strokeStyle = p.ink
    ctx.lineWidth = 0.8
    const a = dirs[q]
    for (let k = -40; k < 40; k++) {
      ctx.beginPath()
      ctx.moveTo(x0 + w / 4 + Math.cos(a + Math.PI / 2) * k * 5 - Math.cos(a) * w, y0 + h / 4 + Math.sin(a + Math.PI / 2) * k * 5 - Math.sin(a) * w)
      ctx.lineTo(x0 + w / 4 + Math.cos(a + Math.PI / 2) * k * 5 + Math.cos(a) * w, y0 + h / 4 + Math.sin(a + Math.PI / 2) * k * 5 + Math.sin(a) * w)
      ctx.stroke()
    }
    ctx.restore()
  }
  void rng
}

export const PAINTERS: Record<string, Painter> = {
  cave, paint: cave, megalith, dots, 'dots-earth': dotsEarth,
  monument, pyramid: monument, ziggurat: monument, stepped: fret, plaques: monument,
  temple, greek: temple, roman: temple, neoclassical: temple,
  pattern: mosaic, mosaic, knot, lotus, mandala, girih, miniature, jali, batik, fret,
  ink: inkMountains, mountains: inkMountains, japanese, zen: enso, enso, sumie: japanese, calligraphy, ukiyo: wave, wave, korean,
  gothic, romanesque: gothic, renaissance, mannerism: renaissance,
  baroque, rococo: baroque, sublime, storm: sublime, fields: sublime,
  impression, flow: swirl, swirl, fauve, jagged: jaggedFlow,
  nouveau, whiplash: nouveau, symbolism: nouveau,
  cubism, futurism: cubism, surreal,
  construct: destijl, destijl, suprematism, bauhaus, constructivism,
  dada, conceptual, postmodern: dada,
  abstract: drip, gesture: drip, drip, field,
  pop, benday, minimal, object: minimal, grid, land, op,
  installation: polka, dots_room: installation, street, graffiti: street, stencil: street, neo: crown, crown,
  digital: pixel, pixel, ascii, dither, glitch, net, '3d': wireframe3d,
  generative, lab: generative, plotter, fractal, data, reaction,
  ai, postdigital, kandinsky, squares, weave, pointillism, lewitt,
}

export function painterFor(movement: Movement, override?: string): Painter {
  return (override && PAINTERS[override]) || (movement.visual.variant && PAINTERS[movement.visual.variant]) || PAINTERS[movement.visual.scene] || generative
}

export function paintInto(canvas: HTMLCanvasElement, movement: Movement, seed: string | number, override?: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const rng = mulberry32(typeof seed === 'number' ? seed : hashString(seed))
  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  painterFor(movement, override)(ctx, canvas.width, canvas.height, rng, movement.visual.palette)
  ctx.restore()
}
