import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects, type Project, type ProjectId } from '../content'
import { FRAMES, refreshAnchors, state } from '../engine/engine'
import { Chars } from '../lib/Chars'
import { usePhone } from '../lib/hooks'
import { JarvisDemo } from './demos/JarvisDemo'
import { HospitalDemo } from './demos/HospitalDemo'
import { ClutchDemo } from './demos/ClutchDemo'
import { SldtDemo } from './demos/SldtDemo'

const DEMOS: Record<ProjectId, () => ReactNode> = {
  jarvis: () => <JarvisDemo />,
  hospital: () => <HospitalDemo />,
  clutchhub: () => <ClutchDemo />,
  sldt: () => <SldtDemo />,
}

// The figure sits over the black hole; the text sits where the sky is clear.
const FLIPPED: Record<ProjectId, boolean> = { jarvis: true, hospital: false, clutchhub: true, sldt: false }

// How far the figure drifts and tilts on its way through. On a phone the words sit
// directly above and below it, so it moves a short way and stays level.
const DRIFT = {
  desk: { tiltIn: 3, tiltOut: 2, yIn: 110, yOut: -80 },
  phone: { tiltIn: 0, tiltOut: 0, yIn: 28, yOut: -20 },
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)' // --ease

// While a panel opens or closes, the page's height is held still. The engine
// re-measures every section and refreshes every ScrollTrigger whenever <body>
// changes size, and a height animation would make it do that on every frame.
// Once the panel settles, the page is measured once.
let holds = 0
function holdPage() {
  const b = document.body
  holds++
  b.style.height = ''
  b.style.height = `${b.getBoundingClientRect().height}px`
}
function releasePage() {
  holds = Math.max(0, holds - 1)
  if (!holds) document.body.style.height = ''
}
function settle() {
  ScrollTrigger.refresh()
  refreshAnchors()
}

/** "Agent, voice, interface and memory": what the panel holds, from its run-in heads. */
function peek(p: Project) {
  const h = p.built.map(([head]) => head.replace(/\.$/, '').toLowerCase())
  const list = h.length > 1 ? `${h.slice(0, -1).join(', ')} and ${h[h.length - 1]}` : h[0]
  return `${list.charAt(0).toUpperCase()}${list.slice(1)}. Stack and source.`
}

function Prose({ p }: { p: Project }) {
  return (
    <div className="prose">
      {p.built.map(([h, t]) => (
        <p key={h}>
          <span className="runin">{h}</span>
          {t}
        </p>
      ))}
    </div>
  )
}

function Sidenote({ p }: { p: Project }) {
  return (
    <p className="sidenote">
      Built with {p.stack.slice(0, -1).join(', ')} and {p.stack[p.stack.length - 1]}. Read the{' '}
      <a href={p.source} target="_blank" rel="noreferrer" data-cursor="opens GitHub">
        source
      </a>
      {p.live ? (
        <>
          {' '}
          or{' '}
          <a href={p.live} target="_blank" rel="noreferrer" data-cursor="opens the app">
            use it
          </a>
        </>
      ) : null}
      .
    </p>
  )
}

/** Phones only: the build notes and the stack, folded under one row until asked for. */
function Built({ p }: { p: Project }) {
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  // stops the animation in flight and tidies up after it
  const moving = useRef<(() => void) | null>(null)
  const id = `${p.id}-built`

  useEffect(() => () => moving.current?.(), [])

  const toggle = () => {
    const el = panel.current
    if (!el) return
    const next = !open
    setOpen(next)
    // start from wherever the panel stands now, even halfway through a move
    const fromH = el.hidden ? 0 : el.getBoundingClientRect().height
    const fromO = el.hidden ? 0 : Number(getComputedStyle(el).opacity)
    moving.current?.()
    el.hidden = false
    const toH = next ? el.getBoundingClientRect().height : 0
    if (state.reduced) {
      el.hidden = !next
      settle()
      return
    }
    holdPage()
    el.style.overflow = 'hidden'
    const a = el.animate(
      [
        { height: `${fromH}px`, opacity: fromO },
        { height: `${toH}px`, opacity: next ? 1 : 0 },
      ],
      { duration: next ? 560 : 420, easing: EASE, fill: 'forwards' },
    )
    const tidy = () => {
      el.style.overflow = ''
      releasePage()
    }
    moving.current = () => {
      moving.current = null
      a.onfinish = null
      a.cancel()
      tidy()
    }
    a.onfinish = () => {
      moving.current = null
      if (!next) el.hidden = true
      a.cancel()
      tidy()
      settle()
    }
  }

  return (
    <div className="built">
      <button type="button" className="built-toggle" aria-expanded={open} aria-controls={id} onClick={toggle}>
        <span className="built-head">
          <span className="label">How it’s built</span>
          <span className="built-peek" aria-hidden="true">
            {peek(p)}
          </span>
        </span>
        <span className="built-sign" aria-hidden="true" />
      </button>
      {/* hidden is set once here and then driven by toggle(); React never rewrites an unchanged prop */}
      <div className="built-panel" id={id} ref={panel} hidden>
        <Prose p={p} />
        <Sidenote p={p} />
      </div>
    </div>
  )
}

