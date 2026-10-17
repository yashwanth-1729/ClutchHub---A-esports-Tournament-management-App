import fragSrc from './blackhole.frag.glsl?raw'

const vertSrc = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

export type CameraFrame = {
  r: number // distance from the singularity, in Schwarzschild radii
  az: number
  el: number
  roll: number
  sx: number // horizontal shift of the hole on screen, in view heights
  sy: number
  fov: number // vertical field of view, radians
  name: number // opacity of the name written behind the hole
  dim: number
  heat: number
}

export type FrameUniforms = {
  time: number
  mouse: [number, number, number]
  lock: number
  intro: number
  flash: number
}

type Uniforms = Record<string, WebGLUniformLocation | null>

const NAMES = [
  'uRes', 'uTime', 'uCamPos', 'uCamFwd', 'uCamRight', 'uCamUp', 'uTanFov', 'uShift', 'uMouse',
  'uName', 'uPlane', 'uHeat', 'uLock', 'uDim', 'uIntro', 'uFlash', 'uSteps',
]

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(`shader: ${log}`)
  }
  return sh
}

export class BlackHole {
  readonly canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private prog: WebGLProgram
  private u: Uniforms = {}
  private nameTex: WebGLTexture
  private plane = { halfW: 1, halfH: 1, z: 15 }
  private scale = 1
  steps = 170

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    })
    if (!gl) throw new Error('webgl2 unavailable')
    this.gl = gl

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vertSrc))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragSrc))
    gl.bindAttribLocation(prog, 0, 'aPos')
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`link: ${gl.getProgramInfoLog(prog)}`)
    this.prog = prog
    gl.useProgram(prog)
    for (const n of NAMES) this.u[n] = gl.getUniformLocation(prog, n)

    // one triangle that covers the screen
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    this.nameTex = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.nameTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
    gl.uniform1i(this.u.uName, 0)
  }

  static supported() {
    try {
      const c = document.createElement('canvas')
      return !!c.getContext('webgl2')
    } catch {
      return false
    }
  }

  /** The name is drawn on a plane behind the hole, so the lensing bends it. */
  setName(source: HTMLCanvasElement, halfW: number, halfH: number, z: number) {
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.nameTex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.plane = { halfW, halfH, z }
  }

  /** Render scale relative to CSS pixels. The image is soft by nature, so this can drop a lot. */
  resize(scale: number) {
    this.scale = scale
    const w = Math.max(2, Math.round(window.innerWidth * scale))
    const h = Math.max(2, Math.round(window.innerHeight * scale))
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
  }

  get resolutionScale() {
    return this.scale
  }

  render(f: CameraFrame, k: FrameUniforms) {
    const gl = this.gl
    const { u } = this
    const w = this.canvas.width
    const h = this.canvas.height
    gl.viewport(0, 0, w, h)

    const ce = Math.cos(f.el)
    const pos = [f.r * Math.sin(f.az) * ce, f.r * Math.sin(f.el), -f.r * Math.cos(f.az) * ce]
    const len = Math.hypot(pos[0], pos[1], pos[2])
    const fwd = [-pos[0] / len, -pos[1] / len, -pos[2] / len]
    // right = up x fwd, up = fwd x right
    let rx = fwd[2], rz = -fwd[0]
    const rl = Math.hypot(rx, rz) || 1
    rx /= rl
    rz /= rl
    const right = [rx, 0, rz]
    const up = [
      fwd[1] * right[2] - fwd[2] * right[1],
      fwd[2] * right[0] - fwd[0] * right[2],
      fwd[0] * right[1] - fwd[1] * right[0],
    ]
    const cr = Math.cos(f.roll), sr = Math.sin(f.roll)
    const R = right.map((v, i) => v * cr + up[i] * sr)
    const U = up.map((v, i) => v * cr - right[i] * sr)

    gl.uniform2f(u.uRes, w, h)
    gl.uniform1f(u.uTime, k.time)
    gl.uniform3fv(u.uCamPos, pos)
    gl.uniform3fv(u.uCamFwd, fwd)
    gl.uniform3fv(u.uCamRight, R)
    gl.uniform3fv(u.uCamUp, U)
    gl.uniform1f(u.uTanFov, Math.tan(f.fov / 2))
    gl.uniform2f(u.uShift, f.sx, f.sy)
    gl.uniform3f(u.uMouse, k.mouse[0], k.mouse[1], k.mouse[2])
    gl.uniform4f(u.uPlane, this.plane.z, this.plane.halfW, this.plane.halfH, f.name)
    gl.uniform1f(u.uHeat, f.heat)
    gl.uniform1f(u.uLock, k.lock)
    gl.uniform1f(u.uDim, f.dim)
    gl.uniform1f(u.uIntro, k.intro)
    gl.uniform1f(u.uFlash, k.flash)
    gl.uniform1i(u.uSteps, this.steps)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  dispose() {
    this.gl.deleteProgram(this.prog)
    this.gl.deleteTexture(this.nameTex)
  }
}
