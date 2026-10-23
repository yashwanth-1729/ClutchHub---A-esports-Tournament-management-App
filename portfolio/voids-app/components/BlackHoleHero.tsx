'use client'

import { useEffect, useRef } from 'react'
import { BlackHole, type CameraFrame } from '@/lib/gl/BlackHole'
import { setWebgl } from '@/lib/gl/status'

// The homepage's black hole as the backdrop for the whole talk. It opens with the same fall from
// r = 1729, then the camera moves for each section and falls closer as the argument builds.
// What only VOIDS does: the hole runs cold blue on the slides about general-purpose AI and burns
// warm on the specialist slides, and the lensed name behind it becomes the domain on VOIDS React.
type Shot = CameraFrame & { cool: number; plate?: string }
const F = (o: Partial<Shot>): Shot => ({ r: 20, az: 0, el: 0.1, roll: 0, sx: 0, sy: 0, fov: 0.95, name: 0, dim: 0.3, heat: 0.2, cool: 0, ...o })

const SHOTS: Record<string, Shot> = {
  hero: F({ r: 30, sy: 0.16, name: 1, dim: 1, heat: 0.1, plate: 'VOIDS' }),
  problem: F({ r: 26, az: 0.6, el: 0.32, roll: -0.1, sx: 0.58, sy: -0.06, dim: 0.32, heat: 0, cool: 1 }),
  hypothesis: F({ r: 21, az: 1.1, el: -0.1, roll: 0.08, sx: -0.58, sy: 0.22, dim: 0.3, heat: 0.12, cool: 0.6 }),
  evidence: F({ r: 18, az: 1.6, el: 0.22, roll: 0.12, sx: 0.62, sy: -0.24, dim: 0.28, heat: 0.22, cool: 0.3 }),
  react: F({ r: 15, az: 2.2, el: 0.14, sx: 0.42, sy: -0.3, fov: 1.0, name: 1, dim: 0.26, heat: 0.36, plate: 'REACT' }),
  technology: F({ r: 13.5, az: 2.85, el: -0.2, roll: -0.1, sx: -0.6, sy: 0.26, dim: 0.28, heat: 0.42 }),
  local: F({ r: 12, az: 3.45, el: 0.26, roll: 0.1, sx: 0.62, sy: -0.26, dim: 0.24, heat: 0.48 }),
  infrastructure: F({ r: 11, az: 4.0, el: -0.16, roll: -0.12, sx: -0.62, sy: -0.22, dim: 0.24, heat: 0.54 }),
  economics: F({ r: 10, az: 4.5, el: 0.3, sx: 0.6, sy: 0.26, fov: 1.05, dim: 0.22, heat: 0.6 }),
  savings: F({ r: 9, az: 4.95, el: -0.12, roll: 0.1, sx: -0.6, sy: 0.22, fov: 1.05, dim: 0.24, heat: 0.66 }),
  measured: F({ r: 8, az: 5.35, el: 0.6, sy: -0.62, fov: 1.1, dim: 0.2, heat: 0.72 }),
  commercial: F({ r: 6.6, az: 5.8, el: -0.2, roll: -0.1, sx: 0.58, sy: 0.22, fov: 1.1, dim: 0.24, heat: 0.8 }),
  closing: F({ r: 3.4, az: 6.25, el: 0.05, fov: 1.45, dim: 0.85, heat: 0.95 }),
}
const KEYS = ['r', 'az', 'el', 'roll', 'sx', 'sy', 'fov', 'dim', 'heat', 'cool'] as const

const FROM = 1729
const APPROACH_S = 3.2
const IGNITE_AT = 2.6
const IGNITE_S = 3.2

const FAMILY = 'VOIDS Plate'
let fontLoading: Promise<unknown> | null = null
function loadFont() {
  if (!fontLoading) {
    const face = new FontFace(FAMILY, 'url(/voids/fonts/hubot-wdth.woff2)', { weight: '780', stretch: '125%' })
    document.fonts.add(face)
    fontLoading = face.load()
  }
  return fontLoading
}

