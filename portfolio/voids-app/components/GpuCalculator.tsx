'use client'

import { useMemo, useState } from 'react'
import { CLOUD_REFERENCE, ELECTRICITY_DEFAULT, GPUS, WORKSTATIONS, fineTuneFit } from '@/data/hardware'
import { inr, lakh } from '@/lib/format'
import { Tag } from './Slide'

export function GpuCalculator() {
  const [gpuId, setGpuId] = useState(GPUS[0].id)
  const [qty, setQty] = useState(1)
  const [wsId, setWsId] = useState(WORKSTATIONS[0].id)
  const [tariff, setTariff] = useState(ELECTRICITY_DEFAULT.inrPerKwh)
  const [hours, setHours] = useState(12)
  const [years, setYears] = useState(4)

  const gpu = GPUS.find((g) => g.id === gpuId)!
  const ws = WORKSTATIONS.find((w) => w.id === wsId)!
  const maxQty = Math.max(1, Math.min(ws.maxGpus, Math.floor(ws.gpuBudgetW / gpu.tdpW)))
  const n = Math.min(qty, maxQty)

  const r = useMemo(() => {
    const gpuCost = gpu.priceInr * n
    const platform = ws.components.reduce((s, c) => s + c.priceInr, 0)
    const capex = gpuCost + platform
    // power at the wall under load: GPUs at board power, the rest of the system, ×1.1 for PSU losses and cooling
    const watts = (gpu.tdpW * n + ws.baseW) * 1.1
    const kwhMonth = (watts / 1000) * hours * 30
    const power = kwhMonth * tariff
    const depreciation = capex / (years * 12)
    const upkeep = (capex * 0.04) / 12 // assumed 4% of capex a year for repairs, spares, fans, paste
    const monthly = power + depreciation + upkeep
    const gpuHours = n * hours * 30
    return { gpuCost, platform, capex, watts, kwhMonth, power, depreciation, upkeep, monthly, perGpuHour: monthly / gpuHours, vram: gpu.vram * n }
  }, [gpu, ws, n, tariff, hours, years])

  const fit = fineTuneFit(r.vram, gpu.vram)

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="grid content-start gap-6 rounded-2xl border border-rule bg-panel p-6">
        <div>
          <p className="label mb-3">GPU</p>
          <select value={gpuId} onChange={(e) => setGpuId(e.target.value)} className="w-full rounded-lg border border-rule bg-void px-3 py-2.5 text-[15px] text-ink">
            {GPUS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.vram} GB · {lakh(g.priceInr)}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[13px] text-ink-3">
            {gpu.category} · {gpu.tdpW} W · {gpu.bandwidth} · {gpu.priceNote}
          </p>
        </div>
        <div>
          <p className="label mb-3">Platform</p>
          <div className="grid gap-2">
            {WORKSTATIONS.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setWsId(w.id)
                  setQty((q) => Math.min(q, w.maxGpus))
                }}
                aria-pressed={w.id === wsId}
                className={`rounded-xl border px-4 py-3 text-left transition ${w.id === wsId ? 'border-warm bg-warm/10' : 'border-rule hover:border-ink-3'}`}
              >
                <span className="block text-[15px] text-ink">{w.label}</span>
                <span className="block text-[12.5px] text-ink-3">{w.summary}</span>
              </button>
            ))}
          </div>
        </div>
        <Slider label="GPUs" value={n} min={1} max={maxQty} step={1} onChange={setQty} show={`${n} × ${gpu.vram} GB = ${r.vram} GB`} />
        <Slider label="Electricity" value={tariff} min={5} max={14} step={0.25} onChange={setTariff} show={`₹${tariff.toFixed(2)} / kWh`} />
        <Slider label="Training or inference hours per day" value={hours} min={2} max={24} step={1} onChange={setHours} show={`${hours} h`} />
        <Slider label="Depreciation period" value={years} min={2} max={6} step={1} onChange={setYears} show={`${years} years`} />
      </div>

      <div className="grid content-start gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label">Purchase cost, complete workstation</p>
            <p className="num display text-[clamp(52px,6.4vw,96px)] leading-none font-[300]">{lakh(r.capex)}</p>
            <p className="mt-2 text-[15px] text-ink-2">
              {inr(r.gpuCost)} in GPUs + {inr(r.platform)} platform
            </p>
          </div>
          <Tag kind="indicative" />
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat name="Power at the wall" value={`${(r.watts / 1000).toFixed(2)} kW`} sub={`${Math.round(r.kwhMonth)} kWh / month`} />
          <Stat name="Electricity" value={inr(r.power)} sub="per month" />
          <Stat name="Depreciation" value={inr(r.depreciation)} sub="per month" />
          <Stat name="Effective cost" value={inr(r.perGpuHour)} sub="per GPU-hour owned" warm />
        </div>

        <div className="rounded-2xl border border-rule p-5">
          <p className="label mb-2">What {r.vram} GB of VRAM allows for a 20–30B model</p>
          <ul className="grid gap-2 text-[14.5px] leading-snug">
            {fit.map((f) => (
              <li key={f.task} className="flex gap-3">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${f.ok === 'yes' ? 'bg-ok' : f.ok === 'tight' ? 'bg-warn' : 'bg-bad'}`} />
                <span>
                  <span className="text-ink">{f.task}</span> <span className="text-ink-3">· {f.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-rule p-5">
          <p className="label mb-2">Platform bill of materials</p>
          <ul className="grid gap-1.5 text-[13.5px]">
            {ws.components.map((c) => (
              <li key={c.part} className="flex justify-between gap-4 border-b border-rule/60 pb-1.5 last:border-0">
                <span className="text-ink-3">{c.part}</span>
                <span className="text-right text-ink-2">
                  {c.name} · <span className="text-ink">{inr(c.priceInr)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[12.5px] leading-relaxed text-ink-3">
          Monthly cost = electricity + straight-line depreciation over {years} years + upkeep (assumed 4% of purchase a year). Power = (GPU board power × count + {ws.baseW} W rest of system) × 1.1 for PSU losses and cooling, at {hours} h a day, 30 days.
          GPU prices are Indian listings or indicative figures from the sources in RESEARCH.md; they move weekly. For scale only, not mixed into any figure above: {CLOUD_REFERENCE.text}
        </p>
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, show }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; show: string }) {
  return (
    <div>
      <div className="flex justify-between">
        <p className="label">{label}</p>
        <span className="font-mono text-[13px] text-ink">{show}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-2 w-full" aria-label={label} disabled={min === max} />
    </div>
  )
}

function Stat({ name, value, sub, warm }: { name: string; value: string; sub: string; warm?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${warm ? 'border-warm/50' : 'border-rule'}`}>
      <p className="label">{name}</p>
      <p className={`num mt-1 text-[22px] ${warm ? 'text-warm' : 'text-ink'}`}>{value}</p>
      <p className="text-[12px] text-ink-3">{sub}</p>
    </div>
  )
}
