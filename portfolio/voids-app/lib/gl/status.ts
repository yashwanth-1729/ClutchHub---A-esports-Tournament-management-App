// Whether the WebGL background is drawing: null while unknown. Sections read it to pick a fallback.
import { useSyncExternalStore } from 'react'

let webgl: boolean | null = null
const subs = new Set<() => void>()

export function setWebgl(v: boolean) {
  webgl = v
  subs.forEach((f) => f())
}

export function useWebgl() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => webgl,
    () => null,
  )
}
