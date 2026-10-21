import { useEffect, useRef } from 'react'
import { forceQuality, getLenis, ignite, startEngine, state } from './engine/engine'
import { Hud } from './components/Hud'
import { Cursor } from './components/Cursor'
import { Grain } from './components/Grain'
import { SldtProtocol } from './components/sldt/SldtProtocol'
import { SidsEnd, SidsHero, SidsLab, SidsNotes, SidsWhy } from './components/sids/SidsSections'
import { SIDS } from './site'

// The SIDS page: the same fall as the portfolio, with SIDS on the plate. No
// countdown here; visitors come for the protocol, so the page opens in orbit.
// Sound stays off until asked for, since nothing has been clicked yet.
export default function SidsApp() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const engine = startEngine(canvas.current, { name: 'SIDS' })
    if (import.meta.env.DEV) Object.assign(window, { __void: { state, getLenis, forceQuality, engine } })
    state.approach = 1
    ignite()
    return () => engine.destroy()
  }, [])

  return (
    <>
      <canvas className="void-canvas" ref={canvas} aria-hidden="true" />
      <div className="void-fallback" aria-hidden="true" />
      <Hud nav={SIDS} />
      <Cursor />
      <main className="sids-page">
        <SidsHero />
        <SidsWhy />
        <SldtProtocol />
        <SidsLab />
        <SidsNotes />
        <SidsEnd />
      </main>
      <Grain />
    </>
  )
}
