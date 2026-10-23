import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BlackHole, type CameraFrame, type FrameUniforms } from '../gl/BlackHole'
import { drawNamePlate, loadNameFont } from '../gl/nameTexture'
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
  // the homepage's door to SIDS
  sidsDoor: { r: 9.6, az: 4.1, el: 0.42, roll: -0.08, sx: 0.62, sy: 0.05, fov: 1.05, name: 0, dim: 0.34, heat: 0.64 },
  orbit: { r: 6.4, az: 5.45, el: 0.16, roll: 0, sx: 0, sy: 0, fov: 1.2, name: 0, dim: 0.72, heat: 0.84 },
  contact: { r: 3.1, az: 6.1, el: 0.05, roll: 0, sx: 0, sy: 0, fov: 1.5, name: 0, dim: 1, heat: 1 },

  // The SIDS page: a second fall, from the same distance as the first, with its own name on the plate.
  sidsHero: { r: 30, az: 0, el: 0.1, roll: 0, sx: 0, sy: 0.02, fov: 0.95, name: 1, dim: 1, heat: 0.1 },
  sidsWhy: { r: 17, az: 1.2, el: 0.34, roll: -0.1, sx: 0.58, sy: -0.06, fov: 1.0, name: 0, dim: 0.3, heat: 0.4 },
  protocol: { r: 11, az: 2.3, el: 0.3, roll: 0.1, sx: -0.6, sy: 0.32, fov: 1.05, name: 0, dim: 0.2, heat: 0.56 },
  sidsLab: { r: 8.2, az: 3.2, el: 0.62, roll: 0, sx: 0, sy: -0.62, fov: 1.1, name: 0, dim: 0.16, heat: 0.68 },
  sidsNotes: { r: 6.6, az: 4.0, el: -0.2, roll: -0.1, sx: 0.58, sy: 0.22, fov: 1.1, name: 0, dim: 0.24, heat: 0.78 },
  sidsEnd: { r: 3.4, az: 5.0, el: 0.05, roll: 0, sx: 0, sy: 0, fov: 1.45, name: 0, dim: 0.85, heat: 0.95 },
}

const KEYS = Object.keys(FRAMES.hero) as (keyof CameraFrame)[]

/** Where the approach starts, in Schwarzschild radii: the number in the author's GitHub handle. */
export const APPROACH_FROM = 1729

/** Distance along the approach, log-spaced so the hole grows at a steady visual rate. */
export function approachR(e: number) {
  return Math.exp(Math.log(APPROACH_FROM) * (1 - e) + Math.log(FRAMES.hero.r) * e)
}

function approachFrame(e: number, out: CameraFrame) {
  Object.assign(out, FRAMES.hero)
  const k = 1 - e
  out.r = approachR(e)
  out.az = FRAMES.hero.az - 0.42 * k
  out.el = FRAMES.hero.el + 0.22 * k
  out.roll = 0.1 * k
  out.name = 0
  return out
}

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
  /** 0..1 along the opening approach, driven by the loader. */
  approach: 0,
  sky: 0,
  frame: { ...FRAMES.hero } as CameraFrame,
  gamma: 1,
  outside: 0,
  proper: 0,
  stretch: 0,
  webgl: true,
  plunge: 0,
  accent: [236, 230, 219] as [number, number, number],
  debugFrame: null as CameraFrame | null,
  /** The canvas box in CSS pixels. On phones it is 100lvh, taller than innerHeight. */
  viewW: typeof window !== 'undefined' ? window.innerWidth : 1,
  viewH: typeof window !== 'undefined' ? window.innerHeight : 1,
}

type Listener = (dt: number) => void
const listeners = new Set<Listener>()
const warned = new WeakSet<Listener>()
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

