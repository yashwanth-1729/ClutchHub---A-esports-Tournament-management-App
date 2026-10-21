// A faithful miniature of SIDS (formerly SLDT), small enough to run in a portfolio.
// Same primitives as the real engine (jarvis-oss/sldt): Argon2id identity,
// domain-separated keys, padded AES-256-GCM envelopes, an HMAC-signed and
// hash-chained manifest, compare-and-swap writes with exponential backoff,
// and deterministic conflict resolution. Only the store is in memory.

const te = new TextEncoder()
const td = new TextDecoder()

export class TamperDetected extends Error {
  name = 'TamperDetected'
}
export class ReplayDetected extends Error {
  name = 'ReplayDetected'
}
export class ConcurrentWriteConflict extends Error {
  name = 'ConcurrentWriteConflict'
}

export const PAD_BUCKETS = [256, 1024, 4096, 16384, 65536]
export const ARGON = { iterations: 3, memoryKiB: 65536, parallelism: 1, bytes: 64 }

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`)
    .join(',')}}`
}

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const b64url = (b: Uint8Array) => b64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
export const hex = (b: ArrayBuffer | Uint8Array) =>
  Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('')

export async function sha256Hex(bytes: Uint8Array) {
  return hex(await crypto.subtle.digest('SHA-256', bytes as BufferSource))
}

function pad(plain: Uint8Array) {
  const bucket = PAD_BUCKETS.find((s) => plain.byteLength + 4 <= s) ?? Math.ceil((plain.byteLength + 4) / 65536) * 65536
  const out = new Uint8Array(bucket)
  new DataView(out.buffer).setUint32(0, plain.byteLength)
  out.set(plain, 4)
  return out
}

function unpad(padded: Uint8Array) {
  const n = new DataView(padded.buffer, padded.byteOffset).getUint32(0)
  return padded.slice(4, 4 + n)
}

// ---------- identity ----------

export type Identity = { datasetId: string; secret: string }
export type Keys = { aes: CryptoKey; mac: CryptoKey; ms: number; memoryKiB: number }

export function newIdentity(): Identity {
  return {
    datasetId: b64url(crypto.getRandomValues(new Uint8Array(16))),
    secret: b64url(crypto.getRandomValues(new Uint8Array(32))),
  }
}

export const recoveryCode = (id: Identity) => `SIDS:${id.datasetId}:${id.secret}`

type ArgonResult = { out: Uint8Array; memoryKiB: number; ms: number }
type ArgonRequest = { password: string; salt: Uint8Array; iterations: number; memoryKiB: number; bytes: number }

function argonInWorker(req: ArgonRequest): Promise<ArgonResult> {
  return new Promise((resolve, reject) => {
    let w: Worker
    try {
      w = new Worker(new URL('./argon.worker.ts', import.meta.url), { type: 'module' })
    } catch (e) {
      reject(e)
      return
    }
    w.onmessage = (e: MessageEvent<{ ok: boolean; error?: string } & ArgonResult>) => {
      w.terminate()
      if (e.data.ok) resolve(e.data)
      else reject(new Error(e.data.error))
    }
    w.onerror = (e) => {
      w.terminate()
      reject(new Error(e.message || 'argon2 worker failed'))
    }
    w.postMessage(req)
  })
}

async function argonOnMainThread(req: ArgonRequest): Promise<ArgonResult> {
  const { argon2id } = await import('hash-wasm')
  const t0 = performance.now()
  let memoryKiB = req.memoryKiB
  const run = () => argon2id({ password: req.password, salt: req.salt, iterations: req.iterations, memorySize: memoryKiB, parallelism: 1, hashLength: req.bytes, outputType: 'binary' })
  let out: Uint8Array
  try {
    out = await run()
  } catch {
    memoryKiB = 16384
    out = await run()
  }
  return { out, memoryKiB, ms: performance.now() - t0 }
}

/** Argon2id with the real engine's parameters; falls back to less memory on devices that refuse 64 MiB. */
export async function deriveKeys(id: Identity): Promise<Keys> {
  // the datasetId is the salt, exactly as in the real engine
  const req: ArgonRequest = { password: id.secret, salt: te.encode(id.datasetId).slice(0, 32), iterations: ARGON.iterations, memoryKiB: ARGON.memoryKiB, bytes: ARGON.bytes }
  let res: ArgonResult
  try {
    res = await argonInWorker(req)
  } catch {
    res = await argonOnMainThread(req)
  }
  // domain separation: the first half only ever encrypts, the second only ever signs
  const aes = await crypto.subtle.importKey('raw', res.out.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt'])
  const mac = await crypto.subtle.importKey('raw', res.out.slice(32, 64), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  return { aes, mac, ms: res.ms, memoryKiB: res.memoryKiB }
}

// ---------- objects & manifest ----------

export type Rec = { objectId: string; revision: number; deviceId: string; type: string; deleted: boolean; payload: { body: string } }
export type Entry = { revision: number; hash: string; type: string; deleted: boolean }
export type ManifestData = { revision: number; previousManifestHash: string | null; objects: Record<string, Entry> }
export type Signed = { data: ManifestData; signature: string }

async function seal(key: CryptoKey, rec: Rec) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plain = pad(te.encode(JSON.stringify(rec)))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain))
  return te.encode(JSON.stringify({ iv: b64(iv), ct: b64(ct) }))
}

