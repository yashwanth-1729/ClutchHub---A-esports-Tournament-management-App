// Argon2id at 64 MiB takes long enough to stall a frame budget, so it runs here,
// off the main thread, and the page keeps scrolling and rendering meanwhile.
import { argon2id } from 'hash-wasm'

type Request = { password: string; salt: Uint8Array; iterations: number; memoryKiB: number; bytes: number }
const post = (self as unknown as { postMessage(message: unknown, transfer?: Transferable[]): void }).postMessage.bind(self)

self.onmessage = async (e: MessageEvent<Request>) => {
  const { password, salt, iterations, bytes } = e.data
  let memoryKiB = e.data.memoryKiB
  const t0 = performance.now()
  const run = () => argon2id({ password, salt, iterations, memorySize: memoryKiB, parallelism: 1, hashLength: bytes, outputType: 'binary' })
  try {
    let out: Uint8Array
    try {
      out = await run()
    } catch {
      // some phones refuse 64 MiB of WebAssembly memory
      memoryKiB = 16384
      out = await run()
    }
    post({ ok: true, out, memoryKiB, ms: performance.now() - t0 }, [out.buffer])
  } catch (err) {
    post({ ok: false, error: String(err) })
  }
}
