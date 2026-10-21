# VOIDS — research notes

Research behind the VOIDS presentation at https://www.voidbyte.tech/voids/.
Compiled 21 October 2026. Every number on the page traces to a source below or to a formula stated here.

**What this is not.** No VOIDS model has been trained. Nothing here is a VOIDS result. The page sorts every figure into one of five kinds:

| Tag | Meaning |
|---|---|
| Published evidence | A number reported by a paper, leaderboard, model card or survey, with its source |
| Calculated estimate | Our arithmetic from published specifications, with the formula shown |
| Target, not a result | What VOIDS would need to achieve; unproven |
| Indicative price | A retail listing or quote at research time; prices move weekly |
| Illustrative | A visual aid, not data |

---

## A. Small models beating larger ones

**Verdict.** In specific domains there is solid evidence that 14–32B models match or beat models 7–40× their size. The strongest cases are coding and math, run on independent harnesses. There is equally solid evidence that small models lose on breadth (factual recall, instruction following) and that benchmark parity does not always carry over to agentic work. Frontier closed models still lead on agentic software engineering.

| # | Comparison | Benchmark | Scores | Verification | Source |
|---|---|---|---|---|---|
| 1 | Devstral Small 2 (24B) vs Qwen3-Coder-480B-A35B, GLM-4.6, Kimi K2 (1T) | SWE-bench Verified, bash-only, one attempt | 56.4 vs 55.4 / 55.4 / 43.8 (Claude Opus 4.5: 74.4) | Independent | swebench.com, entries Jul–Dec 2025 |
| 2 | OpenReasoning-Nemotron-32B, EXAONE-4.0-32B vs Qwen3-235B-A22B | LiveCodeBench, problems 2025-01-01 to 2025-05-01 (n = 182), pass@1 | 66.6 / 66.6 vs 59.3 (R1-0528: 70.5) | Independent data; window average computed by us | livecodebench.github.io |
| 3 | Qwen2.5-Coder-32B vs DeepSeek-V3 (671B), GPT-4o | EvalPlus MBPP+ | 77.0 vs 73.0 / 72.2 | Independent | evalplus.github.io |
| 4 | Qwen3-32B vs GPT-4o, Llama 4 Maverick (~402B) | Aider Polyglot pass@2 | 40.0 vs 23.1 / 15.6 (Qwen3-235B: 59.6) | Independent, mixed edit formats | aider.chat |
| 5 | Qwen3-32B, Qwen3-30B-A3B vs DeepSeek-R1 | LiveCodeBench v5 | 65.7 / 62.6 vs 64.3 | Self-reported | arXiv 2505.09388 |
| 6 | R1-Distill-Qwen-32B vs o1-mini, DeepSeek-V3 | LiveCodeBench 2024-08 to 2025-01 | 57.2 vs 53.8 / 36.2 | Self-reported | arXiv 2501.12948 (v1) |
| 7 | Phi-4 (14B) vs Llama-3.3-70B, Qwen2.5-72B, GPT-4o | GPQA | 56.1 vs 49.1 / 49.0 / 50.6 | Self-reported | arXiv 2412.08905 |
| 8 | gpt-oss-20b (20.9B / 3.6B active) vs o3-mini | SWE-bench Verified (n = 477) | 60.7 vs 49.3 | Self-reported, internal scaffold | arXiv 2508.10925 |

**Counterexamples shown on the page.**
- Qwen2.5-Coder-32B ties GPT-4o on HumanEval+ (87.2) but resolves 9.0% of SWE-bench Verified issues against 21.6% for GPT-4o (independent, bash-only).
- Phi-4 scores 3.0 on SimpleQA against 39.4 for GPT-4o, and 63.0 on IFEval against 89.3 for Llama-3.3-70B.
- Scaffold sensitivity: gpt-oss-120b scores 62.4 on SWE-bench Verified in OpenAI's own scaffold and 26.0 on the independent bash-only leaderboard.

**Limitations.**
- Single runs: a 1-point gap is within noise.
- GPT-4o, o1, o3 and Claude sizes are undisclosed, so those comparisons can only "suggest".
- HumanEval and MBPP are saturated and contaminated.
- OpenAI stopped reporting SWE-bench Verified on 23 Feb 2026, citing contamination.

