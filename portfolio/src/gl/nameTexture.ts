// Renders the name into a canvas that the shader places behind the black hole.
// Landscape screens get one line; portrait screens get two so it stays large.
import nameFontUrl from '@fontsource-variable/hubot-sans/files/hubot-sans-latin-wdth-normal.woff2?url'

export type NamePlate = {
  canvas: HTMLCanvasElement
  halfW: number
  halfH: number
  z: number
  y: number
}

// Canvas text can't ask a variable font for a width, so the name gets its own
// face pinned to Hubot Sans at its widest and heaviest: the descriptors clamp
// whatever the canvas requests to exactly this instance.
const FAMILY = 'Voidbyte Name'
export const NAME_FONT = `"${FAMILY}", "Hubot Sans Variable", sans-serif`

let loading: Promise<unknown> | null = null
export function loadNameFont() {
  if (!loading) {
    const face = new FontFace(FAMILY, `url(${nameFontUrl})`, { weight: '780', stretch: '125%' })
    document.fonts.add(face)
    loading = face.load()
  }
  return loading
}

/** On a phone both lines sit above the hole, so the lensing bends them without shredding them. */
export const PORTRAIT = { halfW: 10.5, y: 11.5 }

export function drawNamePlate(text: string, portrait: boolean): NamePlate {
  const name = text.toUpperCase()
  const cut = Math.floor(name.length / 2)
  // a short word stays on one line even on a phone
  const lines = portrait && name.length > 5 ? [name.slice(0, cut), name.slice(cut)] : [name]
  const W = portrait ? 1400 : 2400
  const lineH = portrait ? 480 : 420
  const H = lineH * lines.length + (portrait ? 80 : 60)

  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  let size = lineH
  const setFont = () => {
    ctx.font = `780 ${size}px ${NAME_FONT}`
  }
  setFont()
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
  size *= Math.min(1, (W * 0.94) / widest)
  setFont()

  // centre on the capitals themselves, not the em box
  const cap = ctx.measureText('H').actualBoundingBoxAscent
  lines.forEach((line, i) => {
    const mid = H / 2 + (i - (lines.length - 1) / 2) * lineH
    ctx.fillText(line, W / 2, mid + cap / 2)
  })

  // world units: wide enough that the hole only swallows a letter or two
  // one short line on a phone is drawn narrower, so the whole word stays on screen
  const halfW = portrait ? (lines.length === 1 ? 7 : PORTRAIT.halfW) : 31
  return { canvas: c, halfW, halfH: halfW * (H / W), z: 15, y: portrait ? PORTRAIT.y : 0 }
}
