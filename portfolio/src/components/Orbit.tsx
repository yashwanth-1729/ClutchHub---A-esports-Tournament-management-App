import { Fragment, useRef } from 'react'
import { bookIndex, refTarget } from '../content'
import { focusTarget, scrollToTarget, state } from '../engine/engine'
import { useFrame, useInView, usePhone } from '../lib/hooks'

const ITEMS = bookIndex.map(([t]) => t)

/** Apparent radius of the black hole's shadow on screen, in CSS px. */
function shadowRadiusPx() {
  const r = Math.max(state.frame.r, 1.01)
  const sinA = Math.min(0.999, ((3 * Math.sqrt(3)) / 2) * Math.sqrt(1 - 1 / r) / r)
  const fov = state.viewW / state.viewH < 0.9 ? state.frame.fov * 1.25 : state.frame.fov
  return (Math.tan(Math.asin(sinA)) / Math.tan(fov / 2)) * (state.viewH / 2)
}

/** Follow an index reference: scroll to the part it names and hand focus to its heading. */
function follow(e: React.MouseEvent, r: string) {
  e.preventDefault()
  const to = refTarget[r] === '#top' ? 0 : refTarget[r]
  scrollToTarget(to)
  focusTarget(to)
}

/** The index on a phone: one column, the term on the left, a dotted leader (drawn in CSS), its references on the right. */
function PhoneIndex() {
  let letter = ''
  return (
    <div className="pindex">
      <div className="pindex-head">
        <h3 className="label pindex-title">Index</h3>
        <p className="pindex-note">II.1 is chapter II, part 1. {state.touch ? 'Tap a reference to go there.' : 'Each reference is a link.'}</p>
      </div>
      <ul className="pindex-list">
        {bookIndex.map(([term, refs]) => {
          const first = term[0].toUpperCase()
          const head = first !== letter
          letter = first
          return (
            <li key={term} className={head ? 'pi-row is-head' : 'pi-row'}>
              <span className="pi-letter" aria-hidden="true">
                {head ? first : ''}
              </span>
              <span className="pi-term">{term}</span>
              <span className="pi-refs">
                {refs.map((r, i) => (
                  <Fragment key={r}>
                    {refTarget[r] ? (
                      <a className="pi-ref" href={refTarget[r]} onClick={(e) => follow(e, r)}>
                        {r}
                      </a>
                    ) : (
                      <span className="pi-ref is-plain">{r}</span>
                    )}
                    {i < refs.length - 1 ? (
                      <span className="pi-sep" aria-hidden="true">
                        ,
                      </span>
                    ) : null}
                  </Fragment>
                ))}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Orbit() {
  const phone = usePhone()
  const section = useRef<HTMLElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const inView = useInView(section)
  const t = useRef(0)

  useFrame((dt) => {
    const sec = section.current
    const host = ring.current
    if (!sec || !host || !inView) return
    t.current += dt
    const rect = sec.getBoundingClientRect()
    const vh = window.innerHeight
    const vw = window.innerWidth
    const p = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)))
    const spin = (state.reduced ? 0 : t.current * 0.06) + p * Math.PI * 3
    const shadow = shadowRadiusPx()
    const Rx = Math.max(shadow * 1.6, Math.min(vw * 0.44, vh * 0.85))
    const kids = host.children as HTMLCollectionOf<HTMLElement>
    for (let i = 0; i < kids.length; i++) {
      const th = spin + (i / kids.length) * Math.PI * 2
      const x = Math.cos(th) * Rx
      const y = Math.sin(th) * Rx * 0.2
      const front = Math.sin(th) > 0
      const hidden = !front && Math.abs(x) < shadow * 1.02
      const depth = (Math.sin(th) + 1) / 2
      const el = kids[i]
      el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(0.72 + depth * 0.4).toFixed(3)})`
      el.style.opacity = hidden ? '0.03' : (0.25 + depth * 0.75).toFixed(2)
      el.style.zIndex = front ? '2' : '0'
    }
  })

  return (
    <section id="orbit" className="orbit" data-frame="orbit" ref={section} aria-labelledby="orbit-h">
      <div className="orbit-stage">
        <div className="orbit-head backed">
          <div className="opener">
            <p className="numeral" aria-hidden="true">
              IV.
            </p>
            <h2 id="orbit-h">The photon sphere</h2>
          </div>
          <p className="lede">At one and a half Schwarzschild radii, light can circle a black hole indefinitely. These are the things that keep coming around in my work.</p>
        </div>
        {phone ? (
          <PhoneIndex />
        ) : (
          <>
            <div className="ring" aria-hidden="true">
              <div className="ring-host" ref={ring}>
                {ITEMS.map((t) => (
                  <span key={t} className="ring-item">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="index">
              <p className="index-title">Index</p>
              {bookIndex.map(([term, refs]) => (
                <p key={term}>
                  {term},{' '}
                  {refs.map((r, i) => (
                    <span key={r}>
                      {refTarget[r] ? (
                        <a href={refTarget[r]} onClick={(e) => follow(e, r)}>
                          {r}
                        </a>
                      ) : (
                        <i>{r}</i>
                      )}
                      {i < refs.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
