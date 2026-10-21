'use client'

import { motion } from 'motion/react'
import { Tag } from './Slide'

const METRICS = [
  { name: 'Task completion rate', formula: 'tasks fully solved ÷ tasks attempted', why: 'The headline: did the job get done?' },
  { name: 'Code execution success', formula: 'outputs that run without error ÷ outputs', why: 'Plausible-looking code that crashes counts as a failure.' },
  { name: 'Test pass rate', formula: 'hidden tests passed ÷ hidden tests', why: 'Graded by tests the model never saw.' },
  { name: 'Build success rate', formula: 'next build && tsc --strict succeed ÷ attempts', why: 'Production React has to compile and type-check.' },
  { name: 'Latency', formula: 'time to first token, time to complete', why: 'A model that is right but slow loses the developer.' },
  { name: 'Peak memory', formula: 'max resident memory during the run', why: 'Decides which machines can run it at all.' },
  { name: 'Tokens per second', formula: 'generated tokens ÷ generation time', why: 'Measured on named hardware, never quoted from a ceiling.' },
  { name: 'Cost per successful task', formula: '(energy + hardware amortization or API spend) ÷ tasks solved', why: 'The number a business actually pays.' },
]

const ARMS = [
  { name: 'Unchanged base model', role: 'The control. VOIDS must beat the exact model it started from, or training added nothing.', c: 'border-ink-3' },
  { name: 'VOIDS React', role: 'The candidate, evaluated at every precision it ships in (16-bit, 8-bit, 4-bit).', c: 'border-warm' },
  { name: 'Strong open models of similar and larger size', role: 'Same harness, same tasks, same budget: the fair comparison.', c: 'border-cool' },
  { name: 'Frontier API models', role: 'The reference ceiling on the same tasks, reported with their cost per successful task.', c: 'border-cool-2' },
]

const TARGETS = [
  { goal: 'Beat the unchanged base model on every primary metric', bar: 'Difference outside the 95% confidence interval, over 3 seeds' },
  { goal: 'Match or beat open general models several times larger on the React suite', bar: 'Same harness, same token budget, same tasks' },
  { goal: 'Approach frontier API models on the React suite', bar: 'At a fraction of the cost per successful task, measured, not assumed' },
  { goal: 'Stay usable locally', bar: '4-bit, 32K context, interactive speed on a single 32 GB GPU: measured tokens/s and peak memory' },
  { goal: 'Lose little outside the domain', bar: 'General coding benchmarks re-run to quantify any regression' },
]

export function Measurement() {
  return (
    <div className="mt-10 grid gap-10">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-rule bg-panel p-4"
          >
            <p className="font-mono text-[11px] text-warm">{String(i + 1).padStart(2, '0')}</p>
            <p className="mt-1 text-[16px] font-medium text-ink">{m.name}</p>
            <p className="mt-2 font-mono text-[11.5px] leading-snug text-ink-2">{m.formula}</p>
            <p className="mt-2 text-[13px] leading-snug text-ink-3">{m.why}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="label mb-3">Every run has four arms</p>
          <div className="grid gap-2">
            {ARMS.map((a) => (
              <div key={a.name} className={`rounded-xl border-l-2 bg-panel px-4 py-3 ${a.c}`}>
                <p className="text-[15px] text-ink">{a.name}</p>
                <p className="text-[13px] leading-snug text-ink-3">{a.role}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
            Tasks are written after the base model’s release, run in a sandbox (Node 22, the project’s own package manager, Vitest, Playwright, axe-core), sampled at pass@1, with every prompt, output and failure published.
          </p>
        </div>
        <div>
          <div className="mb-3 flex items-center gap-3">
            <p className="label">What success means</p>
            <Tag kind="target" />
          </div>
          <table className="w-full text-left text-[14px]">
            <tbody>
              {TARGETS.map((t) => (
                <tr key={t.goal} className="border-t border-rule align-top">
                  <td className="py-3 pr-4 text-ink">{t.goal}</td>
                  <td className="py-3 text-ink-3">{t.bar}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
            If VOIDS doesn’t clear these bars against its own base model, the hypothesis is wrong for that domain, and we will say so. These are targets; no VOIDS model has been trained yet.
          </p>
        </div>
      </div>
    </div>
  )
}
