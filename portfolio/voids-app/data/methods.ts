// How a 20–30B model can become exceptional at one domain: each method, what the
// primary source measured, and what it costs or risks.
import type { SourceId } from './sources'

export type Method = { name: string; what: string; fact: string; limit: string; source: SourceId }

export const METHODS: Method[] = [
  {
    name: 'LoRA',
    what: 'Freeze the base model; train small low-rank matrices added to its layers.',
    fact: 'On GPT-3 175B: 10,000× fewer trainable parameters and 3× less GPU memory than full fine-tuning, with no added inference latency.',
    limit: 'Less capacity than full fine-tuning for large shifts; the frozen base is still held in 16-bit.',
    source: 'lora',
  },
  {
    name: 'QLoRA',
    what: 'LoRA through a frozen base quantized to 4-bit NF4, with double quantization and paged optimizers.',
    fact: 'Fine-tunes a 65B model on one 48 GB GPU and a 33B model on one 24 GB GPU; 16-bit full fine-tuning of 65B needs more than 780 GB.',
    limit: 'Slower per step than 16-bit LoRA; quantization approximations can cost some quality.',
    source: 'qlora',
  },
  {
    name: 'Distillation',
    what: 'Train the small model on outputs and reasoning traces from a stronger teacher.',
    fact: 'DeepSeek fine-tuned Qwen and Llama models on ~800k teacher samples (SFT only, no RL); the 32B distill beats OpenAI o1-mini on several reasoning benchmarks.',
    limit: 'Capped by the teacher; teacher licences and terms must allow it.',
    source: 'deepseek_r1',
  },
  {
    name: 'RL with verifiable rewards',
    what: 'Reward the model only when a compiler, type checker or test suite says it is right.',
    fact: 'DeepSWE (RL only, from Qwen3-32B) raised SWE-bench Verified Pass@1 from 23% to 42.2% in 200 steps; DeepCoder-14B rose from 53% to 60.6% on LiveCodeBench v5.',
    limit: 'Needs tasks with executable checks and sandboxed environments; rewards can be gamed if tests are weak.',
    source: 'deepswe',
  },
  {
    name: 'High-quality and synthetic data',
    what: 'Filter hard for quality; generate exercises with known-correct answers.',
    fact: 'phi-1 (1.3B), trained on 6B filtered + 1B synthetic tokens, scored 50.6% on HumanEval; DCLM matched stronger baselines with 40% less compute by filtering.',
    limit: 'Synthetic data can leak benchmark content and narrow the model’s style.',
    source: 'phi1',
  },
  {
    name: 'Continued pretraining',
    what: 'Keep pretraining on a large domain corpus before instruction tuning.',
    fact: 'Code Llama continued Llama 2 on 500B code-heavy tokens and reached up to 67% HumanEval.',
    limit: 'Expensive (hundreds of billions of tokens) and can erode general ability.',
    source: 'codellama',
  },
]

export const CONTAMINATION = [
  { fact: '8–18% of HumanEval overlaps with the RedPajama and StarCoder pretraining sets, and rephrased test items slip past n-gram decontamination.', source: 'rethink_contam' as SourceId },
  { fact: 'Models name the buggy file from the issue text alone in up to 76% of SWE-bench Verified cases, against up to 53% on repositories outside the benchmark: a sign of memorization.', source: 'swe_illusion' as SourceId },
  { fact: 'LiveCodeBench collects new problems continuously, so a model can be scored only on problems published after its training cutoff.', source: 'livecodebench' as SourceId },
]

export const FRONTEND_EVALS = [
  { name: 'WebDev Arena', what: 'Human pairwise votes on generated Next.js / React / Tailwind apps', source: 'webdev_arena' as SourceId },
  { name: 'Next.js Agent Evals', what: 'Coding-agent success rate on real Next.js tasks', source: 'nextjs_evals' as SourceId },
  { name: 'Web-Bench', what: '50 projects × 20 sequential tasks; best 25.1% Pass@1 at release', source: 'webbench' as SourceId },
  { name: 'FrontendBench', what: '148 tasks with sandboxed interactive tests; 90.5% agreement with experts', source: 'frontendbench' as SourceId },
  { name: 'WebGen-Bench', what: 'Whole websites from scratch; a fine-tuned Qwen2.5-Coder-32B rose to 38.2% (best before: 27.8%)', source: 'webgenbench' as SourceId },
  { name: 'SWE-bench Multimodal', what: '617 visual bug-fix tasks from 17 JavaScript UI libraries', source: 'swe_mm' as SourceId },
]
