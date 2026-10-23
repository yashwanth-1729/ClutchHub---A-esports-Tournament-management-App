'use client'

import { motion } from 'motion/react'
import { ArrowRight, Mail } from 'lucide-react'
import { FRONTIER } from '@/data/models'
import { API_PRICES, APPLICATIONS, DEMAND, INDIA, PRIVACY, PROBLEM_FACTS, RISKS, type Fact } from '@/data/market'
import { PRECISIONS, weightsGB } from '@/lib/memory'
import { useWebgl } from '@/lib/gl/status'
import { Concentration } from './Concentration'
import { Cite, Tag } from './Slide'

const BF16 = PRECISIONS.find((p) => p.id === 'bf16')!
const Q4 = PRECISIONS.find((p) => p.id === 'q4')!

export function Hero() {
  // null until we know; true when the WebGL black hole behind the page is drawing the name itself
  const webgl = useWebgl()
  const hole = webgl === true
  const late = (d: number) => (hole ? d + 4.6 : d) // under the black hole, the words wait for the disk to light

  return (
    <section id="hero" className="slide relative flex min-h-svh flex-col items-center overflow-hidden px-5 text-center">
      {webgl === false ? <Concentration className="absolute inset-0 h-full w-full" /> : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-void/80 to-transparent" />

      {webgl === null ? null : (
      <>
      <div className={`relative z-10 flex flex-col items-center ${hole ? 'mt-auto mb-[11vh]' : 'my-auto'}`}>
        {hole ? (
          <h1 className="sr-only">VOIDS — Domain-Specialized Intelligence</h1>
        ) : (
          <motion.h1
            initial={{ opacity: 0, letterSpacing: '0.3em' }}
            animate={{ opacity: 1, letterSpacing: '-0.02em' }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="display mb-8 text-[clamp(84px,17vw,260px)] leading-[0.85] font-[780] text-ink"
          >
            VOIDS
          </motion.h1>
        )}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: late(0.5), duration: 1 }} className="label text-warm-2">
          Domain-Specialized Intelligence
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: late(0.8), duration: 1 }} className="display mt-4 text-[clamp(22px,2.4vw,36px)] leading-[1.05] font-[650]">
          Small by Design. <span className="text-warm">Exceptional by Domain.</span>
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: late(1.1), duration: 1 }} className="mt-4 max-w-[46ch] text-[clamp(14px,1.05vw,17px)] leading-relaxed text-ink-3">
          Compact AI models built for frontier-competitive expertise in the domains that matter.
        </motion.p>
      </div>
      </>
      )}
    </section>
  )
}

