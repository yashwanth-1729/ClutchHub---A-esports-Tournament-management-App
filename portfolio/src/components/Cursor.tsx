import { useEffect, useRef } from 'react'
import { audio } from '../audio/VoidAudio'
import { state } from '../engine/engine'
import { useFrame } from '../lib/hooks'

const INTERACTIVE = 'a, button, input, textarea, [data-cursor]'

/** A point, and sometimes a word written next to it. */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const pos = useRef({ x: -100, y: -100 })
  const enabled = !state.touch && !state.reduced

  useEffect(() => {
    let current: Element | null = null
    let notes = 0
    const over = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(INTERACTIVE) ?? null
      if (el === current) return
      current = el
      root.current?.classList.toggle('is-hover', !!el)
      const text = el?.getAttribute('data-cursor') ?? ''
      root.current?.classList.toggle('has-label', !!text)
      if (label.current) label.current.textContent = text
      if (el && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') audio.blip(notes++)
    }
    document.addEventListener('pointerover', over)
    if (enabled) document.documentElement.classList.add('custom-cursor')
    return () => {
      document.removeEventListener('pointerover', over)
      document.documentElement.classList.remove('custom-cursor')
    }
  }, [enabled])

  useFrame(() => {
    if (!enabled) return
    const { x, y } = state.mouse
    const p = pos.current
    p.x += (x - p.x) * 0.2
    p.y += (y - p.y) * 0.2
    if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    if (label.current) label.current.style.transform = `translate3d(${p.x + 14}px, ${p.y + 6}px, 0)`
  })

  if (!enabled) return null
  return (
    <div className="cursor" ref={root} aria-hidden="true">
      <div className="cursor-dot" ref={dot} />
      <span className="cursor-label" ref={label} />
    </div>
  )
}
