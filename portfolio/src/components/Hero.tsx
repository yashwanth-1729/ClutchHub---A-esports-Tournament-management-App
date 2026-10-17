import { brand } from '../content'

export function Hero() {
  return (
    <section className="hero wrap" data-frame="hero" id="top">
      <h1 className="sr-only">
        {brand.person}. {brand.role}.
      </h1>
      <div className="hero-grid">
        <p className="lede rise" style={{ ['--d' as string]: '0.1s' }}>
          Yashwanth Raj Cherukuru designs interfaces and builds the systems underneath them. <em>Scroll, and fall in.</em>
        </p>
        <figcaption className="rise" style={{ ['--d' as string]: '0.45s' }}>
          <b>Plate I.</b>
          The author’s name behind a black hole, seen from thirty Schwarzschild radii. Its light bends around the hole on the way to you; move your cursor and the
          view moves with it. Rendered live, in your browser.
        </figcaption>
      </div>
    </section>
  )
}
