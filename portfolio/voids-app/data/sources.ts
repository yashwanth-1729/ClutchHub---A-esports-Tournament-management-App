// Every source cited on the page, numbered in the order the page first uses them.
// Dates are publication dates where known, otherwise the date the page was accessed.
export type Source = { n: number; title: string; publisher: string; date: string; url: string }

const RAW = {
  // frontier sizes and the cost of general-purpose AI
  deepseek_v3: { title: 'DeepSeek-V3 Technical Report', publisher: 'DeepSeek-AI, arXiv 2412.19437', date: '2024-12-27', url: 'https://arxiv.org/abs/2412.19437' },
  kimi_k2: { title: 'Kimi K2: Open Agentic Intelligence', publisher: 'Moonshot AI, arXiv 2507.20534', date: '2025-07-28', url: 'https://arxiv.org/abs/2507.20534' },
  llama31: { title: 'The Llama 3 Herd of Models', publisher: 'Meta, arXiv 2407.21783', date: '2024-07-31', url: 'https://arxiv.org/abs/2407.21783' },
  qwen3_report: { title: 'Qwen3 Technical Report', publisher: 'Qwen Team, arXiv 2505.09388', date: '2025-05-14', url: 'https://arxiv.org/abs/2505.09388' },
  openai_pricing: { title: 'API pricing', publisher: 'OpenAI', date: 'accessed 2026-10-21', url: 'https://platform.openai.com/docs/pricing' },
  anthropic_pricing: { title: 'Pricing', publisher: 'Anthropic', date: 'accessed 2026-10-21', url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
  google_pricing: { title: 'Gemini API pricing', publisher: 'Google', date: 'accessed 2026-10-21', url: 'https://ai.google.dev/gemini-api/docs/pricing' },
  so2025_ai: { title: 'Developer Survey 2025: AI', publisher: 'Stack Overflow', date: '2025-07', url: 'https://survey.stackoverflow.co/2025/ai' },
  cisco2025: { title: '2025 Data Privacy Benchmark Study', publisher: 'Cisco', date: '2025-04-02', url: 'https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2025/m04/cisco-2025-data-privacy-benchmark-study-privacy-landscape-grows-increasingly-complex-in-the-age-of-ai.html' },
  ibm2025: { title: 'Cost of a Data Breach Report 2025', publisher: 'IBM', date: '2025-07-30', url: 'https://newsroom.ibm.com/2025-07-30-ibm-report-13-of-organizations-reported-breaches-of-ai-models-or-applications,-97-of-which-reported-lacking-proper-ai-access-controls' },

  // architectures (official configs)
  hf_qwen25coder32_cfg: { title: 'Qwen2.5-Coder-32B-Instruct config.json', publisher: 'Qwen, Hugging Face', date: '2024-11', url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct/raw/main/config.json' },
  hf_qwen3_32_cfg: { title: 'Qwen3-32B config.json', publisher: 'Qwen, Hugging Face', date: '2025-04', url: 'https://huggingface.co/Qwen/Qwen3-32B/raw/main/config.json' },
  hf_qwen3_30a3_cfg: { title: 'Qwen3-30B-A3B config.json', publisher: 'Qwen, Hugging Face', date: '2025-04', url: 'https://huggingface.co/Qwen/Qwen3-30B-A3B/raw/main/config.json' },
  hf_devstral_cfg: { title: 'Devstral-Small-2505 config.json', publisher: 'Mistral AI, Hugging Face', date: '2025-05', url: 'https://huggingface.co/mistralai/Devstral-Small-2505/raw/main/config.json' },
  gptoss_card: { title: 'gpt-oss-120b & gpt-oss-20b Model Card', publisher: 'OpenAI, arXiv 2508.10925', date: '2025-08-05', url: 'https://arxiv.org/abs/2508.10925' },
  gemma3_report: { title: 'Gemma 3 Technical Report', publisher: 'Google DeepMind, arXiv 2503.19786', date: '2025-03-25', url: 'https://arxiv.org/abs/2503.19786' },

  // evidence
  swebench_lb: { title: 'SWE-bench Verified leaderboard (bash-only)', publisher: 'SWE-bench', date: 'entries 2025-07 to 2025-12', url: 'https://www.swebench.com/' },
  livecodebench_lb: { title: 'LiveCodeBench leaderboard', publisher: 'LiveCodeBench', date: 'data through 2025-04', url: 'https://livecodebench.github.io/leaderboard.html' },
  evalplus_lb: { title: 'EvalPlus leaderboard', publisher: 'EvalPlus', date: '2024-11', url: 'https://evalplus.github.io/leaderboard.html' },
  aider_lb: { title: 'Aider LLM leaderboards (Polyglot)', publisher: 'Aider', date: '2025-05-08', url: 'https://aider.chat/docs/leaderboards/' },
  deepseek_r1: { title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL', publisher: 'DeepSeek-AI, arXiv 2501.12948', date: '2025-01-22', url: 'https://arxiv.org/abs/2501.12948' },
  phi4: { title: 'Phi-4 Technical Report', publisher: 'Microsoft, arXiv 2412.08905', date: '2024-12-12', url: 'https://arxiv.org/abs/2412.08905' },

  // VOIDS React
  qwen25coder: { title: 'Qwen2.5-Coder Technical Report', publisher: 'Qwen Team, arXiv 2409.12186', date: '2024-09-18', url: 'https://arxiv.org/abs/2409.12186' },
  so2025_tech: { title: 'Developer Survey 2025: Technology', publisher: 'Stack Overflow', date: '2025-07', url: 'https://survey.stackoverflow.co/2025/technology' },
  stateofjs2025: { title: 'State of JavaScript 2025: Libraries', publisher: 'Devographics', date: '2025', url: 'https://2025.stateofjs.com/en-US/libraries/' },
  octoverse2025: { title: 'Octoverse 2025: TypeScript becomes #1 on GitHub', publisher: 'GitHub', date: '2025-10-28', url: 'https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/' },

  // technology
  lora: { title: 'LoRA: Low-Rank Adaptation of Large Language Models', publisher: 'Hu et al., arXiv 2106.09685', date: '2021-06-17', url: 'https://arxiv.org/abs/2106.09685' },
  qlora: { title: 'QLoRA: Efficient Finetuning of Quantized LLMs', publisher: 'Dettmers et al., arXiv 2305.14314', date: '2023-05-23', url: 'https://arxiv.org/abs/2305.14314' },
  deepswe: { title: 'DeepSWE-Preview', publisher: 'Agentica, Hugging Face', date: '2025-07-01', url: 'https://huggingface.co/agentica-org/DeepSWE-Preview' },
  phi1: { title: 'Textbooks Are All You Need (phi-1)', publisher: 'Microsoft, arXiv 2306.11644', date: '2023-06-20', url: 'https://arxiv.org/abs/2306.11644' },
  codellama: { title: 'Code Llama: Open Foundation Models for Code', publisher: 'Meta, arXiv 2308.12950', date: '2023-08-24', url: 'https://arxiv.org/abs/2308.12950' },

  // local inference
  apple_m4: { title: 'Apple introduces M4 chip', publisher: 'Apple Newsroom', date: '2024-05-07', url: 'https://www.apple.com/newsroom/2024/05/apple-introduces-m4-chip/' },
  apple_m4promax: { title: 'MacBook Pro (M4 Pro / M4 Max) technical specifications', publisher: 'Apple', date: '2024-10-30', url: 'https://www.apple.com/macbook-pro/specs/' },
  apple_m3ultra: { title: 'Apple reveals M3 Ultra', publisher: 'Apple Newsroom', date: '2025-03-05', url: 'https://www.apple.com/newsroom/2025/03/apple-reveals-m3-ultra-taking-apple-silicon-to-a-new-extreme/' },
  nv_4090: { title: 'GeForce RTX 4090 specifications', publisher: 'NVIDIA', date: '2022-10', url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/' },
  nv_5090: { title: 'GeForce RTX 5090 specifications', publisher: 'NVIDIA', date: '2025-01', url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/' },
  nv_pro6000: { title: 'RTX PRO 6000 Blackwell Workstation Edition', publisher: 'NVIDIA', date: '2025-03', url: 'https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/' },
  hwcorner5090: { title: 'RTX 5090 LLM benchmarks', publisher: 'Hardware Corner', date: '2025-11-06', url: 'https://www.hardware-corner.net/rtx-5090-llm-benchmarks/' },
  llamacpp15396: { title: 'Performance of llama.cpp with gpt-oss-20b (discussion #15396)', publisher: 'ggml-org / llama.cpp, GitHub', date: '2025-08', url: 'https://github.com/ggml-org/llama.cpp/discussions/15396' },
  willison_qwen25: { title: 'Qwen2.5-Coder-32B is an LLM that can code well that runs on my Mac', publisher: 'Simon Willison', date: '2024-11-12', url: 'https://simonwillison.net/2024/Nov/12/qwen25-coder/' },

  // infrastructure (India)
  it_5090: { title: 'Gigabyte AORUS RTX 5090 Stealth Ice 32 GB (in stock)', publisher: 'The IT Depot', date: '2026-10-21', url: 'https://www.theitdepot.com/index.php?route=product/product&product_id=8791' },
  it_5080: { title: 'Zotac RTX 5080 Solid Core OC 16 GB (in stock)', publisher: 'The IT Depot', date: '2026-10-21', url: 'https://www.theitdepot.com/index.php?route=product/product&product_id=8294' },
  it_6000ada: { title: 'PNY NVIDIA RTX 6000 Ada 48 GB', publisher: 'The IT Depot', date: '2026-10-21', url: 'https://www.theitdepot.com/pny_quadro_nvidia_rtx_6000_ada_48gb_gddr6' },
  pg_pro6000: { title: 'NVIDIA RTX PRO 6000 Blackwell Max-Q 96 GB (in stock)', publisher: 'PrimeABGB', date: '2026-10-21', url: 'https://www.primeabgb.com/online-price-reviews-india/nvidia-rtx-pro-6000-blackwell-max-q-workstation-edition-96gb-gddr7-512-bit-graphics-card-900-5g153-2500-000/' },
  pg_store: { title: 'Workstation parts: memory, boards, storage, cases, UPS', publisher: 'PrimeABGB', date: '2026-10-21', url: 'https://www.primeabgb.com' },
  it_store: { title: 'Workstation parts: CPUs, power supplies', publisher: 'The IT Depot', date: '2026-10-21', url: 'https://www.theitdepot.com' },
  eh_store: { title: 'Workstation parts: power supplies, coolers', publisher: 'EliteHubs', date: '2026-10-21', url: 'https://elitehubs.com' },
  tg_tariff: { title: 'Retail supply tariff schedule FY2025-26 (LT-II commercial)', publisher: 'TGSPDCL', date: '2025-26, retained 2026-27', url: 'https://tgsouthernpower.org/resources/PDF/Tariffs/63tarifffile.pdf' },
  fx_rate: { title: 'USD exchange rates', publisher: 'open.er-api.com', date: '2026-10-21', url: 'https://open.er-api.com/v6/latest/USD' },
  e2e_h100: { title: 'NVIDIA H100 cloud GPU pricing', publisher: 'E2E Networks', date: '2026-10-21', url: 'https://www.e2enetworks.com/gpus/nvidia-h100' },

  // economics
  zero: { title: 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models', publisher: 'Rajbhandari et al., arXiv 1910.02054', date: '2019-10-04', url: 'https://arxiv.org/abs/1910.02054' },
  unsloth_req: { title: 'Unsloth requirements', publisher: 'Unsloth docs', date: 'accessed 2026-10', url: 'https://unsloth.ai/docs/get-started/fine-tuning-for-beginners/unsloth-requirements' },
  openrouter_models: { title: 'Models API (listed prices)', publisher: 'OpenRouter', date: 'accessed 2026-10-21', url: 'https://openrouter.ai/api/v1/models' },
  groq_models: { title: 'Supported models and pricing', publisher: 'Groq', date: 'accessed 2026-10-21', url: 'https://console.groq.com/docs/models' },
  together_pricing: { title: 'Pricing', publisher: 'Together AI', date: 'accessed 2026-10-21', url: 'https://www.together.ai/pricing' },
  nvidia_slm: { title: 'Small Language Models are the Future of Agentic AI', publisher: 'Belcak et al. (NVIDIA), arXiv 2506.02153', date: '2025-06-02', url: 'https://arxiv.org/abs/2506.02153' },
  indiaai_pib: { title: 'Democratising AI in India', publisher: 'Press Information Bureau, Govt. of India', date: '2026-02-10', url: 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/feb/doc2026210784401.pdf' },

  slora: { title: 'S-LoRA: Serving Thousands of Concurrent LoRA Adapters', publisher: 'Sheng et al., arXiv 2311.03285', date: '2023-11-06', url: 'https://arxiv.org/abs/2311.03285' },
  samsung990: { title: 'Samsung 990 PRO NVMe SSD specifications (up to 7,450 MB/s read)', publisher: 'Samsung Semiconductor', date: '2022-10', url: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/990-pro/' },

  // measurement
  rethink_contam: { title: 'Rethinking Benchmark and Contamination for Language Models with Rephrased Samples', publisher: 'Yang et al., arXiv 2311.04850', date: '2023-11-08', url: 'https://arxiv.org/abs/2311.04850' },
  swe_illusion: { title: 'The SWE-Bench Illusion', publisher: 'Liang et al., arXiv 2506.12286', date: '2025-06-14', url: 'https://arxiv.org/abs/2506.12286' },
  livecodebench: { title: 'LiveCodeBench: Holistic and Contamination Free Evaluation', publisher: 'Jain et al., arXiv 2403.07974', date: '2024-03-12', url: 'https://arxiv.org/abs/2403.07974' },
  openai_swe_verified: { title: 'Why we no longer evaluate SWE-bench Verified', publisher: 'OpenAI', date: '2026-02-23', url: 'https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/' },
  webdev_arena: { title: 'WebDev Arena', publisher: 'LMArena', date: '2025-03-10', url: 'https://arena.ai/blog/webdev-arena' },
  nextjs_evals: { title: 'Next.js Agent Evals', publisher: 'Vercel', date: 'accessed 2026-10', url: 'https://nextjs.org/evals' },
  webbench: { title: 'Web-Bench', publisher: 'Xu et al., arXiv 2505.07473', date: '2025-05-12', url: 'https://arxiv.org/abs/2505.07473' },
  frontendbench: { title: 'FrontendBench', publisher: 'Zhu et al., arXiv 2506.13832', date: '2025-06-16', url: 'https://arxiv.org/abs/2506.13832' },
  webgenbench: { title: 'WebGen-Bench', publisher: 'Lu et al., arXiv 2505.03733', date: '2025-05-06', url: 'https://arxiv.org/abs/2505.03733' },
  swe_mm: { title: 'SWE-bench Multimodal', publisher: 'Yang et al., arXiv 2410.03859', date: '2024-10-04', url: 'https://arxiv.org/abs/2410.03859' },

  // commercial
  so2026_ai: { title: 'Developer Survey 2026: AI', publisher: 'Stack Overflow', date: '2026-10-06', url: 'https://survey.stackoverflow.co/2026/ai/data' },
  cisco2026: { title: '2026 Data and Privacy Benchmark Study', publisher: 'Cisco', date: '2026-01-26', url: 'https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m01/ai-data-privacy-investments-governance-cisco-report.html' },
  gartner_slm: { title: 'Gartner predicts organizations will use small, task-specific AI models three times more than general-purpose LLMs by 2027', publisher: 'Gartner', date: '2025-04-09', url: 'https://www.gartner.com/en/newsroom/press-releases/2025-04-09-gartner-predicts-by-2027-organizations-will-use-small-task-specific-ai-models-three-times-more-than-general-purpose-large-language-models' },
  dpdp: { title: 'Digital Personal Data Protection Rules, 2025: explainer', publisher: 'Press Information Bureau, Govt. of India', date: '2025-11-17', url: 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf' },
  eu_ai_act: { title: 'AI Act: regulatory framework', publisher: 'European Commission', date: 'accessed 2026-10-21', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
  nasscom2026: { title: 'Strategic Review 2026: Executive Summary', publisher: 'Nasscom', date: '2026-02', url: 'https://nasscom.in/modules/custom/nasscom_general/docs/Nasscom-Strategic%20Review-2026-Executive%20Summary.pdf' },
  indiaai_factsheet: { title: 'IndiaAI Mission factsheet', publisher: 'Press Information Bureau, Govt. of India', date: '2026-08-13', url: 'https://www.pib.gov.in/FactsheetDetails.aspx?id=150860&NoteId=150860&ModuleId=16' },
} satisfies Record<string, Omit<Source, 'n'>>

export type SourceId = keyof typeof RAW

export const SOURCES = Object.fromEntries(
  Object.entries(RAW).map(([k, v], i) => [k, { ...v, n: i + 1 }]),
) as Record<SourceId, Source>
