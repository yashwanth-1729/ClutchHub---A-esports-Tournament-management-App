import { useEffect, useRef } from 'react'

/** Film grain from a noise tile drawn once at startup. */
export function Grain() {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 160
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(160, 160)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    if (el.current) el.current.style.backgroundImage = `url(${c.toDataURL('image/png')})`
  }, [])
  return <div className="grain" ref={el} aria-hidden="true" />
}