**Frontier sizes** (total / active per token):
- DeepSeek-V3/R1: 671B / 37B (arXiv 2412.19437)
- Kimi K2: 1T / 32B (arXiv 2507.20534)
- Llama 3.1: 405B, dense (arXiv 2407.21783)
- Qwen3-235B-A22B: 235B / 22B (arXiv 2505.09388)

## B. Making a 20–30B model exceptional at React

**Methods** (from primary sources):

| Method | What the source measured | Source |
|---|---|---|
| LoRA | 10,000× fewer trainable parameters, 3× less GPU memory on GPT-3 175B, no added latency | arXiv 2106.09685 |
| QLoRA | 65B fine-tuned on one 48 GB GPU, 33B on one 24 GB GPU | arXiv 2305.14314 |
| Distillation | ~800k R1 samples, SFT only; the 32B distill beats o1-mini on several benchmarks | arXiv 2501.12948 |
| RL with verifiable rewards | DeepSWE: SWE-bench Verified 23% → 42.2% in 200 steps from Qwen3-32B | huggingface.co/agentica-org/DeepSWE-Preview |
| Synthetic / filtered data | phi-1 (1.3B): 50.6% HumanEval from 6B filtered + 1B synthetic tokens | arXiv 2306.11644 |
| Continued pretraining | Code Llama: 500B code-heavy tokens, up to 67% HumanEval | arXiv 2308.12950 |

**Reference pretraining mix.** Qwen2.5-Coder uses code, text and math at 7 : 2 : 1 over 5.5T tokens (arXiv 2409.12186).

**Proposed curriculum.** The VOIDS React curriculum (35 / 20 / 15 / 10 / 10 / 10) is a **target design choice**, not a result.

**Frontend evaluations:**
- WebDev Arena
- Next.js Agent Evals
- Web-Bench: best Pass@1 at release was 25.1%
- FrontendBench: 148 tasks
- WebGen-Bench: a fine-tuned Qwen2.5-Coder-32B reached 38.2%
- SWE-bench Multimodal: 617 tasks

**Contamination:**
- 8–18% of HumanEval overlaps common pretraining sets (arXiv 2311.04850).
- Models identify the buggy file from the issue text alone in up to 76% of SWE-bench Verified cases (arXiv 2506.12286).
- LiveCodeBench filters problems by date.

## C. Running locally

**Formulas** (the memory calculator, `lib/memory.ts`):
- **Weights (GB)** = parameters (B) × bits per weight ÷ 8. Bits per weight follow the llama.cpp quant types: BF16 16, Q8_0 8.5, Q6_K 6.56, Q5_K_M 5.7, Q4_K_M 4.85, Q3_K_M 3.9.
- **KV cache (bytes)** = 2 × layers × KV heads × head dim × bytes per element × tokens.
  - Gemma 3 uses 1,024-token sliding windows on 52 of 62 layers.
  - gpt-oss-20b uses 128-token windows on 12 of 24 layers.
  - Only the full-attention layers grow with context.
- **Runtime overhead** = 0.8 GB + 6% of weights (an assumption).
- **Usable memory** (assumptions):
  - Apple unified memory: 66% of RAM at 36 GB and below, 75% above (the default GPU working-set limit).
  - NVIDIA: VRAM − 0.5 GB.
  - CPU-only: RAM − 4 GB.
- **Decode ceiling** (tokens/s) = memory bandwidth ÷ bytes of active weights read per token. This is an upper bound. Measured speeds are typically lower, and they are shown separately.

**Architectures** come from each model's official `config.json`:
- Qwen2.5-Coder-32B: 64 layers, 8 KV heads, head dim 128.
- Qwen3-30B-A3B: 48 layers, 4 KV heads, 128.
- gpt-oss-20b: 24 layers, 8 KV heads, 64.

**Hypothetical VOIDS sizes** reuse the Qwen2.5-32B attention layout, with layers scaled by √(size ÷ 32.8B). This is an assumption.

**Measured decode speeds** (single user):

