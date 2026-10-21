import { Deck, type DeckSection } from '@/components/Deck'
import { Economics } from '@/components/Economics'
import { EvidenceExplorer } from '@/components/EvidenceExplorer'
import { GpuCalculator } from '@/components/GpuCalculator'
import { Measurement } from '@/components/Measurement'
import { MemoryCalculator } from '@/components/MemoryCalculator'
import { Methods } from '@/components/Methods'
import { ParamCompare } from '@/components/ParamCompare'
import { Pipeline } from '@/components/Pipeline'
import { ReactCapabilities } from '@/components/ReactCapabilities'
import { Closing, Commercial, Hero, ProblemVisual } from '@/components/Sections'
import { Slide } from '@/components/Slide'
import { HARDWARE_SOURCES } from '@/data/hardware'

const SECTIONS: DeckSection[] = [
  { id: 'hero', title: 'VOIDS' },
  { id: 'problem', title: 'The problem' },
  { id: 'hypothesis', title: 'The hypothesis' },
  { id: 'evidence', title: 'Evidence' },
  { id: 'react', title: 'VOIDS React' },
  { id: 'technology', title: 'Technology' },
  { id: 'local', title: 'Local intelligence' },
  { id: 'infrastructure', title: 'Owning GPUs' },
  { id: 'economics', title: 'Economics' },
  { id: 'measured', title: 'Measured' },
  { id: 'commercial', title: 'Commercial' },
  { id: 'closing', title: 'Closing' },
]

export default function Page() {
  return (
    <Deck sections={SECTIONS}>
      <div className="grid-bg pointer-events-none fixed inset-0 -z-10" />
      <Hero />

      <Slide
        id="problem"
        n="02"
        label="The problem with general-purpose AI"
        title="Frontier models know a little about everything, and live in someone else’s data centre."
        lede="The strongest models are hundreds of billions to a trillion parameters. They run only in the cloud, priced per token, and every prompt carries your code with it. For a company’s private repository, that is often a deal-breaker, and the answers are still often “almost right”."
        sources={['deepseek_v3', 'kimi_k2', 'llama31', 'qwen3_report', 'openai_pricing', 'anthropic_pricing', 'google_pricing', 'so2025_ai', 'cisco2025', 'ibm2025']}
      >
        <ProblemVisual />
      </Slide>

      <Slide
        id="hypothesis"
        n="03"
        label="The VOIDS hypothesis"
        title="Most of a giant model is irrelevant to any single task."
        lede="A 20–30B model, trained deeply on one domain and checked by executable tests, can approach frontier performance on that domain while fitting on one workstation. Compare the sizes honestly: mixture-of-experts models store far more parameters than they use per token."
        sources={['deepseek_v3', 'kimi_k2', 'llama31', 'qwen3_report']}
      >
        <ParamCompare />
      </Slide>

      <Slide
        id="evidence"
        n="04"
        label="Scientific evidence"
        title="Smaller models already beat much larger ones, in specific domains."
        lede="Published comparisons, strongest first. “Shows” means an independent harness ran every model the same way; “Suggests” means the developer reported it or the larger model’s size is secret; “Against” marks where small models lose."
        sources={['swebench_lb', 'livecodebench_lb', 'evalplus_lb', 'aider_lb', 'qwen3_report', 'deepseek_r1', 'phi4', 'gptoss_card']}
      >
        <EvidenceExplorer />
      </Slide>

      <Slide
        id="react"
        n="05"
        label="VOIDS React"
        title="The first specialist: React, Next.js and TypeScript."
        lede="Frontend engineering is huge, fast-moving and checkable: code either builds, type-checks, renders and passes its tests, or it doesn’t. These are target capabilities, each paired with the automated check that would prove it."
        sources={['qwen25coder', 'so2025_tech', 'stateofjs2025', 'octoverse2025']}
      >
        <ReactCapabilities />
      </Slide>

      <Slide
        id="technology"
        n="06"
        label="The technology behind specialization"
        title="Not a new giant model. A focused pipeline on an open one."
        lede="Every stage uses published, reproducible methods. Click a stage."
        sources={['lora', 'qlora', 'deepseek_r1', 'deepswe', 'phi1', 'codellama', 'rethink_contam', 'swe_illusion', 'livecodebench']}
      >
        <Pipeline />
        <Methods />
      </Slide>

      <Slide
        id="local"
        n="07"
        label="Local intelligence"
        title="Will it run on my machine?"
        lede="Pick a model, a precision, a context length and a device. Memory is computed from each model’s published architecture; speed is a bandwidth ceiling, not a promise. Measured speeds follow in section 09."
        sources={['hf_qwen25coder32_cfg', 'hf_qwen3_32_cfg', 'hf_qwen3_30a3_cfg', 'hf_devstral_cfg', 'gptoss_card', 'gemma3_report', 'apple_m4', 'apple_m4promax', 'apple_m3ultra', 'nv_4090', 'nv_5090', 'nv_pro6000']}
      >
        <MemoryCalculator />
      </Slide>

      <Slide
        id="infrastructure"
        n="08"
        label="Owning GPUs"
        title="What it costs to own the hardware, in India."
        lede="Choose GPUs and a platform. Prices are Indian listings at the time of research and move weekly; treat them as indicative."
        sources={HARDWARE_SOURCES}
      >
        <GpuCalculator />
      </Slide>

      <Slide
        id="economics"
        n="09"
        label="Real AI economics"
        title="Memory decides what is possible. Usage decides what is cheap."
        sources={['zero', 'unsloth_req', 'hwcorner5090', 'llamacpp15396', 'willison_qwen25', 'openai_pricing', 'anthropic_pricing', 'google_pricing', 'together_pricing', 'groq_models', 'openrouter_models']}
      >
        <Economics />
      </Slide>

      <Slide
        id="measured"
        n="10"
        label="Evaluation"
        title="Performance is measured. Not promised."
        lede="VOIDS will be judged against the model it started from, on fresh tasks it could not have seen, by code that runs. Benchmarks that leak into training are worthless: OpenAI stopped reporting SWE-bench Verified in 2026 for exactly this reason."
        sources={['openai_swe_verified', 'rethink_contam', 'swe_illusion', 'livecodebench', 'webdev_arena', 'nextjs_evals', 'webbench', 'frontendbench', 'webgenbench', 'swe_mm']}
      >
        <Measurement />
      </Slide>

      <Slide
        id="commercial"
        n="11"
        label="Commercial potential"
        title="A large, checkable market that cannot send its code away."
        lede="Demand, privacy pressure and India’s developer base, from the sources themselves. Forecasts are labelled as forecasts."
        sources={['octoverse2025', 'so2025_tech', 'stateofjs2025', 'so2025_ai', 'so2026_ai', 'gartner_slm', 'cisco2026', 'dpdp', 'eu_ai_act', 'nasscom2026', 'indiaai_factsheet']}
      >
        <Commercial />
      </Slide>

      <Closing />
    </Deck>
  )
}
