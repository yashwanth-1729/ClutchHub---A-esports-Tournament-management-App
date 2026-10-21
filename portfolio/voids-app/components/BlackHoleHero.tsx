'use client'

import { useEffect, useRef, useState } from 'react'
import { BlackHole, type CameraFrame } from '@/lib/gl/BlackHole'

// The homepage's opening, retold for VOIDS: fall from r = 1729 to r = 30, then the disk ignites
// and the name, written on a plane behind the hole, bends around it.
const HERO: CameraFrame = { r: 30, az: 0, el: 0.1, roll: 0, sx: 0, sy: 0.1, fov: 0.95, name: 1, dim: 1, heat: 0.1 }
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

/** The name, white on black, sized for the plane the shader places behind the hole. */
function plate(portrait: boolean) {
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
  size *= Math.min(1, (W * 0.94) / ctx.measureText('VOIDS').width)
  ctx.font = `780 ${size}px "${FAMILY}", "Hubot Sans Variable", sans-serif`
  const cap = ctx.measureText('H').actualBoundingBoxAscent
  ctx.fillText('VOIDS', W / 2, H / 2 + cap / 2)
  const halfW = portrait ? 7 : 31
  return { c, halfW, halfH: halfW * (H / W), z: 15, y: portrait ? 8.5 : 0 }
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp = (v: number) => Math.min(1, Math.max(0, v))

/** Returns whether WebGL is running, so the page can hide its HTML fallback title. */
export function BlackHoleHero({ className = '', onReady }: { className?: string; onReady?: (webgl: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !BlackHole.supported()) return onReady?.(false)
    let bh: BlackHole
    try {
      bh = new BlackHole(canvas)
    } catch {
      return onReady?.(false)
    }
    onReady?.(true)

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = matchMedia('(pointer: coarse)').matches
    bh.steps = touch ? 110 : 170
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const scale = Math.max(0.3, Math.min(1.2, (touch ? 0.42 : 0.62) * dpr))

    let portrait = canvas.clientWidth / canvas.clientHeight < 0.9
    const setPlate = () => {
      const p = plate(portrait)
      bh.setName(p.c, p.halfW, p.halfH, p.z, p.y)
    }
    setPlate()
    loadFont().then(setPlate, () => {})
    bh.resize(scale)

    const mouse = { x: 0, y: 0, on: 0 }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = (e.clientX - r.left - r.width / 2) / r.height
      mouse.y = -(e.clientY - r.top - r.height / 2) / r.height
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const ro = new ResizeObserver(() => {
      const nowPortrait = canvas.clientWidth / canvas.clientHeight < 0.9
      if (nowPortrait !== portrait) {
        portrait = nowPortrait
        setPlate()
      }
      bh.resize(scale)
    })
    ro.observe(canvas)

    // draw only while the opening is on screen
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)

    const start = performance.now()
    const f: CameraFrame = { ...HERO }
    let raf = 0
    let litSent = false
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible || bh.lost) return
      const t = reduced ? 99 : (performance.now() - start) / 1000
      const e = ease(clamp(t / APPROACH_S))
      const intro = ease(clamp((t - IGNITE_AT) / IGNITE_S))
      const k = 1 - e
      Object.assign(f, HERO)
      if (portrait) f.sy = 0.02
      // log-spaced so the hole grows at a steady visual rate
      f.r = Math.exp(Math.log(FROM) * k + Math.log(HERO.r) * e)
      f.az = HERO.az - 0.42 * k + (reduced ? 0 : 0.035 * Math.sin(t * 0.12) * intro)
      f.el = HERO.el + 0.22 * k
      f.roll = 0.1 * k
      f.name = clamp((intro - 0.3) / 0.6)
      if (!litSent && intro > 0.55) {
        litSent = true
        setLit(true)
      }
      mouse.on += ((touch || reduced || intro < 1 ? 0 : 1) - mouse.on) * 0.05
      bh.render(f, { time: reduced ? 12 : t, mouse: [mouse.x, mouse.y, 0.0011 * mouse.on], lock: 0, intro, flash: 0, sky: Math.min(1, e * 6) })
      if (reduced && t > 0) cancelAnimationFrame(raf)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      bh.dispose()
    }
  }, [onReady])

  return <canvas ref={ref} data-lit={lit} className={className} aria-hidden="true" />
}