/** A word, white on black, sized for the plane the shader places behind the hole. */
function plate(text: string, portrait: boolean) {
  const W = portrait ? 1400 : 2400
  const lineH = portrait ? 480 : 420
  const H = lineH + (portrait ? 80 : 60)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  let size = lineH
  ctx.font = `780 ${size}px "${FAMILY}", "Hubot Sans Variable", sans-serif`
  size *= Math.min(1, (W * 0.94) / ctx.measureText(text).width)
  ctx.font = `780 ${size}px "${FAMILY}", "Hubot Sans Variable", sans-serif`
  const cap = ctx.measureText('H').actualBoundingBoxAscent
  ctx.fillText(text, W / 2, H / 2 + cap / 2)
  const halfW = portrait ? 7 : 31
  return { c, halfW, halfH: halfW * (H / W), z: 15, y: portrait ? 8.5 : 0 }
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp = (v: number) => Math.min(1, Math.max(0, v))

/** Fixed behind every section; follows whichever section holds the middle of the screen. */
export function VoidBackground({ sections }: { sections: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !BlackHole.supported()) return setWebgl(false)
    let bh: BlackHole
    try {
      bh = new BlackHole(canvas)
    } catch {
      return setWebgl(false)
    }
    setWebgl(true)

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = matchMedia('(pointer: coarse)').matches
    bh.steps = touch ? 110 : 170
    const dpr = Math.min(devicePixelRatio || 1, 2)
    // start sharp; step down only if this GPU can't keep up
    let quality = touch ? 0.5 : 0.85
    const fit = () => bh.resize(Math.max(0.3, Math.min(1.4, quality * dpr)))

    let portrait = innerWidth / innerHeight < 0.9
    let plateText = 'VOIDS'
    const setPlate = () => {
      const p = plate(plateText, portrait)
      bh.setName(p.c, p.halfW, p.halfH, p.z, p.y)
    }
    setPlate()
    loadFont().then(setPlate, () => {})
    fit()

    const onResize = () => {
      const now = innerWidth / innerHeight < 0.9
      if (now !== portrait) {
        portrait = now
        setPlate()
      }
      fit()
    }
    window.addEventListener('resize', onResize)

    const mouse = { x: 0, y: 0, on: 0 }
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX - innerWidth / 2) / innerHeight
      mouse.y = -(e.clientY - innerHeight / 2) / innerHeight
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    // the camera is tied to the scroll: between two sections it blends their shots
    const els = sections.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    let tops: number[] = []
    const measure = () => (tops = els.map((el) => el.getBoundingClientRect().top + scrollY))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    const target: Shot = { ...SHOTS.hero }
    const smooth = (x: number) => x * x * (3 - 2 * x)
    const aim = () => {
      // at the top of a section its own shot is exact; it blends into the next as you scroll on
      const y = scrollY + 1
      let i = 0
      while (i < tops.length - 1 && y >= tops[i + 1]) i++
      const a = SHOTS[els[i]?.id] ?? SHOTS.hero
      const b = SHOTS[els[i + 1]?.id] ?? a
      const span = (tops[i + 1] ?? tops[i] + 1) - tops[i]
      const f = smooth(clamp((y - tops[i]) / Math.max(1, span)))
      for (const key of KEYS) target[key] = a[key] + (b[key] - a[key]) * f
      target.name = a.name + (b.name - a.name) * f
      target.plate = f < 0.5 ? a.plate ?? b.plate : b.plate ?? a.plate
    }

    const start = performance.now()
    const cur: Shot = { ...SHOTS.hero }
    const out: Shot = { ...SHOTS.hero }
    let raf = 0
    let last = start
    let ema = 16.7
    let checkIn = 0
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (bh.lost) return
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const t = reduced ? 99 : (now - start) / 1000

      // follow the scroll closely, with just enough lag to feel like a camera
      aim()
      const k = reduced ? 1 : 1 - Math.exp(-dt * 7)
      for (const key of KEYS) cur[key] += (target[key] - cur[key]) * k
      // the name fades out before its word changes, then back in
      const want = target.plate ?? plateText
      const nameTarget = want !== plateText ? 0 : target.name
      cur.name += (nameTarget - cur.name) * k
      if (want !== plateText && cur.name < 0.03) {
        plateText = want
        setPlate()
      }

      // the opening fall, laid over the hero shot
      const e = ease(clamp(t / APPROACH_S))
      const intro = ease(clamp((t - IGNITE_AT) / IGNITE_S))
      const a = 1 - e
      Object.assign(out, cur)
      out.r = Math.exp(Math.log(FROM) * a + Math.log(cur.r) * e)
      out.az = cur.az - 0.42 * a + (reduced ? 0 : 0.035 * Math.sin(t * 0.12) * intro)
      out.el = cur.el + 0.22 * a
      out.roll = cur.roll + 0.1 * a
      out.name = cur.name * clamp((intro - 0.3) / 0.6)
      // phones stack content full width, so the hole stays near the middle
      if (portrait) {
        out.sx *= 0.2
        out.sy = Math.max(-0.2, Math.min(0.2, out.sy))
      }

      mouse.on += ((touch || reduced || intro < 1 ? 0 : 1) - mouse.on) * 0.05
      bh.render(out, { time: reduced ? 12 : t, mouse: [mouse.x, mouse.y, 0.0011 * mouse.on], lock: 0, intro, flash: 0, sky: Math.min(1, e * 6) })

      // keep it smooth on slower GPUs: drop resolution when frames run long
      ema += (now - start > 1000 ? (dt * 1000 - ema) * 0.05 : 0)
      if ((checkIn += dt) > 1.5) {
        checkIn = 0
        if (ema > 24 && quality > 0.3) {
          quality *= 0.85
          fit()
        } else if (ema < 14 && quality < (touch ? 0.6 : 1)) {
          quality = Math.min(touch ? 0.6 : 1, quality * 1.08)
          fit()
        }
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      bh.dispose()
    }
  }, [sections])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
}
