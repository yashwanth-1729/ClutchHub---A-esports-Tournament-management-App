'use client'

import { useEffect, useRef } from 'react'

/**
 * Concentrated intelligence: a wide, faint cloud (scale) collapses into a small,
 * dense, bright core with a thin orbit (focus). The cool particles are breadth;
 * the warm ones are what remains when everything is pointed at one domain.
 */
export function Concentration({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let dpr = 1
    const N = 1400
    type P = { a: number; r0: number; r1: number; z: number; speed: number; warm: boolean; size: number; phase: number }
    const ps: P[] = []
    for (let i = 0; i < N; i++) {
      const warm = Math.random() < 0.42
      ps.push({
        a: Math.random() * Math.PI * 2,
        // where it starts: a broad nebula
        r0: Math.pow(Math.random(), 0.55) * 1.0 + 0.05,
        // where it ends: a tight core and a thin ring
        r1: warm ? (Math.random() < 0.6 ? Math.pow(Math.random(), 2.2) * 0.07 : 0.11 + Math.random() * 0.012) : 0.22 + Math.random() * 0.5,
        z: Math.random(),
        speed: 0.08 + Math.random() * 0.35,
        warm,
        size: Math.random() * 1.4 + 0.3,
        phase: Math.random() * Math.PI * 2,
      })
    }
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let raf = 0
    let t0 = 0
    let mx = 0
    let my = 0
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

    const draw = (t: number) => {
      if (!t0) t0 = t
      const time = reduced ? 1e5 : (t - t0) / 1000
      // the collapse: 0.6 s of drift, then 3.4 s to fall in
      const k = ease((time - 0.6) / 3.4)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const cx = w * (0.5 + mx * 0.01)
      const cy = h * (0.5 + my * 0.01)
      const R = Math.min(w, h) * 0.62

      // the core's glow grows as everything arrives
      if (k > 0.05) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.22)
        g.addColorStop(0, `rgba(255, 196, 140, ${0.32 * k})`)
        g.addColorStop(0.45, `rgba(255, 140, 70, ${0.12 * k})`)
        g.addColorStop(1, 'rgba(255, 120, 60, 0)')
        ctx.fillStyle = g
        ctx.fillRect(cx - R * 0.25, cy - R * 0.25, R * 0.5, R * 0.5)
      }

      ctx.globalCompositeOperation = 'lighter'
      for (const p of ps) {
        const r = p.r0 + (p.r1 - p.r0) * k
        // closer in, faster round: a little Kepler
        const ang = p.a + time * p.speed * (0.3 + (1 - r) * 1.6) + p.phase * 0.0
        const tilt = 0.32 + 0.1 * k
        const x = cx + Math.cos(ang) * r * R
        const y = cy + Math.sin(ang) * r * R * (p.warm ? tilt : 0.62 - 0.2 * k)
        const twinkle = 0.65 + 0.35 * Math.sin(time * 2 + p.phase)
        if (p.warm) {
          const a = (0.25 + 0.65 * k) * twinkle
          ctx.fillStyle = `rgba(255, ${170 + Math.round(60 * (1 - r))}, ${110 + Math.round(80 * (1 - r))}, ${a})`
        } else {
          const a = (0.5 - 0.28 * k) * twinkle * (0.4 + p.z * 0.6)
          ctx.fillStyle = `rgba(143, 163, 255, ${a})`
        }
        const s = p.size * (p.warm ? 0.8 + 0.6 * k : 1)
        ctx.fillRect(x, y, s, s)
      }
      ctx.globalCompositeOperation = 'source-over'

      // the event horizon: a small dark disc at the very centre, once the core has formed
      if (k > 0.3) {
        ctx.fillStyle = `rgba(3, 3, 3, ${Math.min(1, (k - 0.3) * 1.6)})`
        ctx.beginPath()
        ctx.ellipse(cx, cy, R * 0.034, R * 0.034, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      if (!reduced) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
