import { useRef, useState } from 'react'
import { audio } from '../../audio/VoidAudio'
import { signals } from '../../engine/signals'
import { sleep } from '../../lib/hooks'

type Who = 'you' | 'p2' | 'taken'
type Slot = { t: string; by: Who | null; contested?: boolean }
type Line = { text: string; cls?: 'ok' | 'bad' | 'dim' }
type LogLine = Line & { id: number }

const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30']
const initial = (): Slot[] => TIMES.map((t) => ({ t, by: t === '09:30' || t === '11:00' || t === '12:00' ? 'taken' : null }))

export function HospitalDemo() {
  const [slots, setSlotsState] = useState<Slot[]>(initial)
  const slotsRef = useRef<Slot[]>(slots)
  const setSlots = (next: Slot[] | ((s: Slot[]) => Slot[])) => {
    slotsRef.current = typeof next === 'function' ? next(slotsRef.current) : next
    setSlotsState(slotsRef.current)
  }
  const [log, setLog] = useState<LogLine[]>([{ id: 0, text: 'waiting for a booking', cls: 'dim' }])
  const lineId = useRef(1)
  // bumped by "start another", so a booking still in flight can't land in the new morning
  const gen = useRef(0)
  const [busy, setBusy] = useState(false)
  const [leads, setLeads] = useState(0)
  const booking = useRef(1040)
  const leadId = useRef(41)

  const push = (...lines: Line[]) => setLog((l) => [...l, ...lines.map((x) => ({ ...x, id: lineId.current++ }))].slice(-7))

  const book = async (i: number) => {
    if (busy || slotsRef.current[i].by) return
    setBusy(true)
    const g = gen.current
    const t = slotsRef.current[i].t
    setSlots((s) => s.map((x, k) => (k === i ? { ...x, contested: true } : x)))
    push({ text: `you → POST /bookings  slot=${t}` }, { text: `p2  → POST /bookings  slot=${t}` })
    signals.contention = 1
    audio.blip(1)
    await sleep(700)
    if (g !== gen.current) return setBusy(false)

    const winner: Who = Math.random() < 0.6 ? 'you' : 'p2'
    const loser: Who = winner === 'you' ? 'p2' : 'you'
    const id = booking.current++
    setSlots((s) => s.map((x, k) => (k === i ? { t: x.t, by: winner } : x)))
    push({ text: `← 201 ${winner === 'you' ? 'you' : 'p2 '} booked ${t}, BK-${id}`, cls: 'ok' }, { text: `← 409 ${loser === 'you' ? 'you' : 'p2 '} slot ${t} is already held`, cls: 'bad' })
    audio.blip(4)
    await sleep(650)
    if (g !== gen.current) return setBusy(false)

    // refused outright, never a silent double booking
    push({ text: `${loser === 'you' ? 'you' : 'p2 '} → pick another slot`, cls: 'dim' })
    setBusy(false)
  }

  const doubleSubmit = async () => {
    if (busy) return
    setBusy(true)
    const key = Math.random().toString(16).slice(2, 6)
    const id = leadId.current++
    push({ text: `→ POST /intake  Idempotency-Key: ${key}…` }, { text: `→ POST /intake  Idempotency-Key: ${key}… (double tap)` })
    await sleep(500)
    setLeads((n) => n + 1)
    push({ text: `← 201 lead L-00${id} created`, cls: 'ok' }, { text: `← 200 same key, returning L-00${id}`, cls: 'dim' })
    setBusy(false)
  }

  const full = slots.every((s) => s.by)
  const booked = slots.filter((s) => s.by === 'you' || s.by === 'p2').length

  return (
    <div className="hs">
      <p className="hs-head">
        <i>Outpatients, Thursday morning.</i> <span className="mono">{booked} booked, {leads} lead{leads === 1 ? '' : 's'} stored</span>
      </p>
      <div className="hs-grid" role="group" aria-label="Appointment slots">
        {slots.map((s, i) => (
          <button
            key={s.t}
            className={`hs-slot ${s.by ?? 'free'} ${s.contested ? 'contested' : ''}`}
            onClick={() => book(i)}
            aria-disabled={!!s.by || busy}
            data-cursor={s.by ? undefined : `book ${s.t}`}
          >
            <span className="hs-t">{s.t}</span>
            <span className="hs-s">{s.contested ? 'contested' : s.by === 'you' ? 'yours' : s.by === 'p2' ? 'patient two' : s.by === 'taken' ? 'taken' : 'free'}</span>
          </button>
        ))}
      </div>
      <p className="hs-actions">
        Click any free time. Or{' '}
        <button className="act" onClick={doubleSubmit} aria-disabled={busy}>
          submit the intake form twice
        </button>{' '}
        and count the leads.
        {full && !busy ? (
          <>
            {' '}
            The morning is full;{' '}
            <button
              className="act"
              onClick={() => {
                gen.current++
                setSlots(initial())
                push({ text: 'a new morning', cls: 'dim' })
              }}
            >
              start another
            </button>
            .
          </>
        ) : null}
      </p>
      <pre className="demo-log" role="log" aria-live="polite" aria-relevant="additions">
        {log.map((l) => (
          <span key={l.id} className={l.cls}>
            {l.text}
            {'\n'}
          </span>
        ))}
      </pre>
    </div>
  )
}
