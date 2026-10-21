'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { FRONTIER } from '@/data/models'
import { times } from '@/lib/format'
import { Cite, Tag } from './Slide'

/** Areas drawn to scale: a circle's area is its parameter count. */
export function ParamCompare() {
  const [fId, setFId] = useState(FRONTIER[0].id)
  const [voidsB, setVoidsB] = useState(24)
  const f = FRONTIER.find((x) => x.id === fId)!
  const R = 190 // radius of the frontier model's total
  const r = (b: number) => R * Math.sqrt(b / f.totalB)
  const moe = f.activeB < f.totalB

  return (
    <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="relative">
        <svg viewBox="0 0 640 420" className="w-full" role="img" aria-label={`${f.label}: ${f.totalB} billion parameters in total, ${f.activeB} billion active per token, beside VOIDS at ${voidsB} billion.`}>
          <defs>
            <radialGradient id="pc-warm">
              <stop offset="0%" stopColor="#ffd2a8" />
              <stop offset="60%" stopColor="#ff9a52" />
              <stop offset="100%" stopColor="#ff7a3a" />
            </radialGradient>
          </defs>
          {/* frontier: total */}
          <motion.circle cx={230} cy={210} animate={{ r: R }} fill="rgba(143,163,255,0.06)" stroke="rgba(143,163,255,0.55)" strokeDasharray="3 5" />
          {/* frontier: active per token */}
          {moe ? <motion.circle cx={230} cy={210} animate={{ r: r(f.activeB) }} transition={{ type: 'spring', stiffness: 80, damping: 16 }} fill="rgba(143,163,255,0.35)" stroke="rgba(143,163,255,0.9)" /> : null}
          <text x={230} y={210 - R - 12} textAnchor="middle" className="fill-[#8fa3ff] font-mono text-[12px]">
            {f.totalB.toLocaleString('en-IN')}B total
          </text>
          {moe ? (
            <text x={230} y={214} textAnchor="middle" className="fill-ink font-mono text-[11px]">
              {f.activeB}B active
            </text>
          ) : null}
          {/* VOIDS */}
          <motion.circle cx={520} cy={250} animate={{ r: r(voidsB) }} transition={{ type: 'spring', stiffness: 80, damping: 16 }} fill="url(#pc-warm)" />
          <text x={520} y={250 + r(voidsB) + 22} textAnchor="middle" className="fill-[#ff9a52] font-mono text-[12px]">
            VOIDS {voidsB}B dense
          </text>
        </svg>
        <p className="mt-2 text-[12.5px] text-ink-3">Circle area ∝ parameter count. Dashed: every parameter the model stores. Filled: the parameters used for each token.</p>
      </div>

      <div className="grid gap-6">
        <div>
          <p className="label mb-3">Compare against</p>
          <div className="flex flex-wrap gap-2">
            {FRONTIER.map((x) => (
              <button
                key={x.id}
                onClick={() => setFId(x.id)}
                aria-pressed={x.id === fId}
                className={`rounded-full border px-3 py-1.5 text-[13px] transition ${x.id === fId ? 'border-cool bg-cool/15 text-ink' : 'border-rule text-ink-2 hover:border-ink-3'}`}
              >
                {x.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-ink-3">
            {f.note} <Cite id={f.source} />
          </p>
        </div>
        <div>
          <div className="flex justify-between">
            <p className="label">VOIDS size</p>
            <span className="font-mono text-[13px]">{voidsB}B</span>
          </div>
          <input type="range" min={20} max={30} value={voidsB} onChange={(e) => setVoidsB(+e.target.value)} className="mt-2 w-full" aria-label="VOIDS size in billions of parameters" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-cool/40 p-4">
            <p className="label">Stored parameters</p>
            <p className="num display mt-1 text-[44px] leading-none font-[350] text-cool">{times(f.totalB, voidsB)}</p>
            <p className="mt-1 text-[12.5px] text-ink-3">larger than VOIDS {voidsB}B</p>
          </div>
          <div className="rounded-xl border border-rule p-4">
            <p className="label">Active per token</p>
            <p className="num display mt-1 text-[44px] leading-none font-[350]">{f.activeB >= voidsB ? times(f.activeB, voidsB) : `${(voidsB / f.activeB).toFixed(1)}× smaller`}</p>
            <p className="mt-1 text-[12.5px] text-ink-3">{moe ? 'mixture of experts: most weights idle per token' : 'dense: every weight used per token'}</p>
          </div>
        </div>
        <p className="text-[14px] leading-relaxed text-ink-2">
          A mixture-of-experts model stores all its experts but uses a few per token, so its <b className="font-semibold text-ink">memory</b> follows the total and its <b className="font-semibold text-ink">compute per token</b> follows the active count. Neither number alone predicts quality: data, training and evaluation do. <Tag kind="evidence" />
        </p>
      </div>
    </div>
  )
}
