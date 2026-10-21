import { useEffect, useRef, useState } from 'react'
import { forceQuality, getLenis, ignite, onFrame, startEngine, state } from './engine/engine'
import { Loader } from './components/Loader'
import { PORTRAIT } from './gl/nameTexture'
import { Hud } from './components/Hud'
import { Cursor } from './components/Cursor'
import { Grain } from './components/Grain'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Work } from './components/Work'
import { Orbit } from './components/Orbit'
import { SidsDoor } from './components/sids/SidsSections'
import { Contact } from './components/Contact'

export default function App() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const debrisCanvas = useRef<HTMLCanvasElement>(null)
  // until the visitor enters, the page behind the loader is out of reach of Tab and screen readers
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const engine = startEngine(canvas.current)
    if (import.meta.env.DEV) Object.assign(window, { __void: { state, getLenis, forceQuality, engine, PORTRAIT } })
    let cleanup = () => {}
    let alive = true

    // The debris layer is heavy to load and compile, so it waits until the count has
    // landed on 30: done mid-count it stalls the falling numbers; done after, the
    // screen is still and nothing is seen to stop.
    const whenCounted = new Promise<void>((resolve) => {
      const off = onFrame(() => {
        if (state.approach < 1) return
        off()
        const idle = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback
        if (idle) idle(() => resolve(), { timeout: 400 })
        else setTimeout(resolve, 60)
      })
    })
    if (state.webgl && debrisCanvas.current) {
      whenCounted
        .then(() => import('./gl/Debris'))
        .then(({ Debris }) => {
          if (!alive || !debrisCanvas.current) return
          const debris = new Debris(debrisCanvas.current)
          const onResize = () => debris.resize()
          window.addEventListener('resize', onResize)
          // the canvas box also changes without a window resize (mobile toolbars, lvh)
          const ro = new ResizeObserver(onResize)
          ro.observe(debrisCanvas.current)
          const off = onFrame((dt) => debris.update(dt, state.accent))
          cleanup = () => {
            off()
            window.removeEventListener('resize', onResize)
            ro.disconnect()
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
      <Loader
        onEnter={() => {
          ignite()
          setEntered(true)
        }}
      />
      <div inert={!entered}>
        <Hud />
      </div>
      <Cursor />
      <main inert={!entered}>
        <Hero />
        <About />
        <Work />
        <SidsDoor />
        <Orbit />
        <Contact />
      </main>
      <Grain />
    </>
  )
}
