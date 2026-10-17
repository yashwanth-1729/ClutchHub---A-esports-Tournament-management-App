import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { audio } from '../audio/VoidAudio'
import { state } from '../engine/engine'
import { brand } from '../content'

const TARGET = 1729

export function Loader({ onEnter }: { onEnter: () => void }) {
  const [n, setN] = useState(state.reduced ? TARGET : 0)
  const [counted, setCounted] = useState(state.reduced)
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const leaving = useRef(false)

  useEffect(() => {
    if (state.reduced) return
    let raf = 0
    let t0 = 0
    const D = 2600
    const step = (t: number) => {
      if (!t0) t0 = t
      const p = Math.min(1, (t - t0) / D)
      setN(Math.round((1 - Math.pow(1 - p, 4)) * TARGET))
      if (p < 1) raf = requestAnimationFrame(step)
      else setCounted(true)
    }
    ;(document.fonts?.ready ?? Promise.resolve()).then(() => {
      raf = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (counted) root.current?.querySelector<HTMLButtonElement>('.loader-enter .act')?.focus({ preventScroll: true })
  }, [counted])

  const enter = (withSound: boolean) => {
    if (leaving.current) return
    leaving.current = true
    audio.setEnabled(withSound)
    const el = root.current!
    const tl = gsap.timeline({ onComplete: () => setGone(true) })
    tl.to(el.querySelectorAll('.loader-enter, .loader-head, .loader-cap'), { opacity: 0, duration: 0.4 }, 0)
    tl.to(el.querySelector('.loader-count'), { scaleY: 0.015, scaleX: 1.5, opacity: 0.2, duration: 0.85, ease: 'expo.in' }, 0)
    tl.add(onEnter, 0.6)
    tl.to(el, { opacity: 0, duration: 1.4, ease: 'power2.out' }, 0.75)
  }

  if (gone) return null

  return (
    <div className="loader" ref={root} role="dialog" aria-label="Enter the site">
      <div className="loader-head">
        <span className="wordmark">Voidbyte</span>
        <span>{brand.person}</span>
      </div>

      <div className="loader-body">
        <p className="loader-count" aria-hidden="true">
          {String(n).padStart(4, '0')}
        </p>
        <p className="loader-cap">
          {counted ? (
            <>
              1<sup>3</sup> + 12<sup>3</sup> = 9<sup>3</sup> + 10<sup>3</sup>. The smallest number that is a sum of two cubes in two different ways, and the last four characters
              of my GitHub handle.
            </>
          ) : (
            'Approaching.'
          )}
        </p>
      </div>

      <p className="loader-enter" style={{ opacity: counted ? 1 : 0, pointerEvents: counted ? 'auto' : 'none' }}>
        Enter{' '}
        <button className="act" onClick={() => enter(true)}>
          with sound
        </button>{' '}
        or{' '}
        <button className="act" onClick={() => enter(false)}>
          in silence
        </button>
        .<span className="loader-note">The sound is synthesized in your browser as you fall.</span>
      </p>
    </div>
  )
}
