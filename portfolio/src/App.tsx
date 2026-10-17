import { useEffect, useRef } from 'react'
import { forceQuality, getLenis, ignite, onFrame, startEngine, state } from './engine/engine'
import { Loader } from './components/Loader'
import { Hud } from './components/Hud'
import { Cursor } from './components/Cursor'
import { Grain } from './components/Grain'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Work } from './components/Work'
import { Orbit } from './components/Orbit'
import { SldtChapter } from './components/sldt/SldtChapter'
import { Contact } from './components/Contact'

export default function App() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const debrisCanvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const engine = startEngine(canvas.current)
    if (import.meta.env.DEV) Object.assign(window, { __void: { state, getLenis, forceQuality } })
    let cleanup = () => {}
    let alive = true

    // the debris layer is heavier, so it loads while the loader counts
    if (state.webgl && debrisCanvas.current) {
      import('./gl/Debris')
        .then(({ Debris }) => {
          if (!alive || !debrisCanvas.current) return
          const debris = new Debris(debrisCanvas.current)
          const onResize = () => debris.resize()
          window.addEventListener('resize', onResize)
          const off = onFrame((dt) => debris.update(dt, state.accent))
          cleanup = () => {
            off()
            window.removeEventListener('resize', onResize)
            debris.dispose()
          }
        })
        .catch((err) => console.warn('[void] debris layer unavailable', err))
    }

    return () => {
      alive = false
      cleanup()
      engine.destroy()
    }
  }, [])

  return (
    <>
      <canvas className="void-canvas" ref={canvas} aria-hidden="true" />
      <div className="void-fallback" aria-hidden="true" />
      <canvas className="debris-canvas" ref={debrisCanvas} aria-hidden="true" />
      <Loader onEnter={ignite} />
      <Hud />
      <Cursor />
      <main>
        <Hero />
        <About />
        <Work />
        <SldtChapter />
        <Orbit />
        <Contact />
      </main>
      <Grain />
    </>
  )
}
