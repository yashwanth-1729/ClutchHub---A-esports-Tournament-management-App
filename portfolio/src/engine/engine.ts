import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BlackHole, type CameraFrame } from '../gl/BlackHole'
import { NAME_FONT, drawNamePlate } from '../gl/nameTexture'
import { audio } from '../audio/VoidAudio'
import { brand } from '../content'

gsap.registerPlugin(ScrollTrigger)

// Camera framing per section. r is distance from the singularity in
// Schwarzschild radii, so the HUD readouts are the real numbers.
export const FRAMES: Record<string, CameraFrame> = {
  hero: { r: 30, az: 0, el: 0.1, roll: 0, sx: 0, sy: 0.02, fov: 0.95, name: 1, dim: 1, heat: 0 },
  about: { r: 24, az: 0.55, el: 0.32, roll: -0.12, sx: 0.46, sy: -0.04, fov: 0.9, name: 0, dim: 0.7, heat: 0.12 },
  work: { r: 20, az: 1.05, el: -0.08, roll: 0.08, sx: 0, sy: 0.34, fov: 0.95, name: 0, dim: 0.65, heat: 0.2 },
  jarvis: { r: 17, az: 1.6, el: 0.2, roll: 0.14, sx: -0.62, sy: -0.24, fov: 0.95, name: 0, dim: 0.3, heat: 0.28 },
  hospital: { r: 14.5, az: 2.3, el: -0.16, roll: -0.1, sx: 0.62, sy: 0.26, fov: 0.95, name: 0, dim: 0.3, heat: 0.38 },
  clutchhub: { r: 12.5, az: 3.0, el: 0.22, roll: 0.12, sx: -0.6, sy: 0.24, fov: 1.0, name: 0, dim: 0.3, heat: 0.48 },
  sldt: { r: 10.5, az: 3.75, el: -0.18, roll: -0.14, sx: 0.6, sy: -0.26, fov: 1.05, name: 0, dim: 0.3, heat: 0.58 },
  sldtIntro: { r: 9.6, az: 4.1, el: 0.42, roll: -0.08, sx: 0.62, sy: 0.05, fov: 1.05, name: 0, dim: 0.34, heat: 0.64 },
  protocol: { r: 8.8, az: 4.4, el: 0.3, roll: 0.1, sx: -0.6, sy: 0.32, fov: 1.05, name: 0, dim: 0.2, heat: 0.68 },
  sldtLab: { r: 8.2, az: 4.7, el: 0.62, roll: 0, sx: 0, sy: -0.62, fov: 1.1, name: 0, dim: 0.16, heat: 0.72 },
  sldtNotes: { r: 7.6, az: 5.0, el: -0.2, roll: -0.1, sx: 0.58, sy: 0.22, fov: 1.1, name: 0, dim: 0.24, heat: 0.76 },
  orbit: { r: 6.4, az: 5.45, el: 0.16, roll: 0, sx: 0, sy: 0, fov: 1.2, name: 0, dim: 0.72, heat: 0.84 },
  contact: { r: 3.1, az: 6.1, el: 0.05, roll: 0, sx: 0, sy: 0, fov: 1.5, name: 0, dim: 1, heat: 1 },
}

const KEYS = Object.keys(FRAMES.hero) as (keyof CameraFrame)[]

export const state = {
  ready: false,
  reduced: typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  touch: typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches,
  scrollY: 0,
  maxScroll: 1,
  velocity: 0,
  mouse: { x: 0, y: 0, nx: 0, ny: 0, sx: 0, sy: 0 },
  lock: 0,
  lockTarget: 0,
  flash: 0,
  intro: 0,
  frame: { ...FRAMES.hero } as CameraFrame,
  gamma: 1,
  outside: 0,
  proper: 0,
  stretch: 0,
  webgl: true,
  plunge: 0,
  accent: [236, 230, 219] as [number, number, number],
  debugFrame: null as CameraFrame | null,
}

type Listener = (dt: number) => void
const listeners = new Set<Listener>()
export function onFrame(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

let lenis: Lenis | null = null
type Anchor = { key: string; y: number; frame: CameraFrame }
let anchors: Anchor[] = []
const anchorListeners = new Set<(a: Anchor[]) => void>()

/** Section positions along the fall, for the depth gauge. */
export function onAnchors(fn: (a: Anchor[]) => void) {
  anchorListeners.add(fn)
  fn(anchors)
  return () => {
    anchorListeners.delete(fn)
  }
}

export function getLenis() {
  return lenis
}

export function scrollToTarget(target: string | number | HTMLElement, duration = 2.4) {
  if (lenis) lenis.scrollTo(target, { duration, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'auto' })
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView()
  }
}

