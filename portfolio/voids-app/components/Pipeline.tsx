'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Boxes, Database, FlaskConical, Gauge, HardDriveDownload, Laptop } from 'lucide-react'

const STAGES = [
  {
    icon: Boxes,
    name: 'Open-weight base',
    short: 'Start from a strong 20–32B model',
    body: 'Pretraining from scratch costs trillions of tokens. VOIDS starts from a released open-weight model with a permissive license and an existing coding foundation, and keeps it unchanged as the baseline to beat.',
  },
  {
    icon: Database,
    name: 'Domain dataset',
    short: 'Curated, deduplicated, decontaminated',
    body: 'Permissively licensed React, Next.js and TypeScript repositories, bug-fix pairs, test-verified synthetic tasks, and accessibility fixes, filtered for quality and stripped of anything that overlaps the evaluation sets.',
  },
  {
    icon: FlaskConical,
    name: 'Specialized training',
    short: 'QLoRA / LoRA, distillation, RL',
    body: 'Supervised fine-tuning with low-rank adapters, distillation from stronger teacher models where licenses allow, then reinforcement learning where the reward is a compiler, a type checker and a test suite, not a human opinion.',
  },
  {
    icon: Gauge,
    name: 'Verifiable evaluation',
    short: 'Execution, not vibes',
    body: 'Held-out, time-windowed React tasks run in a sandbox: does it build, type-check, pass the tests, pass the accessibility audit? Every result is compared with the unchanged base model and strong competitors.',
  },
  {
    icon: HardDriveDownload,
    name: 'Quantization',
    short: '16-bit → 8 / 6 / 4-bit',
    body: 'Shrink the weights for local use, then re-run the same evaluation at each precision, because quantization costs some accuracy and that cost has to be measured, not assumed.',
  },
  {
    icon: Laptop,
    name: 'Local deployment',
    short: 'On a workstation or a well-equipped laptop',
    body: 'Served by llama.cpp, MLX or vLLM on hardware the customer controls. Code and prompts never leave the machine.',
  },
]

export function Pipeline() {
  const [i, setI] = useState(2)
  const S = STAGES[i]
  return (
    <div className="mt-10">
      <div className="relative grid grid-cols-2 gap-3 md:grid-cols-6">
        <div className="absolute left-[8%] right-[8%] top-9 hidden h-px bg-rule md:block" />
        <motion.div className="absolute left-[8%] top-9 hidden h-px bg-warm md:block" animate={{ width: `${(i / (STAGES.length - 1)) * 84}%` }} transition={{ duration: 0.6 }} />
        {STAGES.map((s, k) => {
          const Icon = s.icon
          const on = k === i
          return (
            <button key={s.name} onClick={() => setI(k)} aria-pressed={on} className="relative z-10 flex flex-col items-center gap-3 text-center">
              <span className={`flex h-[72px] w-[72px] items-center justify-center rounded-full border bg-void transition ${on ? 'border-warm text-warm shadow-[0_0_40px_-8px_rgba(255,154,82,0.6)]' : k < i ? 'border-warm/50 text-warm/70' : 'border-rule text-ink-3'}`}>
                <Icon size={26} strokeWidth={1.4} />
              </span>
              <span className={`text-[13.5px] leading-tight ${on ? 'text-ink' : 'text-ink-2'}`}>{s.name}</span>
              <span className="label hidden text-[10px] md:block">{s.short}</span>
            </button>
          )
        })}
      </div>
      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto mt-10 max-w-[70ch] rounded-2xl border border-rule bg-panel p-6">
        <p className="label">
          <span className="text-warm">Stage {i + 1}</span> · {S.short}
        </p>
        <p className="display mt-2 text-[26px] font-[650]">{S.name}</p>
        <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{S.body}</p>
      </motion.div>
    </div>
  )
}
