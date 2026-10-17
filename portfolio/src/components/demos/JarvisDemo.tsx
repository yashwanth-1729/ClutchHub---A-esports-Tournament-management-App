import { useEffect, useRef, useState } from 'react'
import { audio } from '../../audio/VoidAudio'
import { state } from '../../engine/engine'
import { signals } from '../../engine/signals'
import { useFrame, useInView } from '../../lib/hooks'

type Lang = 'en' | 'te' | 'hi'
const LINES: Record<Lang, { label: string; text: string; lang: string }> = {
  en: { label: 'English', text: 'Morning. Two study blocks today, the first one at seven. Want me to hold you to it?', lang: 'en' },
  te: { label: 'తెలుగు', text: 'శుభోదయం. ఈరోజు రెండు స్టడీ బ్లాక్స్ ఉన్నాయి, మొదటిది ఏడు గంటలకు.', lang: 'te' },
  hi: { label: 'Hinglish', text: 'Good morning! Aaj do study blocks hain, pehla saat baje. Lock in karein?', lang: 'hi-Latn' },
}
const LOCK_LINE = 'Locked in. I’ll keep everything else quiet until you’re done.'
const HOLD_MS = 1100

function Mascot({ talking, hovered }: { talking: boolean; hovered: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const inView = useInView(wrap)
  const s = useRef({ t: 0, blink: 0, nextBlink: 2, lookX: 0, lookY: 0, open: 1, talk: 0, ring: 0 })

  useFrame((dt) => {
    const c = canvas.current
    if (!c || !inView) return
    const g = c.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = c.clientWidth
    const H = c.clientHeight
    if (c.width !== Math.round(W * dpr)) {
      c.width = Math.round(W * dpr)
      c.height = Math.round(H * dpr)
    }
    const st = s.current
    st.t += dt
    st.ring += dt * (0.25 + state.lock * 1.4)

    // look toward the cursor
    const rect = c.getBoundingClientRect()
    const dx = state.mouse.x - (rect.left + W / 2)
    const dy = state.mouse.y - (rect.top + H / 2)
    const d = Math.hypot(dx, dy) || 1
    const reach = Math.min(1, d / 400)
    st.lookX += ((dx / d) * 9 * reach - st.lookX) * 0.12
    st.lookY += ((dy / d) * 6 * reach - st.lookY) * 0.12

    // blink
    st.nextBlink -= dt
    if (st.nextBlink < 0) {
      st.blink = 1
      st.nextBlink = 2.2 + Math.random() * 3.5
    }
    st.blink = Math.max(0, st.blink - dt * 7)
    const blinkK = 1 - Math.sin(Math.min(1, st.blink) * Math.PI) * 0.92

    const lock = state.lock
    st.talk += ((talking ? 1 : 0) - st.talk) * 0.15
    const voice = talking ? 0.35 + 0.65 * Math.abs(Math.sin(st.t * 11) * Math.sin(st.t * 4.3)) : 0
    signals.voice = voice * st.talk
    const wantOpen = hovered ? 1.18 : 1
    st.open += (wantOpen - st.open) * 0.1

    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, W, H)
    const cx = W / 2
    const cy = H / 2 - 6
    const R = Math.min(W, H) * 0.34

    const hot = `rgb(${255}, ${Math.round(150 - 110 * lock)}, ${Math.round(80 - 50 * lock)})`
    const warm = `rgba(236, 230, 219, ${0.18 + 0.1 * lock})`

    // halo
    const halo = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.7)
    halo.addColorStop(0, `rgba(255, ${Math.round(110 - 80 * lock)}, ${Math.round(50 - 30 * lock)}, ${0.16 + 0.12 * lock + voice * 0.12})`)
    halo.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = halo
    g.fillRect(0, 0, W, H)

    // body
    const body = g.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R)
    body.addColorStop(0, '#1d1714')
    body.addColorStop(1, '#070605')
    g.fillStyle = body
    g.beginPath()
    g.arc(cx, cy, R, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = warm
    g.lineWidth = 1
    g.stroke()

    // segmented orbit ring
    const segs = 36
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2 + st.ring
      const on = (i + Math.floor(st.t * (2 + lock * 6))) % 6 !== 0
      g.strokeStyle = on ? (lock > 0.5 ? hot : 'rgba(236,230,219,0.35)') : 'rgba(236,230,219,0.08)'
      g.lineWidth = 2
      g.beginPath()
      g.arc(cx, cy, R * 1.17, a0, a0 + (Math.PI * 2) / segs - 0.06)
      g.stroke()
    }

    // eyes: round capsules at rest, narrow angled slits when locked in
    for (const side of [-1, 1]) {
      const ex = cx + side * R * 0.32 + st.lookX
      const ey = cy - R * 0.08 + st.lookY
      const h = (R * 0.42 * st.open * (1 - 0.72 * lock) * blinkK) * (1 + voice * 0.15)
      const w = R * 0.15
      g.save()
      g.translate(ex, ey)
      g.rotate(side * -0.32 * lock)
      g.shadowColor = hot
      g.shadowBlur = 18 + voice * 20
      g.fillStyle = lock > 0.5 ? hot : '#f3ece1'
      const rr = Math.min(w, h) / 2
      g.beginPath()
      g.roundRect(-w / 2, -h / 2, w, Math.max(h, 2), rr)
      g.fill()
      g.restore()
    }

    // voice line
    g.strokeStyle = lock > 0.5 ? hot : 'rgba(236,230,219,0.75)'
    g.lineWidth = 1.5
    g.beginPath()
    const mw = R * 0.7
    for (let i = 0; i <= 48; i++) {
      const x = cx - mw / 2 + (i / 48) * mw
      const env = Math.sin((i / 48) * Math.PI)
      const y = cy + R * 0.42 + Math.sin(i * 0.9 + st.t * 18) * env * (2 + 9 * voice * st.talk)
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  })

  return (
    <div ref={wrap} className="jv-mascot">
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  )
}

