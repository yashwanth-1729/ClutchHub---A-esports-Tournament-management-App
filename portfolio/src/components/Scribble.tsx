import { useEffect, useRef } from 'react'
import { useInView } from '../lib/hooks'

// Grease-pencil marks, the way astronomers annotate plates. Drawn once, in view.

const SHAPES = {
  circle: 'M12,52 C10,24 52,6 104,8 C158,10 196,26 194,52 C192,80 150,96 98,94 C48,92 10,78 14,50 C16,34 34,22 58,16',
  underline: 'M4,14 C50,8 120,16 196,9',
  arrow: 'M6,40 C40,34 80,22 120,8 M104,4 L121,8 L110,22',
}

export function Scribble({
  kind = 'circle',
  style,
  delay = 0,
  className = '',
}: {
  kind?: keyof typeof SHAPES
  style?: React.CSSProperties
  delay?: number
  className?: string
}) {
  const svg = useRef<SVGSVGElement>(null)
  const inView = useInView(svg)
  const drawn = useRef(false)

  useEffect(() => {
    const path = svg.current?.querySelector('path')
    if (!path) return
    const len = path.getTotalLength()
    if (!drawn.current) {
      path.style.strokeDasharray = `${len}`
      path.style.strokeDashoffset = `${len}`
    }
    if (inView && !drawn.current) {
      drawn.current = true
      path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
        duration: 900,
        delay: delay * 1000,
        easing: 'cubic-bezier(.65,0,.35,1)',
        fill: 'forwards',
      })
    }
  }, [inView, delay])

  return (
    <svg ref={svg} className={`scribble ${className}`} viewBox={kind === 'circle' ? '0 0 200 100' : kind === 'arrow' ? '0 0 130 48' : '0 0 200 20'} preserveAspectRatio="none" style={style} aria-hidden="true">
      <path d={SHAPES[kind]} />
    </svg>
  )
}