function computeAnchors() {
  const vh = window.innerHeight
  state.maxScroll = Math.max(1, document.documentElement.scrollHeight - vh)
  const sy = lenis ? lenis.scroll : window.scrollY
  anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-frame]'))
    .map((el) => {
      const top = el.getBoundingClientRect().top + sy
      const y = Math.min(state.maxScroll, Math.max(0, top + (el.offsetHeight - vh) / 2))
      const key = el.dataset.frame!
      return { key, y, frame: FRAMES[key] ?? FRAMES.hero }
    })
    .sort((a, b) => a.y - b.y)
  if (anchors.length) anchors[anchors.length - 1].y = Math.max(anchors[anchors.length - 1].y, state.maxScroll)
  anchorListeners.forEach((fn) => fn(anchors))
}

function frameAt(y: number, out: CameraFrame) {
  if (!anchors.length) return Object.assign(out, FRAMES.hero)
  if (y <= anchors[0].y) return Object.assign(out, anchors[0].frame)
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]
    const b = anchors[i + 1]
    if (y <= b.y) {
      const t = b.y > a.y ? (y - a.y) / (b.y - a.y) : 1
      const e = t * t * (3 - 2 * t)
      for (const k of KEYS) out[k] = a.frame[k] + (b.frame[k] - a.frame[k]) * e
      return out
    }
  }
  return Object.assign(out, anchors[anchors.length - 1].frame)
}

// The accent is the colour of the disk's light at the current depth: it
// redshifts from white to orange as you fall, and goes red when locked in.
const heatStops = [
  [244, 236, 222], // seen from far away: near white
  [255, 178, 112],
  [255, 128, 64], // deep: sodium orange
  [255, 52, 34], // lock-in red
]
function accentFor(heat: number, lock: number) {
  const x = Math.min(0.999, Math.max(0, heat)) * (heatStops.length - 2)
  const i = Math.floor(x)
  const t = x - i
  const c = heatStops[i].map((v, k) => v + (heatStops[i + 1][k] - v) * t)
  const red = heatStops[3]
  return c.map((v, k) => Math.round(v + (red[k] - v) * lock))
}

let forcedQuality: number | null = null
/** For capturing stills: pin the render scale and stop adapting it. */
export function forceQuality(q: number | null) {
  forcedQuality = q
  window.dispatchEvent(new Event('resize'))
}

export type Engine = { destroy: () => void; renderer: BlackHole | null }

