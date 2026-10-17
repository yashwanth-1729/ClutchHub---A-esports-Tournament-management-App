import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { audio } from '../audio/VoidAudio'
import { scrollToTarget, state } from '../engine/engine'
import { useFrame } from '../lib/hooks'
import { brand, links } from '../content'

function human(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return m ? `${m}m ${String(sec).padStart(2, '0')}s` : `${sec}s`
}

export function Contact() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('Your mail app opens with the message already written, so it really does reach me.')
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const note = useRef<HTMLParagraphElement>(null)
  const acc = useRef(0)

  useFrame((dt) => {
    acc.current += dt
    if (acc.current < 0.5 || !note.current) return
    acc.current = 0
    note.current.textContent = `You fell for ${human(state.proper)}. Outside, ${human(state.outside)} went by.`
  })

  const mailto = (body: string) =>
    `mailto:${links.email}?subject=${encodeURIComponent('From the void')}&body=${encodeURIComponent(body)}`

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const msg = text.trim()
    if (!msg || sent) return
    setSent(true)
    const field = input.current!
    const box = field.getBoundingClientRect()
    const cs = getComputedStyle(field)

    // lay the letters over the input, then let the hole take them
    const layer = document.createElement('div')
    layer.className = 'spag'
    layer.style.left = `${box.left + parseFloat(cs.paddingLeft)}px`
    layer.style.top = `${box.top}px`
    layer.style.height = `${box.height}px`
    layer.style.lineHeight = `${box.height}px`
    layer.style.fontSize = cs.fontSize
    layer.setAttribute('aria-hidden', 'true')
    for (const ch of msg.slice(0, 160)) {
      const s = document.createElement('span')
      s.textContent = ch
      layer.appendChild(s)
    }
    document.body.appendChild(layer)
    setText('')

    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const spans = Array.from(layer.children) as HTMLElement[]
    const tl = gsap.timeline({
      onComplete: () => {
        layer.remove()
      },
    })
    spans.forEach((s, i) => {
      const r = s.getBoundingClientRect()
      const dx = cx - (r.left + r.width / 2)
      const dy = cy - (r.top + r.height / 2)
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI
      tl.to(
        s,
        {
          x: dx,
          y: dy,
          rotation: ang,
          scaleX: 7,
          scaleY: 0.12,
          opacity: 0,
          duration: 1.5 + Math.random() * 0.5,
          ease: 'power3.in',
        },
        Math.abs(i - spans.length / 2) * 0.012,
      )
    })

    audio.swallow()
    gsap
      .timeline()
      .to(state, { plunge: 1, duration: 2.2, ease: 'power3.in' }, 0.2)
      .to(state, { flash: 1, duration: 0.15 }, 2.25)
      .add(() => {
        setStatus('Gone past the horizon. Your mail app should be open with it now; press send there and it reaches me.')
        window.location.href = mailto(msg)
      }, 2.4)
      .to(state, { plunge: 0, duration: 3.2, ease: 'power2.out' }, 3.0)
      .add(() => setSent(false), 3.4)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${links.email}`
    }
  }

  return (
    <section id="contact" className="contact wrap" data-frame="contact" aria-labelledby="contact-h">
      <p className="label">
        <b>V.</b>The horizon
      </p>
      <h2 id="contact-h">
        Say something
        <br />
        into the void.
      </h2>
      <form className="void-form" onSubmit={send}>
        <label className="sr-only" htmlFor="void-msg">
          Your message
        </label>
        <input
          id="void-msg"
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A project, a question, or just hello"
          maxLength={600}
          autoComplete="off"
        />
        <button type="submit" className="act" disabled={!text.trim() || sent} data-cursor="into the hole">
          send it in
        </button>
      </form>
      <p className="void-status" aria-live="polite">
        {status}
      </p>
      <p className="contact-links">
        Or write to{' '}
        <button onClick={copy} data-cursor={copied ? 'copied' : 'copy the address'}>
          {copied ? 'the address, now on your clipboard' : links.email}
        </button>
        , read the code on{' '}
        <a href={links.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        {links.instagram ? (
          <>
            , follow along on{' '}
            <a href={links.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </>
        ) : null}
        {links.linkedin ? (
          <>
            , find me on{' '}
            <a href={links.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </>
        ) : null}
        {links.website ? (
          <>
            , visit{' '}
            <a href={links.website} target="_blank" rel="noreferrer">
              {brand.mark}
            </a>
          </>
        ) : null}
        , or take the{' '}
        <a href={links.resume} target="_blank" rel="noreferrer">
          résumé
        </a>{' '}
        with you.
      </p>
      <p className="elapsed-note" ref={note} aria-hidden="true" />
      <footer className="colophon">
        <p>
          <b>Colophon.</b>
          Set in Newsreader, with IBM Plex Mono for anything a machine wrote. The black hole is ray-traced in your browser through Schwarzschild geometry, the debris is
          modelled in code with Three.js, the sound is synthesized as you fall, and the cryptography in chapter III is real. Designed and built by {brand.person} in 2026.{' '}
          {brand.mark}.
        </p>
        <button className="act" onClick={() => scrollToTarget(0, 5)} data-cursor="it takes a while">
          Climb back out
        </button>
      </footer>
    </section>
  )
}
