'use client'

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Code2, Database, FileText, FlaskConical, Layers, Server } from 'lucide-react'
import { ELECTRICITY_DEFAULT, FX, GPUS, WORKSTATIONS } from '@/data/hardware'
import { API_PRICES } from '@/data/market'
import { MEASURED } from '@/data/measured'
import { VOIDS_ARCH } from '@/data/models'
import { PRECISIONS, kvCacheGB, overheadGB, weightsGB } from '@/lib/memory'
import { inr, lakh } from '@/lib/format'
import { Cite, Tag } from './Slide'

const Q4 = PRECISIONS.find((p) => p.id === 'q4')!
// measured on an RTX 5090: Qwen3-32B dense, 4-bit, 4K deep (Hardware Corner)
const PP = MEASURED[0].pp! // prompt tokens read per second
const TG = MEASURED[0].tg // tokens written per second

/** LoRA rank 16 on every attention and MLP projection of the Qwen2.5-32B shape (hidden 5120, KV 1024, MLP 27648, 64 layers), 16-bit. */
const ADAPTER_GB = (16 * ((5120 + 5120) * 2 + (5120 + 1024) * 2 + (5120 + 27648) * 3) * 64 * 2) / 1e9

const SPECIALISTS = [
  { icon: Code2, name: 'React & frontend', note: 'VOIDS React' },
  { icon: Server, name: 'Backend & APIs', note: 'a later specialist' },
  { icon: Database, name: 'SQL & data', note: 'a later specialist' },
  { icon: FlaskConical, name: 'Tests & review', note: 'a later specialist' },
  { icon: FileText, name: 'Docs & support', note: 'a later specialist' },
]

const RIGS = [
  { id: 'rtx5090', label: '1 × RTX 5090 (32 GB)', ws: 'single', speed: 'measured' },
  { id: 'pro6000', label: '1 × RTX PRO 6000 (96 GB)', ws: 'single', speed: 'assumed equal to the RTX 5090: same 1,792 GB/s bandwidth' },
] as const