async function open(key: CryptoKey, bytes: Uint8Array): Promise<Rec> {
  const env = JSON.parse(td.decode(bytes)) as { iv: string; ct: string }
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(env.iv) as BufferSource }, key, unb64(env.ct) as BufferSource)
  return JSON.parse(td.decode(unpad(new Uint8Array(plain)))) as Rec
}

async function sign(mac: CryptoKey, data: ManifestData): Promise<Signed> {
  return { data, signature: hex(await crypto.subtle.sign('HMAC', mac, te.encode(canonicalJson(data)))) }
}

const manifestHash = (d: ManifestData) => sha256Hex(te.encode(canonicalJson(d)))

/** Higher revision wins; ties go to the higher device id. Never the clock. */
export function resolveConflict<T extends { revision: number; deviceId: string }>(a: T, b: T): T {
  if (a.revision !== b.revision) return a.revision > b.revision ? a : b
  return a.deviceId >= b.deviceId ? a : b
}

// ---------- the dumb store ----------

type File = { bytes: Uint8Array; version: number }

/** Serves bytes by path and refuses stale writes. It has no idea it is a sync backend. */
export class DumbStore {
  files = new Map<string, File>()
  manifests: Uint8Array[] = []
  async get(path: string): Promise<File | null> {
    await sleep(40)
    const f = this.files.get(path)
    return f ? { bytes: f.bytes.slice(), version: f.version } : null
  }
  async put(path: string, bytes: Uint8Array, expected: number | null) {
    await sleep(40)
    const cur = this.files.get(path)
    if ((cur?.version ?? null) !== expected) throw new ConcurrentWriteConflict(path)
    this.files.set(path, { bytes: bytes.slice(), version: (cur?.version ?? 0) + 1 })
    if (path.endsWith('manifest.json')) this.manifests.push(bytes.slice())
  }
  /** Attacker tools: the store operator can do anything except hold the keys. */
  flipBit(path: string) {
    const f = this.files.get(path)
    if (!f) return -1
    const i = Math.floor(f.bytes.length * (0.3 + Math.random() * 0.4))
    f.bytes[i] ^= 1 << Math.floor(Math.random() * 7)
    return i
  }
  replace(path: string, bytes: Uint8Array) {
    const cur = this.files.get(path)
    this.files.set(path, { bytes: bytes.slice(), version: (cur?.version ?? 0) + 1 })
  }
}

// ---------- devices ----------

export type LocalObj = Rec & { pending: boolean; lastHash: string | null; storeVersion: number | null }
export type LogLine = { text: string; cls?: 'ok' | 'bad' | 'warn' | 'dim' }
export type Log = (line: LogLine) => void

export class Device {
  local = new Map<string, LocalObj>()
  lastRev = 0
  lastManifestHash: string | null = null
  halted: string | null = null
  busy = false
  constructor(
    public name: string,
    public id: string,
  ) {}

  get(objectId: string) {
    return this.local.get(objectId)
  }

  edit(objectId: string, body: string) {
    const prev = this.local.get(objectId)
    this.local.set(objectId, {
      objectId,
      type: 'note',
      deleted: false,
      payload: { body },
      // bumped on every local edit, as in the real engine's upsert
      revision: (prev?.revision ?? 0) + 1,
      deviceId: this.id,
      pending: true,
      lastHash: prev?.lastHash ?? null,
      storeVersion: prev?.storeVersion ?? null,
    })
  }
}

export type SyncResult = { pulled: number; pushed: number; revision: number; retries: number }

/**
 * One sync call, with the real engine's retry policy: losing the race on the
 * manifest restarts the whole cycle with exponential backoff (300 ms up to
 * 8 s, eight attempts). Losing it on an object write ends this call; the
 * next sync pulls what the other device wrote and resolves the conflict.
 */
export async function sync(dev: Device, store: DumbStore, keys: Keys, prefix: string, log: Log, pauseMs = 0): Promise<SyncResult> {
  let retries = 0
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const r = await attemptSync(dev, store, keys, prefix, log, pauseMs)
      return { ...r, retries }
    } catch (e) {
      if (!(e instanceof ConcurrentWriteConflict) || !e.message.endsWith('manifest.json')) throw e
      retries++
      if (attempt < 7) {
        const ms = Math.min(8000, 300 * 2 ** attempt)
        log({ text: `${dev.name}  409: the manifest changed since we read it, retrying the cycle in ${ms} ms`, cls: 'warn' })
        await sleep(ms)
      }
    }
  }
  throw new Error('gave up after 8 lost races on the manifest')
}

