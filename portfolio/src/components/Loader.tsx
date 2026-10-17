import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { audio } from '../audio/VoidAudio'
import { APPROACH_FROM, approachR, state } from '../engine/engine'
import { brand } from '../content'

// The opening is the approach itself: the camera starts 1729 Schwarzschild
// radii out, where the hole is a speck bending the starlight, and closes to
// thirty while this readout counts the distance down.
const DURATION = 5200

export function Loader({ onEnter }: { onEnter: () => void }) {
  const [counted, setCounted] = useState(state.reduced)
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const leaving = useRef(false)

  useEffect(() => {
    if (state.reduced) {
      state.approach = 1
      return
    }
    let raf = 0
    let t0 = 0
    const step = (t: number) => {
      if (!t0) t0 = t
      const p = Math.min(1, (t - t0) / DURATION)
      // the speck lingers, the hole rushes up, then the camera settles into orbit
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      state.approach = e
      if (readout.current) readout.current.textContent = approachR(e).toFixed(2)
      if (p < 1) raf = requestAnimationFrame(step)
      else setCounted(true)
    }
    ;(document.fonts?.ready ?? Promise.resolve()).then(() => {
      raf = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (counted) root.current?.querySelector<HTMLButtonElement>('.enter-btn')?.focus({ preventScroll: true })
  }, [counted])

  // hand focus to the page once the loader is gone, rather than dropping it on <body>
  useEffect(() => {
    if (gone) document.querySelector<HTMLElement>('#top h1')?.focus({ preventScroll: true })
  }, [gone])

  const enter = (withSound: boolean) => {
    if (leaving.current) return
    leaving.current = true
    audio.setEnabled(withSound)
    const el = root.current!
    const tl = gsap.timeline({ onComplete: () => setGone(true) })
    tl.to(el.querySelectorAll('.loader-enter, .loader-cap, .loader-head'), { opacity: 0, y: 8, duration: 0.5, ease: 'power2.in', stagger: 0.04 }, 0)
    tl.to(el.querySelector('.loader-read'), { opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.1)
    tl.add(onEnter, 0.35)
    tl.to(el, { opacity: 0, duration: 0.6 }, 0.7)
  }

  if (gone) return null

  return (
    <div className={`loader ${counted ? 'is-counted' : ''}`} ref={root} role="dialog" aria-modal="true" aria-label="Enter the site">
      <div className="loader-head">
        <span className="wordmark">Voidbyte</span>
        <span className="label">{brand.person} — Portfolio, 2026</span>
      </div>

      <div className="loader-read" aria-hidden="true">
        <p className="label">{counted ? 'In orbit' : 'Approach'} · distance to the singularity</p>
        <p className="loader-count">
          <span ref={readout}>{(state.reduced ? approachR(1) : APPROACH_FROM).toFixed(2)}</span>
          <span className="loader-unit">
            r<sub>s</sub>
          </span>
        </p>
      </div>

      <p className="loader-cap">
        <span className="label">Why 1729</span>
        The approach starts 1729 Schwarzschild radii out. 1<sup>3</sup> + 12<sup>3</sup> = 9<sup>3</sup> + 10<sup>3</sup>: the smallest number that is a sum
        of two cubes in two ways, and the last four digits of my GitHub handle.
      </p>

      <div className="loader-enter" inert={!counted} role="group" aria-label="Enter">
        <p className="label">Enter</p>
        <button className="enter-btn" onClick={() => enter(true)}>
          With sound
        </button>
        <button className="enter-btn" onClick={() => enter(false)}>
          In silence
        </button>
        <p className="loader-note">The sound is synthesized in your browser as you fall.</p>
      </div>
    </div>
  )
}
