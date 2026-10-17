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
