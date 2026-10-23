'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { Maximize2, Minimize2 } from 'lucide-react'

export type DeckSection = { id: string; title: string }

/**
 * A quiet shell for a live talk: free, smooth scrolling like the homepage, ← → to jump a section,
 * F for full screen, and a hairline of progress.
 */
export function Deck({ sections, children }: { sections: DeckSection[]; children: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  const [full, setFull] = useState(false)
  const bar = useRef<HTMLDivElement>(null)
  const lenis = useRef<Lenis | null>(null)

  // smooth wheel scrolling, as on voidbyte.tech
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const l = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true })
    lenis.current = l
    let raf = 0
    const loop = (t: number) => {
      l.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      l.destroy()
      lenis.current = null
    }
  }, [])

  // which section holds the middle of the screen, and how far down the page we are
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setIndex(els.indexOf(e.target as HTMLElement))
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    els.forEach((el) => io.observe(el))
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [sections])

  const go = useCallback(
    (i: number) => {
      const el = document.getElementById(sections[Math.max(0, Math.min(sections.length - 1, i))].id)
      if (!el) return
      if (lenis.current) lenis.current.scrollTo(el, { duration: 1.6 })
      else el.scrollIntoView()
    },
    [sections],
  )

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.()
  }, [])

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      // sliders, fields and menus keep their own keys
      if (t.closest('input, select, textarea, [role="slider"], [contenteditable="true"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        go(index + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        go(index - 1)
      } else if (e.key === 'f' || e.key === 'F') toggleFull()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, go, toggleFull])

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 md:px-10">
        <a href="/" className="pointer-events-auto display text-[12px] font-bold tracking-[0.14em] text-ink uppercase">
          Voidbyte <span className="text-ink-3">/ VOIDS</span>
        </a>
        <button
          onClick={toggleFull}
          className="pointer-events-auto rounded-full p-2 text-ink-3 transition hover:text-ink"
          title="Full screen (F) · ← → to move between sections"
          aria-label="Full screen"
        >
          {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </header>

      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-px bg-rule/50">
        <div ref={bar} className="h-px origin-left bg-warm" style={{ transform: 'scaleX(0)' }} />
      </div>
    </>
  )
}
