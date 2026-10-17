import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { projects, type Project, type ProjectId } from '../content'
import { FRAMES, state } from '../engine/engine'
import { Chars } from '../lib/Chars'
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

function ProjectSection({ p, fig }: { p: Project; fig: number }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current!
    const ctx = gsap.context(() => {
      if (state.reduced) return
      gsap.from(el.querySelectorAll('.title .ch'), {
        yPercent: 70,
        scaleY: 2.2,
        opacity: 0,
        transformOrigin: '50% 100%',
        stagger: 0.03,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 72%' },
      })
      gsap.from(el.querySelectorAll('.project-copy > :not(.title)'), {
        y: 24,
        opacity: 0,
        stagger: 0.07,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 62%' },
      })
      // the figure drifts in tilted, settles while you read it, drifts out
      const figEl = el.querySelector('.figure')
      const flip = FLIPPED[p.id] ? -1 : 1
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
        .fromTo(figEl, { rotateZ: -3 * flip, y: 110, transformPerspective: 1400 }, { rotateZ: 0, y: 0, ease: 'power2.out', duration: 1 })
        .to(figEl, { rotateZ: 2 * flip, y: -80, ease: 'power2.in', duration: 1 }, 1.25)
    }, el)
    return () => ctx.revert()
  }, [p.id])

  return (
    <section ref={ref} id={p.id} data-frame={p.id} className={`project wrap ${FLIPPED[p.id] ? 'flip' : ''}`} aria-labelledby={`${p.id}-title`}>
      <div className="project-grid">
        <div className="project-copy backed">
          <p className="label">
            <b>{p.index}</b>found at <i>r</i> = {FRAMES[p.id].r.toFixed(1)}
          </p>
          <h3 className="title" id={`${p.id}-title`}>
            <span className="tidal">
              <Chars text={p.title} />
            </span>
          </h3>
          <p className="kicker">{p.kicker}</p>
          {p.original ? <p className="original">An architecture I designed. Chapter III takes it apart.</p> : null}
          <p className="lede">{p.lead}</p>
          <div className="prose">
            {p.built.map(([h, t]) => (
              <p key={h}>
                <span className="runin">{h}</span>
                {t}
              </p>
            ))}
          </div>
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
        </div>
        <div className="project-artifact" aria-hidden="true" />
        <figure className="project-stage">
          <div className="figure">{DEMOS[p.id]()}</div>
          <figcaption>
            <b>Fig. {fig}.</b>
            {p.figure}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

export function Work() {
  const intro = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = intro.current!
    const ctx = gsap.context(() => {
      if (state.reduced) return
      gsap.from(el.querySelectorAll('.numeral, .opener h2 .ch'), {
        yPercent: 50,
        scaleY: 2.4,
        opacity: 0,
        transformOrigin: '50% 100%',
        stagger: 0.05,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 70%' },
      })
      gsap.from(el.querySelectorAll('.lede'), { opacity: 0, y: 20, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 55%' } })
    }, el)
    return () => ctx.revert()
  }, [])

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
