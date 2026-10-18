import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { state } from '../../engine/engine'
import { Chars } from '../../lib/Chars'
import { usePhone } from '../../lib/hooks'
import { Scribble } from '../Scribble'
import { SldtProtocol } from './SldtProtocol'
import { SldtLab } from './SldtLab'

const FOUND = [
  ['A fine-grained token can’t make a repository’s first commit.', 'A documented GitHub limit rather than a bug. A new store is seeded with one file by hand, once.'],
  ['Losing the race during the very first publish crashed the cycle.', 'It now restarts the cycle like any other lost race on the manifest, with a regression test that fakes the stale read that caused it.'],
  ['Retries without a delay burned out in milliseconds.', 'Exponential backoff from 300 ms to 8 s, and a budget raised from five attempts to eight for a dataset’s first sync.'],
  ['A stale read looks exactly like “nothing new”.', 'Nothing in the response gives it away, so no protocol can detect it. Periodic pulls catch up; the live test now polls the way a real deployment does.'],
]

export function SldtChapter() {
  const intro = useRef<HTMLElement>(null)
  const notes = useRef<HTMLElement>(null)
  // small copy differences on a phone: the lab there has its own Laptop / Phone / Store tabs,
  // so "this tab" would be ambiguous, and the lede needs one word kept with its neighbour
  const phone = usePhone()

  useEffect(() => {
    if (state.reduced) return
    const ctx = gsap.context(() => {
      gsap.from(intro.current!.querySelectorAll('.numeral, .opener h2 .ch'), {
        yPercent: 50,
        scaleY: 2.4,
        opacity: 0,
        transformOrigin: '50% 100%',
        stagger: 0.03,
        duration: 1.3,
        ease: 'expo.out',
        scrollTrigger: { trigger: intro.current, start: 'top 70%' },
      })
      gsap.from(intro.current!.querySelectorAll('.lede, .prose p'), {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: intro.current, start: 'top 55%' },
      })
      gsap.from(notes.current!.querySelectorAll('.notes li, .tally p'), {
        opacity: 0,
        y: 24,
        stagger: 0.07,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: notes.current, start: 'top 70%' },
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <>
      <section className="sldt-intro wrap" id="inside-sldt" data-frame="sldtIntro" ref={intro} aria-labelledby="sldt-thesis">
        <div className="opener">
          <p className="numeral" aria-hidden="true">
            III.
          </p>
          <h2 id="sldt-thesis">
            <span className="tidal">
              <Chars text="Sync without a server" />
            </span>
          </h2>
        </div>
        <div className="thesis-cols backed">
          <p className="lede">
            Most sync needs a database and a server you have to trust. SLDT needs neither. Any storage that can serve bytes by path and refuse a stale write becomes a sync
            {/* on a narrow phone "backend" would be left alone on a line above the underlined phrase */}
            {phone ? ' ' : ' '}backend{' '}
            <span className="marked">
              without ever knowing it is one
              <Scribble kind="underline" style={{ left: 0, right: 0, bottom: '-0.25em', height: '0.5em', width: '100%' }} delay={0.6} />
            </span>
            .
          </p>
          <div className="prose">
            <p>
              I designed it for the open-source edition of JARVIS: the same job as the paid app’s Supabase mirror, with a different trust model. The store, in practice
              a GitHub repository, never sees plaintext and never holds a secret. There are no accounts: a recovery code is the identity, and if you lose it the data is gone, by design.
            </p>
            <p>
              Desktop and Android hold their own write token. A web build writes through a small stateless proxy instead, so no page ever ships a secret to its
              visitors. The next few screens take the protocol apart, then hand you a working copy to attack.
            </p>
          </div>
        </div>
      </section>

      <SldtProtocol />

      <section className="sldt-lab wrap" data-frame="sldtLab" aria-labelledby="lab-h">
        <figure className="lab-figure">
          <div className="lab-intro backed">
            <p className="label" id="lab-h">
              <b>III.6</b>A working copy
            </p>
            <p className="lede">Two devices and one dumb store, running the real primitives in your browser. Edit, race, then attack the store and watch the protocol refuse.</p>
          </div>
          <SldtLab />
          <figcaption>
            <b>Fig. 5.</b>
            A miniature of SLDT: the same Argon2id identity, padded AES-256-GCM envelopes, HMAC-signed and hash-chained manifest, compare-and-swap writes and conflict rule
            as the real engine. Only the store is pretend; it lives in this {phone ? 'page’s' : 'tab’s'} memory instead of a GitHub repository.
          </figcaption>
        </figure>
      </section>

      <section className="sldt-notes wrap" data-frame="sldtNotes" ref={notes} aria-labelledby="notes-h">
        <p className="label" id="notes-h">
          <b>III.7</b>Field notes from the first live run against GitHub
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
          <p>
            <span className="tally-n">92</span>assertions across eight test files
          </p>
          <p>
            <span className="tally-n">15</span>more for the stateless write proxy
          </p>
          <p>
            <span className="tally-n">8</span>of 8 checks passing live against the real GitHub API
          </p>
          <p>
            <span className="tally-n">0</span>servers that ever see your plaintext
          </p>
        </div>
        <p className="threat">
          The limits, written down rather than hidden: it is single-user, multi-device sync, not a CRDT, so two people editing one record at once will lose an edit. The store
          still sees timing and rough sizes. Both are accepted in the threat model.
        </p>
      </section>
    </>
  )
}
