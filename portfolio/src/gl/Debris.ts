import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { state } from '../engine/engine'
import { signals } from '../engine/signals'
import type { ProjectId } from '../content'

// Four artifacts that fell in with us, one per project. Everything is modelled
// in code so the metal can reflect the same light as the accretion disk.

type Item = {
  id: ProjectId
  group: THREE.Group
  pivot: THREE.Group
  section: HTMLElement | null
  spin: THREE.Vector3
  phase: number
  glow?: THREE.MeshPhysicalMaterial
}

const ORANGE = new THREE.Color(1.0, 0.42, 0.15)
const RED = new THREE.Color(1.0, 0.1, 0.05)

function scratchTexture(seed = 1) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = 'rgb(120,120,120)'
  g.fillRect(0, 0, 512, 512)
  let s = seed * 9301
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  // brushed grain
  for (let i = 0; i < 1400; i++) {
    const y = rnd() * 512
    g.strokeStyle = `rgba(${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 255 : 0},0.05)`
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(512, y + (rnd() - 0.5) * 6)
    g.stroke()
  }
  // a few real scratches
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 512
    const y = rnd() * 512
    const a = rnd() * Math.PI
    const l = 10 + rnd() * 90
    g.strokeStyle = `rgba(230,230,230,${0.15 + rnd() * 0.3})`
    g.lineWidth = 0.6 + rnd()
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function perforation() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = '#000'
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      g.beginPath()
      g.arc(x * 16 + 8 + (y % 2) * 8, y * 16 + 8, 4.2, 0, Math.PI * 2)
      g.fill()
    }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(6, 2)
  return t
}

function environment(renderer: THREE.WebGLRenderer) {
  // A dark room lit by a ring of hot gas and one cold softbox.
  const env = new THREE.Scene()
  env.background = new THREE.Color(0x000000)
  const disk = new THREE.Mesh(
    new THREE.TorusGeometry(6, 1.1, 16, 96),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(4.0, 1.5, 0.45) }),
  )
  disk.rotation.x = Math.PI / 2 - 0.18
  disk.position.y = -1.5
  env.add(disk)
  const soft = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.05, 1.9) }))
  soft.position.set(-4, 5, 3)
  soft.lookAt(0, 0, 0)
  env.add(soft)
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 0.5, 0.2) }))
  strip.position.set(5, 0, -2)
  strip.lookAt(0, 0, 0)
  env.add(strip)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const rt = pmrem.fromScene(env, 0.035)
  pmrem.dispose()
  return rt.texture
}

function materials() {
  const scratches = scratchTexture(3)
  const titanium = new THREE.MeshPhysicalMaterial({
    color: 0xbdb6ab,
    metalness: 1,
    roughness: 0.34,
    roughnessMap: scratches,
    envMapIntensity: 1.25,
  })
  const anodized = new THREE.MeshPhysicalMaterial({
    color: 0x121212,
    metalness: 0.55,
    roughness: 0.42,
    roughnessMap: scratches,
    clearcoat: 0.5,
    clearcoatRoughness: 0.35,
    envMapIntensity: 1.0,
  })
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 0.85, metalness: 0 })
  const glass = () =>
    new THREE.MeshPhysicalMaterial({
      color: 0x331006,
      emissive: ORANGE.clone(),
      emissiveIntensity: 2.4,
      roughness: 0.15,
      metalness: 0,
      clearcoat: 1,
    })
  return { titanium, anodized, rubber, glass }
}

type Mats = ReturnType<typeof materials>

function microphone(m: Mats) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 1.0, 96), m.anodized)
  body.position.y = -0.25
  g.add(body)
  for (const y of [0.25, -0.74]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.06, 96), m.titanium)
    band.position.y = y
    g.add(band)
  }
  // perforated grille with a dark core showing through the holes
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 48), m.rubber)
  core.position.y = 0.52
  g.add(core)
  const coreTop = new THREE.Mesh(new THREE.SphereGeometry(0.36, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), m.rubber)
  coreTop.position.y = 0.77
  g.add(coreTop)
  const perf = perforation()
  const grilleMat = m.titanium.clone()
  grilleMat.alphaMap = perf
  grilleMat.alphaTest = 0.5
  grilleMat.side = THREE.DoubleSide
  const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.5, 96, 1, true), grilleMat)
  grille.position.y = 0.52
  g.add(grille)
  const domeMat = grilleMat.clone()
  domeMat.alphaMap = perf.clone()
  domeMat.alphaMap.repeat.set(6, 1.4)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.41, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2), domeMat)
  dome.position.y = 0.77
  g.add(dome)
  const glow = m.glass()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.425, 0.022, 16, 128), glow)
  ring.rotation.x = Math.PI / 2
  ring.position.y = -0.5
  g.add(ring)
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.22, 48), m.titanium)
  plug.position.y = -0.88
  g.add(plug)
  return { g, glow }
}

