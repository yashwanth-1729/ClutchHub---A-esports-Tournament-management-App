import { useEffect, useRef, useState, type RefObject } from 'react'
import { onFrame } from '../engine/engine'

/** True while the element is on screen. Demos pause themselves when it is false. */
export function useInView<T extends Element>(ref: RefObject<T | null>, margin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return inView
}

/** Run a callback on the shared animation loop. */
export function useFrame(fn: (dt: number) => void) {
  const saved = useRef(fn)
  saved.current = fn
  useEffect(() => onFrame((dt) => saved.current(dt)), [])
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** True while the media query matches. */
export function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && matchMedia(query).matches)
  useEffect(() => {
    const mq = matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

/** The phone layout: one column, a bottom bar, sections rebuilt for a thumb. CSS uses the same query. */
export const PHONE_QUERY = '(max-width: 700px)'

/** At this width and below the desktop links are gone (global.css): the chapter sheet and the one-column index stand in. */
export const COMPACT_QUERY = '(max-width: 900px)'

export function usePhone() {
  return useMedia(PHONE_QUERY)
}