| Model | Precision | Hardware | Speed | Source |
|---|---|---|---|---|
| Qwen3-32B | Q4 | RTX 5090 | 61.4 tok/s at 4K, 43.8 tok/s at 32K | Hardware Corner, 2025-11-06 |
| Qwen3-30B-A3B | Q4 | RTX 5090 | 234.3 tok/s | Hardware Corner, 2025-11-06 |
| gpt-oss-20b | MXFP4 | RTX 5090 | 282.5 tok/s | llama.cpp discussion #15396 |
| gpt-oss-20b | MXFP4 | RTX 4090 | 222.0 tok/s | llama.cpp discussion #15396 |
| gpt-oss-20b | MXFP4 | M4 Max | 92.4 tok/s | llama.cpp discussion #15396 |
| gpt-oss-20b | MXFP4 | M1 Pro | 45.7 tok/s | llama.cpp discussion #15396 |
| Qwen2.5-Coder-32B | 8-bit MLX | M2 Max | 10 tok/s at 32.7 GB peak | Simon Willison, 2024-11-12 |

**Device bandwidths** come from Apple and NVIDIA specification pages:
- M4: 120 GB/s
- M4 Pro: 273 GB/s
- M4 Max: 410 or 546 GB/s
- M3 Ultra: 819 GB/s
- RTX 4090: 1,008 GB/s
- RTX 5090 and RTX PRO 6000: 1,792 GB/s
- Dual-channel DDR5-5600 is about 90 GB/s, computed as 2 × 64-bit × 5600 MT/s.

## D. Owning GPUs in India

All prices were read on 21 Oct 2026 from Indian retailers' own pages.
- Only listings the store marked **in stock** are used in the calculator.
- Specs (VRAM, bandwidth, board power) come from nvidia.com.
- The data file is `data/hardware.ts`.

**GPUs in the calculator**

| GPU | VRAM | Power | Price used | Listing |
|---|---|---|---|---|
| RTX 5090 | 32 GB | 575 W | ₹8,83,410 | theitdepot, Gigabyte AORUS Stealth Ice. Other in-stock listings: theitdepot Zotac AMP Extreme ₹8,85,885; Vedant ASUS TUF OC ₹9,26,000. |
| RTX 5080 | 16 GB | 360 W | ₹1,96,999 | theitdepot, Zotac Solid Core OC. In stock elsewhere from ₹2,04,499 to ₹2,32,940. |
| RTX 6000 Ada | 48 GB | 300 W | ₹6,47,375 | theitdepot, PNY. Another listing is ₹9,72,600. |
| RTX PRO 6000 Blackwell Max-Q | 96 GB | 300 W | ₹18,40,800 | primeabgb. The Workstation Edition (600 W) was listed at ₹15,85,000 at elitehubs, but out of stock. |

**RTX 5090 caveat.** Most Indian listings are out of stock. Their last shown prices were ₹4.2–5.9 lakh, and in-stock prices are about twice that. The calculator uses the lowest in-stock price, so it overstates what a patient buyer may pay.

**Excluded from the calculator**
- **RTX 4090:** end of life; every listing is out of stock.
- **RTX PRO 5000:** no in-stock retail listing.
- **L40S, A100, H100, H200:** passive cooling, so they need a server chassis. Their prices exist only as seller claims on IndiaMART, ex-GST:
  - A100 80 GB: ₹18–35 lakh
  - H100: ₹25–33 lakh
  - H200 NVL: ₹20–39.5 lakh

**Platforms** (GPUs not included; all parts in stock)

| Part | Single-GPU desktop | Price | Threadripper, 2–4 GPUs | Price |
|---|---|---|---|---|
| CPU | Ryzen 9 9950X (theitdepot) | ₹61,385 | Threadripper 7970X OEM (theitdepot) | ₹2,12,015 |
| Board | Gigabyte X870E Aorus Pro (primeabgb) | ₹41,850 | ASRock TRX50 WS (primeabgb) | ₹71,300 |
| Memory | TeamGroup 128 GB DDR5-6000 (primeabgb) | ₹2,33,168 | 4 × Kingston 32 GB DDR5-5600 ECC RDIMM (primeabgb) | ₹4,81,064 |
| SSD | Samsung 990 Pro 4 TB (primeabgb) | ₹79,768 | same | ₹79,768 |
| PSU | Corsair HX1500i (theitdepot) | ₹34,450 | Cooler Master V Platinum 1600 W V2 (elitehubs) | ₹38,795 |
| Case | Lian Li O11 Dynamic EVO XL (primeabgb) | ₹24,180 | same | ₹24,180 |
| Cooling | Arctic Liquid Freezer III Pro 360 (elitehubs) | ₹10,499 | Noctua NH-U14S TR5-SP6 (elitehubs) | ₹13,795 |
| UPS | APC SRV3KL-IN 3 kVA (primeabgb) | ₹49,600 | same | ₹49,600 |
| **Total** | | **₹5,34,900** | | **₹9,70,517** |

