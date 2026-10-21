import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { state } from '../../engine/engine'
import { Chars } from '../../lib/Chars'
import { usePhone } from '../../lib/hooks'
import { follow } from '../../lib/nav'
import { links } from '../../content'
import { SIDS_SOURCE } from '../../site'
import { Scribble } from '../Scribble'
import { SldtLab } from '../sldt/SldtLab'
import { CompareDiagram, ComparePanel } from './CompareDiagram'

export const HOOK = 'A darkmatter from Voidbyte: it holds everything together while staying invisible.'

/** The plate: the word SIDS behind the hole, the way the portfolio opens on its author's name. */
export function SidsHero() {
  return (
    <section className="hero wrap sids-hero" data-frame="sidsHero" id="top">
      <h1 className="sr-only" tabIndex={-1}>
        SIDS, Server-Independent Data Sync. {HOOK}
      </h1>
      <div className="hero-grid">
        <div className="hero-intro rise" style={{ ['--d' as string]: '0.1s' }}>
          <p className="label">
            <b>SIDS</b>Server-Independent Data Sync
          </p>
          <p className="lede">
            {HOOK} <em>Scroll, and see how.</em>
          </p>
        </div>
        <p className="hero-cue rise" style={{ ['--d' as string]: '0.35s' }} aria-hidden="true">
          <span className="label">Scroll</span>
          <span className="cue-line" />
        </p>
        <p className="plate-cap rise" style={{ ['--d' as string]: '0.5s' }}>
          <span className="label">Plate II</span>
          Four letters behind a black hole. The store at the heart of SIDS is the same kind of object: it holds everything your devices give it, and can read
          none of it.
        </p>
      </div>
    </section>
  )
}

