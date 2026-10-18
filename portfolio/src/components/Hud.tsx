import { useCallback, useEffect, useRef, useState } from 'react'
import { audio } from '../audio/VoidAudio'
import { focusTarget, onAnchors, scrollToTarget, state } from '../engine/engine'
import { useFrame, usePhone } from '../lib/hooks'
import { brand } from '../content'
import { ChapterSheet, ROW_BY_KEY, elapsedSentence } from './ChapterSheet'

export { minutes } from './ChapterSheet'

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

/** At this width and below the desktop links are gone (global.css), so the chapter sheet stands in for them. */
const SHEET_QUERY = '(max-width: 900px)'

function useMedia(query: string) {
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

export function Hud() {
  const phone = usePhone()
  const sheetWidth = useMedia(SHEET_QUERY)
  const hud = useRef<HTMLDivElement>(null)
  const folio = useRef<HTMLSpanElement>(null)
  const elapsed = useRef<HTMLSpanElement>(null)
  const [sound, setSound] = useState(audio.enabled)
  const [marks, setMarks] = useState<{ key: string; y: number }[]>([])
  // phones: where each section starts, since one phone section can run for several screens
  const tops = useRef<{ key: string; top: number }[]>([])
  const [current, setCurrent] = useState('hero')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [fromKeyboard, setFromKeyboard] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const acc = useRef(0)
  const flags = useRef({ locked: false, top: true })

  useEffect(() => audio.subscribe(setSound), [])
  useEffect(
    () =>
      onAnchors((list) => {
        setMarks(list.map((a) => ({ key: a.key, y: a.y })))
        const sy = window.scrollY
        tops.current = Array.from(document.querySelectorAll<HTMLElement>('[data-frame]'))
          .map((el) => ({ key: el.dataset.frame!, top: el.getBoundingClientRect().top + sy }))
          .sort((a, b) => a.top - b.top)
      }),
    [],
  )

  useFrame((dt) => {
    acc.current += dt
    if (acc.current < 0.12) return
    acc.current = 0
    if (folio.current) folio.current.textContent = state.frame.r.toFixed(2)
    if (elapsed.current) elapsed.current.textContent = elapsedSentence()
    const f = flags.current
    // "locked in" takes no room in the phone's bottom bar until it is true
    const locked = state.lock > 0.02
    if (locked !== f.locked) {
      f.locked = locked
      hud.current?.classList.toggle('is-locked', locked)
    }
    // at the very top the plate has the screen; the top bar darkens once text can pass under it
    const top = state.scrollY < 24
    if (top !== f.top) {
      f.top = top
      hud.current?.classList.toggle('at-top', top)
    }
    let key = 'hero'
    if (phone) {
      // the section whose top has passed the middle of the screen
      for (const t of tops.current) if (state.scrollY >= t.top - window.innerHeight * 0.5) key = t.key
    } else {
      // the chapter whose anchor we most recently passed
      for (const m of marks) if (state.scrollY >= m.y - window.innerHeight * 0.5) key = m.key
    }
    if (key !== current) setCurrent(key)
  })

  const go = (target: string | number) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToTarget(target)
    focusTarget(target)
  }
  const openSheet = (e: React.MouseEvent<HTMLElement>) => {
    opener.current = e.currentTarget
    // Enter and Space fire a click with no pointer behind it
    setFromKeyboard(e.detail === 0)
    setSheetOpen(true)
  }
  const closeSheet = useCallback((restore: boolean) => {
    setSheetOpen(false)
    if (restore) opener.current?.focus()
  }, [])
  // the sheet belongs to narrow screens; turning the device into something wider closes it
  useEffect(() => {
    if (!sheetWidth) setSheetOpen(false)
  }, [sheetWidth])

  const [num, title] = CHAPTERS[current] ?? ['', '']
  // the phone's running head names the exact part, as the chapter sheet does; on the plate it is the contents
  const row = ROW_BY_KEY[current]
  const [pNum, pTitle] = row ? [row.num, row.title] : current === 'hero' ? ['I–V', 'Contents'] : [num, title]
  const runheadName = current === 'hero' ? 'Contents, chapters I to V' : `${pNum ? `${pNum} ` : ''}${pTitle}, all chapters`

  return (
    <>
      <div className="hud at-top" ref={hud}>
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
            {sheetWidth ? (
              <button
                type="button"
                className="chapters-btn"
                aria-haspopup="dialog"
                aria-expanded={sheetOpen}
                aria-controls="chapter-sheet"
                onClick={openSheet}
              >
                Chapters
              </button>
            ) : null}
          </div>
        </div>
        <div className="foot">
          <span className="elapsed" ref={elapsed} aria-hidden="true" />
          {phone ? (
            <button
              type="button"
              className="runhead"
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              aria-controls="chapter-sheet"
              aria-label={runheadName}
              onClick={openSheet}
            >
              <span className="runhead-text">
                {pNum ? (
                  <>
                    <b>{pNum}</b>{' '}
                  </>
                ) : null}
                {pTitle}
              </span>
            </button>
          ) : null}
          <span className="folio" title="Your distance from the singularity, in Schwarzschild radii">
            <span className="locked-note">locked in</span>
            <i>r</i> = <span ref={folio}>30.00</span> r<sub>s</sub>
          </span>
        </div>
      </div>
      {sheetWidth ? <ChapterSheet open={sheetOpen} current={current} sound={sound} keyboard={fromKeyboard} onClose={closeSheet} /> : null}
    </>
  )
}
