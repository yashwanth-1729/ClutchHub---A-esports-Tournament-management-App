import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio/VoidAudio'
import { onAnchors, scrollToTarget, state } from '../engine/engine'
import { useFrame } from '../lib/hooks'
import { brand } from '../content'

// Running head: the chapter you are in. Folio: how far from the singularity.
const CHAPTERS: Record<string, [string, string]> = {
  hero: ['', 'Plate I'],
  about: ['I.', 'Orientation'],
  work: ['II.', 'Debris'],
  jarvis: ['II.1', 'JARVIS'],
  hospital: ['II.2', 'Hospital Automation'],
  clutchhub: ['II.3', 'ClutchHub'],
  sldt: ['II.4', 'SLDT'],
  sldtIntro: ['III.', 'Sync without a server'],
  protocol: ['III.', 'Sync without a server'],
  sldtLab: ['III.', 'A working copy'],
  sldtNotes: ['III.', 'Field notes'],
  orbit: ['IV.', 'The photon sphere'],
  contact: ['V.', 'The horizon'],
}

export function minutes(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  if (!m) return `${sec} s`
  return `${m} min ${sec} s`
}

export function Hud() {
  const folio = useRef<HTMLSpanElement>(null)
  const elapsed = useRef<HTMLSpanElement>(null)
  const [sound, setSound] = useState(audio.enabled)
  const [marks, setMarks] = useState<{ key: string; y: number }[]>([])
  const [current, setCurrent] = useState('hero')
  const acc = useRef(0)

  useEffect(() => audio.subscribe(setSound), [])
  useEffect(() => onAnchors((list) => setMarks(list.map((a) => ({ key: a.key, y: a.y })))), [])

  useFrame((dt) => {
    acc.current += dt
    if (acc.current < 0.12) return
    acc.current = 0
    if (folio.current) folio.current.textContent = state.frame.r.toFixed(2)
    if (elapsed.current) {
      const out = state.outside
      const you = state.proper
      elapsed.current.textContent =
        you < 2 ? 'Clocks start when you do.' : `For you, ${minutes(you)} have passed. Outside, ${minutes(out)}.`
    }
    // the chapter whose anchor we most recently passed
    let key = 'hero'
    for (const m of marks) if (state.scrollY >= m.y - window.innerHeight * 0.5) key = m.key
    if (key !== current) setCurrent(key)
  })

  const go = (target: string | number) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToTarget(target)
  }
  const [num, title] = CHAPTERS[current] ?? ['', '']

  return (
    <div className="hud">
      <div className="head">
        <a className="wordmark" href="#top" onClick={go(0)} aria-label={`${brand.mark}, back to the top`}>
          Voidbyte
        </a>
        <span className="chapter" aria-live="off">
          {num ? <b>{num}</b> : null}
          {title}
        </span>
        <div className="head-right">
          <a href="#work" onClick={go('#work')}>
            Work
          </a>
          <a href="#inside-sldt" onClick={go('#inside-sldt')}>
            SLDT
          </a>
          <a href="#contact" onClick={go('#contact')}>
            Contact
          </a>
          <button className="sound" onClick={() => audio.toggle()} aria-pressed={sound}>
            {sound ? 'sound on' : 'sound off'}
          </button>
        </div>
      </div>
      <div className="foot">
        <span className="elapsed" ref={elapsed} aria-hidden="true" />
        <span className="folio" title="Your distance from the singularity, in Schwarzschild radii">
          <span className="locked-note">locked in</span>
          <i>r</i> = <span ref={folio}>30.00</span> r<sub>s</sub>
        </span>
      </div>
    </div>
  )
}