async function attemptSync(dev: Device, store: DumbStore, keys: Keys, prefix: string, log: Log, pauseMs: number) {
  const mPath = `${prefix}/manifest.json`
  const mFile = await store.get(mPath)
  let remote: Signed | null = null

  if (mFile) {
    let parsed: Signed
    try {
      parsed = JSON.parse(td.decode(mFile.bytes)) as Signed
    } catch {
      throw new TamperDetected('manifest bytes are not even valid JSON')
    }
    const ok = await crypto.subtle.verify('HMAC', keys.mac, hexToBytes(parsed.signature) as BufferSource, te.encode(canonicalJson(parsed.data)))
    if (!ok) throw new TamperDetected('manifest signature does not verify')
    if (parsed.data.revision < dev.lastRev) throw new ReplayDetected(`store served manifest r${parsed.data.revision}, this device already saw r${dev.lastRev}`)
    const h = await manifestHash(parsed.data)
    if (parsed.data.revision === dev.lastRev && dev.lastManifestHash && h !== dev.lastManifestHash)
      throw new ReplayDetected(`two different manifests both claim r${dev.lastRev}`)
    if (parsed.data.revision === dev.lastRev + 1 && dev.lastManifestHash && parsed.data.previousManifestHash !== dev.lastManifestHash)
      throw new TamperDetected('hash chain to the previous manifest is broken')
    remote = parsed
  }

  const data: ManifestData = remote?.data ?? { revision: 0, previousManifestHash: null, objects: {} }

  // pull
  let pulled = 0
  for (const [oid, entry] of Object.entries(data.objects)) {
    const mine = dev.local.get(oid)
    if (mine && mine.lastHash === entry.hash) continue
    const path = `${prefix}/objects/${oid}.enc`
    const f = await store.get(path)
    if (!f) continue
    if ((await sha256Hex(f.bytes)) !== entry.hash) {
      log({ text: `${dev.name}  ${oid}.enc hash doesn’t match the manifest. CorruptObject, skipped; the cycle carries on`, cls: 'bad' })
      continue
    }
    let rec: Rec
    try {
      rec = await open(keys.aes, f.bytes)
    } catch {
      log({ text: `${dev.name}  ${oid}.enc failed GCM authentication, rejected`, cls: 'bad' })
      continue
    }
    if (mine?.pending) {
      const winner = resolveConflict({ revision: rec.revision, deviceId: rec.deviceId, side: 'remote' }, { revision: mine.revision, deviceId: mine.deviceId, side: 'local' })
      if (winner.side === 'remote') {
        dev.local.set(oid, { ...rec, pending: false, lastHash: entry.hash, storeVersion: f.version })
        log({ text: `${dev.name}  conflict on ${oid}: r${rec.revision}·${rec.deviceId} beats local r${mine.revision}·${mine.deviceId} → take remote`, cls: 'warn' })
        pulled++
      } else {
        mine.lastHash = entry.hash
        mine.storeVersion = f.version
        log({ text: `${dev.name}  conflict on ${oid}: local r${mine.revision}·${mine.deviceId} beats r${rec.revision}·${rec.deviceId} → keep local`, cls: 'warn' })
      }
    } else {
      dev.local.set(oid, { ...rec, pending: false, lastHash: entry.hash, storeVersion: f.version })
      pulled++
    }
  }
  dev.lastRev = Math.max(dev.lastRev, data.revision)
  if (remote) dev.lastManifestHash = await manifestHash(data)

  if (pauseMs) await sleep(pauseMs)

  // push
  const pending = [...dev.local.values()].filter((o) => o.pending)
  if (!pending.length) return { pulled, pushed: 0, revision: data.revision }

  const objects = { ...data.objects }
  const written: { o: LocalObj; hash: string; version: number }[] = []
  for (const o of pending) {
    const rec: Rec = { objectId: o.objectId, revision: o.revision, deviceId: o.deviceId, type: o.type, deleted: o.deleted, payload: o.payload }
    const bytes = await seal(keys.aes, rec)
    const path = `${prefix}/objects/${o.objectId}.enc`
    await store.put(path, bytes, o.storeVersion)
    written.push({ o, hash: await sha256Hex(bytes), version: (o.storeVersion ?? 0) + 1 })
    objects[o.objectId] = { revision: rec.revision, hash: written[written.length - 1].hash, type: rec.type, deleted: rec.deleted }
  }
  const next: ManifestData = {
    revision: data.revision + 1,
    previousManifestHash: remote ? await manifestHash(data) : null,
    objects,
  }
  const signed = await sign(keys.mac, next)
  try {
    await store.put(mPath, te.encode(JSON.stringify(signed)), mFile?.version ?? null)
  } catch (e) {
    // our object writes stand; the next attempt re-reads and re-checks them
    for (const w of written) w.o.storeVersion = w.version
    throw e
  }
  for (const w of written) {
    w.o.pending = false
    w.o.lastHash = w.hash
    w.o.storeVersion = w.version
  }
  dev.lastRev = next.revision
  dev.lastManifestHash = await manifestHash(next)
  return { pulled, pushed: pending.length, revision: next.revision }
}

function hexToBytes(h: string) {
  const out = new Uint8Array(h.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function readManifest(store: DumbStore, prefix: string): Signed | null {
  const f = store.files.get(`${prefix}/manifest.json`)
  if (!f) return null
  try {
    return JSON.parse(td.decode(f.bytes)) as Signed
  } catch {
    return null
  }
}
