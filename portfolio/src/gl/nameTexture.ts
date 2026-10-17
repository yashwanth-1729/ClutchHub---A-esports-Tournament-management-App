// Renders the name into a canvas that the shader places behind the black hole.
// Landscape screens get one line; portrait screens get two so it stays large.

export type NamePlate = {
  canvas: HTMLCanvasElement
  halfW: number
  halfH: number
  z: number
}

export const NAME_FONT = '"Newsreader Variable", "Newsreader", Georgia, serif'

export function drawNamePlate(text: string, portrait: boolean): NamePlate {
  const lines = portrait ? [text.slice(0, Math.floor(text.length / 2)), text.slice(Math.floor(text.length / 2))] : [text]
  const W = portrait ? 1400 : 2400
  const lineH = portrait ? 520 : 460
  const H = lineH * lines.length + (portrait ? 80 : 60)

  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  let size = lineH * 0.9
  const setFont = () => {
    ctx.font = `italic 400 ${size}px ${NAME_FONT}`
  }
  setFont()
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
  size *= Math.min(1, (W * 0.94) / widest)
  setFont()

  lines.forEach((line, i) => {
    const y = H / 2 + (i - (lines.length - 1) / 2) * lineH * 0.98
    ctx.fillText(line, W / 2, y)
  })

  // world units: wide enough that the hole only swallows a letter or two
  const halfW = portrait ? 19 : 31
  return { canvas: c, halfW, halfH: halfW * (H / W), z: 15 }
}
