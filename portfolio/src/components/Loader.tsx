import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { audio } from '../audio/VoidAudio'
import { APPROACH_FROM, approachR, state } from '../engine/engine'
import { brand } from '../content'

// The opening is the approach itself: the camera starts 1729 Schwarzschild
// radii out, where the hole is a speck bending the starlight, and closes to
// thirty while this readout counts the distance down.
const DURATION = 5200

// This family's tabular figures swap in a slashed zero, so instead of tnum
// each character gets a fixed cell; the count holds still while it changes.
function setReadout(el: HTMLElement, text: string) {
  while (el.childElementCount < text.length) el.append(document.createElement('span'))
  while (el.childElementCount > text.length) el.lastElementChild!.remove()
  Array.from(el.children).forEach((cell, i) => {
    if (cell.textContent === text[i]) return
    cell.textContent = text[i]
    cell.className = text[i] === '.' ? 'dot' : 'dg'
  })
}

export function Loader({ onEnter }: { onEnter: () => void }) {
  const [counted, setCounted] = useState(state.reduced)
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const leaving = useRef(false)

  useLayoutEffect(() => {
    if (readout.current) setReadout(readout.current, (state.reduced ? approachR(1) : APPROACH_FROM).toFixed(2))
  }, [])

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
      if (readout.current) setReadout(readout.current, approachR(e).toFixed(2))
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

  // Always with sound. Browsers only start audio from a click, so this one
  // click is both the way in and the gesture that switches the sound on.
  const enter = () => {
    if (leaving.current) return
    leaving.current = true
    audio.setEnabled(true)
    const el = root.current!
    const tl = gsap.timeline({ onComplete: () => setGone(true) })
    tl.to(el.querySelectorAll('.loader-enter, .loader-cap, .loader-head'), { opacity: 0, y: 8, duration: 0.5, ease: 'power2.in', stagger: 0.04 }, 0)
    tl.to(el.querySelector('.loader-read'), { opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.1)
    tl.add(onEnter, 0.35)
    tl.to(el, { opacity: 0, duration: 0.6 }, 0.7)
  }

  if (gone) return null

  return (
    <div
      className={`loader ${counted ? 'is-counted' : ''}`}
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Enter the site"
      // once in orbit, a click anywhere goes in; the button is there for keyboards
      onClick={counted ? enter : undefined}
    >
      <div className="loader-head">
        <span className="wordmark">Voidbyte</span>
        <span className="label">{brand.person} — Portfolio, 2026</span>
      </div>

      <div className="loader-read" aria-hidden="true">
        <p className="label">{counted ? 'In orbit' : 'Approach'} · distance to the singularity</p>
        <p className="loader-count">
          {/* filled by setReadout, never by React, so the two never fight over it */}
          <span ref={readout} />
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

      <div className="loader-enter" inert={!counted}>
        <button className="enter-btn" onClick={enter}>
          <span>Enter</span>
          <span className="enter-arrow" aria-hidden="true">
            →
          </span>
        </button>
        <p className="loader-note">With sound, synthesized in your browser as you fall. Mute it any time, top right.</p>
      </div>
    </div>
  )
}
