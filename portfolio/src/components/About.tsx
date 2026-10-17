import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// A trailing * sets a word in italic as it lights up.
const TEXT =
  'I build whole products. The part you touch:* onboarding, dashboards, gestures, the words on the buttons. And the part you don’t:* the APIs, the locks, the queues, the ciphers.'

export function About() {
  const section = useRef<HTMLElement>(null)
  const words = TEXT.split(' ').map((w) => ({ text: w.replace('*', ''), hot: w.endsWith('*') }))

  useEffect(() => {
    const el = section.current!
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>('.about-text .w'))
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 70%',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const lit = Math.floor(self.progress * spans.length * 1.25)
        spans.forEach((s, i) => s.classList.toggle('lit', i < lit))
      },
    })
    const tail = gsap.fromTo(
      el.querySelectorAll('.about-tail'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.15, ease: 'power2.out', scrollTrigger: { trigger: el, start: '45% bottom', end: '65% bottom', scrub: true } },
    )
    return () => {
      st.kill()
      tail.scrollTrigger?.kill()
      tail.kill()
    }
  }, [])

  return (
    <section className="about" data-frame="about" ref={section} aria-labelledby="about-h">
      <div className="sticky wrap">
        <div className="about-inner">
          <p className="label" id="about-h">
            <b>I.</b>Orientation
          </p>
          <p className="about-text">
            {words.map((w, i) => (
              <span key={i}>
                <span className={`w ${w.hot ? 'hot' : ''}`}>{w.text}</span>{' '}
              </span>
            ))}
          </p>
          <p className="about-tail">
            Most of my work lives in the gap between the two. I’m in the second year of a B.Tech in Computer Science at KL University, graduating in 2029, based in
            India, and <em>open to remote freelance work and internships.</em>
          </p>
        </div>
      </div>
    </section>
  )
}
