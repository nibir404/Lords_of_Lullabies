import type { SoundProfile } from '@/data/types'

interface Profile {
  drone: number[]
  wave: OscillatorType
  filter: number
  lfo: number
  noise: number
  noiseFreq: number
  gain: number
  pulse?: { freqs: number[]; every: number; wave: OscillatorType; length: number; level: number; jitter?: number }
  arp?: { scale: number[]; every: number; wave: OscillatorType; level: number; delay: number }
  crackle?: number
}

const PENT_C = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3]
const PENT_F = [174.6, 196, 220, 261.6, 293.7, 349.2, 392, 440]

/** Every era's sound texture is a parameter set for the same small synthesis graph. */
const PROFILES: Record<SoundProfile, Profile> = {
  cave: { drone: [55, 82.4], wave: 'sine', filter: 380, lfo: 0.05, noise: 0.05, noiseFreq: 280, gain: 0.5, crackle: 0.55 },
  stone: { drone: [65.4, 98], wave: 'triangle', filter: 520, lfo: 0.03, noise: 0.03, noiseFreq: 900, gain: 0.4 },
  sacred: { drone: [110, 164.8, 220, 277.2], wave: 'sawtooth', filter: 850, lfo: 0.04, noise: 0.01, noiseFreq: 2000, gain: 0.18 },
  ink: { drone: [196], wave: 'sine', filter: 1200, lfo: 0.02, noise: 0.035, noiseFreq: 1400, gain: 0.25, pulse: { freqs: [784, 1046.5, 1174.7], every: 4200, wave: 'sine', length: 3.5, level: 0.05, jitter: 0.6 } },
  acoustic: { drone: [130.8, 196, 261.6], wave: 'triangle', filter: 1100, lfo: 0.05, noise: 0.01, noiseFreq: 3000, gain: 0.2, arp: { scale: PENT_C, every: 1500, wave: 'triangle', level: 0.05, delay: 0.35 } },
  court: { drone: [73.4, 110, 146.8, 220], wave: 'sawtooth', filter: 650, lfo: 0.08, noise: 0.01, noiseFreq: 1500, gain: 0.2 },
  storm: { drone: [41.2, 61.7], wave: 'sine', filter: 300, lfo: 0.12, noise: 0.14, noiseFreq: 480, gain: 0.5, pulse: { freqs: [36, 42], every: 6000, wave: 'sine', length: 2.4, level: 0.18, jitter: 0.8 } },
  organic: { drone: [174.6, 261.6, 349.2], wave: 'sine', filter: 1600, lfo: 0.06, noise: 0.04, noiseFreq: 2200, gain: 0.22, arp: { scale: PENT_F, every: 2300, wave: 'sine', level: 0.045, delay: 0.5 } },
  turbulent: { drone: [98, 146.8, 185], wave: 'triangle', filter: 900, lfo: 0.3, noise: 0.05, noiseFreq: 700, gain: 0.25, arp: { scale: PENT_F.map((f) => f * 2), every: 650, wave: 'sine', level: 0.03, delay: 0.25 } },
  machine: { drone: [55], wave: 'square', filter: 260, lfo: 0.2, noise: 0.01, noiseFreq: 4000, gain: 0.2, pulse: { freqs: [220, 330, 440], every: 480, wave: 'square', length: 0.06, level: 0.03 } },
  dream: { drone: [155.6, 233.1, 311.1], wave: 'sine', filter: 1400, lfo: 0.03, noise: 0.015, noiseFreq: 3000, gain: 0.24, arp: { scale: [622.3, 698.5, 830.6, 932.3, 1244.5], every: 2600, wave: 'sine', level: 0.03, delay: 0.6 } },
  silence: { drone: [110], wave: 'sine', filter: 400, lfo: 0.01, noise: 0.004, noiseFreq: 1000, gain: 0.08 },
  pop: { drone: [130.8], wave: 'square', filter: 500, lfo: 0.5, noise: 0, noiseFreq: 1000, gain: 0.14, pulse: { freqs: [523.3, 659.3, 784], every: 360, wave: 'square', length: 0.08, level: 0.025 } },
  digital: { drone: [65.4], wave: 'square', filter: 300, lfo: 0.1, noise: 0, noiseFreq: 1000, gain: 0.12, pulse: { freqs: [523.3, 659.3, 784, 1046.5, 784, 659.3], every: 170, wave: 'square', length: 0.07, level: 0.022 } },
  glitch: { drone: [48], wave: 'sawtooth', filter: 400, lfo: 1.2, noise: 0.03, noiseFreq: 6000, gain: 0.16, pulse: { freqs: [180, 1200, 2400, 90, 3600], every: 230, wave: 'sawtooth', length: 0.04, level: 0.03, jitter: 0.9 } },
  generative: { drone: [65.4, 98], wave: 'sine', filter: 700, lfo: 0.07, noise: 0.01, noiseFreq: 2000, gain: 0.22, arp: { scale: PENT_C.concat(PENT_C.map((f) => f * 2)), every: 420, wave: 'sine', level: 0.035, delay: 0.42 } },
  neural: { drone: [87.3, 130.8, 174.6], wave: 'sine', filter: 1000, lfo: 0.09, noise: 0.02, noiseFreq: 2600, gain: 0.22, arp: { scale: [698.5, 880, 1046.5, 1318.5, 1568], every: 560, wave: 'triangle', level: 0.025, delay: 0.55 } },
}

class Layer {
  private nodes: AudioNode[] = []
  private oscs: (OscillatorNode | AudioBufferSourceNode)[] = []
  private timers: number[] = []
  readonly out: GainNode

