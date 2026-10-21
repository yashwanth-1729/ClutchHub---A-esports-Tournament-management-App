// Inference memory, written out so every number on the page can be traced to a formula.
//
//   weights  = parameters × bits-per-weight ÷ 8
//   KV cache = 2 (K and V) × layers × KV heads × head dim × bytes per element × tokens
//   overhead = runtime + compute buffers, modelled as a fixed floor plus a share of the weights
//
// Bits per weight for quantized formats are the effective figures of llama.cpp's
// GGUF formats (block scales included), so they are a little above the nominal width.

export type Precision = { id: string; label: string; bitsPerWeight: number; note: string }

export const PRECISIONS: Precision[] = [
  { id: 'bf16', label: 'BF16 / FP16', bitsPerWeight: 16, note: 'Full precision weights. The reference for quality.' },
  { id: 'q8', label: '8-bit (Q8_0)', bitsPerWeight: 8.5, note: 'Near-lossless in published llama.cpp perplexity tests.' },
  { id: 'q6', label: '6-bit (Q6_K)', bitsPerWeight: 6.56, note: 'Very small quality loss.' },
  { id: 'q5', label: '5-bit (Q5_K_M)', bitsPerWeight: 5.7, note: 'Small quality loss.' },
  { id: 'q4', label: '4-bit (Q4_K_M)', bitsPerWeight: 4.85, note: 'The usual local default: noticeable but modest loss.' },
  { id: 'q3', label: '3-bit (Q3_K_M)', bitsPerWeight: 3.9, note: 'Quality degrades clearly, especially for code.' },
]

export type KvPrecision = { id: string; label: string; bytes: number }
export const KV_PRECISIONS: KvPrecision[] = [
  { id: 'f16', label: 'FP16 KV cache', bytes: 2 },
  { id: 'q8', label: '8-bit KV cache', bytes: 1.0625 },
]

export type Arch = {
  id: string
  label: string
  totalB: number
  activeB: number
  layers: number
  kvHeads: number
  headDim: number
  /** layers that attend over the full context; the rest use a sliding window */
  fullAttnLayers?: number
  slidingWindow?: number
  maxContext: number
  source: string
}

export function kvBytesPerToken(a: Arch, kvBytes = 2) {
  return 2 * a.layers * a.kvHeads * a.headDim * kvBytes
}

/** KV cache for a context, honouring sliding-window layers where the architecture has them. */
export function kvCacheGB(a: Arch, context: number, kvBytes = 2) {
  const perLayer = 2 * a.kvHeads * a.headDim * kvBytes
  if (a.fullAttnLayers !== undefined && a.slidingWindow) {
    const full = a.fullAttnLayers * perLayer * context
    const sliding = (a.layers - a.fullAttnLayers) * perLayer * Math.min(context, a.slidingWindow)
    return (full + sliding) / 1e9
  }
  return (a.layers * perLayer * context) / 1e9
}

export function weightsGB(paramsB: number, bitsPerWeight: number) {
  return (paramsB * 1e9 * bitsPerWeight) / 8 / 1e9
}

/** Runtime and compute buffers: an assumed 0.8 GB floor plus 6% of the weights. */
export function overheadGB(weights: number) {
  return 0.8 + 0.06 * weights
}

export type Device = {
  id: string
  label: string
  kind: 'unified' | 'cuda' | 'cpu'
  memoryGB: number
  /** memory bandwidth in GB/s, from the manufacturer's spec sheet */
  bandwidth: number
  note: string
}

/**
 * Memory a model may actually use. macOS lets the GPU wire roughly two thirds of
 * unified memory on smaller machines and about three quarters on larger ones; a
 * discrete GPU keeps ~0.5 GB for the driver; a CPU-only machine needs room for the OS.
 */
export function usableGB(d: Device) {
  if (d.kind === 'unified') return d.memoryGB * (d.memoryGB > 36 ? 0.75 : 0.66)
  if (d.kind === 'cuda') return d.memoryGB - 0.5
  return d.memoryGB - 4
}

export type Verdict = { level: 'comfortable' | 'tight' | 'offload' | 'impractical'; title: string; detail: string }

export function verdict(total: number, d: Device): Verdict {
  const usable = usableGB(d)
  if (total <= usable * 0.85)
    return { level: 'comfortable', title: 'Runs comfortably', detail: `Uses ${pct(total, usable)} of the memory this device can give a model, leaving headroom for the OS and apps.` }
  if (total <= usable)
    return { level: 'tight', title: 'Fits, with little headroom', detail: 'Close other applications; long prompts or a bigger context may push it over.' }
  if (d.kind === 'cuda' && total <= usable + 48)
    return { level: 'offload', title: 'Only with CPU offload', detail: 'Layers that do not fit spill into system RAM. It runs, but generation slows sharply because those layers are read over PCIe and from DDR memory.' }
  return { level: 'impractical', title: 'Impractical on this device', detail: 'The model does not fit. Use a smaller quantization, a shorter context, a smaller model, or more memory.' }
}

/**
 * The bandwidth ceiling for generation: every new token reads the active weights once,
 * so tokens/s can't exceed bandwidth ÷ active weight bytes. Real systems reach roughly
 * 50–80% of it. This is a ceiling, never a measurement.
 */
export function decodeCeiling(activeB: number, bitsPerWeight: number, bandwidth: number) {
  const bytesPerToken = weightsGB(activeB, bitsPerWeight)
  return bandwidth / bytesPerToken
}

const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`
