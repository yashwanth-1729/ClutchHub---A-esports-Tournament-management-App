'use client'

import { useCallback, useEffect, useState } from 'react'
import { Maximize2, Minimize2, MonitorPlay, ScrollText } from 'lucide-react'

export type DeckSection = { id: string; title: string }

/**
 * A presentation shell for a live talk: one section per screen in present mode
 * (snapping, arrow keys, F for full screen), or a plain scrolling page.
 */
export function Deck({ sections, children }: { sections: DeckSection[]; children: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  const [present, setPresent] = useState(true)
  const [full, setFull] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('present', present)
  }, [present])

  // which section holds the middle of the screen
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setIndex(els.indexOf(e.target as HTMLElement))
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  const go = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(sections.length - 1, i))
      document.getElementById(sections[n].id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
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
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
        if (!present && (e.key === 'ArrowDown' || e.key === ' ')) return
        e.preventDefault()
        go(index + 1)
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        if (!present && e.key === 'ArrowUp') return
        e.preventDefault()
        go(index - 1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        go(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        go(sections.length - 1)
      } else if (e.key === 'f' || e.key === 'F') toggleFull()
      else if (e.key === 'p' || e.key === 'P') setPresent((p) => !p)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, present, go, toggleFull, sections.length])

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-gradient-to-b from-void via-void/80 to-transparent px-5 py-4 md:px-10">
        <a href="/" className="pointer-events-auto display text-[12px] font-bold tracking-[0.14em] text-ink uppercase">
          Voidbyte <span className="text-ink-3">/ VOIDS</span>
        </a>
        <span className="label hidden md:block">
          <span className="text-warm">{String(index + 1).padStart(2, '0')}</span> {sections[index]?.title}
        </span>
        <div className="pointer-events-auto flex items-center gap-1">
          <button
            onClick={() => setPresent((p) => !p)}
            className="label flex items-center gap-2 rounded-full border border-rule px-3 py-2 text-ink-2 transition hover:border-ink-3 hover:text-ink"
            aria-pressed={present}
            title="P: switch between presenting and scrolling"
          >
            {present ? <MonitorPlay size={14} /> : <ScrollText size={14} />}
            <span className="hidden sm:inline">{present ? 'Present' : 'Scroll'}</span>
          </button>
          <button onClick={toggleFull} className="rounded-full border border-rule p-2 text-ink-2 transition hover:border-ink-3 hover:text-ink" title="F: full screen" aria-label="Full screen">
            {full ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>

      {children}

      <nav aria-label="Sections" className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        {sections.map((s, i) => (
          <button key={s.id} onClick={() => go(i)} className="group flex items-center justify-end gap-3" aria-label={s.title} aria-current={i === index ? 'step' : undefined}>
            <span className="label opacity-0 transition group-hover:opacity-100">{s.title}</span>
            <span className={`block h-px transition-all ${i === index ? 'w-8 bg-warm' : 'w-4 bg-ink-3 group-hover:bg-ink'}`} />
          </button>
        ))}
      </nav>

      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-void via-void/85 to-transparent px-5 pt-8 pb-3 md:px-10">
        <div className="flex items-center justify-between">
          <span className="label">
            <span className="text-ink">{String(index + 1).padStart(2, '0')}</span> / {String(sections.length).padStart(2, '0')}
          </span>
          <span className="label hidden lg:block">← → to move · F full screen · P {present ? 'scroll mode' : 'present mode'}</span>
        </div>
        <div className="mt-2 h-px w-full bg-rule">
          <div className="h-px bg-warm transition-all duration-500" style={{ width: `${((index + 1) / sections.length) * 100}%` }} />
        </div>
      </footer>
    </>
  )
}
