import { useRef, useState } from 'react'
import { audio } from '../../audio/VoidAudio'
import { signals } from '../../engine/signals'
import {
  ARGON,
  Device,
  DumbStore,
  ReplayDetected,
  TamperDetected,
  deriveKeys,
  hex,
  newIdentity,
  readManifest,
  recoveryCode,
  sleep,
  sync,
  type Identity,
  type Keys,
  type LogLine,
} from '../../sldt/mini'

const OID = 'note_0193'
const SEED = 'DSA revision: graphs. BFS first, Dijkstra once the edges get weights.'
const rid = () => hex(crypto.getRandomValues(new Uint8Array(2)))

type Snapshot = Map<string, { bytes: Uint8Array; version: number }>

export function SldtLab() {
  const lab = useRef<{
    store: DumbStore
    keys: Keys | null
    id: Identity | null
    prefix: string
    a: Device
    b: Device
    snap: Snapshot | null
  }>({ store: new DumbStore(), keys: null, id: null, prefix: '', a: new Device('laptop', rid()), b: new Device('phone ', rid()), snap: null })
  const [, setTick] = useState(0)
  const rerender = () => setTick((t) => t + 1)
  const [phase, setPhase] = useState<'idle' | 'deriving' | 'ready'>('idle')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [attacked, setAttacked] = useState<string | null>(null)

  const L = lab.current
  const push = (line: LogLine) => {
    setLog((l) => [...l, line].slice(-11))
    if (line.cls === 'bad') audio.blip(0)
  }

  const runSync = async (d: Device, pause = 0) => {
    if (!L.keys || d.halted) return
    d.busy = true
    rerender()
    try {
      const r = await sync(d, L.store, L.keys, L.prefix, push, pause)
      push({ text: `${d.name}  pulled ${r.pulled}, pushed ${r.pushed}, now at manifest r${r.revision}${r.retries ? ` after ${r.retries} retr${r.retries > 1 ? 'ies' : 'y'}` : ''}`, cls: 'ok' })
    } catch (e) {
      if (e instanceof TamperDetected || e instanceof ReplayDetected) {
        d.halted = `${e.name}: ${e.message}`
        push({ text: `${d.name}  hard stop. ${e.name}: ${e.message}. Local data untouched`, cls: 'bad' })
        signals.tampered = true
        audio.thump()
      } else push({ text: `${d.name}  ${(e as Error).message}`, cls: 'bad' })
    } finally {
      d.busy = false
      rerender()
    }
  }

  const create = async () => {
    setPhase('deriving')
    const id = newIdentity()
    L.id = id
    L.prefix = `sldt/${id.datasetId.slice(0, 10)}`
    push({ text: `new dataset; the recovery code ${recoveryCode(id).slice(0, 22)}… is the whole account`, cls: 'dim' })
    await sleep(30)
    const keys = await deriveKeys(id)
    L.keys = keys
    push({ text: `Argon2id, ${keys.memoryKiB / 1024} MiB, ${ARGON.iterations} passes: 64 bytes in ${Math.round(keys.ms)} ms, split into an AES key and an HMAC key`, cls: 'ok' })
    setPhase('ready')
    L.a.edit(OID, SEED)
    await runSync(L.a)
    await runSync(L.b)
  }

  const scenario = async (fn: () => Promise<void>) => {
    if (busy || phase !== 'ready') return
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
      rerender()
    }
  }

  const snapshot = () => {
    const snap: Snapshot = new Map()
    L.store.files.forEach((f, p) => snap.set(p, { bytes: f.bytes.slice(), version: f.version }))
    L.snap = snap
  }

  const race = () =>
    scenario(async () => {
      const base = L.a.get(OID)?.payload.body ?? SEED
      L.a.edit(OID, `${base.split(' (')[0]} (edited on the laptop)`)
      L.b.edit(OID, `${base.split(' (')[0]} (edited on the phone)`)
      rerender()
      push({ text: 'both devices edit the same note offline, then sync at the same moment', cls: 'dim' })
      await Promise.all([runSync(L.a, 320), runSync(L.b, 360)])
      await runSync(L.a)
      await runSync(L.b)
      const same = L.a.get(OID)?.payload.body === L.b.get(OID)?.payload.body
      push({ text: same ? `converged: both hold the ${L.a.get(OID)?.deviceId === L.a.id ? 'laptop' : 'phone'}’s version, chosen by rule, not by timing` : 'not converged yet; sync again', cls: same ? 'ok' : 'warn' })
    })

  const flip = () =>
    scenario(async () => {
      const base = L.a.get(OID)?.payload.body ?? SEED
      L.a.edit(OID, `${base.split(' (')[0]} (a fresh edit)`)
      await runSync(L.a)
      snapshot()
      const at = L.store.flipBit(`${L.prefix}/objects/${OID}.enc`)
      setAttacked('bit')
      push({ text: `store  flipped one bit at byte ${at} of ${OID}.enc`, cls: 'bad' })
      await runSync(L.b)
    })

  const forge = () =>
    scenario(async () => {
      snapshot()
      const m = readManifest(L.store, L.prefix)
      if (!m) return
      m.data.objects[OID] = { ...m.data.objects[OID], revision: 99 }
      L.store.replace(`${L.prefix}/manifest.json`, new TextEncoder().encode(JSON.stringify(m)))
      setAttacked('forge')
      push({ text: 'store  rewrote the manifest to claim note_0193 is at r99 (no key, so the old signature stays)', cls: 'bad' })
      await runSync(L.b)
    })

  const rollback = () =>
    scenario(async () => {
      if (L.store.manifests.length < 2) {
        L.a.edit(OID, `${L.a.get(OID)?.payload.body.split(' (')[0] ?? SEED} (one more edit)`)
        await runSync(L.a)
      }
      snapshot()
      const old = L.store.manifests[L.store.manifests.length - 2]
      L.store.replace(`${L.prefix}/manifest.json`, old)
      setAttacked('rollback')
      const r = (JSON.parse(new TextDecoder().decode(old)) as { data: { revision: number } }).data.revision
      push({ text: `store  quietly serves an older, validly signed manifest (r${r})`, cls: 'bad' })
      await runSync(L.a)
    })

  const heal = () =>
    scenario(async () => {
      L.snap?.forEach((f, p) => L.store.files.set(p, { bytes: f.bytes.slice(), version: f.version }))
      L.snap = null
      L.a.halted = null
      L.b.halted = null
      signals.tampered = false
      setAttacked(null)
      push({ text: 'store restored. A stopped device waits for a human; here, that’s you', cls: 'dim' })
      await runSync(L.a)
      await runSync(L.b)
    })

  const manifest = readManifest(L.store, L.prefix)
  const objFile = L.store.files.get(`${L.prefix}/objects/${OID}.enc`)
  let ctPreview = ''
  if (objFile) {
    try {
      const env = JSON.parse(new TextDecoder().decode(objFile.bytes)) as { ct: string }
      ctPreview = hex(Uint8Array.from(atob(env.ct), (c) => c.charCodeAt(0)).slice(0, 72)).replace(/(..)/g, '$1 ')
    } catch {
      ctPreview = '(unparseable bytes)'
    }
  }

  const ready = phase === 'ready'
  const idle = ready && !busy && !attacked

  return (
    <div className="lab">
      <p className="lab-step">
        {phase === 'idle' ? (
          <>
            First,{' '}
            <button className="act" onClick={create} data-cursor="Argon2id, 64 MiB">
              create a dataset
            </button>
            . It generates a real recovery code and derives its two keys with Argon2id at 64 MiB, here in your browser.
          </>
        ) : phase === 'deriving' ? (
          <i>Deriving keys: Argon2id, 64 MiB, three passes…</i>
        ) : (
          <>
            Recovery code <code className="lab-code">{L.id ? `${recoveryCode(L.id).slice(0, 30)}…` : ''}</code>, keys derived in {Math.round(L.keys?.ms ?? 0)} ms. Both
            devices hold it; the store never will.
          </>
        )}
      </p>

      <div className={`lab-grid ${ready ? '' : 'locked'}`}>
        {[L.a, L.b].map((d, i) => {
          const rec = d.get(OID)
          return (
            <div key={d.id} className={`lab-dev ${d.halted ? 'halted' : ''}`} style={{ order: i === 0 ? 0 : 2 }}>
              <p className="lab-col-head">
                <i>The {d.name.trim()}</i> <span className="mono">device {d.id}</span>
              </p>
              <textarea
                value={rec?.payload.body ?? ''}
                onChange={(e) => {
                  d.edit(OID, e.target.value)
                  rerender()
                }}
                disabled={!!d.halted || !ready || busy}
                rows={3}
                aria-label={`Note on the ${d.name.trim()}`}
              />
              <p className="lab-meta">
                <span className="mono">
                  {OID} r{rec?.revision ?? 0}, last written by {rec?.deviceId ?? '—'}
                </span>
                <br />
                {d.halted ? (
                  <span className="bad">Stopped. {d.halted}. Local data untouched.</span>
                ) : (
                  <>
                    {d.busy ? 'Syncing…' : rec?.pending ? 'Edited, not yet synced. ' : `In step with manifest r${d.lastRev}. `}
                    {!d.busy ? (
                      <button className="act" onClick={() => runSync(d)} disabled={!ready || busy}>
                        sync
                      </button>
                    ) : null}
                  </>
                )}
              </p>
            </div>
          )
        })}

        <div className="lab-store" style={{ order: 1 }}>
          <p className="lab-col-head">
            <i>The store</i> <span className="lab-aside">a public repository, in real life</span>
          </p>
          <p className="lab-path mono">{L.prefix || 'sldt/…'}/manifest.json</p>
          {manifest ? (
            <p className={`lab-file mono ${attacked === 'forge' || attacked === 'rollback' ? 'hot' : ''}`}>
              r{manifest.data.revision}, signature {manifest.signature.slice(0, 12)}…
              <br />
              previous {manifest.data.previousManifestHash ? `${manifest.data.previousManifestHash.slice(0, 12)}…` : 'none'}
              <br />
              {OID} at r{manifest.data.objects[OID]?.revision}, {manifest.data.objects[OID]?.hash.slice(0, 12)}…
            </p>
          ) : (
            <p className="lab-file mono dim">nothing yet</p>
          )}
          <p className="lab-path mono">objects/{OID}.enc</p>
          {objFile ? (
            <p className={`lab-file mono cipher ${attacked === 'bit' ? 'hot' : ''}`}>
              {ctPreview}
              <span className="dim"> … {objFile.bytes.length} bytes</span>
            </p>
          ) : (
            <p className="lab-file mono dim">nothing yet</p>
          )}
          <p className="lab-chain">
            {L.store.manifests.length ? (
              <>
                <i>History</i>{' '}
                {L.store.manifests
                  .slice(-6)
                  .map((_, i, arr) => `r${L.store.manifests.length - arr.length + i + 1}`)
                  .join(' ← ')}
              </>
            ) : null}
          </p>
        </div>
      </div>

      <p className="lab-step">
        {ready ? (
          <>
            Now{' '}
            <button className="act" onClick={race} disabled={!idle}>
              edit both and sync at once
            </button>
            . Then attack the store:{' '}
            <button className="act" onClick={flip} disabled={!idle}>
              flip a bit
            </button>
            ,{' '}
            <button className="act" onClick={forge} disabled={!idle}>
              forge the manifest
            </button>
            , or{' '}
            <button className="act" onClick={rollback} disabled={!idle}>
              serve an old one
            </button>
            .
            {attacked ? (
              <>
                {' '}
                When you’ve seen enough,{' '}
                <button className="act" onClick={heal} disabled={busy}>
                  restore the store
                </button>
                .
              </>
            ) : null}
          </>
        ) : (
          <span className="dim">The rest unlocks once the dataset exists.</span>
        )}
      </p>

      <pre className="demo-log lab-log" aria-live="polite">
        {log.length ? null : <span className="dim">Every line here comes from the engine as it runs.{'\n'}</span>}
        {log.map((l, i) => (
          <span key={i} className={l.cls}>
            {l.text}
            {'\n'}
          </span>
        ))}
      </pre>
    </div>
  )
}
