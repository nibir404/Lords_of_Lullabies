import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@/state/store'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createNoise3D } from '@/utils/noise'
import { mulberry32, randomSeed } from '@/utils/random'

interface Params {
  chaos: number
  form: number
  color: number
  density: number
  scale: number
  rotation: number
  noise: number
  particles: number
  dither: number
  pixelation: number
  seed: number
}

const DEFAULTS: Omit<Params, 'seed'> = { chaos: 0.35, form: 0.2, color: 0, density: 0.55, scale: 0.5, rotation: 0, noise: 0.4, particles: 0.5, dither: 0, pixelation: 0 }

const PALETTES = [
  { name: 'Ink', bg: '#efe9dc', ink: ['#141414', '#3a3632', '#b3261e'] },
  { name: 'Nocturne', bg: '#0f1a3a', ink: ['#f2c230', '#3f8fc9', '#e27d34', '#f6e7a2'] },
  { name: 'Fauve', bg: '#1b0f2a', ink: ['#ff5e3a', '#2ec4b6', '#ffbf1f', '#e83f8a'] },
  { name: 'Bauhaus', bg: '#ece7dc', ink: ['#d23a26', '#23479b', '#e1a92d', '#161616'] },
  { name: 'Terminal', bg: '#070807', ink: ['#6cff8a', '#c9f5c9', '#2a8a3a'] },
  { name: 'Ukiyo', bg: '#efe4cb', ink: ['#1f3f6e', '#6f9bb8', '#c9493a'] },
  { name: 'Neon', bg: '#07070a', ink: ['#ff2a6d', '#05d9e8', '#d1f7ff'] },
]

const FORMS = ['Flow', 'Orbit', 'Radial', 'Grid', 'Spiral']

type Path = { pts: [number, number][]; color: string; width: number; alpha: number }

/** Deterministic: the same parameters and seed always produce the same composition. */
function generate(p: Params, w: number, h: number): { bg: string; paths: Path[] } {
  const rng = mulberry32(p.seed)
  const noise = createNoise3D(p.seed % 100000)
  const pal = PALETTES[Math.min(PALETTES.length - 1, Math.floor(p.color * PALETTES.length))]
  const count = Math.round(120 + p.particles * 2600 * (0.4 + p.density))
  const steps = Math.round(30 + p.scale * 120)
  const stepLen = 1.2 + p.scale * 3
  const freq = 0.0008 + p.noise * 0.006
  const cx = w / 2, cy = h / 2
  const rot = p.rotation * Math.PI * 2
  const formF = p.form * (FORMS.length - 1)
  const f0 = Math.floor(formF), f1 = Math.min(FORMS.length - 1, f0 + 1), fm = formF - f0
  const fieldAngle = (form: number, x: number, y: number) => {
    const dx = x - cx, dy = y - cy
    const n = noise(x * freq, y * freq, p.seed * 0.0001) * Math.PI * 2
    switch (form) {
      case 0:
        return n
      case 1:
        return Math.atan2(dy, dx) + Math.PI / 2 + n * 0.25
      case 2:
        return Math.atan2(dy, dx) + n * 0.25
      case 3:
        return Math.round(n / (Math.PI / 2)) * (Math.PI / 2)
      default:
        return Math.atan2(dy, dx) + Math.PI / 2 + 0.35 + n * 0.15
    }
  }
  const paths: Path[] = []
  for (let i = 0; i < count; i++) {
    let x = rng() * w, y = rng() * h
    const pts: [number, number][] = [[x, y]]
    for (let s = 0; s < steps; s++) {
      const a0 = fieldAngle(f0, x, y), a1 = fieldAngle(f1, x, y)
      const a = a0 + Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0)) * fm + rot + (rng() - 0.5) * p.chaos * 2.4
      x += Math.cos(a) * stepLen
      y += Math.sin(a) * stepLen
      if (x < -10 || x > w + 10 || y < -10 || y > h + 10) break
      pts.push([x, y])
    }
    if (pts.length > 2) paths.push({ pts, color: pal.ink[Math.floor(rng() * pal.ink.length)], width: 0.4 + p.scale * 2.4 * (0.3 + rng()), alpha: 0.25 + p.density * 0.7 })
  }
  return { bg: pal.bg, paths }
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