function ProjectSection({ p, fig }: { p: Project; fig: number }) {
  const ref = useRef<HTMLElement>(null)
  const phone = usePhone()

  useEffect(() => {
    const el = ref.current!
    const ctx = gsap.context(() => {
      if (state.reduced) return
      // on a phone the title sits a screen below the section's top, so it waits for itself
      gsap.from(el.querySelectorAll('.title .ch'), {
        yPercent: phone ? 50 : 70,
        scaleY: phone ? 1.6 : 2.2,
        opacity: 0,
        transformOrigin: '50% 100%',
        stagger: 0.03,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: phone ? { trigger: el.querySelector('.title'), start: 'top 90%' } : { trigger: el, start: 'top 72%' },
      })
      gsap.from(el.querySelectorAll('.project-copy > :not(.title)'), {
        y: phone ? 16 : 24,
        opacity: 0,
        stagger: 0.07,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: phone ? { trigger: el.querySelector('.project-copy'), start: 'top 88%' } : { trigger: el, start: 'top 62%' },
      })
      if (phone)
        gsap.from(el.querySelectorAll('.project-read > *'), {
          y: 16,
          opacity: 0,
          stagger: 0.07,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el.querySelector('.project-read'), start: 'top 90%' },
        })
      // the figure drifts in tilted, settles while you read it, drifts out;
      // on a phone the whole plate moves, caption included, so it keeps its dark ground
      const figEl = el.querySelector(phone ? '.project-stage' : '.figure')
      const flip = FLIPPED[p.id] ? -1 : 1
      const d = phone ? DRIFT.phone : DRIFT.desk
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
        .fromTo(figEl, { rotateZ: -d.tiltIn * flip, y: d.yIn, transformPerspective: 1400 }, { rotateZ: 0, y: 0, ease: 'power2.out', duration: 1 })
        .to(figEl, { rotateZ: d.tiltOut * flip, y: d.yOut, ease: 'power2.in', duration: 1 }, 1.25)
    }, el)
    return () => ctx.revert()
  }, [p.id, phone])

  const label = (
    <p className="label">
      <b>{p.index}</b>found at <i>r</i> = {FRAMES[p.id].r.toFixed(1)}
    </p>
  )
  const title = (
    <h3 className="title" id={`${p.id}-title`}>
      <span className="tidal">
        <Chars text={p.title} />
      </span>
    </h3>
  )
  const kicker = <p className="kicker">{p.kicker}</p>
  const original = p.original ? (
    <p className="original">
      An architecture I designed, with <a href="/sids">a page of its own</a>.
    </p>
  ) : null
  const stage = (
    <figure className="project-stage">
      <div className="figure">{DEMOS[p.id]()}</div>
      <figcaption>
        <b>Fig. {fig}.</b>
        {state.touch && p.figureTouch ? p.figureTouch : p.figure}
      </figcaption>
    </figure>
  )

  if (phone)
    // A phone reads top to bottom: open sky for the debris, the name, the working
    // model, then the story, with the build notes folded away until asked for.
    return (
      <section ref={ref} id={p.id} data-frame={p.id} className={`project wrap ${FLIPPED[p.id] ? 'flip' : ''}`} aria-labelledby={`${p.id}-title`}>
        <div className="project-grid">
          <div className="project-artifact" aria-hidden="true" />
          <div className="project-copy backed">
            {label}
            {title}
            {kicker}
            {original}
          </div>
          {stage}
          <div className="project-read backed">
            <p className="lede">{p.lead}</p>
            <Built p={p} />
          </div>
        </div>
      </section>
    )

  return (
    <section ref={ref} id={p.id} data-frame={p.id} className={`project wrap ${FLIPPED[p.id] ? 'flip' : ''}`} aria-labelledby={`${p.id}-title`}>
      <div className="project-grid">
        <div className="project-copy backed">
          {label}
          {title}
          {kicker}
          {original}
          <p className="lede">{p.lead}</p>
          <Prose p={p} />
          <Sidenote p={p} />
        </div>
        <div className="project-artifact" aria-hidden="true" />
        {stage}
      </div>
    </section>
  )
}

export function Work() {
  const intro = useRef<HTMLElement>(null)
  const phone = usePhone()

  useEffect(() => {
    const el = intro.current!
    const ctx = gsap.context(() => {
      if (state.reduced) return
      // a shorter stretch on a phone, where the lede sits close under the title
      gsap.from(el.querySelectorAll('.numeral, .opener h2 .ch'), {
        yPercent: phone ? 30 : 50,
        scaleY: phone ? 1.5 : 2.4,
        opacity: 0,
        transformOrigin: '50% 100%',
        stagger: 0.05,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 70%' },
      })
      gsap.from(el.querySelectorAll('.lede'), { opacity: 0, y: phone ? 12 : 20, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 55%' } })
    }, el)
    return () => ctx.revert()
  }, [phone])

  return (
    <>
      <section id="work" ref={intro} className="work-intro wrap" data-frame="work" aria-labelledby="work-h">
        <div className="opener">
          <p className="numeral" aria-hidden="true">
            II.
          </p>
          <h2 id="work-h">
            <span className="tidal">
              <Chars text="Debris" />
            </span>
          </h2>
        </div>
        <p className="lede">Four things I built, caught in the fall. Each one comes with a small working model of how it behaves.</p>
      </section>
      {projects.map((p, i) => (
        <ProjectSection key={p.id} p={p} fig={i + 1} />
      ))}
    </>
  )
}
