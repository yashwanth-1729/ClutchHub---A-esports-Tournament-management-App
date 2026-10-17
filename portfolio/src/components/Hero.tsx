import { brand } from '../content'

export function Hero() {
  return (
    <section className="hero wrap" data-frame="hero" id="top">
      <h1 className="sr-only" tabIndex={-1}>
        {brand.person}. {brand.role}.
      </h1>
      <div className="hero-grid">
        <div className="hero-intro rise" style={{ ['--d' as string]: '0.1s' }}>
          <p className="label">
            <b>{brand.location}</b>
            {brand.role}
          </p>
          <p className="lede">
            {brand.person} designs interfaces and builds the systems underneath them. <em>Scroll, and fall in.</em>
          </p>
        </div>
        <p className="hero-cue rise" style={{ ['--d' as string]: '0.35s' }} aria-hidden="true">
          <span className="label">Scroll</span>
          <span className="cue-line" />
        </p>
        <p className="plate-cap rise" style={{ ['--d' as string]: '0.5s' }}>
          <span className="label">Plate I</span>
          The author’s name behind a black hole, seen from thirty Schwarzschild radii. Its light bends around the hole on the way to you.{' '}
          <span className="live-only">Move your cursor and the view moves with it. Rendered live, in your browser.</span>
          <span className="still-only">This is a still drawing; this browser can’t run the live version.</span>
        </p>
      </div>
    </section>
  )
}