/** Section 2: the size of general-purpose models, against the memory a developer actually has. */
export function ProblemVisual() {
  const rows = [
    ...FRONTIER.map((f) => ({ label: f.label, b: f.totalB, cool: true, source: f.source })),
    { label: 'VOIDS (proposed, 24B)', b: 24, cool: false, source: null },
  ].sort((a, b) => b.b - a.b)
  const max = weightsGB(rows[0].b, BF16.bitsPerWeight)
  const frontier = API_PRICES.filter((p) => p.kind === 'frontier')

  return (
    <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div className="rounded-2xl border border-rule bg-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="label">Memory just to hold the weights</p>
          <Tag kind="estimate" />
        </div>
        <div className="grid gap-4">
          {rows.map((r, i) => {
            const w16 = weightsGB(r.b, BF16.bitsPerWeight)
            const w4 = weightsGB(r.b, Q4.bitsPerWeight)
            return (
              <div key={r.label}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[14px]">
                  <span className={r.cool ? 'text-ink' : 'text-warm'}>
                    {r.label} {r.source ? <Cite id={r.source} /> : null}
                  </span>
                  <span className="font-mono text-[12.5px] text-ink-2">
                    {Math.round(w16).toLocaleString('en-IN')} GB · <span className="text-ink-3">4-bit {Math.round(w4).toLocaleString('en-IN')} GB</span>
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-rule/40">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.max(0.6, (w16 / max) * 100)}%` }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 1, ease: [0.16, 1, 0.3, 1] }} className={`absolute inset-y-0 left-0 rounded-full ${r.cool ? 'bg-cool-2' : 'bg-warm'}`} />
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.max(0.4, (w4 / max) * 100)}%` }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.08, duration: 1 }} className={`absolute inset-y-0 left-0 rounded-full ${r.cool ? 'bg-cool' : 'bg-warm-2'}`} />
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-5 text-[13px] leading-relaxed text-ink-3">
          Weights = parameters × bits per weight ÷ 8, at 16-bit (dark) and ~4.85-bit Q4_K_M (light). A mixture-of-experts model activates only a fraction per token but must still keep every expert in memory. A 16–64 GB laptop cannot hold any of the four; a 24B model at 4-bit is about {Math.round(weightsGB(24, Q4.bitsPerWeight))} GB.
        </p>
      </div>

      <div className="grid content-start gap-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="label">Frontier API list prices, US$ / 1M tokens</p>
            <Tag kind="evidence" />
          </div>
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="label text-[10px]">
                <th className="pb-2 font-normal">Model</th>
                <th className="pb-2 text-right font-normal">In</th>
                <th className="pb-2 text-right font-normal">Out</th>
              </tr>
            </thead>
            <tbody>
              {frontier.map((p) => (
                <tr key={p.model} className="border-t border-rule">
                  <td className="py-2 text-ink">
                    {p.model} <Cite id={p.source} />
                  </td>
                  <td className="py-2 text-right font-mono text-ink-2">{p.inPerM.toFixed(2)}</td>
                  <td className="py-2 text-right font-mono text-ink">{p.outPerM.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[12px] text-ink-3">Standard tier, short context, read 21 Oct 2026. Every prompt and every file of context leaves the building.</p>
        </div>
        <FactGrid facts={PROBLEM_FACTS} cols="sm:grid-cols-2" />
      </div>
    </div>
  )
}

export function FactGrid({ facts, cols = 'sm:grid-cols-2 lg:grid-cols-3' }: { facts: Fact[]; cols?: string }) {
  return (
    <div className={`grid gap-3 ${cols}`}>
      {facts.map((f, i) => (
        <motion.div
          key={f.text}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-rule bg-panel p-4"
        >
          <p className="num display text-[30px] leading-none font-[600] text-warm">{f.stat}</p>
          <p className="mt-2 text-[13.5px] leading-snug text-ink-2">
            {f.text} <Cite id={f.source} />
          </p>
        </motion.div>
      ))}
    </div>
  )
}

export function Commercial() {
  return (
    <div className="mt-10 grid gap-12">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <p className="label">Who writes React, and how they feel about AI</p>
          <Tag kind="evidence" />
        </div>
        <FactGrid facts={DEMAND} />
      </div>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="label mb-4">Privacy and regulation</p>
          <FactGrid facts={PRIVACY} cols="" />
        </div>
        <div>
          <p className="label mb-4">India</p>
          <FactGrid facts={INDIA} cols="" />
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <p className="label">Where VOIDS React would be used</p>
            <Tag kind="target" />
          </div>
          <ul className="grid gap-2">
            {APPLICATIONS.map((a) => (
              <li key={a.name} className="flex gap-3 rounded-xl border border-rule px-4 py-3">
                <ArrowRight size={16} className="mt-1 shrink-0 text-warm" />
                <span>
                  <span className="text-[15px] text-ink">{a.name}</span>
                  <span className="block text-[13.5px] leading-snug text-ink-3">{a.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label mb-4">What could go wrong</p>
          <ul className="grid gap-2">
            {RISKS.map((r) => (
              <li key={r.name} className="rounded-xl border-l-2 border-bad/60 bg-panel px-4 py-3">
                <span className="text-[15px] text-ink">{r.name}</span>
                <span className="block text-[13.5px] leading-snug text-ink-3">{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function Closing() {
  const webgl = useWebgl()
  return (
    <section id="closing" className="slide relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 text-center">
      {webgl === false ? <Concentration className="absolute inset-0 h-full w-full opacity-70" /> : null}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(3,3,3,0.75)_80%)]" />
      <div className="relative z-10 flex flex-col items-center">
        <p className="label mb-8">
          <span className="mr-3 text-warm">13</span>Closing
        </p>
        <h2 className="display max-w-[18ch] text-[clamp(36px,5.4vw,88px)] leading-[0.98] font-[720]">The Future of AI Doesn’t Have to Be Bigger.</h2>
        <p className="display mt-6 text-[clamp(24px,3vw,46px)] leading-tight font-[600] text-warm">It Has to Be Better at What Matters.</p>
        <p className="display mt-16 text-[clamp(22px,2.4vw,34px)] font-[700]">
          VOIDS <span className="font-[400] text-ink-3">— by Voidbyte</span>
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 font-mono text-[14px] sm:flex-row sm:gap-8">
          <a href="https://www.voidbyte.tech" className="text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink">
            www.voidbyte.tech
          </a>
          <a href="mailto:yash@voidbyte.tech" className="flex items-center gap-2 text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink">
            <Mail size={14} /> yash@voidbyte.tech
          </a>
        </div>
      </div>
    </section>
  )
}