function stethoscope(m: Mats) {
  const g = new THREE.Group()
  const prof = [
    [0, -0.07],
    [0.56, -0.07],
    [0.6, -0.04],
    [0.61, 0.04],
    [0.57, 0.08],
    [0.3, 0.1],
    [0.22, 0.2],
    [0.2, 0.34],
    [0.24, 0.42],
    [0.26, 0.5],
    [0, 0.5],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const shell = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), m.titanium)
  g.add(shell)
  const membrane = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.02, 96), m.anodized)
  membrane.position.y = -0.075
  g.add(membrane)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.045, 24, 128), m.anodized)
  rim.rotation.x = Math.PI / 2
  rim.position.y = -0.02
  g.add(rim)
  // stem and a cut stub of tubing
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.55, 32), m.titanium)
  stem.rotation.z = Math.PI / 2
  stem.position.set(0.42, 0.3, 0)
  g.add(stem)
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.68, 0.3, 0),
    new THREE.Vector3(0.95, 0.38, 0.05),
    new THREE.Vector3(1.15, 0.62, 0.12),
    new THREE.Vector3(1.22, 0.95, 0.18),
  ])
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.075, 24, false), m.rubber)
  g.add(tube)
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), m.titanium)
  cap.position.copy(curve.getPoint(1))
  cap.lookAt(curve.getPoint(1).add(curve.getTangent(1)))
  g.add(cap)
  g.rotation.x = -0.9
  const wrap = new THREE.Group()
  wrap.add(g)
  wrap.position.x = -0.3
  return { g: wrap }
}

function trophy(m: Mats) {
  const g = new THREE.Group()
  const prof = [
    [0.07, 0.0],
    [0.09, 0.08],
    [0.3, 0.32],
    [0.48, 0.62],
    [0.55, 0.98],
    [0.56, 1.04],
    [0.52, 1.04],
    [0.5, 0.98],
    [0.43, 0.64],
    [0.26, 0.38],
    [0.0, 0.3],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const cupMat = m.titanium.clone()
  cupMat.flatShading = true
  const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 8), cupMat)
  cup.position.y = 0.05
  g.add(cup)
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 12, 32, Math.PI), cupMat)
    h.rotation.z = (s * Math.PI) / 2
    h.position.set(s * 0.52, 0.72, 0)
    g.add(h)
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.4, 8), cupMat)
  stem.position.y = -0.15
  g.add(stem)
  const b1 = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.14, 0.62, 3, 0.02), m.anodized)
  b1.position.y = -0.42
  g.add(b1)
  const b2 = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.16, 0.8, 3, 0.025), m.anodized)
  b2.position.y = -0.57
  g.add(b2)
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.07, 0.01), m.titanium)
  plate.position.set(0, -0.57, 0.405)
  g.add(plate)
  g.position.y = -0.1
  return { g }
}

function padlock(m: Mats) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.82, 0.4, 6, 0.09), m.anodized)
  body.position.y = -0.25
  g.add(body)
  for (let i = 0; i < 4; i++) {
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.022, 0.405), m.titanium)
    groove.position.y = -0.48 + i * 0.07
    g.add(groove)
  }
  const path = new THREE.CurvePath<THREE.Vector3>()
  const r = 0.29
  path.add(new THREE.LineCurve3(new THREE.Vector3(-r, 0.1, 0), new THREE.Vector3(-r, 0.42, 0)))
  const arc = new THREE.EllipseCurve(0, 0.42, r, r, Math.PI, 0, true)
  const pts = arc.getPoints(40).map((p) => new THREE.Vector3(p.x, p.y, 0))
  path.add(new THREE.CatmullRomCurve3(pts))
  path.add(new THREE.LineCurve3(new THREE.Vector3(r, 0.42, 0), new THREE.Vector3(r, 0.1, 0)))
  const shackle = new THREE.Mesh(new THREE.TubeGeometry(path, 120, 0.075, 32, false), m.titanium)
  g.add(shackle)
  const glow = m.glass()
  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 32), glow)
  led.rotation.x = Math.PI / 2
  led.position.set(0.3, -0.05, 0.205)
  g.add(led)
  const key = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 32), m.titanium)
  key.rotation.x = Math.PI / 2
  key.position.set(0, -0.12, 0.205)
  g.add(key)
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.03), m.rubber)
  slot.position.set(0, -0.12, 0.21)
  g.add(slot)
  g.position.y = 0.05
  return { g, glow }
}

export class Debris {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  private items: Item[] = []
  private key: THREE.DirectionalLight
  private rim: THREE.DirectionalLight
  private time = 0
  private wasVisible = true
  private vw = 1
  private vh = 1

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.scene.environment = environment(this.renderer)
    this.camera.position.set(0, 0, 10)

