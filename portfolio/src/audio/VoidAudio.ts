// Everything you hear is synthesized live. No audio files.
// The drone is redshifted with you: its pitch and brightness fall as the
// time-dilation factor the HUD shows rises.

const SCALE = [146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 349.23] // D minor pentatonic-ish

function impulse(ctx: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function brownNoise(ctx: AudioContext, seconds: number) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    d[i] = last * 3.5
  }
  return buf
}

export class VoidAudio {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private ducker!: GainNode
  private verb!: GainNode
  private filter!: BiquadFilterNode
  private oscs: OscillatorNode[] = []
  private ratios = [0.5, 1, 1.5, 2.003]
  private wind!: GainNode
  private windFilter!: BiquadFilterNode
  enabled = false
  private listeners = new Set<(on: boolean) => void>()

  private build() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    this.ctx = ctx
    // nothing plays in a hidden tab; it picks up again on return if sound is on
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void ctx.suspend()
      else if (this.enabled) void ctx.resume()
    })

    this.master = ctx.createGain()
    this.master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    // a second gain after the master, so ducking never fights the on/off fades
    this.ducker = ctx.createGain()
    this.master.connect(this.ducker).connect(comp).connect(ctx.destination)

    const conv = ctx.createConvolver()
    conv.buffer = impulse(ctx, 4.5, 2.6)
    this.verb = ctx.createGain()
    this.verb.gain.value = 0.55
    this.verb.connect(conv).connect(this.master)

    this.filter = ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = 420
    this.filter.Q.value = 0.9
    const drone = ctx.createGain()
    drone.gain.value = 0.16
    this.filter.connect(drone)
    drone.connect(this.master)
    drone.connect(this.verb)

    const levels = [0.55, 0.4, 0.16, 0.08]
    this.ratios.forEach((ratio, i) => {
      const o = ctx.createOscillator()
      o.type = i === 3 ? 'triangle' : 'sine'
      o.frequency.value = 73.42 * ratio
      const g = ctx.createGain()
      g.gain.value = levels[i]
      o.connect(g).connect(this.filter)
      o.start()
      this.oscs.push(o)
    })

    // slow breathing on the filter and the level
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.06
    const lfoAmt = ctx.createGain()
    lfoAmt.gain.value = 160
    lfo.connect(lfoAmt).connect(this.filter.frequency)
    lfo.start()
    const breath = ctx.createOscillator()
    breath.frequency.value = 0.11
    const breathAmt = ctx.createGain()
    breathAmt.gain.value = 0.05
    breath.connect(breathAmt).connect(drone.gain)
    breath.start()

    // wind that rises with scroll speed
    const noise = ctx.createBufferSource()
    noise.buffer = brownNoise(ctx, 3)
    noise.loop = true
    this.windFilter = ctx.createBiquadFilter()
    this.windFilter.type = 'bandpass'
    this.windFilter.frequency.value = 380
    this.windFilter.Q.value = 0.7
    this.wind = ctx.createGain()
    this.wind.gain.value = 0.02
    noise.connect(this.windFilter).connect(this.wind)
    this.wind.connect(this.master)
    this.wind.connect(this.verb)
    noise.start()
  }

  /** Must be called from a user gesture. */
  setEnabled(on: boolean) {
    if (on && !this.ctx) this.build()
    if (!this.ctx) return
    if (on) void this.ctx.resume()
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(this.master.gain.value, t)
    this.master.gain.linearRampToValueAtTime(on ? 0.9 : 0, t + (on ? 2.5 : 0.6))
    this.enabled = on
    if (!on) {
      // once the fade is done, stop the graph rather than synthesizing silence
      const ctx = this.ctx
      window.setTimeout(() => {
        if (!this.enabled && ctx.state === 'running') void ctx.suspend()
      }, 700)
    }
    this.listeners.forEach((fn) => fn(on))
  }

  toggle() {
    this.setEnabled(!this.enabled)
  }

  /** Lower everything synthesized here while a voice clip plays over it. */
  duck(on: boolean) {
    if (!this.ctx) return
    this.ducker.gain.setTargetAtTime(on ? 0.3 : 1, this.ctx.currentTime, on ? 0.08 : 0.35)
  }

  subscribe(fn: (on: boolean) => void) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  /** gamma: time-dilation factor. speed: absolute scroll velocity. */
  update(gamma: number, speed: number, lock: number) {
    if (!this.ctx || !this.enabled) return
    const t = this.ctx.currentTime
    const base = 73.42 / Math.pow(gamma, 0.55)
    this.oscs.forEach((o, i) => o.frequency.setTargetAtTime(base * this.ratios[i], t, 0.4))
    const cutoff = 520 / Math.pow(gamma, 0.8) + lock * 260
    this.filter.frequency.setTargetAtTime(cutoff, t, 0.3)
    this.wind.gain.setTargetAtTime(0.02 + Math.min(speed / 60, 1) * 0.12, t, 0.15)
    this.windFilter.frequency.setTargetAtTime(300 + Math.min(speed / 60, 1) * 600, t, 0.2)
  }

  blip(index = 0) {
    if (!this.ctx || !this.enabled) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = SCALE[Math.abs(index) % SCALE.length] * 2
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.035, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 2200
    o.connect(f).connect(g)
    g.connect(this.master)
    g.connect(this.verb)
    o.start(t)
    o.stop(t + 0.75)
  }

  /** Low hit for lock-in. */
  thump() {
    if (!this.ctx || !this.enabled) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(140, t)
    o.frequency.exponentialRampToValueAtTime(38, t + 0.5)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.5, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    o.connect(g)
    g.connect(this.master)
    g.connect(this.verb)
    o.start(t)
    o.stop(t + 1)
  }

  /** A swell that is cut off: something crossed the horizon. */
  swallow() {
    if (!this.ctx || !this.enabled) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = brownNoise(ctx, 2)
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 2
    f.frequency.setValueAtTime(1800, t)
    f.frequency.exponentialRampToValueAtTime(90, t + 1.6)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.5, t + 1.4)
    g.gain.setValueAtTime(0.0001, t + 1.55)
    src.connect(f).connect(g)
    g.connect(this.master)
    g.connect(this.verb)
    src.start(t)
    src.stop(t + 2)
  }
}

export const audio = new VoidAudio()