function render(canvas: HTMLCanvasElement, p: Params) {
  const ctx = canvas.getContext('2d')!
  const w = canvas.width, h = canvas.height
  const { bg, paths } = generate(p, w, h)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const path of paths) {
    ctx.strokeStyle = path.color
    ctx.globalAlpha = path.alpha
    ctx.lineWidth = path.width
    ctx.beginPath()
    path.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  if (p.pixelation > 0.01) {
    const f = 1 + Math.round(p.pixelation * 23)
    const small = document.createElement('canvas')
    small.width = Math.max(1, Math.floor(w / f))
    small.height = Math.max(1, Math.floor(h / f))
    const sctx = small.getContext('2d')!
    sctx.drawImage(canvas, 0, 0, small.width, small.height)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(small, 0, 0, w, h)
    ctx.imageSmoothingEnabled = true
  }
  if (p.dither > 0.01) {
    const img = ctx.getImageData(0, 0, w, h)
    const d = img.data
    const cell = 1 + Math.round(p.pixelation * 23)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4
        const l = (0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]) / 255
        const t = BAYER4[(Math.floor(y / cell) % 4) * 4 + (Math.floor(x / cell) % 4)] / 16
        const v = l > t ? 245 : 18
        d[k] = d[k] + (v - d[k]) * p.dither
        d[k + 1] = d[k + 1] + (v - d[k + 1]) * p.dither
        d[k + 2] = d[k + 2] + (v - d[k + 2]) * p.dither
      }
    ctx.putImageData(img, 0, 0)
  }
}

