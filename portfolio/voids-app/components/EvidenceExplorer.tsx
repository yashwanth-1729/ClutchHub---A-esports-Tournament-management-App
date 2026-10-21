'use client'

import { useState } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { EVIDENCE } from '@/data/evidence'
import { SOURCES } from '@/data/sources'
import { useNarrow } from '@/lib/useNarrow'

const params = (m: { total: number; active?: number }) => (m.active && m.active < m.total ? `${m.total}B total · ${m.active}B active` : `${m.total}B`)
const VERDICT = { proves: ['Shows', 'text-ok'], suggests: ['Suggests', 'text-warn'], against: ['Against', 'text-bad'] } as const

export function EvidenceExplorer() {
  const narrow = useNarrow()
  const [id, setId] = useState(EVIDENCE[0].id)
  const e = EVIDENCE.find((x) => x.id === id)!
  const s = SOURCES[e.source]
  const max = Math.max(...e.scores.map((x) => x.score))
  const data = e.scores.map((x) => ({ ...x, label: x.score.toFixed(1) }))

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <ul className="grid content-start gap-2" role="listbox" aria-label="Published comparisons">
        {EVIDENCE.map((x) => (
          <li key={x.id}>
            <button
              role="option"
              aria-selected={x.id === id}
              onClick={() => setId(x.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${x.id === id ? 'border-warm bg-warm/10' : 'border-rule hover:border-ink-3'}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-[14.5px] text-ink">{x.title}</span>
                <span className={`label shrink-0 text-[10px] ${VERDICT[x.verdict][1]}`}>{VERDICT[x.verdict][0]}</span>
              </span>
              <span className="mt-0.5 block text-[12.5px] text-ink-3">{x.benchmark}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-rule bg-panel p-6">
        <p className="label">
          {e.benchmark} · {e.metric}
        </p>
        <p className="mt-2 text-[clamp(17px,1.3vw,20px)] leading-snug font-[500] text-ink">{e.takeaway}</p>
        <div className="mt-6" style={{ height: data.length * 44 + 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 44, top: 4, bottom: 4 }}>
              <XAxis type="number" domain={[0, Math.ceil(max / 10) * 10 || 100]} hide />
              <YAxis type="category" dataKey="model" width={narrow ? 130 : 200} tick={{ fill: 'rgba(232,226,212,0.75)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} isAnimationActive barSize={24}>
                {data.map((d) => (
                  <Cell key={d.model} fill={d.small ? '#ff9a52' : '#5a6bb8'} />
                ))}
                <LabelList dataKey="label" position="right" fill="#e8e2d4" fontSize={15} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-[12.5px] text-ink-3">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-warm" /> {e.small.name} · {params(e.small)}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-cool-2" /> {e.large.name} · {e.large.total ? params(e.large) : 'size undisclosed'}
          </span>
        </div>
        <dl className="mt-5 grid gap-3 text-[13.5px] leading-snug md:grid-cols-2">
          <div>
            <dt className="label">Conditions</dt>
            <dd className="mt-1 text-ink-2">{e.conditions}</dd>
          </div>
          <div>
            <dt className="label">Limitations</dt>
            <dd className="mt-1 text-ink-2">{e.limitations}</dd>
          </div>
          <div>
            <dt className="label">Verification</dt>
            <dd className="mt-1 text-ink-2">{e.verification}</dd>
          </div>
          <div>
            <dt className="label">Source [{s.n}]</dt>
            <dd className="mt-1">
              <a href={s.url} target="_blank" rel="noreferrer" className="text-ink-2 underline decoration-rule underline-offset-2 hover:text-ink">
                {s.title}
              </a>
              <span className="text-ink-3"> · {s.publisher}, {s.date}</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
