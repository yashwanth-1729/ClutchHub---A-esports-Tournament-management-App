'use client'

import { useMemo, useState } from 'react'
import { ARCHS, DEVICES, VOIDS_ARCH } from '@/data/models'
import { KV_PRECISIONS, PRECISIONS, decodeCeiling, kvCacheGB, overheadGB, usableGB, verdict, weightsGB, type Arch } from '@/lib/memory'
import { gb } from '@/lib/format'
import { Tag } from './Slide'

const CONTEXTS = [4096, 8192, 16384, 32768, 65536, 131072]
const ctxLabel = (c: number) => `${c / 1024}K`

const tone = {
  comfortable: 'border-ok/50 text-ok',
  tight: 'border-warn/50 text-warn',
  offload: 'border-warm/50 text-warm',
  impractical: 'border-bad/50 text-bad',
} as const

export function MemoryCalculator() {
  const [archId, setArchId] = useState('voids')
  const [voidsB, setVoidsB] = useState(24)
  const [precId, setPrecId] = useState('q4')
  const [kvId, setKvId] = useState('f16')
  const [ctxI, setCtxI] = useState(2)
  const [devId, setDevId] = useState(DEVICES[4].id)

  const arch: Arch = useMemo(() => {
    if (archId !== 'voids') return ARCHS.find((a) => a.id === archId)!
    // a hypothetical dense VOIDS model: the reference architecture scaled to the chosen size
    const s = voidsB / VOIDS_ARCH.totalB
    return { ...VOIDS_ARCH, totalB: voidsB, activeB: voidsB, layers: Math.round(VOIDS_ARCH.layers * Math.sqrt(s)), label: `VOIDS, hypothetical ${voidsB}B dense` }
  }, [archId, voidsB])

  const prec = PRECISIONS.find((p) => p.id === precId)!
  const kv = KV_PRECISIONS.find((k) => k.id === kvId)!
  const device = DEVICES.find((d) => d.id === devId)!
  const context = CONTEXTS[ctxI]

  const w = weightsGB(arch.totalB, prec.bitsPerWeight)
  const k = kvCacheGB(arch, context, kv.bytes)
  const o = overheadGB(w)
  const total = w + k + o
  const usable = usableGB(device)
  const v = verdict(total, device)
  const ceiling = decodeCeiling(arch.activeB, prec.bitsPerWeight, device.bandwidth)
  const scale = Math.max(total, usable) * 1.08

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="grid content-start gap-6 rounded-2xl border border-rule bg-panel p-6">
        <Field label="Model">
          <select value={archId} onChange={(e) => setArchId(e.target.value)} className="w-full rounded-lg border border-rule bg-void px-3 py-2.5 text-[15px] text-ink">
            <option value="voids">VOIDS (hypothetical dense model)</option>
            {ARCHS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          {archId === 'voids' ? (
            <div className="mt-4">
              <div className="flex justify-between text-[14px] text-ink-2">
                <span>Parameters</span>
                <span className="font-mono text-ink">{voidsB}B</span>
              </div>
              <input type="range" min={20} max={30} step={1} value={voidsB} onChange={(e) => setVoidsB(+e.target.value)} className="mt-2 w-full" aria-label="Parameters in billions" />
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-ink-3">
              {arch.totalB}B total{arch.activeB !== arch.totalB ? `, ${arch.activeB}B active (mixture of experts)` : ', dense'} · {arch.layers} layers, {arch.kvHeads} KV heads × {arch.headDim}
              {arch.slidingWindow ? `, sliding window ${arch.slidingWindow} on ${arch.layers - (arch.fullAttnLayers ?? 0)} layers` : ''}
            </p>
          )}
        </Field>

        <Field label="Weight precision">
          <div className="flex flex-wrap gap-2">
            {PRECISIONS.map((p) => (
              <Chip key={p.id} on={p.id === precId} onClick={() => setPrecId(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-ink-3">{prec.note} ≈ {prec.bitsPerWeight} bits per weight.</p>
        </Field>

        <Field label={`Context length · ${ctxLabel(context)} tokens`}>
          <input type="range" min={0} max={CONTEXTS.length - 1} step={1} value={ctxI} onChange={(e) => setCtxI(+e.target.value)} className="w-full" aria-label="Context length" />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-3">
            {CONTEXTS.map((c) => (
              <span key={c}>{ctxLabel(c)}</span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            {KV_PRECISIONS.map((p) => (
              <Chip key={p.id} on={p.id === kvId} onClick={() => setKvId(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Device">
          <select value={devId} onChange={(e) => setDevId(e.target.value)} className="w-full rounded-lg border border-rule bg-void px-3 py-2.5 text-[15px] text-ink">
            {DEVICES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[13px] text-ink-3">{device.note}</p>
        </Field>
      </div>

      <div className="grid content-start gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label">Total estimated memory</p>
            <p className="num display text-[clamp(56px,7vw,104px)] leading-none font-[300]">{gb(total).replace(' GB', '')}<span className="ml-2 text-[0.3em] text-ink-3">GB</span></p>
          </div>
          <Tag kind="estimate" />
        </div>

        {/* the stack against what the device can give */}
        <div>
          <div className="relative h-14 w-full overflow-hidden rounded-lg border border-rule bg-void">
            <Bar from={0} to={w} scale={scale} className="bg-warm/85" />
            <Bar from={w} to={w + k} scale={scale} className="bg-cool/80" />
            <Bar from={w + k} to={total} scale={scale} className="bg-ink-3/70" />
            <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${(usable / scale) * 100}%` }} />
            <span className="label absolute top-1 text-ink" style={{ left: `calc(${(usable / scale) * 100}% + 6px)` }}>
              usable {gb(usable)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-[14px]">
            <Legend color="bg-warm/85" name="Weights" value={gb(w)} />
            <Legend color="bg-cool/80" name={`KV cache · ${ctxLabel(context)}`} value={gb(k)} />
            <Legend color="bg-ink-3/70" name="Runtime overhead" value={gb(o)} />
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${tone[v.level]}`}>
          <p className="display text-[22px] font-[650]">{v.title}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{v.detail}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-rule p-4">
            <p className="label">Generation speed ceiling</p>
            <p className="num mt-1 text-[32px] font-[350]">≤ {Math.round(ceiling)} tok/s</p>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-3">
              {device.bandwidth} GB/s ÷ {gb(weightsGB(arch.activeB, prec.bitsPerWeight))} of active weights read per token. A theoretical upper bound; real runs land well below it. Not a measurement.
            </p>
          </div>
          <div className="rounded-xl border border-rule p-4">
            <p className="label">Why weights ≠ peak memory</p>
            <p className="mt-1 text-[13.5px] leading-snug text-ink-2">
              The KV cache grows with every token of context ({gb(kvCacheGB(arch, 1, kv.bytes) * 1024)} per 1K tokens here), and the runtime needs buffers for activations. A model that “is 18 GB” can need far more at long context.
            </p>
          </div>
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink-3">
          Assumptions: weights = parameters × bits ÷ 8; KV = 2 × layers × KV heads × head dim × bytes × tokens; overhead = 0.8 GB + 6% of weights (runtime and compute buffers). Usable memory: ~66% of unified memory on Macs up to 36 GB and
          ~75% above (macOS GPU working-set limit), VRAM − 0.5 GB on NVIDIA, RAM − 4 GB for CPU-only. Hypothetical VOIDS sizes reuse the Qwen2.5-32B attention layout (8 KV heads × 128 dims) with the layer count scaled by √(size ÷ 32.8B): an assumption, since no VOIDS architecture is fixed.
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label mb-3">{label}</p>
      {children}
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`rounded-full border px-3 py-1.5 text-[13px] transition ${on ? 'border-warm bg-warm/15 text-ink' : 'border-rule text-ink-2 hover:border-ink-3 hover:text-ink'}`}>
      {children}
    </button>
  )
}

function Bar({ from, to, scale, className }: { from: number; to: number; scale: number; className: string }) {
  return <div className={`absolute inset-y-0 transition-all duration-500 ${className}`} style={{ left: `${(from / scale) * 100}%`, width: `${((to - from) / scale) * 100}%` }} />
}

function Legend({ color, name, value }: { color: string; name: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-ink-3">
        <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
        <span className="text-[12.5px]">{name}</span>
      </div>
      <p className="num mt-0.5 text-[18px] text-ink">{value}</p>
    </div>
  )
}