function toSVG(p: Params, w: number, h: number) {
  const { bg, paths } = generate(p, w, h)
  const limited = paths.slice(0, 3500)
  const body = limited
    .map((path) => `<polyline fill="none" stroke="${path.color}" stroke-opacity="${path.alpha.toFixed(2)}" stroke-width="${path.width.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" points="${path.pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}"/>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n<title>ART//EVOLVED — generative composition, seed ${p.seed}</title>\n<rect width="100%" height="100%" fill="${bg}"/>\n${body}\n</svg>`
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const CONTROLS: { key: keyof Omit<Params, 'seed'>; label: string; format?: (v: number) => string }[] = [
  { key: 'chaos', label: 'Chaos' },
  { key: 'form', label: 'Form', format: (v) => FORMS[Math.round(v * (FORMS.length - 1))] },
  { key: 'color', label: 'Colour', format: (v) => PALETTES[Math.min(PALETTES.length - 1, Math.floor(v * PALETTES.length))].name },
  { key: 'density', label: 'Density' },
  { key: 'scale', label: 'Scale' },
  { key: 'rotation', label: 'Rotation', format: (v) => `${Math.round(v * 360)}°` },
  { key: 'noise', label: 'Noise' },
  { key: 'particles', label: 'Particles' },
  { key: 'dither', label: 'Dither' },
  { key: 'pixelation', label: 'Pixelation' },
]

export default function CreateStudio() {
  const setView = useStore((s) => s.setView)
  const device = useStore((s) => s.device)
  const [params, setParams] = useState<Params>(() => ({ ...DEFAULTS, seed: randomSeed() }))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1200, h: 800 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      setSize({ w: Math.floor(e.contentRect.width * dpr), h: Math.floor(e.contentRect.height * dpr) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const id = requestAnimationFrame(() => render(c, params))
    return () => cancelAnimationFrame(id)
  }, [params, size])

  const set = useCallback((k: keyof Params, v: number) => setParams((p) => ({ ...p, [k]: v })), [])
  const randomize = () => {
    const r = mulberry32(randomSeed())
    setParams({ chaos: r(), form: r(), color: r(), density: 0.3 + r() * 0.7, scale: r(), rotation: r() * 0.3, noise: r(), particles: 0.2 + r() * 0.8, dither: r() > 0.75 ? r() : 0, pixelation: r() > 0.8 ? r() * 0.4 : 0, seed: randomSeed() })
  }
  const exportPNG = () => canvasRef.current?.toBlob((b) => b && download(`art-evolved-${params.seed}.png`, b), 'image/png')
  const exportSVG = () => download(`art-evolved-${params.seed}.svg`, new Blob([toSVG(params, size.w, size.h)], { type: 'image/svg+xml' }))
  const palette = useMemo(() => PALETTES[Math.min(PALETTES.length - 1, Math.floor(params.color * PALETTES.length))], [params.color])

  return (
    <div className="fixed inset-0 z-[35] flex flex-col bg-[#0d0d0f] text-[#f2efe8] md:flex-row" role="dialog" aria-label="Create — generative playground">
      <div ref={wrapRef} className="relative min-h-0 flex-1" style={{ background: palette.bg }}>
        <canvas ref={canvasRef} width={size.w} height={size.h} className="absolute inset-0 h-full w-full" role="img" aria-label={`Generative composition, seed ${params.seed}`} />
        <div className="pointer-events-none absolute left-5 top-5 bg-[#0d0d0f]/80 px-3 py-2 font-mono text-[10px] uppercase tracking-museum text-[#f2efe8]/80 md:left-8 md:top-8">
          Seed {params.seed} · {FORMS[Math.round(params.form * (FORMS.length - 1))]} · {palette.name}
        </div>
      </div>
      <aside className={device === 'mobile' ? 'max-h-[46vh] border-t border-white/15' : 'w-[360px] border-l border-white/15'}>
        <ScrollArea className="h-full">
          <div className="px-7 py-7">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-sans text-[9px] uppercase tracking-museum text-white/50">Generative mode</div>
                <h2 className="mt-1 font-sans text-3xl font-semibold uppercase tracking-[-0.02em]">Create</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => setView('timeline')} className="border-white/30 text-[#f2efe8] hover:bg-[#f2efe8] hover:text-[#0d0d0f]">
                ← Museum
              </Button>
            </div>
            <p className="mt-4 font-serif text-[17px] italic leading-snug text-white/70">Particles trace a vector field. You design the field.</p>
            <Separator className="my-6 bg-white/15" />
            <div className="space-y-4">
              {CONTROLS.map((c) => (
                <div key={c.key} className="grid grid-cols-[84px_1fr_62px] items-center gap-3">
                  <span className="font-sans text-[9px] uppercase tracking-museum text-white/55">{c.label}</span>
                  <Slider value={[params[c.key]]} min={0} max={1} step={0.01} onValueChange={([v]) => set(c.key, v)} thumbLabel={c.label} className="[&_.bg-fg]:bg-[#f2efe8] [&_.bg-fg\/25]:bg-white/25" />
                  <span className="truncate text-right font-mono text-[10px] text-white/75">{c.format ? c.format(params[c.key]) : params[c.key].toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-6 bg-white/15" />
            <div className="grid grid-cols-3 gap-2">
              <Button variant="primary" size="sm" onClick={randomize} className="bg-[#f2efe8] text-[#0d0d0f]">
                Randomize
              </Button>
              <Button variant="outline" size="sm" onClick={() => setParams({ ...DEFAULTS, seed: params.seed })} className="border-white/30 text-[#f2efe8]">
                Reset
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="border-white/30 text-[#f2efe8]">
                    Export
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 border-white/20 bg-[#16161a] text-[#f2efe8]">
                  <div className="mb-3 font-sans text-[9px] uppercase tracking-museum text-white/50">Export composition</div>
                  <div className="grid gap-2">
                    <Button variant="outline" size="sm" onClick={exportPNG} className="border-white/30 text-[#f2efe8]">
                      Canvas · PNG
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportSVG} className="border-white/30 text-[#f2efe8]">
                      Vector · SVG
                    </Button>
                  </div>
                  <p className="mt-3 font-mono text-[9px] leading-relaxed text-white/45">SVG keeps the vector paths; dither and pixelation are raster effects and appear in the PNG.</p>
                </PopoverContent>
              </Popover>
            </div>
            <Button variant="ghost" size="sm" className="mt-3 w-full text-white/70" onClick={() => set('seed', randomSeed())}>
              New seed, same parameters
            </Button>
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}