export function CompanySavings() {
  const frontier = API_PRICES.filter((p) => p.kind === 'frontier')
  const [devs, setDevs] = useState(50)
  const [reqs, setReqs] = useState(100)
  const [inTok, setInTok] = useState(8000)
  const [outTok, setOutTok] = useState(800)
  const [local, setLocal] = useState(80)
  const [apiId, setApiId] = useState(frontier.find((p) => p.model.startsWith('Claude Opus'))!.model)
  const [rigId, setRigId] = useState<(typeof RIGS)[number]['id']>('rtx5090')
  const [hours, setHours] = useState(10)
  const days = 22

  const api = frontier.find((p) => p.model === apiId)!
  const rig = RIGS.find((r) => r.id === rigId)!

  const r = useMemo(() => {
    const gpu = GPUS.find((g) => g.id === rig.id)!
    const ws = WORKSTATIONS.find((w) => w.id === rig.ws)!
    const perMachine = gpu.priceInr + ws.components.reduce((s, c) => s + c.priceInr, 0)

    const reqMonth = devs * reqs * days
    const perReqUsd = (inTok * api.inPerM + outTok * api.outPerM) / 1e6
    const allApi = reqMonth * perReqUsd * FX.inrPerUsd

    // one request at a time: read the prompt, then write the answer, at measured speeds
    const secPerReq = inTok / PP + outTok / TG
    const localReqDay = devs * reqs * (local / 100)
    const machines = local > 0 ? Math.max(1, Math.ceil((localReqDay * secPerReq) / (hours * 3600))) : 0
    const busy = machines ? (localReqDay * secPerReq) / (machines * hours * 3600) : 0

    const watts = (gpu.tdpW + ws.baseW) * 1.1
    const ownedMonth = machines * (perMachine / 48 + (perMachine * 0.04) / 12 + (watts / 1000) * hours * days * ELECTRICITY_DEFAULT.inrPerKwh)
    const hybrid = allApi * (1 - local / 100) + ownedMonth
    const saving = allApi - hybrid
    const capex = machines * perMachine

    // how many specialists fit at once: as separate full models, or as adapters on one shared base
    const base = weightsGB(VOIDS_ARCH.totalB, Q4.bitsPerWeight)
    const kv = kvCacheGB(VOIDS_ARCH, 32768)
    const oneModel = base + kv + overheadGB(base)
    const separate = Math.floor((gpu.vram - 0.5) / oneModel)
    const adapters = Math.max(0, Math.floor((gpu.vram - 0.5 - oneModel) / ADAPTER_GB))

    return { allApi, hybrid, ownedMonth, saving, capex, machines, busy, secPerReq, payback: saving > 0 ? capex / saving : null, separate, adapters, oneModel, gpu }
  }, [devs, reqs, inTok, outTok, local, api, rig, hours])

  const max = Math.max(r.allApi, r.hybrid)

  return (
    <div className="mt-10 grid gap-8">
      {/* routing diagram */}
      <div className="rounded-2xl border border-rule bg-panel p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="label">One workstation, many specialists, a router in front</p>
          <Tag kind="target" />
        </div>
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.7fr)_auto_minmax(0,1.3fr)_auto_minmax(0,0.7fr)]">
          <div className="rounded-xl border border-rule px-4 py-3 text-[14px]">
            <p className="text-ink">Every request</p>
            <p className="text-[12.5px] text-ink-3">from the IDE, CI or an internal tool</p>
          </div>
          <span className="hidden font-mono text-warm lg:block">→</span>
          <div className="relative rounded-xl border border-warm/40 p-4">
            <p className="label mb-3 flex items-center gap-2 text-warm">
              <Layers size={13} /> Shared base model + specialist adapters
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SPECIALISTS.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.div key={s.name} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className={`rounded-lg border px-2 py-2 text-center ${i === 0 ? 'border-warm bg-warm/10' : 'border-rule'}`}>
                    <Icon size={16} className={`mx-auto ${i === 0 ? 'text-warm' : 'text-ink-3'}`} />
                    <p className="mt-1 text-[12px] leading-tight text-ink">{s.name}</p>
                    <p className="text-[10.5px] text-ink-3">{s.note}</p>
                  </motion.div>
                )
              })}
            </div>
            <p className="mt-3 text-[12.5px] leading-snug text-ink-3">
              Each specialist is a LoRA adapter of ~{ADAPTER_GB.toFixed(2)} GB on one {Math.round(weightsGB(VOIDS_ARCH.totalB, Q4.bitsPerWeight))} GB base, so switching specialists swaps megabytes, not the whole model. Serving thousands of adapters on one base is published work <Cite id="slora" />.
            </p>
          </div>
          <span className="hidden font-mono text-cool lg:block">→</span>
          <div className="rounded-xl border border-cool-2/60 px-4 py-3 text-[14px]">
            <p className="text-ink">Frontier API</p>
            <p className="text-[12.5px] text-ink-3">only for what the specialists can’t do: the {100 - local}% the router escalates</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* inputs */}
        <div className="grid content-start gap-5 rounded-2xl border border-rule bg-panel p-6">
          <Slider label="Developers" value={devs} min={5} max={500} step={5} onChange={setDevs} show={`${devs}`} />
          <Slider label="AI requests per developer per day" value={reqs} min={10} max={400} step={10} onChange={setReqs} show={`${reqs}`} />
          <Slider label="Tokens read per request (code + context)" value={inTok} min={1000} max={40000} step={1000} onChange={setInTok} show={inTok.toLocaleString('en-IN')} />
          <Slider label="Tokens written per request" value={outTok} min={100} max={4000} step={100} onChange={setOutTok} show={outTok.toLocaleString('en-IN')} />
          <Slider label="Share handled by local specialists" value={local} min={0} max={100} step={5} onChange={setLocal} show={`${local}%`} />
          <Slider label="Machine hours per working day" value={hours} min={8} max={24} step={1} onChange={setHours} show={`${hours} h`} />
          <div>
            <p className="label mb-2">Frontier model it replaces</p>
            <select value={apiId} onChange={(e) => setApiId(e.target.value)} className="w-full rounded-lg border border-rule bg-void px-3 py-2.5 text-[15px] text-ink">
              {frontier.map((p) => (
                <option key={p.model} value={p.model}>
                  {p.model} · ${p.inPerM} in / ${p.outPerM} out
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="label mb-2">Workstation GPU</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {RIGS.map((g) => (
                <button key={g.id} onClick={() => setRigId(g.id)} aria-pressed={g.id === rigId} className={`rounded-xl border px-3 py-2 text-left text-[13.5px] ${g.id === rigId ? 'border-warm bg-warm/10 text-ink' : 'border-rule text-ink-2'}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* results */}
        <div className="grid content-start gap-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="label">{r.saving >= 0 ? 'Saved every month' : 'Extra cost every month'}</p>
              <p className={`num display text-[clamp(48px,6vw,88px)] leading-none font-[300] ${r.saving >= 0 ? 'text-warm' : 'text-bad'}`}>{lakh(Math.abs(r.saving))}</p>
              <p className="mt-2 text-[15px] text-ink-2">
                {lakh(Math.abs(r.saving) * 12)} a year
                {r.payback ? <> · hardware pays back in {r.payback < 1 ? 'under a month' : `${Math.ceil(r.payback)} months`}</> : r.saving < 0 ? ' · at this usage, the API is cheaper' : null}
              </p>
            </div>
            <Tag kind="estimate" />
          </div>

          <div className="grid gap-3">
            <CostBar label={`All requests to ${api.model}`} value={r.allApi} max={max} className="bg-cool-2" />
            <CostBar label={`Hybrid: ${local}% local, ${100 - local}% to ${api.model}`} value={r.hybrid} max={max} className="bg-warm" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat name="Workstations needed" value={`${r.machines}`} sub={r.machines ? `${Math.round(r.busy * 100)}% busy, one request at a time` : 'none'} />
            <Stat name="Hardware, one-time" value={lakh(r.capex)} sub={`${inr(r.ownedMonth)} / month to own and run`} />
            <Stat name="Per local request" value={`${r.secPerReq.toFixed(1)} s`} sub={`read at ${PP.toLocaleString('en-IN')} tok/s, write at ${TG} tok/s`} />
          </div>

          <div className="rounded-2xl border border-rule p-5">
            <p className="label mb-2">Specialists resident at once on {r.gpu.vram} GB · 4-bit, 32K context each</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="num display text-[34px] leading-none">{r.separate}</p>
                <p className="mt-1 text-[13px] text-ink-3">as separate full ~32B models (~{r.oneModel.toFixed(0)} GB each); others load from SSD on demand <Cite id="samsung990" /></p>
              </div>
              <div>
                <p className="num display text-[34px] leading-none text-warm">{r.adapters > 999 ? '1,000+' : r.adapters.toLocaleString('en-IN')}</p>
                <p className="mt-1 text-[13px] text-ink-3">as adapters on one shared base, in memory together (memory permitting; context is shared)</p>
              </div>
            </div>
          </div>

          <p className="text-[12.5px] leading-relaxed text-ink-3">
            Conservative on purpose: each workstation serves one request at a time at the speeds measured for a dense 32B model on an RTX 5090 <Cite id="hwcorner5090" /> ({rig.speed}). Batching many requests together raises throughput and would need fewer machines; we have not measured it,
            so it is not counted. API cost = requests × (tokens read × input price + tokens written × output price) × ₹{FX.inrPerUsd}/US$, list prices, no caching discounts <Cite id={api.source} />. Owning = hardware over 4 years + 4% a year upkeep + electricity at ₹
            {ELECTRICITY_DEFAULT.inrPerKwh}/kWh, {days} working days a month. The usage figures and the local share are your assumptions; whether a specialist can handle {local}% of requests is exactly what VOIDS has to prove.
          </p>
        </div>
      </div>
    </div>
  )
}

function CostBar({ label, value, max, className }: { label: string; value: number; max: number; className: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-[13.5px]">
        <span className="text-ink-2">{label}</span>
        <span className="font-mono text-ink">{inr(value)} / month</span>
      </div>
      <div className="h-3 rounded-full bg-rule/40">
        <motion.div className={`h-full rounded-full ${className}`} animate={{ width: `${(value / max) * 100}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  )
}

function Stat({ name, value, sub }: { name: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-rule bg-panel p-4">
      <p className="label">{name}</p>
      <p className="num mt-2 text-[24px] leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-[12px] leading-snug text-ink-3">{sub}</p>
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, show }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; show: string }) {
  return (
    <label className="block">
      <span className="flex justify-between gap-3">
        <span className="label">{label}</span>
        <span className="font-mono text-[13px] text-ink">{show}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-2 w-full" />
    </label>
  )
}
