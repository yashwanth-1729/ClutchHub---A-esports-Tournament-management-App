'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { ELECTRICITY_DEFAULT, FX, GPUS, WORKSTATIONS } from '@/data/hardware'
import { API_PRICES } from '@/data/market'
import { MEASURED, TRAIN_MEMORY } from '@/data/measured'
import { PRECISIONS, weightsGB } from '@/lib/memory'
import { inr } from '@/lib/format'
import { useNarrow } from '@/lib/useNarrow'
import { Cite, Tag } from './Slide'

const TICK = { fill: 'rgba(232,226,212,0.7)', fontSize: 12 }
const SIZES = [20, 24, 30]
const QUANTS = ['bf16', 'q8', 'q6', 'q4'].map((id) => PRECISIONS.find((p) => p.id === id)!)

/** Owned single-stream decoding, from measured speeds on an RTX 5090 workstation. */
const OWNED = [
  { label: 'Qwen3-32B dense · 4-bit', tg: MEASURED[0].tg, source: MEASURED[0].source },
  { label: 'Qwen3-30B-A3B MoE · 4-bit', tg: MEASURED[2].tg, source: MEASURED[2].source },
]

export function Economics() {
  const narrow = useNarrow()
  const [hours, setHours] = useState(10)
  const [fx, setFx] = useState(FX.inrPerUsd)

  const weights = SIZES.map((b) => Object.fromEntries([['size', `${b}B`], ...QUANTS.map((q) => [q.id, +weightsGB(b, q.bitsPerWeight).toFixed(1)])]))

  const cost = useMemo(() => {
    const gpu = GPUS.find((g) => g.id === 'rtx5090')!
    const ws = WORKSTATIONS[0]
    const capex = gpu.priceInr + ws.components.reduce((s, c) => s + c.priceInr, 0)
    const watts = (gpu.tdpW + ws.baseW) * 1.1
    const perHour = (watts / 1000) * ELECTRICITY_DEFAULT.inrPerKwh + capex / (4 * 365 * hours) + (capex * 0.04) / (365 * hours)
    const owned = OWNED.map((o) => ({ name: o.label, inr: perHour / ((o.tg * 3600) / 1e6), owned: true }))
    const api = API_PRICES.map((p) => ({ name: `${p.model} (${p.provider})`, inr: p.outPerM * fx, owned: false, open: p.kind === 'open' }))
    return { perHour, capex, rows: [...owned, ...api].sort((a, b) => b.inr - a.inr) }
  }, [hours, fx])

  return (
    <div className="mt-10 grid gap-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <Panel title="Weights at each precision, 20–30B" tag="estimate">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weights} margin={{ left: -8, right: 8, top: 18 }}>
                <CartesianGrid vertical={false} stroke="rgba(232,226,212,0.08)" />
                <XAxis dataKey="size" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} unit=" GB" width={64} />
                {QUANTS.map((q, i) => (
                  <Bar key={q.id} dataKey={q.id} name={q.label} fill={['#5a6bb8', '#8fa3ff', '#ffd2a8', '#ff9a52'][i]} radius={[3, 3, 0, 0]}>
                    <LabelList dataKey={q.id} position="top" fill="#e8e2d4" fontSize={10} />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend items={QUANTS.map((q, i) => ({ c: ['#5a6bb8', '#8fa3ff', '#ffd2a8', '#ff9a52'][i], t: q.label }))} />
          <p className="mt-3 text-[12.5px] leading-snug text-ink-3">params × bits per weight ÷ 8. Add the KV cache for context and ~1 GB of runtime overhead (section 07).</p>
        </Panel>

        <Panel title="Memory to fine-tune a 32B model" tag="evidence">
          <ul className="mt-2 grid gap-4">
            {TRAIN_MEMORY.map((t) => (
              <li key={t.method}>
                <div className="mb-1 flex justify-between text-[14px]">
                  <span className="text-ink">
                    {t.method} <Cite id={t.source} />
                  </span>
                  <span className="font-mono text-ink">{t.gb32} GB</span>
                </div>
                <div className="relative h-3 rounded-full bg-rule/40">
                  <div className={`absolute inset-y-0 left-0 rounded-full ${t.gb32 > 96 ? 'bg-cool-2' : 'bg-warm'}`} style={{ width: `${Math.min(100, (t.gb32 / 512) * 100)}%` }} />
                </div>
                <p className="mt-1 text-[12px] text-ink-3">{t.detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12.5px] leading-snug text-ink-3">
            Full fine-tuning needs a multi-GPU server. QLoRA fits one 32 GB RTX 5090; LoRA on a 16-bit base fits one 96 GB card. That is why VOIDS starts with adapters, not full training.
          </p>
        </Panel>
      </div>

      <Panel title="Measured generation speed, one user, short context" tag="evidence">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MEASURED.map((m) => ({ name: `${m.model.replace(/ \((dense|MoE)\)/, '')} · ${m.hardware}`, tg: m.tg, moe: /MoE/.test(m.model) }))} layout="vertical" margin={{ left: 0, right: 48 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={narrow ? 150 : 250} tick={{ ...TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Bar dataKey="tg" radius={[0, 3, 3, 0]} barSize={16}>
                {MEASURED.map((m) => (
                  <Cell key={m.model + m.hardware + m.context} fill={/MoE/.test(m.model) ? '#ff9a52' : '#8fa3ff'} />
                ))}
                <LabelList dataKey="tg" position="right" fill="#e8e2d4" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[12.5px] leading-snug text-ink-3">
          Tokens per second generated, as measured by others: Hardware Corner <Cite id="hwcorner5090" />, llama.cpp contributors <Cite id="llamacpp15396" />, Simon Willison <Cite id="willison_qwen25" />. Warm = mixture-of-experts (few active parameters), cool = dense. Includes the
          RTX 5090 at 4K and 32K context.
        </p>
      </Panel>

      <Panel title="Cost per million generated tokens: owned workstation vs API" tag="estimate">
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="flex justify-between">
              <span className="label">Hours of use per day</span>
              <span className="font-mono text-[13px]">{hours} h</span>
            </span>
            <input type="range" min={2} max={24} value={hours} onChange={(e) => setHours(+e.target.value)} className="mt-2 w-full" />
          </label>
          <label className="block">
            <span className="flex justify-between">
              <span className="label">Exchange rate (assumption)</span>
              <span className="font-mono text-[13px]">₹{fx} / US$</span>
            </span>
            <input type="range" min={80} max={100} step={0.5} value={fx} onChange={(e) => setFx(+e.target.value)} className="mt-2 w-full" />
          </label>
        </div>
        <div style={{ height: 34 * cost.rows.length + 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cost.rows.map((r) => ({ ...r, label: inr(r.inr) }))} layout="vertical" margin={{ left: 0, right: narrow ? 56 : 72 }}>
              <XAxis type="number" scale="log" domain={[5, 'auto']} hide allowDataOverflow />
              <YAxis type="category" dataKey="name" width={narrow ? 150 : 260} tick={{ ...TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Bar dataKey="inr" radius={[0, 3, 3, 0]} barSize={18}>
                {cost.rows.map((r) => (
                  <Cell key={r.name} fill={r.owned ? '#ff9a52' : 'open' in r && r.open ? '#8fa3ff' : '#5a6bb8'} />
                ))}
                <LabelList dataKey="label" position="right" fill="#e8e2d4" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Legend
          items={[
            { c: '#ff9a52', t: 'Owned RTX 5090 workstation, one user' },
            { c: '#8fa3ff', t: 'Hosted open-weight model (API)' },
            { c: '#5a6bb8', t: 'Frontier model (API)' },
          ]}
        />
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
          Owned: {inr(cost.capex)} workstation, depreciated over 4 years at {hours} h/day, 4% a year upkeep, and electricity at ₹{ELECTRICITY_DEFAULT.inrPerKwh}/kWh ≈ {inr(cost.perHour)} per hour of use, divided by the measured single-user speed. Serving many users at once
          (batching) raises total throughput and lowers this cost; we have not measured that, so it is not shown. API: list output prices × the exchange rate; input tokens are extra. Log scale.
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          The honest reading: used most of the working day, an owned workstation generates tokens for less than most frontier APIs even serving one person; used an hour or two a day, it does not. Hosted open-weight models are cheaper than both. The reason to own a specialist is that the code never leaves, the model is fixed and auditable, and the cost does not grow with usage. Price alone is not the argument.
        </p>
      </Panel>
    </div>
  )
}

function Panel({ title, tag, children }: { title: string; tag: 'evidence' | 'estimate'; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-rule bg-panel p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="label">{title}</p>
        <Tag kind={tag} />
      </div>
      {children}
    </div>
  )
}

function Legend({ items }: { items: { c: string; t: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-3">
      {items.map((i) => (
        <span key={i.t} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.c }} />
          {i.t}
        </span>
      ))}
    </div>
  )
}
