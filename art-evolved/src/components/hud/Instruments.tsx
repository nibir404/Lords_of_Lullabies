import type { ReactNode } from 'react'
import type { Instrument, Movement } from '@/data/types'
import { useStore, type Instruments as InstrumentState } from '@/state/store'
import { GEN_SYSTEMS } from '@/data/generative'
import { CHARSETS } from '@/components/3d/glyphs'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { randomSeed } from '@/utils/random'
import { AI_STAGES } from '@/utils/formations'
import { world } from '@/state/world'
import { useWorldValue } from '@/hooks/useWorldValue'
import { cn } from '@/lib/utils'

function Control({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="grid grid-cols-[96px_1fr_44px] items-center gap-3">
      <span className="font-sans text-[9px] uppercase tracking-museum text-muted">{label}</span>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} thumbLabel={label} />
      <span className="text-right font-mono text-[10px] tabular-nums text-fg/80">{format ? format(value) : value.toFixed(2)}</span>
    </div>
  )
}

function Frame({ title, children, onReset }: { title: string; children: ReactNode; onReset?: () => void }) {
  return (
    <div className="panel-section border-t border-fg/15 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="panel-heading font-sans text-[10px] font-medium uppercase tracking-museum text-accent">{title}</h3>
        {onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

const DITHER_STAGES = ['Full colour', 'Grayscale', 'Dither', 'Halftone', 'Pixel']

/** Real-time controls for chambers whose visual language is parametric. */
export function Instruments({ instrument }: { instrument: Instrument }) {
  const ins = useStore((s) => s.instruments)
  const set = useStore((s) => s.setInstrument)
  const reset = useStore((s) => s.resetInstrument)
  const patch = <K extends keyof InstrumentState>(k: K) => (p: Partial<InstrumentState[K]>) => set(k, p)

  switch (instrument) {
    case 'abstract': {
      const a = ins.abstract
      const p = patch('abstract')
      return (
        <Frame title="Instrument · Abstract field" onReset={() => reset('abstract')}>
          <Control label="Form" value={a.form} min={0} max={1} step={0.01} onChange={(v) => p({ form: v })} format={(v) => ['Sphere', 'Cube', 'Torus'][Math.round(v * 2)]} />
          <Control label="Density" value={a.density} min={0.05} max={1} step={0.01} onChange={(v) => p({ density: v })} />
          <Control label="Chaos" value={a.chaos} min={0} max={1} step={0.01} onChange={(v) => p({ chaos: v })} />
          <Control label="Colour" value={a.color} min={0} max={1} step={0.01} onChange={(v) => p({ color: v })} />
          <Control label="Movement" value={a.movement} min={0} max={1} step={0.01} onChange={(v) => p({ movement: v })} />
          <Control label="Scale" value={a.scale} min={0} max={1} step={0.01} onChange={(v) => p({ scale: v })} />
        </Frame>
      )
    }
    case 'pixel': {
      const a = ins.pixel
      const p = patch('pixel')
      return (
        <Frame title="Instrument · Pixel engine" onReset={() => reset('pixel')}>
          <Control label="Pixel size" value={a.pixelSize} min={2} max={24} step={1} onChange={(v) => p({ pixelSize: v })} format={(v) => `${v}px`} />
          <Control label="Colour limit" value={a.colorLimit} min={2} max={16} step={1} onChange={(v) => p({ colorLimit: v })} format={(v) => String(v)} />
          <Control label="Dither" value={a.dither} min={0} max={1.5} step={0.01} onChange={(v) => p({ dither: v })} />
          <Control label="Noise" value={a.noise} min={0} max={0.6} step={0.01} onChange={(v) => p({ noise: v })} />
        </Frame>
      )
    }
    case 'ascii': {
      const a = ins.ascii
      const p = patch('ascii')
      return (
        <Frame title="Instrument · ASCII renderer" onReset={() => reset('ascii')}>
          <div className="grid grid-cols-[96px_1fr] items-center gap-3">
            <span className="font-sans text-[9px] uppercase tracking-museum text-muted">Character set</span>
            <Tabs value={String(a.charset)} onValueChange={(v) => p({ charset: Number(v) })}>
              <TabsList className="gap-3">
                {CHARSETS.map((c, i) => (
                  <TabsTrigger key={c.name} value={String(i)}>
                    {c.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="font-mono text-[11px] tracking-[0.3em] text-fg/70" aria-hidden>
            {CHARSETS[a.charset].chars}
          </div>
          <Control label="Density" value={a.density} min={6} max={24} step={1} onChange={(v) => p({ density: v })} format={(v) => `${v}px`} />
          <Control label="Contrast" value={a.contrast} min={0.5} max={3} step={0.01} onChange={(v) => p({ contrast: v })} />
          <Control label="Mono scale" value={a.scale} min={0.6} max={2} step={0.01} onChange={(v) => p({ scale: v })} />
        </Frame>
      )
    }
    case 'dither': {
      const a = ins.dither
      const p = patch('dither')
      return (
        <Frame title="Instrument · Dither engine" onReset={() => reset('dither')}>
          <div className="flex justify-between font-sans text-[8px] uppercase tracking-[0.14em] text-muted" aria-hidden>
            {DITHER_STAGES.map((s, i) => (
              <span key={s} className={cn(Math.round(a.stage) === i && 'text-accent')}>
                {s}
              </span>
            ))}
          </div>
          <Slider value={[a.stage]} min={0} max={4} step={0.01} onValueChange={([v]) => p({ stage: v })} thumbLabel="Dither stage" />
          <Control label="Threshold" value={a.threshold} min={0.1} max={0.9} step={0.01} onChange={(v) => p({ threshold: v })} />
          <div className="grid grid-cols-[96px_1fr] items-center gap-3">
            <span className="font-sans text-[9px] uppercase tracking-museum text-muted">Pattern</span>
            <Tabs value={String(a.pattern)} onValueChange={(v) => p({ pattern: Number(v) })}>
              <TabsList>
                <TabsTrigger value="0">Bayer 8×8</TabsTrigger>
                <TabsTrigger value="1">Error-diffusion-like</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Frame>
      )
    }
    case 'glitch': {
      const a = ins.glitch
      const p = patch('glitch')
      return (
        <Frame title="Instrument · Controlled breakdown" onReset={() => reset('glitch')}>
          <Control label="Intensity" value={a.intensity} min={0} max={1} step={0.01} onChange={(v) => p({ intensity: v })} />
          <Control label="Frame tear" value={a.tear} min={0} max={1} step={0.01} onChange={(v) => p({ tear: v })} />
          <Control label="Pixel sort" value={a.sort} min={0} max={1} step={0.01} onChange={(v) => p({ sort: v })} />
        </Frame>
      )
    }
    case 'generative': {
      const a = ins.generative
      const p = patch('generative')
      const sys = GEN_SYSTEMS.find((s) => s.id === a.system)
      return (
        <Frame title="Laboratory · Generative system" onReset={() => reset('generative')}>
          <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="System">
            {GEN_SYSTEMS.map((s) => (
              <button
                key={s.id}
                role="radio"
                aria-checked={a.system === s.id}
                onClick={() => p({ system: s.id })}
                className={cn('border px-2 py-1.5 text-left font-sans text-[9px] uppercase tracking-[0.12em] transition-colors duration-300', a.system === s.id ? 'border-fg bg-fg text-bg' : 'border-fg/15 text-fg/70 hover:border-fg/50')}
              >
                {s.label}
              </button>
            ))}
          </div>
          {sys && <p className="font-serif text-[15px] italic leading-snug text-fg/75">{sys.note}</p>}
          <div className="flex items-center justify-between border border-fg/15 px-3 py-2 font-mono text-[10px]">
            <span className="text-muted">SEED</span>
            <span className="tabular-nums">{a.seed}</span>
            <Button variant="ghost" size="sm" onClick={() => p({ seed: randomSeed() })}>
              Regenerate
            </Button>
          </div>
          <Control label="Chaos" value={a.chaos} min={0} max={1} step={0.01} onChange={(v) => p({ chaos: v })} />
          <Control label="Iterations" value={a.iterations} min={0} max={1} step={0.01} onChange={(v) => p({ iterations: v })} />
          <Control label="Density" value={a.density} min={0} max={1} step={0.01} onChange={(v) => p({ density: v })} />
          <Control label="Scale" value={a.scale} min={0} max={1} step={0.01} onChange={(v) => p({ scale: v })} />
          <Control label="Colour" value={a.color} min={0} max={1} step={0.01} onChange={(v) => p({ color: v })} />
          <Control label="Symmetry" value={a.symmetry} min={0} max={1} step={0.01} onChange={(v) => p({ symmetry: v })} format={(v) => (v < 0.2 ? 'None' : `${Math.floor(v * 10)}-fold`)} />
        </Frame>
      )
    }
  }
}

/** For the AI chamber: which stage of the human → machine progression is on screen. */
export function AIStages({ movement }: { movement: Movement }) {
  const p = useWorldValue(() => world.autoStage[movement.id] ?? 0, 6)
  const stage = Math.round(p) % AI_STAGES.length
  return (
    <Frame title="Human → Algorithm → Machine">
      <ol className="space-y-1.5">
        {AI_STAGES.map((s, i) => (
          <li key={s} className={cn('flex items-baseline gap-3 font-sans text-[11px] uppercase tracking-[0.14em] transition-colors duration-500', i === stage ? 'text-fg' : 'text-fg/35')}>
            <span className="font-mono text-[9px]">{String(i + 1).padStart(2, '0')}</span>
            {s}
            {i === stage && <span className="ml-auto h-px w-10 bg-accent" />}
          </li>
        ))}
      </ol>
    </Frame>
  )
}