/** After an in-page jump, move keyboard focus to the section's heading so the next Tab starts there. */
export function focusTarget(target: string | number) {
  const sec = typeof target === 'number' ? document.getElementById('top') : document.querySelector<HTMLElement>(target)
  if (!sec) return
  const id = sec.getAttribute('aria-labelledby')
  const h = (id ? document.getElementById(id) : null) ?? sec.querySelector<HTMLElement>('h1, h2')
  if (!h) return
  if (!h.hasAttribute('tabindex')) h.tabIndex = -1
  h.focus({ preventScroll: true })
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

export type Engine = { destroy: () => void; renderer: BlackHole | null; replate: () => void }

export type EngineOptions = {
  /** The word on the plate behind the hole: the author's first name unless a page names itself. */
  name?: string
}

export function startEngine(canvas: HTMLCanvasElement | null, opts: EngineOptions = {}): Engine {
  const root = document.documentElement
  let renderer: BlackHole | null = null

  const measure = () => {
    state.viewW = canvas?.clientWidth || window.innerWidth
    state.viewH = canvas?.clientHeight || window.innerHeight
  }
  measure()

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
  let portrait = state.viewW / state.viewH < 0.9
  const plate = () => {
    if (!renderer) return
    const p = drawNamePlate(opts.name ?? brand.first, portrait)
    renderer.setName(p.canvas, p.halfW, p.halfH, p.z, p.y)
  }
  plate()
  loadNameFont().then(plate, () => {})

  // resolution adapts to how fast this GPU actually is
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let quality = state.touch ? 0.5 : 0.62
  const maxQuality = state.touch ? 0.75 : 0.9
  if (renderer) renderer.steps = state.touch ? 130 : 170
  // Resizing a canvas wipes it. Outside the frame loop (window or toolbar
  // resizes) the last frame is drawn again at once, so no empty frame is shown.
  let lastFrame: { f: CameraFrame; u: FrameUniforms } | null = null
  const applyScale = (redraw = true) => {
    const changed = renderer?.resize(forcedQuality ?? Math.max(0.3, Math.min(1.4, quality * dpr)))
    if (changed && redraw && lastFrame && renderer && !renderer.lost) renderer.render(lastFrame.f, lastFrame.u)
  }
  applyScale()

  if (!state.reduced) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    lenis.stop()
  }

  const fitCanvas = () => {
    measure()
    const nowPortrait = state.viewW / state.viewH < 0.9
    if (nowPortrait !== portrait) {
      portrait = nowPortrait
      plate()
    }
    applyScale()
  }
  const onResize = () => {
    fitCanvas()
    computeAnchors()
  }
  window.addEventListener('resize', onResize)
  const ro = new ResizeObserver(() => {
    computeAnchors()
    ScrollTrigger.refresh()
  })
  ro.observe(document.body)
  // the canvas box can change on its own when a phone's toolbar comes and goes
  const cro = new ResizeObserver(fitCanvas)
  if (canvas) cro.observe(canvas)
  computeAnchors()

  // sections that stretch with scroll speed; written per element, only on change
  let tidals = document.querySelectorAll<HTMLElement>('.tidal')
  let lastStretch = ''

  const onMove = (e: PointerEvent) => {
    state.mouse.x = e.clientX
    state.mouse.y = e.clientY
    state.mouse.nx = (e.clientX / window.innerWidth) * 2 - 1
    state.mouse.ny = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  // Frame time, smoothed, against the display's own refresh interval, so a
  // 60 Hz screen can climb back up and a 120 Hz one isn't judged by 60 Hz rules.
  let ema = 16.7
  let base = 16.7 // tracks the low end of the frame times: falls fast, rises slowly
  let ceiling = maxQuality
  let lastUp = false
  // a verdict has to hold for two checks in a row before the resolution moves
  let slowRuns = 0
  let fastRuns = 0
  let sinceAdjust = 0
  let lastAccent = ''
  let hudClock = 0
  let lastKey = ''
  let lostFor = 0
  const start = performance.now()
  const onVisibility = () => {
    // the first frame back from a hidden tab is a stall, not a slow GPU
    ema = base
    sinceAdjust = 0
  }
  document.addEventListener('visibilitychange', onVisibility)
  const fallBack = () => {
    state.webgl = false
    root.classList.add('no-webgl')
  }

  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs, 100) / 1000
    if (lenis) lenis.raf(performance.now())

    state.scrollY = lenis ? lenis.animatedScroll : window.scrollY
    const v = lenis ? lenis.velocity : 0
    state.velocity += (v - state.velocity) * 0.2

    // camera
    const f = state.frame
    if (state.debugFrame) Object.assign(f, state.debugFrame)
    else if (!state.ready) approachFrame(state.reduced ? 1 : state.approach, f)
    else frameAt(state.scrollY, f)
    // stars come up as the approach starts; the name only once the disk has lit it
    state.sky = state.ready ? 1 : Math.min(1, (state.reduced ? 1 : state.approach) * 6)
    if (state.plunge > 0.0001) {
      // the last few metres: straight down toward the horizon
      f.r += (1.03 - f.r) * state.plunge
      f.fov += (1.9 - f.fov) * state.plunge
    }
    const m = state.mouse
    if (!state.reduced) {
      m.sx += (m.nx - m.sx) * 0.05
      m.sy += (m.ny - m.sy) * 0.05
    }
    const aspect = state.viewW / state.viewH
    const drawn = { ...f }
    drawn.name *= Math.min(1, Math.max(0, (state.intro - 0.3) / 0.6))
    drawn.az += m.sx * 0.1
    drawn.el -= m.sy * 0.045
    drawn.sx *= Math.min(1, Math.max(0.3, aspect / 1.78))
    if (aspect < 0.9) {
      drawn.fov = f.fov * 1.25
      // on a phone the name sits above the hole and the words below it
      drawn.sy += 0.04 * f.name
      // the stacked name sits right where the first words scroll in, so it leaves sooner
      drawn.name *= f.name * f.name
      // Phones stack the words full width over the hole, so away from the opening and the end
      // the hole stays centred, smaller and dimmer: a backdrop, never half cut off by an edge.
      const calm = Math.max(0, 1 - f.name * 2) * Math.max(0, 1 - Math.max(0, f.heat - 0.84) * 6)
      drawn.sx *= 1 - calm
      drawn.sy += (0.06 - drawn.sy) * calm
      drawn.r *= 1 + 0.3 * calm
      drawn.dim *= 1 - 0.45 * calm
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
    const st = state.stretch.toFixed(3)
    if (st !== lastStretch) {
      lastStretch = st
      if (tidals.length && !tidals[0].isConnected) tidals = document.querySelectorAll<HTMLElement>('.tidal')
      tidals.forEach((el) => el.style.setProperty('--stretch', st))
    }

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

    if (renderer && state.webgl) {
      // a context that stays lost for a few seconds isn't coming back
      lostFor = renderer.lost ? lostFor + dt : 0
      if (lostFor > 4) fallBack()
    }

    // The approach plays behind the loader, so this always draws; with reduced
    // motion, only frames that changed.
    if (renderer && state.webgl && !renderer.lost) {
      const lensOn = !state.touch && state.ready && !state.reduced ? 1 : 0
      const mx = (m.x - state.viewW / 2) / state.viewH
      const my = -(m.y - state.viewH / 2) / state.viewH
      const time = state.reduced ? 12 : (performance.now() - start) / 1000
      let draw = true
      if (state.reduced) {
        const key = [drawn.r, drawn.az, drawn.el, drawn.sx, drawn.sy, drawn.fov, drawn.name, drawn.dim, drawn.heat, state.lock, state.flash, state.intro, state.sky, canvas!.width, canvas!.height]
          .map((v) => v.toFixed(4))
          .join()
        draw = key !== lastKey
        lastKey = key
      }
      // Resolution is settled before drawing: a resize after the draw would
      // wipe the frame just drawn and put a black one on screen.
      // Stalls (a hidden tab, a long task) and frames with nothing to draw say nothing about the GPU.
      if (draw && deltaMs < 100) {
        const d = Math.min(Math.max(deltaMs, 4), 50)
        base += (d - base) * (d < base ? 0.1 : 0.002)
        ema += (d - ema) * 0.05
      }
      sinceAdjust += dt
      if (sinceAdjust > 1 && forcedQuality === null) {
        sinceAdjust = 0
        const slow = ema > Math.max(24, base * 1.6) && quality > 0.3
        // never step up mid-scroll, when frame times are noisiest
        const fast = ema < base * 1.2 && quality < ceiling && Math.abs(state.velocity) < 2
        slowRuns = slow ? slowRuns + 1 : 0
        fastRuns = fast ? fastRuns + 1 : 0
        if (slowRuns >= 2) {
          // a step up that immediately costs frames becomes the ceiling
          if (lastUp) ceiling = Math.max(0.3, quality / 1.06)
          quality *= 0.85
          lastUp = false
          slowRuns = 0
          applyScale(false)
          draw = true
        } else if (fastRuns >= 2) {
          quality = Math.min(ceiling, quality * 1.06)
          lastUp = true
          fastRuns = 0
          applyScale(false)
          draw = true
        } else if (!slow && !fast) lastUp = false
      }
      if (draw) {
        const u = { time, mouse: [mx, my, 0.0011 * lensOn] as [number, number, number], lock: state.lock, intro: state.intro, flash: state.flash, sky: state.sky }
        renderer.render(drawn, u)
        lastFrame = { f: drawn, u }
      }
    }

    audio.update(state.gamma, Math.abs(state.velocity), state.lock)
    // one broken listener must not take the others down with it
    listeners.forEach((fn) => {
      try {
        fn(dt)
      } catch (err) {
        if (!warned.has(fn)) {
          warned.add(fn)
          console.error(err)
        }
      }
    })
  }

  gsap.ticker.lagSmoothing(0)
  gsap.ticker.add(tick)

  return {
    renderer,
    replate: plate,
    destroy() {
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
      ro.disconnect()
      cro.disconnect()
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