**Platform notes**
- Memory is unusually expensive in October 2026. On the Threadripper build, RAM costs more than the CPU.
- The UPS is the long-backup model. It may need an external battery pack, which we have not checked.
- One 1600 W supply can feed two ~575 W cards or four 300 W cards. The calculator caps the GPU count by a power budget (single 1,000 W, Threadripper 1,250 W) as an assumption.

**Calculator formulas**
- **Power at the wall** = (GPU board power × count + rest of system) × 1.1. The rest of the system is 250 W for the single-GPU build and 450 W for the Threadripper build; both values and the 1.1 factor are assumptions.
- **Monthly cost** = electricity + capex ÷ (years × 12) + 4% of capex a year for upkeep (an assumption).
- **Cost per GPU-hour** = monthly cost ÷ (GPUs × hours per day × 30).

**Electricity**
- Default: ₹8.50/kWh. This is Telangana's TGSPDCL LT-II commercial rate (0–100 kW, above 50 units a month) for FY2025-26, retained for FY2026-27 (Mercom, 7 Apr 2026).
  - Fixed charges of ₹30–100 per kW per month are excluded.
  - The tariff PDF returned 403, so the figure was read through a search summary.
- Andhra Pradesh commercial slabs are ₹5.40–10.15 (proposal, indicative).

**Exchange rate.** ₹94.995 per US$ (open.er-api.com, 21 Oct 2026), rounded to ₹95. It is adjustable on the page.

**Cloud reference** (not mixed into any purchase figure)
- E2E Networks rents an H100 80 GB at ₹379.05 an hour, excluding GST (fetched).
- These are indicative only:
  - A100 at about ₹170–187 an hour
  - H200 NVL at about ₹381 an hour
  - RTX PRO 6000 at about ₹151 an hour
- The IndiaAI Mission advertises 38,000+ GPUs at ₹65 an hour (PIB, 10 Feb 2026). That is an average across GPU types, likely entry-level.

**Sites that could not be read:** mdcomputers.in (403), amazon.in (captcha), IndiaMART product pages (429), and the state tariff sites (403).

## E. Economics

**Training memory for 32B:**
- Full fine-tune: about 512 GB. That is 16 bytes per parameter (16-bit weights and gradients, an fp32 master copy and Adam moments), before activations (ZeRO, arXiv 1910.02054).
- LoRA on a 16-bit base: 76 GB, and QLoRA: 26 GB (Unsloth requirements page).

**API prices** (US$ per 1M tokens, input / output, standard tier, read 21 Oct 2026):

| Model | Provider | Input | Output |
|---|---|---|---|
| GPT-5.5 | OpenAI | 5 | 30 |
| GPT-5 | OpenAI | 1.25 | 10 |
| Claude Opus 5.5 | Anthropic | 4 | 20 |
| Claude Sonnet 5.5 | Anthropic | 2 | 10 |
| Gemini 3.1 Pro Preview | Google | 2 | 12 |
| Gemma 4 31B | Together | 0.39 | 0.97 |
| gpt-oss-20b | Groq | 0.075 | 0.30 |
| Qwen3-32B | OpenRouter, lowest listed provider | 0.08 | 0.28 |

**Owned cost per 1M generated tokens** = (electricity per hour + capex ÷ (4 years × 365 × hours per day) + 4%-a-year upkeep spread the same way) ÷ (measured tokens per second × 3,600 ÷ 10⁶).
- It uses the single-user measured speed on an RTX 5090. That is pessimistic: batching raises total throughput, but we have no measurement for it, so it is not shown.
- The exchange rate is a user-adjustable assumption.

**Conclusion stated on the page.**
- Used about ten hours a day, an owned RTX 5090 workstation (₹14.2 lakh) undercuts most frontier APIs per output token, even for one user. Used an hour or two a day, it does not.
- Hosted open-weight models are cheaper still.
- The case for owning rests on privacy, control and fixed cost, not price alone.