  constructor(private ctx: AudioContext, destination: AudioNode, private p: Profile, noiseBuffer: AudioBuffer) {
    this.out = ctx.createGain()
    this.out.gain.value = 0
    this.out.connect(destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = p.filter
    filter.Q.value = 0.8
    filter.connect(this.out)
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = p.lfo
    lfoGain.gain.value = p.filter * 0.35
    lfo.connect(lfoGain).connect(filter.frequency)
    lfo.start()
    this.oscs.push(lfo)
    this.nodes.push(filter, lfoGain)

    p.drone.forEach((f, i) => {
      for (const detune of [-6, 7]) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = p.wave
        o.frequency.value = f
        o.detune.value = detune + i * 2
        g.gain.value = 0.12 / p.drone.length
        o.connect(g).connect(filter)
        o.start()
        this.oscs.push(o)
        this.nodes.push(g)
      }
    })

    if (p.noise > 0) {
      const src = ctx.createBufferSource()
      src.buffer = noiseBuffer
      src.loop = true
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = p.noiseFreq
      bp.Q.value = 0.6
      const g = ctx.createGain()
      g.gain.value = p.noise
      src.connect(bp).connect(g).connect(this.out)
      src.start()
      this.oscs.push(src)
      this.nodes.push(bp, g)
    }

    let delayIn: AudioNode = this.out
    if (p.arp) {
      const delay = ctx.createDelay(2)
      delay.delayTime.value = p.arp.delay
      const fb = ctx.createGain()
      fb.gain.value = 0.45
      delay.connect(fb).connect(delay)
      delay.connect(this.out)
      this.nodes.push(delay, fb)
      delayIn = delay
    }
    if (p.pulse) this.schedule(p.pulse.every, p.pulse.jitter ?? 0, () => this.blip(p.pulse!.freqs, p.pulse!.wave, p.pulse!.length, p.pulse!.level, this.out))
    if (p.arp) {
      const arp = p.arp
      this.schedule(arp.every, 0.5, () => this.blip(arp.scale, arp.wave, 1.4, arp.level, delayIn, this.out))
    }
    if (p.crackle) this.schedule(90, 0.9, () => Math.random() < p.crackle! * 0.4 && this.crackle(noiseBuffer))
  }

  private schedule(every: number, jitter: number, fn: () => void) {
    const tick = () => {
      fn()
      this.timers.push(window.setTimeout(tick, every * (1 - jitter / 2 + Math.random() * jitter)))
    }
    this.timers.push(window.setTimeout(tick, every * Math.random()))
  }

  private blip(freqs: number[], wave: OscillatorType, length: number, level: number, ...dest: AudioNode[]) {
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = wave
    o.frequency.value = freqs[Math.floor(Math.random() * freqs.length)]
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(level, t + Math.min(0.02, length * 0.2))
    g.gain.exponentialRampToValueAtTime(0.0001, t + length)
    o.connect(g)
    dest.forEach((d) => g.connect(d))
    o.start(t)
    o.stop(t + length + 0.05)
    o.onended = () => g.disconnect()
  }

  private crackle(buffer: AudioBuffer) {
    const t = this.ctx.currentTime
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const hp = this.ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1800
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.08 * Math.random(), t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    src.connect(hp).connect(g).connect(this.out)
    src.start(t, Math.random() * 1.5, 0.05)
    src.onended = () => g.disconnect()
  }

  fadeTo(level: number, seconds: number) {
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setValueAtTime(this.out.gain.value, t)
    this.out.gain.linearRampToValueAtTime(level, t + seconds)
  }

  fadeIn() {
    this.fadeTo(this.p.gain, 2.5)
  }

  stop(after = 3) {
    this.fadeTo(0, after * 0.8)
    this.timers.forEach((id) => clearTimeout(id))
    this.timers = []
    window.setTimeout(() => {
      this.oscs.forEach((o) => {
        try {
          o.stop()
        } catch {
          /* already stopped */
        }
      })
      this.nodes.forEach((n) => n.disconnect())
      this.out.disconnect()
    }, after * 1000)
  }
}

/** Optional ambient layer; one synthesis graph re-parameterised per era, crossfaded on change. */
export class AmbientEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private layer: Layer | null = null
  private profile: SoundProfile | null = null

  async enable(profile: SoundProfile) {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
      const comp = this.ctx.createDynamicsCompressor()
      comp.connect(this.ctx.destination)
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.master.connect(comp)
      const len = this.ctx.sampleRate * 2
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const d = this.noise.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    }
    await this.ctx.resume()
    const t = this.ctx.currentTime
    this.master!.gain.cancelScheduledValues(t)
    this.master!.gain.linearRampToValueAtTime(0.7, t + 1.5)
    this.profile = null
    this.setProfile(profile)
  }

  disable() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(this.master.gain.value, t)
    this.master.gain.linearRampToValueAtTime(0, t + 0.8)
    this.layer?.stop(1)
    this.layer = null
    this.profile = null
    window.setTimeout(() => this.ctx?.state === 'running' && !this.layer && this.ctx.suspend(), 1200)
  }

  setProfile(profile: SoundProfile) {
    if (!this.ctx || !this.master || !this.noise || this.profile === profile) return
    this.profile = profile
    this.layer?.stop(3)
    this.layer = new Layer(this.ctx, this.master, PROFILES[profile], this.noise)
    this.layer.fadeIn()
  }
}

export const ambient = new AmbientEngine()