    this.key = new THREE.DirectionalLight(0xffb070, 2.4)
    this.key.position.set(-3, -2, 4)
    this.rim = new THREE.DirectionalLight(0xffe6c8, 1.6)
    this.rim.position.set(4, 5, -3)
    this.scene.add(this.key, this.rim, new THREE.AmbientLight(0x221510, 0.6))

    const m = materials()
    const builders: Record<ProjectId, () => { g: THREE.Group; glow?: THREE.MeshPhysicalMaterial }> = {
      jarvis: () => microphone(m),
      hospital: () => stethoscope(m),
      clutchhub: () => trophy(m),
      sldt: () => padlock(m),
    }
    ;(Object.keys(builders) as ProjectId[]).forEach((id, i) => {
      const { g, glow } = builders[id]()
      const pivot = new THREE.Group()
      pivot.add(g)
      const group = new THREE.Group()
      group.add(pivot)
      group.visible = false
      this.scene.add(group)
      this.items.push({
        id,
        group,
        pivot,
        section: null,
        glow,
        phase: i * 1.7,
        spin: new THREE.Vector3(0.12 + i * 0.03, 0.35 - i * 0.05, 0.07 * (i % 2 ? 1 : -1)),
      })
    })
    this.resize()
    // compile every material now, while the loader is up, not mid-scroll
    this.items.forEach((it) => (it.group.visible = true))
    this.renderer
      .compileAsync(this.scene, this.camera)
      .catch(() => {})
      .finally(() => this.items.forEach((it) => (it.group.visible = false)))
  }

  resize() {
    // the canvas box (100lvh) can be taller than innerHeight on phones; draw to the box
    const el = this.renderer.domElement
    const w = el.clientWidth || window.innerWidth
    const h = el.clientHeight || window.innerHeight
    const ratio = Math.min(window.devicePixelRatio || 1, state.touch ? 1.5 : 1.75)
    // setSize wipes the canvas even at the same size, so only touch it when something changed
    if (w === this.vw && h === this.vh && ratio === this.renderer.getPixelRatio()) return
    this.vw = w
    this.vh = h
    this.renderer.setPixelRatio(ratio)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    // refill the wiped canvas now rather than on the next frame
    this.renderer.render(this.scene, this.camera)
  }

  update(dt: number, accent: [number, number, number]) {
    this.time += dt
    const { vw, vh } = this
    const unit = (2 * 10 * Math.tan(THREE.MathUtils.degToRad(15))) / vh // world units per CSS px at z = 0
    const mobile = vw < 1180
    let any = false

    this.key.color.setRGB(accent[0] / 255, accent[1] / 255, accent[2] / 255)

    for (const it of this.items) {
      if (!it.section) it.section = document.getElementById(it.id)
      const sec = it.section
      if (!sec) continue
      const r = sec.getBoundingClientRect()
      const center = r.top + r.height / 2
      const offset = (center - vh / 2) / vh
      const visible = offset > -1.6 && offset < 1.6
      it.group.visible = visible
      if (!visible) continue
      any = true

      // debris drifts past faster than the page: we are falling, it is not
      const slot = sec.querySelector('.project-artifact')?.getBoundingClientRect()
      let x = vw / 2
      let y = vh / 2 + (center - vh / 2) * 1.45
      let px = 0.3 * vh
      if (slot) {
        x = slot.left + slot.width / 2
        const sy = slot.top + slot.height / 2
        y = sy + (sy - vh / 2) * 0.45
        px = mobile ? Math.min(slot.height * 0.85, vw * 0.5) : Math.min(slot.width * 0.95, vh * 0.34)
      }
      it.group.position.set((x - vw / 2) * unit, -(y - vh / 2) * unit, 0)

      const size = px * unit
      const stretch = 1 + state.stretch * 1.6
      it.group.scale.set(size / Math.sqrt(stretch), size * stretch, size / Math.sqrt(stretch))

      // with reduced motion only scrolling turns them
      const t = (state.reduced ? 0 : this.time) + it.phase
      const scrollSpin = offset * 1.2
      it.pivot.rotation.set(
        Math.sin(t * it.spin.x) * 0.6 + scrollSpin * 0.4 + state.mouse.sy * 0.25,
        t * it.spin.y + scrollSpin + state.mouse.sx * 0.4,
        Math.sin(t * it.spin.z * 3) * 0.25 + offset * 0.3,
      )

      if (it.glow) {
        const hot = it.id === 'jarvis' ? Math.max(state.lock, 0) : signals.tampered ? 1 : 0
        it.glow.emissive.copy(ORANGE).lerp(RED, hot)
        const blink = it.id === 'sldt' && signals.tampered && !state.reduced ? 0.5 + 0.5 * Math.sin(this.time * 14) : 1
        it.glow.emissiveIntensity = (2.2 + (it.id === 'jarvis' ? signals.voice * 4 : 0)) * blink
      }
    }

    if (any || this.wasVisible) this.renderer.render(this.scene, this.camera)
    this.wasVisible = any
  }

  dispose() {
    this.renderer.dispose()
  }
}
