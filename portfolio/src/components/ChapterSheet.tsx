import { useCallback, useEffect, useRef } from 'react'
import { audio } from '../audio/VoidAudio'
import { FRAMES, getLenis, state } from '../engine/engine'
import { useFrame } from '../lib/hooks'
import { goTo, isPage, type Target } from '../lib/nav'
import type { ChapterRow } from '../site'

// a number never wraps away from its unit
export function minutes(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  if (!m) return `${sec} s`
  return `${m} min ${sec} s`
}

/** Proper time against the outside clock: the HUD sentence, shared with the phone's chapter sheet. */
export function elapsedSentence() {
  const you = state.proper
  return you < 2 ? 'Clocks start when you do.' : `For you, ${minutes(you)} have passed. Outside, ${minutes(state.outside)}.`
}

/** Height of the list's bottom fade; a row scrolled into view clears it. */
const FADE = 40

/** Scroll the list just enough that the row is in view and clear of the fade. */
function reveal(row: HTMLElement, list: HTMLElement) {
  const l = list.getBoundingClientRect()
  const r = row.getBoundingClientRect()
  if (r.bottom > l.bottom - FADE) list.scrollTop += r.bottom - l.bottom + FADE
  else if (r.top < l.top) list.scrollTop -= l.top - r.top
}

type Props = {
  /** The page's contents: chapters, with their parts beneath. */
  contents: ChapterRow[]
  open: boolean
  current: string
  sound: boolean
  /** Opened from the keyboard: the focused row shows its ring. A tap moves focus without one. */
  keyboard: boolean
  /** restore: hand focus back to the button that opened the sheet. */
  onClose: (restore: boolean) => void
}

/** Phones and small tablets: the whole fall on one screen, a tap from anywhere. */
export function ChapterSheet({ contents, open, current, sound, keyboard, onClose }: Props) {
  const sheet = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLElement>(null)
  const elapsed = useRef<HTMLParagraphElement>(null)
  const acc = useRef(0)
  const scrollLocked = useRef(false)

  // the page stands still behind the sheet
  const lockPage = useCallback(() => {
    if (scrollLocked.current) return
    scrollLocked.current = true
    const lenis = getLenis()
    if (lenis) lenis.stop()
    else document.documentElement.style.overflow = 'hidden'
  }, [])
  const releasePage = useCallback(() => {
    if (!scrollLocked.current) return
    scrollLocked.current = false
    const lenis = getLenis()
    if (lenis) lenis.start()
    else document.documentElement.style.overflow = ''
  }, [])

  // rows continue below the fold: the list fades out at the bottom to say so
  const measure = useCallback(() => {
    const l = list.current
    if (l) l.classList.toggle('has-more', l.scrollTop + l.clientHeight < l.scrollHeight - 2)
  }, [])

  useEffect(() => {
    if (!open) return
    lockPage()
    if (elapsed.current) elapsed.current.textContent = elapsedSentence()
    const el = sheet.current
    // focus lands on "you are here" (the first chapter while still on the plate), scrolled into view
    const here = el?.querySelector<HTMLElement>('.sheet-row[aria-current]') ?? el?.querySelector<HTMLElement>('.sheet-row')
    here?.focus({ preventScroll: true, focusVisible: keyboard } as FocusOptions)
    if (here && list.current) reveal(here, list.current)
    measure()

    // listened for on the document, so Escape and Tab work wherever a tap left focus
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose(true)
        return
      }
      if (e.key !== 'Tab' || !el) return
      const items = Array.from(el.querySelectorAll<HTMLElement>('button'))
      if (!items.length) return
      const i = items.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        items[items.length - 1].focus()
      } else if (!e.shiftKey && (i === -1 || i === items.length - 1)) {
        e.preventDefault()
        items[0].focus()
      }
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', measure)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', measure)
      releasePage()
    }
  }, [open, keyboard, onClose, lockPage, releasePage, measure])

  useFrame((dt) => {
    if (!open) return
    acc.current += dt
    if (acc.current < 0.25) return
    acc.current = 0
    if (elapsed.current) elapsed.current.textContent = elapsedSentence()
  })

  const go = (target: Target) => {
    // another page: leave the sheet as it is; the next page starts fresh
    if (isPage(target)) {
      goTo(target)
      return
    }
    // Lenis ignores scrollTo while stopped, so the page is let go first
    releasePage()
    onClose(false)
    goTo(target)
  }

  const row = (r: ChapterRow, sub: boolean) => {
    const here = r.key === current
    const r0 = FRAMES[r.key]?.r
    return (
      <button type="button" className={`sheet-row ${sub ? 'is-sub' : 'is-ch'}`} aria-current={here ? 'location' : undefined} onClick={() => go(r.target)}>
        <span className="sheet-num">{r.num}</span>
        <span className="sheet-title">{r.title}</span>
        {r0 !== undefined ? (
          <span className="sheet-r">
            {/* a ledger column: the first row names the variable, the rest give its value */}
            <span className="sheet-r-eq">
              <i>r</i> ={' '}
            </span>
            {r0.toFixed(1)}
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <div
      ref={sheet}
      id="chapter-sheet"
      className={`sheet ${open ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-h"
      tabIndex={-1}
    >
      <div className="sheet-head">
        <p className="label" id="sheet-h">
          Chapters
        </p>
        <button type="button" className="sheet-close" onClick={() => onClose(true)}>
          Close
        </button>
      </div>
      <nav className="sheet-scroll" ref={list} aria-labelledby="sheet-h" data-lenis-prevent onScroll={measure} onTransitionEnd={measure}>
        <ol className="sheet-list">
          {contents.map((c) => (
            <li key={c.key} className="sheet-group">
              {row(c, false)}
              {c.children ? (
                <ol className="sheet-sub">
                  {c.children.map((s) => (
                    <li key={s.key}>{row(s, true)}</li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="sheet-note">
          <i>r</i> is the distance from the singularity, in Schwarzschild radii.
        </p>
      </nav>
      <div className="sheet-foot">
        <p className="sheet-elapsed" ref={elapsed} />
        <button type="button" className="sound" onClick={() => audio.toggle()} aria-pressed={sound}>
          {sound ? 'sound on' : 'sound off'}
        </button>
      </div>
    </div>
  )
}
