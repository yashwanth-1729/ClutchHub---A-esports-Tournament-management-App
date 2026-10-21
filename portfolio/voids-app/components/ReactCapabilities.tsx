'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Accessibility, Bug, Component, FileCode2, FlaskConical, FolderTree, Gauge, LayoutGrid, Route, Wrench } from 'lucide-react'
import { Cite, Tag } from './Slide'

const CAPS = [
  { icon: Component, name: 'Component creation', ex: 'A data table with sorting, pagination and keyboard support, typed end to end.', check: 'Type-checks, renders, Vitest + Testing Library pass' },
  { icon: Route, name: 'Next.js architecture', ex: 'Choose server vs client components, data fetching, caching and route handlers for an App Router app.', check: 'next build succeeds; route tests pass' },
  { icon: FileCode2, name: 'TypeScript development', ex: 'Generic, strict types for props, hooks and API responses without any.', check: 'tsc --strict with zero errors' },
  { icon: LayoutGrid, name: 'Responsive UI generation', ex: 'Layouts that hold from 360 px phones to 2560 px displays.', check: 'Playwright screenshots at set widths; no overflow' },
  { icon: Bug, name: 'Complex debugging', ex: 'Hydration mismatches, stale closures, effect loops, race conditions.', check: 'The failing test passes; nothing else regresses' },
  { icon: Gauge, name: 'Optimization', ex: 'Cut re-renders, split bundles, fix layout shift.', check: 'Bundle size and Lighthouse metrics before/after' },
  { icon: Accessibility, name: 'Accessibility', ex: 'Labels, focus order, roles, contrast, reduced motion.', check: 'axe-core finds zero violations' },
  { icon: FolderTree, name: 'Repository-level reasoning', ex: 'Change a shared hook and update every caller across the codebase.', check: 'Full build and test suite on the repository' },
  { icon: FlaskConical, name: 'Automated testing', ex: 'Write the tests a reviewer would ask for, including edge cases.', check: 'Tests fail on seeded bugs (mutation testing)' },
  { icon: Wrench, name: 'Refactoring', ex: 'Class components to hooks, Pages Router to App Router, prop drilling to context.', check: 'Behaviour-preserving: the old test suite still passes' },
]

/** Pretraining mixes: Qwen2.5-Coder's published ratio, and a proposed VOIDS React fine-tuning curriculum. */
const MIXES = {
  base: {
    title: 'A general coding base model',
    note: 'Qwen2.5-Coder’s published pretraining mix: code, text and math at 7 : 2 : 1, over 5.5 trillion tokens.',
    tag: 'evidence' as const,
    parts: [
      { name: 'Code, ~92 languages', v: 70, c: 'bg-cool-2' },
      { name: 'General text', v: 20, c: 'bg-cool/70' },
      { name: 'Math', v: 10, c: 'bg-cool/40' },
    ],
  },
  voids: {
    title: 'The proposed VOIDS React curriculum',
    note: 'A design choice to be tested, not a result: most of the signal on the target domain, plus general code replayed so the model doesn’t forget it.',
    tag: 'target' as const,
    parts: [
      { name: 'React · Next.js · TypeScript repositories', v: 35, c: 'bg-warm' },
      { name: 'Test-verified synthetic tasks', v: 20, c: 'bg-warm/80' },
      { name: 'Bug-fix and refactor pairs', v: 15, c: 'bg-warm/65' },
      { name: 'Accessibility and performance fixes', v: 10, c: 'bg-warm/50' },
      { name: 'Docs-grounded Q&A', v: 10, c: 'bg-warm/35' },
      { name: 'General code replay', v: 10, c: 'bg-cool-2' },
    ],
  },
}

export function ReactCapabilities() {
  const [mix, setMix] = useState<'base' | 'voids'>('voids')
  const m = MIXES[mix]
  return (
    <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <p className="label">Target capabilities, each with how it would be checked</p>
          <Tag kind="target" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CAPS.map((c, i) => {
            const Icon = c.icon
            return (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="group rounded-xl border border-rule bg-panel p-4 transition hover:border-warm/50"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-warm" strokeWidth={1.6} />
                  <p className="text-[15.5px] font-medium text-ink">{c.name}</p>
                </div>
                <p className="mt-2 text-[13.5px] leading-snug text-ink-2">{c.ex}</p>
                <p className="mt-2 font-mono text-[11.5px] text-ok/80">✓ {c.check}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-rule bg-panel p-6">
        <p className="label mb-3">Where the training signal goes</p>
        <div className="flex gap-2">
          <button onClick={() => setMix('base')} aria-pressed={mix === 'base'} className={`rounded-full border px-3 py-1.5 text-[13px] ${mix === 'base' ? 'border-cool bg-cool/15' : 'border-rule text-ink-2'}`}>
            General coding base
          </button>
          <button onClick={() => setMix('voids')} aria-pressed={mix === 'voids'} className={`rounded-full border px-3 py-1.5 text-[13px] ${mix === 'voids' ? 'border-warm bg-warm/15' : 'border-rule text-ink-2'}`}>
            VOIDS React
          </button>
        </div>
        <p className="display mt-5 text-[22px] font-[650]">{m.title}</p>
        <div className="mt-4 flex h-5 w-full overflow-hidden rounded-full">
          {m.parts.map((p) => (
            <motion.div key={mix + p.name} layout initial={{ width: 0 }} animate={{ width: `${p.v}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className={`${p.c} h-full`} />
          ))}
        </div>
        <ul className="mt-4 grid gap-2 text-[14px]">
          {m.parts.map((p) => (
            <li key={p.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-2">
                <span className={`h-2.5 w-2.5 rounded-sm ${p.c}`} />
                {p.name}
              </span>
              <span className="font-mono text-ink">{p.v}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
          {m.note} {mix === 'base' ? <Cite id="qwen25coder" /> : null}
        </p>
        <div className="mt-3">
          <Tag kind={m.tag} />
        </div>
      </div>
    </div>
  )
}