/** Audio chunks arrive out of order; playback stays in order; the buffer is bounded. */
function Stream() {
  const CAP = 4
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const sim = useRef({
    nextReq: 1,
    nextPlay: 1,
    flight: [] as { seq: number; start: number; dur: number }[],
    buffered: new Set<number>(),
    playing: 0,
    playStart: 0,
    now: 0,
  })
  const [, force] = useState(0)

  useEffect(() => {
    if (!inView) return
    const id = window.setInterval(() => {
      const s = sim.current
      s.now += 60
      // land arrivals
      s.flight = s.flight.filter((c) => {
        if (s.now - c.start >= c.dur) {
          s.buffered.add(c.seq)
          return false
        }
        return true
      })
      // play strictly in order
      if (s.playing && s.now - s.playStart >= 620) {
        s.buffered.delete(s.playing)
        s.playing = 0
        s.nextPlay++
      }
      if (!s.playing && s.buffered.has(s.nextPlay)) {
        s.playing = s.nextPlay
        s.playStart = s.now
      }
      // request more only while there is room: bounded backpressure
      while (s.flight.length + s.buffered.size < CAP) {
        s.flight.push({ seq: s.nextReq++, start: s.now, dur: 300 + Math.random() * 1500 })
      }
      force((n) => n + 1)
    }, 60)
    return () => window.clearInterval(id)
  }, [inView])

  const s = sim.current
  const full = s.flight.length + s.buffered.size >= CAP
  return (
    <div className="jv-stream" ref={ref} aria-label="Simulation of streaming audio playback">
      <p className="jv-k">
        <i>Underneath:</i> audio chunks arrive out of order, play in order, and the buffer never holds more than {CAP}.
      </p>
      <div className="jv-row">
        <span className="jv-l">in flight</span>
        <div className="jv-track">
          {s.flight.map((c) => (
            <span key={c.seq} className="jv-chunk" style={{ left: `${Math.min(1, (s.now - c.start) / c.dur) * 92}%` }}>
              {c.seq}
            </span>
          ))}
        </div>
      </div>
      <div className="jv-row">
        <span className="jv-l">buffer</span>
        <div className="jv-slots">
          {Array.from({ length: CAP }, (_, k) => {
            const seq = s.nextPlay + k
            const has = s.buffered.has(seq)
            return (
              <span key={seq} className={`jv-slot ${has ? 'has' : ''} ${seq === s.playing ? 'play' : ''}`}>
                {has ? seq : ''}
              </span>
            )
          })}
        </div>
        <span className={`jv-bp ${full ? 'on' : ''}`}>{full ? 'full: holding requests' : 'room: requesting'}</span>
      </div>
      <div className="jv-row">
        <span className="jv-l">speaker</span>
        <span className="jv-play">{s.playing ? `playing chunk ${s.playing}` : `waiting for chunk ${s.nextPlay}`}</span>
      </div>
    </div>
  )
}

