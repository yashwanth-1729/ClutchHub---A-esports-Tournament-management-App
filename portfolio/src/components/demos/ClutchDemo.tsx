import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { audio } from '../../audio/VoidAudio'
import { signals } from '../../engine/signals'
import { state } from '../../engine/engine'
import { useInView } from '../../lib/hooks'

// Free Fire squad placement points, 1st to 12th.
const PLACEMENT = [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0]
const MAPS = ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'NeXTerra', 'Bermuda']
const SQUADS = ['Kessler', 'Low Orbit', 'Redline', 'Static', 'Team Nyx', 'Perihelion']

type Row = { name: string; kills: number; place: number; total: number; last: number; prevRank: number }

const fresh = (): Row[] => SQUADS.map((name, i) => ({ name, kills: 0, place: 0, total: 0, last: 0, prevRank: i }))

function shuffle<T>(a: T[]) {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

export function ClutchDemo() {
  const [rows, setRows] = useState<Row[]>(fresh)
  const [match, setMatch] = useState(0)
  const body = useRef<HTMLDivElement>(null)
  const inView = useInView(body)
  const positions = useRef(new Map<string, number>())

  const matchRef = useRef(0)
  const rowsRef = useRef(rows)
  // plays itself unless the visitor prefers less motion, and can always be paused
  const [auto, setAuto] = useState(!state.reduced)
  const timer = useRef(0)

  const play = () => {
    // remember where every row is before the reshuffle
    body.current?.querySelectorAll<HTMLElement>('[data-name]').forEach((el) => positions.current.set(el.dataset.name!, el.getBoundingClientRect().top))
    if (matchRef.current >= MAPS.length) {
      matchRef.current = 0
      rowsRef.current = fresh()
      setRows(rowsRef.current)
      setMatch(0)
      return
    }
    // our six squads land somewhere in a twelve-squad lobby
    const spots = shuffle(Array.from({ length: 12 }, (_, i) => i)).slice(0, SQUADS.length)
    const prev = rowsRef.current
    const next = prev.map((r) => {
      const pos = spots[SQUADS.indexOf(r.name)]
      const kills = Math.max(0, Math.round((12 - pos) * 0.45 + Math.random() * 4 - 1))
      const placePts = PLACEMENT[pos]
      const gained = kills + placePts
      return { ...r, kills: r.kills + kills, place: r.place + placePts, total: r.total + gained, last: gained }
    })
    const rank = (rs: Row[]) => [...rs].sort((a, b) => b.total - a.total || b.kills - a.kills)
    const before = prev.map((r) => r.name)
    rowsRef.current = rank(next).map((r) => ({ ...r, prevRank: before.indexOf(r.name) }))
    setRows(rowsRef.current)
    matchRef.current += 1
    setMatch(matchRef.current)
    signals.reshuffle = 1
    audio.blip(matchRef.current + 2)
  }

  useLayoutEffect(() => {
    // FLIP: animate each row from where it was to where it is now
    if (state.reduced) return void positions.current.clear()
    body.current?.querySelectorAll<HTMLElement>('[data-name]').forEach((el) => {
      const was = positions.current.get(el.dataset.name!)
      if (was === undefined) return
      const now = el.getBoundingClientRect().top
      const d = was - now
      if (Math.abs(d) > 1) el.animate([{ transform: `translateY(${d}px)` }, { transform: 'translateY(0)' }], { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)' })
    })
    positions.current.clear()
  }, [rows])

  useEffect(() => {
    if (!inView || !auto) return
    timer.current = window.setInterval(play, 3200)
    return () => window.clearInterval(timer.current)
  }, [inView, auto])

  // a manual match resets the clock, so the next automatic one is a full interval away
  const playNow = () => {
    play()
    if (inView && auto) {
      window.clearInterval(timer.current)
      timer.current = window.setInterval(play, 3200)
    }
  }

  const done = match >= MAPS.length
  return (
    <div className="ch">
      <p className="ch-head">
        <i>{match === 0 ? 'The lobby is filling.' : done ? 'Final standings.' : `After match ${match} of ${MAPS.length}, on ${MAPS[match - 1]}.`}</i>
      </p>
      <div className="ch-table" ref={body} role="table" aria-label="Live leaderboard">
        <div className="ch-row ch-th" role="row">
          <span role="columnheader">#</span>
          <span role="columnheader">Squad</span>
          <span role="columnheader">Kills</span>
          <span role="columnheader">
            <span className="wide-only">Placement</span>
            <span className="narrow-only" aria-hidden="true">
              Place
            </span>
          </span>
          <span role="columnheader">Total</span>
        </div>
        {rows.map((r, i) => {
          const move = r.prevRank - i
          return (
            <div className={`ch-row ${i === 0 && match > 0 ? 'lead' : ''}`} role="row" key={r.name} data-name={r.name}>
              <span role="cell" className="ch-rank">
                {i + 1}
                <i className={move > 0 ? 'up' : move < 0 ? 'down' : ''}>{move > 0 ? '↑' : move < 0 ? '↓' : ''}</i>
              </span>
              <span role="cell" className="ch-name">
                {r.name}
              </span>
              <span role="cell">{r.kills}</span>
              <span role="cell">{r.place}</span>
              <span role="cell" className="ch-total">
                {r.last ? <em key={match}>+{r.last}</em> : null}
                {r.total}
              </span>
            </div>
          )
        })}
      </div>
      <p className="ch-foot">
        Total is kills plus placement points, {PLACEMENT.slice(0, 4).join(', ')}… down to zero for twelfth.{' '}
        <button className="act" onClick={playNow}>
          {done ? 'Run another tournament' : 'Play the next match'}
        </button>
        , or{' '}
        <button className="act" onClick={() => setAuto((a) => !a)}>
          {auto ? 'stop it playing itself' : 'let it play itself'}
        </button>
        .
      </p>
    </div>
  )
}