## E2. Company savings: many specialists on one workstation

**Architecture (a target).** A router sends each request to a local specialist or escalates it to a frontier API. Specialists are LoRA adapters on one shared 4-bit base model; serving thousands of adapters on one base is shown by S-LoRA (arXiv 2311.03285).

**Adapter size (calculated).** Rank-16 LoRA on every attention and MLP projection of the Qwen2.5-32B shape (hidden 5120, KV 1024, MLP 27648, 64 layers) has about 134M parameters, which is ≈ 0.27 GB at 16-bit.

**Formulas (calculated)**
- API cost per month = developers × requests per day × 22 working days × (tokens read × input price + tokens written × output price) × ₹95/US$. List prices are used, with no caching discounts.
- Seconds per local request = tokens read ÷ 2,931 tok/s + tokens written ÷ 61.4 tok/s, for Qwen3-32B Q4 on an RTX 5090 (Hardware Corner).
  - The RTX PRO 6000 is assumed to match these speeds (same 1,792 GB/s bandwidth).
- Workstations needed = ceil(local requests per day × seconds per request ÷ (hours per day × 3600)). Each machine serves one request at a time; batching is unmeasured, so it is excluded, which overstates the hardware needed.
- Owned cost per month = per machine (capex ÷ 48 + 4% of capex a year ÷ 12 + electricity).
- Saving = all-API cost − (API share × all-API cost + owned cost).

**Example: the page defaults (assumptions)**

Inputs: 50 developers, 100 requests a day, 8,000 tokens read and 800 written per request, 80% handled locally, replacing Claude Opus 5.5.

Results:
- **Cost:** about ₹5.0 L a month all-API, against about ₹1.7 L hybrid.
- **Hardware:** 2 RTX 5090 workstations.
- **Saving:** about ₹3.3 L a month, with payback in about 9 months.

**How the result changes**
- With 25 developers replacing Claude Sonnet 5.5, the saving almost disappears.
- **The saving depends on volume and on which API is replaced.**
- Whether a specialist can actually handle 80% of requests is unproven. Establishing it is the purpose of VOIDS.

## F. Commercial case

**Developers**
- Stack Overflow 2025: 84% use or plan to use AI tools. 46% distrust the accuracy of AI output vs 33% who trust it. 66% name "almost right, but not quite" as their top frustration. React 44.7%, Next.js 20.8%, TypeScript 43.6%.
- Stack Overflow 2026: 6.6% trust AI output for important decisions.
- State of JS 2025: 83.6% have used React and 58.6% have used Next.js.
- GitHub Octoverse 2025: TypeScript became #1 on GitHub in August 2025. India added 5.2M+ developers.

**Privacy and security**
- Cisco 2025: 64% worry about leaking sensitive data through generative AI.
- Cisco 2026: 81% face heightened demand for data localisation.
- IBM 2025: 1 in 5 organisations had a breach caused by shadow AI.

**Regulation**
- India's DPDP Rules were notified in November 2025. Penalties reach up to ₹250 crore.
- EU AI Act: obligations for general-purpose AI models apply from 2 Aug 2025.

**Industry and compute**
- Nasscom: the Indian tech industry is worth $315.4B (FY26E).
- IndiaAI Mission: 45,000+ subsidised GPUs.

**Forecasts, labelled as such on the page**
- Gartner predicts that small task-specific models will see three times the usage of general LLMs by 2027.
- NVIDIA's position paper (arXiv 2506.02153) estimates that small models are 10–30× cheaper to serve.

**Corrections we made during research**
- The NVIDIA paper is arXiv 2506.02153, not 2506.02142.
- The EU AI Act's high-risk deadlines were delayed by Regulation (EU) 2026/1744.

## Limitations of this document

- Prices change weekly. Pricing pages were read on one day.
- Some survey publication days are approximate (Stack Overflow 2025: July 2025).
- Gartner and McKinsey pages blocked automated access. Gartner statements were checked through republications. McKinsey figures are not used on the page.
- Leaderboard numbers are single runs. Different agent versions and scaffolds make some gaps noise.
- The memory model ignores activation memory for long prompts, framework-specific allocators, and the vision encoders of multimodal models.
