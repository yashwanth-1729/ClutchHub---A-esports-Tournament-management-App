import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { audio } from '../audio/VoidAudio'
import { onAnchors, state } from '../engine/engine'
import { COMPACT_QUERY, useFrame, useMedia, usePhone } from '../lib/hooks'
import { follow } from '../lib/nav'
import { brand } from '../content'
import { PORTFOLIO, type ChapterRow, type SiteNav } from '../site'
import { ChapterSheet, elapsedSentence } from './ChapterSheet'

export { minutes } from './ChapterSheet'

// Running head: the chapter you are in. Folio: how far from the singularity.
export function Hud({ nav = PORTFOLIO }: { nav?: SiteNav }) {
  const phone = usePhone()
  // every row by its section key, for the phone's running head
  const rowByKey = useMemo(
    () => Object.fromEntries(nav.contents.flatMap((r) => [r, ...(r.children ?? [])]).map((r) => [r.key, r])) as Record<string, ChapterRow>,
    [nav],
  )
  const first = Object.keys(nav.heads)[0]
  const sheetWidth = useMedia(COMPACT_QUERY)
  const hud = useRef<HTMLDivElement>(null)
  const folio = useRef<HTMLSpanElement>(null)
  const elapsed = useRef<HTMLSpanElement>(null)
  const [sound, setSound] = useState(audio.enabled)
  const [marks, setMarks] = useState<{ key: string; y: number }[]>([])
  // phones: where each section starts, since one phone section can run for several screens
  const tops = useRef<{ key: string; top: number }[]>([])
  const [current, setCurrent] = useState(first)
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
    let key = first
    if (phone) {
      // the section whose top has passed the middle of the screen
      for (const t of tops.current) if (state.scrollY >= t.top - window.innerHeight * 0.5) key = t.key
    } else {
      // the chapter whose anchor we most recently passed
      for (const m of marks) if (state.scrollY >= m.y - window.innerHeight * 0.5) key = m.key
    }
    if (key !== current) setCurrent(key)
  })

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

  const [num, title] = nav.heads[current] ?? ['', '']
  // the phone's running head names the exact part, as the chapter sheet does; on the opening screen it is the contents
  const row = rowByKey[current]
  const opening = current === first
  const [pNum, pTitle] = row ? [row.num, row.title] : opening ? [nav.opening.num, nav.opening.title] : [num, title]
  const runheadName = opening ? nav.opening.name : `${pNum ? `${pNum} ` : ''}${pTitle}, all chapters`

  return (
    <>
      <div className="hud at-top" ref={hud}>
        <div className="head">
          <a
            className="wordmark"
            href={nav.home === 0 ? '#top' : String(nav.home)}
            onClick={follow(nav.home)}
            aria-label={nav.home === 0 ? `${brand.mark}, back to the top` : `${brand.mark}, the portfolio`}
          >
            Voidbyte
          </a>
          <span className="chapter" aria-live="off">
            {num ? <b>{num}</b> : null}
            {title}
          </span>
          <div className="head-right">
            {nav.links.map((l) =>
              l.external ? (
                <a key={l.label} href={String(l.to)} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              ) : (
                <a key={l.label} href={String(l.to)} onClick={follow(l.to)}>
                  {l.label}
                </a>
              ),
            )}
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
      {sheetWidth ? (
        <ChapterSheet contents={nav.contents} open={sheetOpen} current={current} sound={sound} keyboard={fromKeyboard} onClose={closeSheet} />
      ) : null}
    </>
  )
}
