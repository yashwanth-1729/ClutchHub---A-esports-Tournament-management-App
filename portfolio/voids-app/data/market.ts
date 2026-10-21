// API prices, demand signals and regulation: each with its source and date.
// Prices are list prices in US$ per million tokens, standard tier, short context,
// read from the providers' own pricing pages on 21 October 2026. They change often.
import type { SourceId } from './sources'

export type ApiPrice = { model: string; provider: string; kind: 'frontier' | 'open'; inPerM: number; outPerM: number; note?: string; source: SourceId }

export const API_PRICES: ApiPrice[] = [
  { model: 'GPT-5.5', provider: 'OpenAI', kind: 'frontier', inPerM: 5, outPerM: 30, note: 'under 272K context', source: 'openai_pricing' },
  { model: 'Claude Opus 5.5', provider: 'Anthropic', kind: 'frontier', inPerM: 4, outPerM: 20, source: 'anthropic_pricing' },
  { model: 'Gemini 3.1 Pro (preview)', provider: 'Google', kind: 'frontier', inPerM: 2, outPerM: 12, note: 'up to 200K context', source: 'google_pricing' },
  { model: 'Claude Sonnet 5.5', provider: 'Anthropic', kind: 'frontier', inPerM: 2, outPerM: 10, source: 'anthropic_pricing' },
  { model: 'GPT-5', provider: 'OpenAI', kind: 'frontier', inPerM: 1.25, outPerM: 10, source: 'openai_pricing' },
  { model: 'Gemma 4 31B', provider: 'Together AI', kind: 'open', inPerM: 0.39, outPerM: 0.97, note: 'serverless', source: 'together_pricing' },
  { model: 'gpt-oss-20b', provider: 'Groq', kind: 'open', inPerM: 0.075, outPerM: 0.3, source: 'groq_models' },
  { model: 'Qwen3-32B', provider: 'OpenRouter', kind: 'open', inPerM: 0.08, outPerM: 0.28, note: 'lowest listed provider', source: 'openrouter_models' },
]

/** A labelled assumption for blending input and output prices into one figure. */
export const BLEND = { input: 3, output: 1, text: 'Blended price assumes 3 input tokens for every output token, typical of coding assistants that read more context than they write. This ratio is our assumption.' }

export const blended = (p: ApiPrice) => (p.inPerM * BLEND.input + p.outPerM * BLEND.output) / (BLEND.input + BLEND.output)

export type Fact = { stat: string; text: string; source: SourceId }

/** Section 2: why general-purpose cloud AI is a hard fit for private code. */
export const PROBLEM_FACTS: Fact[] = [
  { stat: '46%', text: 'of developers distrust the accuracy of AI output; 33% trust it, and 3.1% “highly trust” it.', source: 'so2025_ai' },
  { stat: '66%', text: 'name “AI solutions that are almost right, but not quite” as their biggest frustration.', source: 'so2025_ai' },
  { stat: '64%', text: 'of organisations worry about inadvertently sharing sensitive information through generative AI.', source: 'cisco2025' },
  { stat: '1 in 5', text: 'organisations reported a breach caused by “shadow AI”, adding US$670K to the average breach cost where it was common.', source: 'ibm2025' },
]

/** Section 11: demand signals. */
export const DEMAND: Fact[] = [
  { stat: '#1', text: 'TypeScript became the most-used language on GitHub in August 2025, adding 1.05 million contributors (+66.6% in a year).', source: 'octoverse2025' },
  { stat: '44.7%', text: 'of developers use React and 20.8% use Next.js (n = 23,678); 43.6% use TypeScript.', source: 'so2025_tech' },
  { stat: '83.6%', text: 'of State of JavaScript 2025 respondents have used React; 58.6% have used Next.js.', source: 'stateofjs2025' },
  { stat: '84%', text: 'of developers use or plan to use AI tools; 50.6% of professionals use them every day.', source: 'so2025_ai' },
  { stat: '6.6%', text: 'of developers trust AI output for important decisions; 48% trust it only when they can easily verify it.', source: 'so2026_ai' },
  { stat: '3×', text: 'Gartner predicts that by 2027 organisations will use small, task-specific models at least three times more than general-purpose LLMs (a forecast, not a measurement).', source: 'gartner_slm' },
]

export const PRIVACY: Fact[] = [
  { stat: '81%', text: 'of organisations face heightened demand for data localisation; 86% believe local storage is inherently safer.', source: 'cisco2026' },
  { stat: '₹250 cr', text: 'maximum DPDP penalty for failing to keep reasonable security safeguards; the Rules were notified in November 2025 with phased compliance over 18 months.', source: 'dpdp' },
  { stat: '2 Aug 2025', text: 'EU AI Act obligations for general-purpose AI models began to apply; the Act is generally applicable from 2 August 2026.', source: 'eu_ai_act' },
]

export const INDIA: Fact[] = [
  { stat: '5.2M+', text: 'developers in India joined GitHub in 2025, over 14% of all new accounts; GitHub projects 57.5M Indian developers by 2030.', source: 'octoverse2025' },
  { stat: '$315.4B', text: 'Indian technology industry revenue, FY26 estimate, with about 6.0 million people directly employed.', source: 'nasscom2026' },
  { stat: '45,000+', text: 'GPUs in the IndiaAI Mission’s subsidised pool as of June 2026; 93.18 lakh GPU-hours used across 237 projects by August.', source: 'indiaai_factsheet' },
]

export const APPLICATIONS = [
  { name: 'On-premise coding assistant', text: 'For agencies, product companies and IT services firms whose client contracts forbid sending code to third-party APIs.' },
  { name: 'Regulated industries', text: 'Banks, insurers, healthcare and government teams building React front ends under DPDP, RBI or sectoral data rules.' },
  { name: 'Pull-request review', text: 'A React-specialist reviewer in CI that checks hooks, accessibility and performance before a human looks.' },
  { name: 'Migration at scale', text: 'Class components to hooks, Pages Router to App Router, JavaScript to strict TypeScript, across thousands of files at a fixed hardware cost.' },
  { name: 'Accessibility remediation', text: 'Find and fix WCAG failures, verified by axe-core rather than by eye.' },
  { name: 'Offline and edge', text: 'Developers on laptops with poor connectivity, air-gapped networks, and classrooms without cloud budgets.' },
]

export const RISKS = [
  { name: 'The base moves fast', text: 'Qwen alone released new ~27–32B open models in April 2025, February, April and August 2026. A specialist must be re-derivable on each new base, or it falls behind a general model that simply got better.' },
  { name: 'Prices keep falling', text: 'Hosted 20–32B models already cost US$0.02–0.40 per million input tokens. The case for owning hardware rests on privacy, control and volume, not on price alone.' },
  { name: 'Benchmarks can mislead', text: 'OpenAI stopped reporting SWE-bench Verified in February 2026, citing contamination. VOIDS has to be judged on fresh, held-out, executable tasks.' },
  { name: 'Licences and teachers', text: 'The base model’s licence and any teacher model’s terms decide what can be trained, distilled and sold.' },
  { name: 'It might not work', text: 'Specialization may not beat the unchanged base model by a meaningful margin. That is exactly what the evaluation is designed to find out.' },
]