export function SidsWhy() {
  const el = useRef<HTMLElement>(null)
  useEffect(() => {
    if (state.reduced) return
    const ctx = gsap.context(() => {
      gsap.from(el.current!.querySelectorAll('.why-head > *, .cmp-col, .why-prose p'), {
        opacity: 0,
        y: 24,
        stagger: 0.08,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el.current, start: 'top 70%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])
  return (
    <section className="sids-why wrap" id="why" data-frame="sidsWhy" ref={el} aria-labelledby="why-h">
      <div className="why-head backed">
        <p className="label" id="why-h">
          <b>01</b>Why it exists
        </p>
        <p className="why-statement">
          Most sync needs a database and a server you have to trust. SIDS needs{' '}
          <span className="marked">
            neither
            <Scribble kind="underline" style={{ left: 0, right: 0, bottom: '-0.2em', height: '0.5em', width: '100%' }} delay={0.4} />
          </span>
          .
        </p>
        <p className="lede">
          Any storage that can hand back bytes by path and refuse a stale write becomes a sync backend, without ever knowing it is one. No database, no accounts, no
          login.
        </p>
      </div>
      <CompareDiagram id="why" />
      <div className="why-prose prose backed">
        <p>
          I designed it for the open-source edition of JARVIS: the same job as the paid app’s Supabase mirror, with a different trust model. The store, in practice a
          GitHub repository, never sees plaintext and never holds a secret. A recovery code is the identity; lose it and the data is gone, by design.
        </p>
        <p>
          Desktop and Android hold their own write token. A web build writes through a small stateless relay instead, so no page ever ships a secret to its visitors.
          The relay sees only sealed bytes and keeps nothing.
        </p>
      </div>
    </section>
  )
}

export function SidsLab() {
  const phone = usePhone()
  return (
    <section className="sldt-lab wrap" id="try" data-frame="sidsLab" aria-labelledby="lab-h">
      <figure className="lab-figure">
        <div className="lab-intro backed">
          <p className="label" id="lab-h">
            <b>03</b>Try it
          </p>
          <p className="lede">Two devices and one dumb store, running the real primitives in your browser. Edit, race, then attack the store and watch the protocol refuse.</p>
        </div>
        <SldtLab />
        <figcaption>
          <b>Fig. 2.</b>
          A miniature of SIDS: the same Argon2id identity, padded AES-256-GCM envelopes, HMAC-signed and hash-chained manifest, compare-and-swap writes and conflict rule
          as the real engine. Only the store is pretend; it lives in this {phone ? 'page’s' : 'tab’s'} memory instead of a GitHub repository.
        </figcaption>
      </figure>
    </section>
  )
}

const FOUND = [
  ['A fine-grained token can’t make a repository’s first commit.', 'A documented GitHub limit rather than a bug. A new store is seeded with one file by hand, once.'],
  ['Losing the race during the very first publish crashed the cycle.', 'It now restarts the cycle like any other lost race on the manifest, with a regression test that fakes the stale read that caused it.'],
  ['Retries without a delay burned out in milliseconds.', 'Exponential backoff from 300 ms to 8 s, and a budget raised from five attempts to eight for a dataset’s first sync.'],
  ['A stale read looks exactly like “nothing new”.', 'Nothing in the response gives it away, so no protocol can detect it. Periodic pulls catch up; the live test now polls the way a real deployment does.'],
]

const TALLY: [number, string, string?][] = [
  [92, 'assertions across eight test files'],
  [15, 'more for the stateless write relay'],
  [8, 'checks passing live against the real GitHub API', 'of 8'],
  [0, 'servers that ever see your plaintext'],
]

export function SidsNotes() {
  const el = useRef<HTMLElement>(null)
  useEffect(() => {
    const nums = Array.from(el.current!.querySelectorAll<HTMLElement>('.tally-n[data-n]'))
    if (state.reduced) return
    const ctx = gsap.context(() => {
      gsap.from(el.current!.querySelectorAll('.notes li, .tally p'), {
        opacity: 0,
        y: 24,
        stagger: 0.07,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el.current, start: 'top 70%' },
      })
      // the numbers count up once, the first time they come into view
      nums.forEach((n) => {
        const to = Number(n.dataset.n)
        const o = { v: 0 }
        n.textContent = '0'
        gsap.to(o, {
          v: to,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => (n.textContent = String(Math.round(o.v))),
          scrollTrigger: { trigger: n, start: 'top 85%', once: true },
        })
      })
    }, el)
    return () => ctx.revert()
  }, [])
  return (
    <section className="sldt-notes wrap" id="notes" data-frame="sidsNotes" ref={el} aria-labelledby="notes-h">
      <p className="label" id="notes-h">
        <b>04</b>Field notes from the first live run against GitHub
      </p>
      <ol className="notes backed">
        {FOUND.map(([t, d], i) => (
          <li key={i}>
            <span className="note-n">{i + 1}</span>
            <p>
              <span className="runin">{t}</span> {d}
            </p>
          </li>
        ))}
      </ol>
      <div className="tally">
        {TALLY.map(([n, text, of]) => (
          <p key={text}>
            <span className="tally-n" data-n={n}>
              {n}
            </span>
            {of ? `${of} ` : ''}
            {text}
          </p>
        ))}
      </div>
      <p className="threat">
        The limits, written down rather than hidden: it is single-user, multi-device sync, not a CRDT, so two people editing one record at once will lose an edit. The store
        still sees timing and rough sizes. Both are accepted in the threat model.
      </p>
    </section>
  )
}

export function SidsEnd() {
  return (
    <section className="sids-end wrap" id="use" data-frame="sidsEnd" aria-labelledby="use-h">
      <div className="end-inner backed">
        <p className="label" id="use-h">
          <b>05</b>Use it
        </p>
        <h2 className="end-title">Holds everything. Shows nothing.</h2>
        <p className="lede">
          SIDS runs today inside the open-source edition of JARVIS. A standalone library is on its way, for TypeScript and JavaScript first and Python next, so any app
          can sync this way in a few lines.
        </p>
        <ul className="end-rows">
          <li>
            <a className="end-row" href={SIDS_SOURCE} target="_blank" rel="noreferrer">
              <span className="end-name">Read the source</span>
              <span className="end-does label">GitHub</span>
            </a>
          </li>
          <li>
            <a className="end-row" href={`mailto:${links.email}?subject=SIDS`}>
              <span className="end-name">Talk to me about it</span>
              <span className="end-does label">Email</span>
            </a>
          </li>
          <li>
            <a className="end-row" href="/" onClick={follow('/')}>
              <span className="end-name">Back to the portfolio</span>
              <span className="end-does label">voidbyte.tech</span>
            </a>
          </li>
        </ul>
        <p className="end-colophon">SIDS was designed and built by Yashwanth Raj Cherukuru. Voidbyte, 2026.</p>
      </div>
    </section>
  )
}

/** Chapter III on the portfolio: one screen that opens the SIDS page. */
export function SidsDoor() {
  const el = useRef<HTMLElement>(null)
  useEffect(() => {
    if (state.reduced) return
    const ctx = gsap.context(() => {
      gsap.from(el.current!.querySelectorAll('.numeral, .opener h2 .ch'), {
        yPercent: 50,
        scaleY: 2.4,
        opacity: 0,
        transformOrigin: '50% 100%',
        stagger: 0.05,
        duration: 1.3,
        ease: 'expo.out',
        scrollTrigger: { trigger: el.current, start: 'top 70%' },
      })
      gsap.from(el.current!.querySelectorAll('.door-copy > :not(.opener), .door-art'), {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el.current, start: 'top 55%' },
      })
    }, el)
    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [])
  return (
    <section className="sids-door wrap" id="sids-door" data-frame="sidsDoor" ref={el} aria-labelledby="door-h">
      <div className="door-copy backed">
        <div className="opener">
          <p className="numeral" aria-hidden="true">
            III.
          </p>
          <h2 id="door-h">
            <span className="tidal">
              <Chars text="SIDS" />
            </span>
          </h2>
        </div>
        <p className="label">Server-Independent Data Sync</p>
        <p className="door-hook">{HOOK}</p>
        <p className="lede">Your devices share one locked notebook through storage that can’t open it. No server, no accounts, no database. An architecture I designed, with a page of its own: how it works, the field notes, and a working copy you can attack.</p>
        <a className="enter-btn door-btn" href="/sids">
          <span>Open SIDS</span>
          <span className="enter-arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>
      <div className="door-art" aria-hidden="true">
        <ComparePanel kind="sids" id="door" />
      </div>
    </section>
  )
}
