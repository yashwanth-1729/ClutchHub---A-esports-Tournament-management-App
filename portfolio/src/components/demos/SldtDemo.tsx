import { useEffect, useRef, useState } from 'react'
import { audio } from '../../audio/VoidAudio'
import { signals } from '../../engine/signals'
import { useFrame, useInView } from '../../lib/hooks'

// Real AES-256-GCM and HMAC-SHA256 through the Web Crypto API, the same
// primitives SLDT uses. Keys are generated fresh in your tab and never leave it.

const te = new TextEncoder()
const hex = (b: ArrayBuffer | Uint8Array) =>
  Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) => x.toString(16).padStart(2, '0'))
const short = (h: string[]) => `${h.slice(0, 3).join('')}…${h.slice(-2).join('')}`

type Status = 'ok' | 'bad' | 'wait'
type View = {
  cipher: string[]
  plain: string
  iv: string
  sig: string
  tag: Status
  hmac: Status
  error: string
}

function makeRecord() {
  return JSON.stringify(
    {
      id: 'note_0193',
      title: 'DSA revision: graphs',
      body: 'BFS for shortest paths when edges are unweighted. Dijkstra once weights show up.',
      updatedAt: new Date().toISOString().slice(0, 19) + 'Z',
      device: 'android',
      deleted: false,
    },
    null,
    2,
  )
}

export function SldtDemo() {
  const keys = useRef<{ aes: CryptoKey; mac: CryptoKey } | null>(null)
  const sealed = useRef<{ ct: Uint8Array; iv: Uint8Array; manifest: string; sig: ArrayBuffer } | null>(null)
  const record = useRef(makeRecord())
  const [view, setView] = useState<View>({ cipher: [], plain: record.current, iv: '', sig: '', tag: 'wait', hmac: 'wait', error: '' })
  const [tampered, setTampered] = useState(false)
  const lens = useRef<HTMLDivElement>(null)
  const inView = useInView(lens)
  const pointer = useRef({ inside: false, x: 0, y: 0, t: 0 })

  const supported = typeof crypto !== 'undefined' && !!crypto.subtle

  const verify = async (ct: Uint8Array) => {
    const s = sealed.current!
    const k = keys.current!
    // the manifest pins the ciphertext hash; its signature pins the manifest
    const digest = hex(await crypto.subtle.digest('SHA-256', ct as BufferSource)).join('')
    const manifest = JSON.stringify({ id: 'note_0193', iv: hex(s.iv).join(''), sha256: digest })
    const macOk = await crypto.subtle.verify('HMAC', k.mac, s.sig, te.encode(manifest))
    let plain = ''
    let tag: Status = 'ok'
    let error = ''
    try {
      plain = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: s.iv as BufferSource }, k.aes, ct as BufferSource))
    } catch (e) {
      tag = 'bad'
      error = (e as Error).name || 'OperationError'
    }
    setView({
      cipher: hex(ct),
      plain,
      iv: short(hex(s.iv)),
      sig: short(hex(s.sig)),
      tag,
      hmac: macOk ? 'ok' : 'bad',
      error,
    })
  }

  const seal = async () => {
    const k = keys.current!
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k.aes, te.encode(record.current)))
    const digest = hex(await crypto.subtle.digest('SHA-256', ct)).join('')
    const manifest = JSON.stringify({ id: 'note_0193', iv: hex(iv).join(''), sha256: digest })
    const sig = await crypto.subtle.sign('HMAC', k.mac, te.encode(manifest))
    sealed.current = { ct, iv, manifest, sig }
    setTampered(false)
    signals.tampered = false
    await verify(ct)
  }

  useEffect(() => {
    if (!supported) return
    let alive = true
    ;(async () => {
      const aes = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
      const mac = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
      if (!alive) return
      keys.current = { aes, mac }
      await seal()
    })()
    return () => {
      alive = false
      signals.tampered = false
    }
  }, [])

  const tamper = async () => {
    if (!sealed.current) return
    const ct = sealed.current.ct.slice()
    const i = Math.floor(Math.random() * ct.length)
    ct[i] ^= 1 << Math.floor(Math.random() * 8)
    setTampered(true)
    signals.tampered = true
    audio.thump()
    await verify(ct)
  }

  const reseal = async () => {
    audio.blip(3)
    await seal()
  }

  // the lens follows the cursor inside the box, and wanders when you leave
  useFrame((dt) => {
    const el = lens.current
    if (!el || !inView) return
    const p = pointer.current
    p.t += dt
    let x = p.x
    let y = p.y
    if (!p.inside) {
      x = el.clientWidth * (0.5 + 0.34 * Math.sin(p.t * 0.6))
      y = el.clientHeight * (0.5 + 0.3 * Math.sin(p.t * 0.83 + 1))
    }
    el.style.setProperty('--lx', `${x}px`)
    el.style.setProperty('--ly', `${y}px`)
  })

  const move = (e: React.PointerEvent) => {
    const r = lens.current!.getBoundingClientRect()
    pointer.current.x = e.clientX - r.left
    pointer.current.y = e.clientY - r.top
  }

  return (
    <div className="sl">
      <div
        className={`sl-lens ${tampered ? 'tampered' : ''}`}
        ref={lens}
        onPointerEnter={(e) => {
          pointer.current.inside = true
          move(e)
        }}
        onPointerMove={move}
        onPointerLeave={() => {
          pointer.current.inside = false
        }}
        data-cursor="decrypting"
        aria-label="Ciphertext with a lens that reveals the decrypted record"
      >
        <pre className="sl-cipher" aria-hidden="true">
          {view.cipher.join(' ')}
        </pre>
        <pre className="sl-plain">
          {view.tag === 'bad'
            ? `decrypt() threw ${view.error}\nthe authentication tag does not match\n\nrecord rejected; the last verified\nversion stays on disk.`
            : view.plain}
        </pre>
        <span className="sl-ring" aria-hidden="true" />
      </div>
      <dl className="sl-status">
        <dt>Cipher</dt>
        <dd>AES-256-GCM, IV {view.iv || '…'}</dd>
        <dt>Tag</dt>
        <dd className={view.tag}>{view.tag === 'bad' ? `rejected (${view.error})` : view.tag === 'ok' ? 'verified' : '…'}</dd>
        <dt>Manifest</dt>
        <dd className={view.hmac}>{view.hmac === 'bad' ? 'HMAC-SHA256 mismatch' : `HMAC-SHA256 ${view.sig}`}</dd>
        <dt>The store sees</dt>
        <dd>ciphertext and a signed manifest, nothing else</dd>
      </dl>
      <p className="sl-actions">
        {supported ? (
          <>
            <button className="act" onClick={tamper}>
              Flip one bit
            </button>{' '}
            of the ciphertext, or{' '}
            <button className="act" onClick={reseal}>
              {tampered ? 'restore and seal it again' : 'seal it again'}
            </button>{' '}
            with a fresh IV.
          </>
        ) : (
          'This browser does not expose the Web Crypto API here.'
        )}
      </p>
    </div>
  )
}