export function startEngine(canvas: HTMLCanvasElement | null): Engine {
  const root = document.documentElement
  let renderer: BlackHole | null = null

  if (canvas && BlackHole.supported()) {
    try {
      renderer = new BlackHole(canvas)
    } catch (err) {
      console.warn('[void] falling back to static background', err)
      renderer = null
    }
  }
  state.webgl = !!renderer
  root.classList.toggle('no-webgl', !renderer)

  // name plate: redraw when fonts land and when orientation flips
  let portrait = window.innerWidth / window.innerHeight < 0.9
  const plate = () => {
    if (!renderer) return
    const p = drawNamePlate(brand.first, portrait)
    renderer.setName(p.canvas, p.halfW, p.halfH, p.z)
  }
  plate()
  document.fonts?.load(`italic 400 100px ${NAME_FONT}`).then(plate, () => {})

  // resolution adapts to how fast this GPU actually is
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let quality = state.touch ? 0.42 : 0.62
  const maxQuality = state.touch ? 0.6 : 0.9
  if (renderer) renderer.steps = state.touch ? 110 : 170
  const applyScale = () => renderer?.resize(forcedQuality ?? Math.max(0.3, Math.min(1.4, quality * dpr)))
  applyScale()

  if (!state.reduced) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    lenis.stop()
  }

  const onResize = () => {
    const nowPortrait = window.innerWidth / window.innerHeight < 0.9
    if (nowPortrait !== portrait) {
      portrait = nowPortrait
      plate()
    }
    applyScale()
    computeAnchors()
  }
  window.addEventListener('resize', onResize)
  const ro = new ResizeObserver(() => {
    computeAnchors()
    ScrollTrigger.refresh()
  })
  ro.observe(document.body)
  computeAnchors()

  const onMove = (e: PointerEvent) => {
    state.mouse.x = e.clientX
    state.mouse.y = e.clientY
    state.mouse.nx = (e.clientX / window.innerWidth) * 2 - 1
    state.mouse.ny = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  let ema = 16
  let sinceAdjust = 0
  let lastAccent = ''
  let hudClock = 0
  const start = performance.now()

  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 100) / 1000
    if (lenis) lenis.raf(performance.now())

    state.scrollY = lenis ? lenis.animatedScroll : window.scrollY
    const v = lenis ? lenis.velocity : 0
    state.velocity += (v - state.velocity) * 0.2

    // camera
    const f = state.frame
    if (state.debugFrame) Object.assign(f, state.debugFrame)
    else frameAt(state.scrollY, f)
    if (state.plunge > 0.0001) {
      // the last few metres: straight down toward the horizon
      f.r += (1.03 - f.r) * state.plunge
      f.fov += (1.9 - f.fov) * state.plunge
    }
    const m = state.mouse
    m.sx += (m.nx - m.sx) * 0.05
    m.sy += (m.ny - m.sy) * 0.05
    const aspect = window.innerWidth / window.innerHeight
    const drawn = { ...f }
    drawn.az += m.sx * 0.1
    drawn.el -= m.sy * 0.045
    drawn.sx *= Math.min(1, Math.max(0.3, aspect / 1.78))
    if (aspect < 0.9) {
      drawn.fov = f.fov * 1.25
      // on a phone the name needs the top half of the screen to itself
      drawn.sy += 0.17 * f.name
    }

    state.lock += (state.lockTarget - state.lock) * (state.lockTarget > state.lock ? 0.06 : 0.04)
    state.flash *= 0.95
    state.gamma = 1 / Math.sqrt(Math.max(1 - 1 / f.r, 0.0001))
    if (state.ready) {
      state.proper += dt
      state.outside += dt * state.gamma
    }

    // tidal stretch from scroll speed
    const stretch = Math.min(Math.abs(state.velocity) * 0.006, 0.45)
    state.stretch += (stretch - state.stretch) * 0.15
    root.style.setProperty('--stretch', state.stretch.toFixed(3))

    const acc = accentFor(f.heat, state.lock)
    state.accent = acc as [number, number, number]
    const accStr = acc.join(' ')
    if (accStr !== lastAccent) {
      root.style.setProperty('--accent-rgb', accStr)
      lastAccent = accStr
    }
    hudClock += dt
    if (hudClock > 0.25) {
      hudClock = 0
      root.style.setProperty('--lock', state.lock.toFixed(2))
    }

    if (renderer) {
      const lensOn = !state.touch && state.ready ? 1 : 0
      const mx = (m.x - window.innerWidth / 2) / window.innerHeight
      const my = -(m.y - window.innerHeight / 2) / window.innerHeight
      renderer.render(drawn, {
        time: state.reduced ? 12 : (performance.now() - start) / 1000,
        mouse: [mx, my, 0.0011 * lensOn],
        lock: state.lock,
        intro: state.intro,
        flash: state.flash,
      })

      ema += (deltaMs - ema) * 0.05
      sinceAdjust += dt
      if (sinceAdjust > 1 && state.ready && forcedQuality === null) {
        sinceAdjust = 0
        if (ema > 24 && quality > 0.3) {
          quality *= 0.85
          applyScale()
        } else if (ema < 13 && quality < maxQuality) {
          quality = Math.min(maxQuality, quality * 1.06)
          applyScale()
        }
      }
    }

    audio.update(state.gamma, Math.abs(state.velocity), state.lock)
    listeners.forEach((fn) => fn(dt))
  }

  gsap.ticker.lagSmoothing(0)
  gsap.ticker.add(tick)

  return {
    renderer,
    destroy() {
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      ro.disconnect()
      lenis?.destroy()
      lenis = null
      renderer?.dispose()
    },
  }
}

/** Called when the visitor enters: unlock scrolling and ignite. */
export function ignite() {
  state.ready = true
  document.documentElement.classList.add('is-ready')
  lenis?.start()
  computeAnchors()
  gsap.to(state, { intro: 1, duration: state.reduced ? 0.01 : 3.2, ease: 'power2.inOut' })
}

export function refreshAnchors() {
  computeAnchors()
}
