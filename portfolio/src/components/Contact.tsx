import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { audio } from '../audio/VoidAudio'
import { focusTarget, scrollToTarget, state } from '../engine/engine'
import { useFrame, usePhone } from '../lib/hooks'
import { brand, links } from '../content'

function human(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return m ? `${m}m ${String(sec).padStart(2, '0')}s` : `${sec}s`
}

const PLACEHOLDER = 'A project, a question, or just hello'

export function Contact() {
  const phone = usePhone()
  const [text, setText] = useState('')
  const [status, setStatus] = useState('Your mail app opens with the message already written, so it really does reach me.')
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  // kept after sending, in case no mail app answered the mailto: link
  const [lastMsg, setLastMsg] = useState('')
  const [msgCopied, setMsgCopied] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  // on a phone the message is written in a field that grows a line at a time
  const area = useRef<HTMLTextAreaElement>(null)
  const note = useRef<HTMLParagraphElement>(null)
  const acc = useRef(0)

  useFrame((dt) => {
    acc.current += dt
    if (acc.current < 0.5 || !note.current) return
    acc.current = 0
    note.current.textContent = `You fell for ${human(state.proper)}. Outside, ${human(state.outside)} went by.`
  })

  // fit the phone field to its words (or, while empty, to its placeholder).
  // While a message falls the field keeps its size, so the letters leave from where they were written.
  useEffect(() => {
    const el = area.current
    if (!phone || !el || sent) return
    const fit = () => {
      el.style.height = 'auto'
      let h = el.scrollHeight
      if (!el.value) {
        el.value = el.placeholder
        h = el.scrollHeight
        el.value = ''
      }
      el.style.height = `${h + el.offsetHeight - el.clientHeight}px`
    }
    fit()
    let live = true
    document.fonts?.ready.then(() => live && fit())
    window.addEventListener('resize', fit)
    return () => {
      live = false
      window.removeEventListener('resize', fit)
    }
  }, [phone, text, sent])

  const mailto = (body: string) =>
    `mailto:${links.email}?subject=${encodeURIComponent('From the void')}&body=${encodeURIComponent(body)}`

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const msg = text.trim()
    if (!msg || sent) return
    setSent(true)
    setLastMsg(msg)
    setMsgCopied(false)
    const done = 'Gone past the horizon. Your mail app should be open with it now; press send there and it reaches me.'

    if (state.reduced) {
      setText('')
      setStatus(done)
      window.location.href = mailto(msg)
      setSent(false)
      return
    }

    // on a phone the keyboard goes down first, so the fall can be seen
    const wrapped = phone && !!area.current
    const field = wrapped ? area.current! : input.current!
    if (wrapped && document.activeElement === field) field.blur()
    const box = field.getBoundingClientRect()
    const cs = getComputedStyle(field)

    // lay the letters over the input, then let the hole take them
    const layer = document.createElement('div')
    layer.className = 'spag'
    if (wrapped) {
      // the letters wrap as the field wrapped them; each is pinned where it was set
      const padL = parseFloat(cs.paddingLeft)
      const padR = parseFloat(cs.paddingRight)
      layer.style.left = `${box.left + field.clientLeft + padL}px`
      layer.style.top = `${box.top + field.clientTop + parseFloat(cs.paddingTop) - field.scrollTop}px`
      layer.style.width = `${field.clientWidth - padL - padR}px`
      layer.style.lineHeight = cs.lineHeight
      layer.style.whiteSpace = 'pre-wrap'
      layer.style.overflowWrap = 'break-word'
    } else {
      layer.style.left = `${box.left + parseFloat(cs.paddingLeft)}px`
      layer.style.top = `${box.top}px`
      layer.style.height = `${box.height}px`
      layer.style.lineHeight = `${box.height}px`
    }
    layer.style.fontSize = cs.fontSize
    layer.setAttribute('aria-hidden', 'true')
    for (const ch of msg.slice(0, 160)) {
      const s = document.createElement('span')
      s.textContent = ch
      if (wrapped) s.style.display = 'inline'
      layer.appendChild(s)
    }
    document.body.appendChild(layer)
    if (wrapped) {
      const origin = layer.getBoundingClientRect()
      const kids = Array.from(layer.children) as HTMLElement[]
      const at = kids.map((s) => s.getBoundingClientRect())
      kids.forEach((s, i) => {
        s.style.position = 'absolute'
        s.style.left = `${at[i].left - origin.left}px`
        s.style.top = `${at[i].top - origin.top}px`
        s.style.lineHeight = `${at[i].height}px`
      })
    }
    setText('')

    // the hole sits at the centre of the canvas box
    const cx = state.viewW / 2
    const cy = state.viewH / 2
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
        setStatus(done)
        window.location.href = mailto(msg)
      }, 2.4)
      .to(state, { plunge: 0, duration: 3.2, ease: 'power2.out' }, 3.0)
      .add(() => {
        setSent(false)
        // a phone would raise its keyboard again; there the field waits to be tapped
        if (!wrapped) input.current?.focus({ preventScroll: true })
      }, 3.4)
  }

  const gmail = (body: string) =>
    `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(links.email)}&su=${encodeURIComponent('From the void')}&body=${encodeURIComponent(body)}`

  const copyMsg = async () => {
    try {
      await navigator.clipboard.writeText(`${lastMsg}\n\n— to ${links.email}`)
      setMsgCopied(true)
    } catch {
      setMsgCopied(false)
    }
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

  const statusLine = (
    <p className="void-status" aria-live="polite">
      {status}
      {lastMsg && !sent ? (
        <>
          {' '}
          If nothing opened,{' '}
          <button className="act" onClick={copyMsg}>
            {msgCopied ? 'your message is on your clipboard' : 'copy your message'}
          </button>{' '}
          or{' '}
          <a className="act" href={gmail(lastMsg)} target="_blank" rel="noreferrer">
            write it in Gmail
          </a>
          .
        </>
      ) : null}
    </p>
  )

  // the phone's address book: one row per way to reach me, what a tap does on the right
  const elsewhere: { href: string; name: string; does: string }[] = [
    { href: links.github, name: 'GitHub', does: 'Read the code' },
    { href: links.instagram, name: 'Instagram', does: 'Follow along' },
    { href: links.linkedin, name: 'LinkedIn', does: 'Find me there' },
    { href: links.website, name: brand.mark, does: 'Visit' },
    { href: links.resume, name: 'Résumé', does: 'Take it with you' },
  ].filter((l) => l.href)

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
      {phone ? (
        <div className="contact-body">
          <form className="void-form" onSubmit={send}>
            <label className="sr-only" htmlFor="void-msg">
              Your message
            </label>
            <textarea
              id="void-msg"
              ref={area}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // return sends, as it does on the desktop line; shift and return breaks the line
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder={sent ? '' : PLACEHOLDER}
              maxLength={600}
              autoComplete="off"
              enterKeyHint="send"
            />
            <button type="submit" className="act void-send" aria-disabled={!text.trim() || sent}>
              <span>send it in</span>
              <span className="void-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </form>
          {statusLine}
          <div className="elsewhere">
            <p className="label elsewhere-title">Or find me here</p>
            <ul className="crows">
              <li>
                <button className="crow" onClick={copy}>
                  <span className="crow-name">{links.email}</span>
                  <span className="crow-does">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </li>
              {elsewhere.map((l) => (
                <li key={l.name}>
                  <a className="crow" href={l.href} target="_blank" rel="noreferrer">
                    <span className="crow-name">{l.name}</span>
                    <span className="crow-does">{l.does}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="sr-only" aria-live="polite">
              {copied ? 'The address is on your clipboard.' : ''}
            </p>
          </div>
        </div>
      ) : (
        <>
          <form className="void-form" onSubmit={send}>
            <label className="sr-only" htmlFor="void-msg">
              Your message
            </label>
            <input
              id="void-msg"
              ref={input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              maxLength={600}
              autoComplete="off"
            />
            <button type="submit" className="act" aria-disabled={!text.trim() || sent} data-cursor="into the hole">
              send it in
            </button>
          </form>
          {statusLine}
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
        </>
      )}
      <p className="elapsed-note" ref={note} aria-hidden="true" />
      <footer className="colophon">
        <p>
          <b>Colophon.</b>
          Set in Hubot Sans and Mona Sans, with Monaspace Neon for anything a machine wrote: one family, drawn to work together. The black hole is ray-traced in your browser through Schwarzschild geometry, the debris is
          modelled in code with Three.js, the sound is synthesized as you fall, and the cryptography in chapter III is real. Designed and built by {brand.person} in 2026.{' '}
          {brand.mark}.
        </p>
        <button
          className="act"
          onClick={() => {
            scrollToTarget(0, 5)
            focusTarget(0)
          }}
          data-cursor="it takes a while"
        >
          Climb back out
        </button>
      </footer>
    </section>
  )
}