export function JarvisDemo() {
  const [lang, setLang] = useState<Lang>('en')
  const [line, setLine] = useState(LINES.en.text)
  const [talking, setTalking] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [locked, setLocked] = useState(false)
  const [hold, setHold] = useState(0)
  const holdRaf = useRef(0)
  const talkTimer = useRef(0)
  const voiceEl = useRef<HTMLAudioElement | null>(null)

  const speak = (text: string, file: string, ms: number) => {
    setLine(text)
    setTalking(true)
    window.clearTimeout(talkTimer.current)
    voiceEl.current?.pause()
    if (audio.enabled) {
      const a = new Audio(`/voice/${file}.mp3`)
      a.volume = 0.9
      voiceEl.current = a
      a.onended = () => setTalking(false)
      a.onloadedmetadata = () => {
        window.clearTimeout(talkTimer.current)
        talkTimer.current = window.setTimeout(() => setTalking(false), a.duration * 1000 + 200)
      }
      a.play().catch(() => {})
    }
    talkTimer.current = window.setTimeout(() => setTalking(false), ms)
  }

  const pick = (l: Lang) => {
    setLang(l)
    speak(LINES[l].text, l, 3200)
  }

  const lockIn = () => {
    setLocked(true)
    state.lockTarget = 1
    audio.thump()
    speak(LOCK_LINE, 'lock', 2600)
  }
  const release = () => {
    setLocked(false)
    state.lockTarget = 0
    setLine(LINES[lang].text)
  }

  const startHold = () => {
    if (locked) return
    cancelAnimationFrame(holdRaf.current)
    const t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / (state.reduced ? 1 : HOLD_MS))
      setHold(p)
      if (p >= 1) {
        setHold(0)
        lockIn()
        return
      }
      holdRaf.current = requestAnimationFrame(step)
    }
    holdRaf.current = requestAnimationFrame(step)
  }
  const endHold = () => {
    cancelAnimationFrame(holdRaf.current)
    setHold(0)
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(holdRaf.current)
      window.clearTimeout(talkTimer.current)
      voiceEl.current?.pause()
    },
    [],
  )

  return (
    <div className="jv">
      <div className="jv-stage" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
        <Mascot talking={talking} hovered={hovered} />
        <p className="jv-bubble" lang={locked ? 'en' : LINES[lang].lang} aria-live="polite">
          “{line}”
        </p>
        <p className="jv-state">{locked ? 'locked in' : talking ? 'speaking' : hovered ? 'listening' : 'idle'}</p>
      </div>
      <p className="jv-controls">
        Have it speak{' '}
        {(Object.keys(LINES) as Lang[]).map((l, i, all) => (
          <span key={l}>
            <button className="act" aria-pressed={lang === l} onClick={() => pick(l)} lang={LINES[l].lang}>
              {LINES[l].label}
            </button>
            {i < all.length - 2 ? ', ' : i === all.length - 2 ? ' or ' : ''}
          </span>
        ))}
        . Or{' '}
        {locked ? (
          <button className="act" onClick={release} data-cursor="let go">
            release the lock
          </button>
        ) : (
          <button
            className="act jv-hold"
            style={{ ['--p' as string]: hold }}
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                e.preventDefault()
                lockIn()
              }
            }}
            data-cursor="keep holding"
          >
            press and hold to lock in
          </button>
        )}
        .
      </p>
      <Stream />
    </div>
  )
}
