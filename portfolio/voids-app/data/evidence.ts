// Published comparisons where a smaller model meets or beats a much larger one, and the
// counterexamples where it does not. Every score was read from the cited source; where the
// larger model's size is undisclosed (GPT-4o, o1/o3, Claude), the item can only "suggest".
import type { SourceId } from './sources'

type Size = { name: string; total: number; active?: number }

export type Evidence = {
  id: string
  title: string
  benchmark: string
  metric: string
  takeaway: string
  /** proves: independent harness, same conditions. suggests: self-reported or undisclosed sizes. against: a counterexample. */
  verdict: 'proves' | 'suggests' | 'against'
  small: Size
  large: Size
  scores: { model: string; score: number; small: boolean }[]
  conditions: string
  limitations: string
  verification: string
  source: SourceId
}

export const EVIDENCE: Evidence[] = [
  {
    id: 'swe_devstral',
    title: 'A 24B model fixes real GitHub issues as well as 480B–1T models',
    benchmark: 'SWE-bench Verified (500 tasks), bash-only leaderboard',
    metric: '% of issues resolved, one attempt',
    takeaway: 'Devstral Small 2 (24B, dense) resolves 56.4% of issues: level with Qwen3-Coder-480B and GLM-4.6, 12.6 points ahead of the 1-trillion-parameter Kimi K2 Instruct. Frontier closed models are still clearly ahead.',
    verdict: 'proves',
    small: { name: 'Devstral Small 2 (24B)', total: 24 },
    large: { name: 'Qwen3-Coder-480B-A35B', total: 480, active: 35 },
    scores: [
      { model: 'Devstral Small 2 · 24B', score: 56.4, small: true },
      { model: 'Qwen3-Coder · 480B / 35B', score: 55.4, small: false },
      { model: 'GLM-4.6 · ~357B / 32B', score: 55.4, small: false },
      { model: 'Kimi K2 Instruct · 1T / 32B', score: 43.8, small: false },
      { model: 'Llama 4 Maverick · ~402B / 17B', score: 21.0, small: false },
      { model: 'Claude Opus 4.5 · undisclosed', score: 74.4, small: false },
    ],
    conditions: 'Every model runs in the same minimal agent (mini-SWE-agent), one attempt per task; entries marked “checked” by the leaderboard maintainers, July–December 2025.',
    limitations: 'Agent versions differ between entries (v0.0.0 to v1.17.2). One run per model, so a 1-point gap is noise: read it as “matches”, not “beats”. Public repositories carry contamination risk.',
    verification: 'Independent: run by the SWE-bench maintainers with one harness.',
    source: 'swebench_lb',
  },
  {
    id: 'lcb_32b',
    title: '32B reasoning models beat a 235B model on fresh coding problems',
    benchmark: 'LiveCodeBench, problems published 2025-01-01 to 2025-05-01 (n = 182)',
    metric: 'mean pass@1',
    takeaway: 'Two dense 32B models score 66.6 against 59.3 for Qwen3-235B-A22B, on problems released after most training cutoffs. The 671B teacher they were distilled from is still ahead.',
    verdict: 'proves',
    small: { name: 'OpenReasoning-Nemotron-32B', total: 32.8 },
    large: { name: 'Qwen3-235B-A22B', total: 235, active: 22 },
    scores: [
      { model: 'OpenReasoning-Nemotron · 32B', score: 66.6, small: true },
      { model: 'EXAONE 4.0 · 32B', score: 66.6, small: true },
      { model: 'Qwen3 · 235B / 22B', score: 59.3, small: false },
      { model: 'DeepSeek-R1-0528 · 671B / 37B', score: 70.5, small: false },
    ],
    conditions: 'Window averages computed from the leaderboard’s own per-problem results file, the same way the site’s date slider computes them. On the earlier 2024-10 to 2025-02 window: 73.5 / 73.0 / 70.5 / 76.3.',
    limitations: 'The window was chosen by us from official data. Training cutoffs relative to the window are not fully disclosed. Thinking budgets differ. The distilled student stays below its teacher.',
    verification: 'Independent leaderboard data; window average computed by us.',
    source: 'livecodebench_lb',
  },
  {
    id: 'evalplus_qwen',
    title: 'Qwen2.5-Coder-32B matches GPT-4o and beats DeepSeek-V3 on function-level code',
    benchmark: 'EvalPlus MBPP+',
    metric: 'pass@1, greedy decoding',
    takeaway: 'A 32B dense coder scores 77.0 on MBPP+, ahead of the 671B DeepSeek-V3 (73.0) and GPT-4o (72.2). On HumanEval+ it ties GPT-4o at 87.2.',
    verdict: 'proves',
    small: { name: 'Qwen2.5-Coder-32B-Instruct', total: 32.8 },
    large: { name: 'DeepSeek-V3', total: 671, active: 37 },
    scores: [
      { model: 'Qwen2.5-Coder · 32B', score: 77.0, small: true },
      { model: 'DeepSeek-Coder-V2 · 236B / 21B', score: 75.1, small: false },
      { model: 'DeepSeek-V3 · 671B / 37B', score: 73.0, small: false },
      { model: 'GPT-4o (Aug 2024) · undisclosed', score: 72.2, small: false },
    ],
    conditions: 'Same EvalPlus harness for every model. On the independent Aider code-editing leaderboard, Qwen2.5-Coder-32B and GPT-4o both score 71.4.',
    limitations: 'HumanEval and MBPP are saturated, function-level and at high contamination risk. This parity does not carry over to agentic work: see the counterexample on SWE-bench.',
    verification: 'Independent leaderboard.',
    source: 'evalplus_lb',
  },
  {
    id: 'aider_qwen3',
    title: 'Qwen3-32B outscores GPT-4o and Llama 4 Maverick at multi-language code editing',
    benchmark: 'Aider Polyglot (225 exercises, 6 languages)',
    metric: 'pass@2',
    takeaway: 'Qwen3-32B scores 40.0 against 23.1 for GPT-4o and 15.6 for the ~402B Llama 4 Maverick. The larger Qwen3-235B is far ahead at 59.6.',
    verdict: 'suggests',
    small: { name: 'Qwen3-32B', total: 32.8 },
    large: { name: 'Llama 4 Maverick', total: 402, active: 17 },
    scores: [
      { model: 'Qwen3 · 32B', score: 40.0, small: true },
      { model: 'GPT-4o (Aug 2024) · undisclosed', score: 23.1, small: false },
      { model: 'Llama 4 Maverick · ~402B / 17B', score: 15.6, small: false },
      { model: 'Qwen3 · 235B / 22B', score: 59.6, small: false },
    ],
    conditions: 'Aider harness for every model; single runs, May 2025 entry for Qwen3-32B.',
    limitations: 'Edit formats differ (Maverick used “whole”, the others “diff”), providers differ, one run each.',
    verification: 'Independent leaderboard, mixed settings.',
    source: 'aider_lb',
  },
  {
    id: 'qwen3_r1',
    title: 'A 30B mixture-of-experts with 3.3B active rivals DeepSeek-R1 on coding',
    benchmark: 'LiveCodeBench v5 (2024-10 to 2025-02)',
    metric: 'pass@1, thinking mode',
    takeaway: 'Qwen3-32B scores 65.7 and Qwen3-30B-A3B 62.6 against 64.3 for the 671B DeepSeek-R1. R1 still wins on Codeforces (2029 vs 1977) and GPQA (71.5 vs 68.4).',
    verdict: 'suggests',
    small: { name: 'Qwen3-30B-A3B', total: 30.5, active: 3.3 },
    large: { name: 'DeepSeek-R1', total: 671, active: 37 },
    scores: [
      { model: 'Qwen3 · 32B dense', score: 65.7, small: true },
      { model: 'Qwen3 · 30.5B / 3.3B', score: 62.6, small: true },
      { model: 'DeepSeek-R1 · 671B / 37B', score: 64.3, small: false },
    ],
    conditions: 'Temperature 0.6, top-p 0.95, top-k 20; Tables 11, 13 and 15 of the report.',
    limitations: 'Self-reported; R1 was re-run by the Qwen team; the comparison spans tables; the small Qwen3 models were partly distilled from larger Qwen3 models.',
    verification: 'Self-reported by the developer.',
    source: 'qwen3_report',
  },
  {
    id: 'r1_distill',
    title: 'Distillation: a 32B student beats o1-mini and the 671B DeepSeek-V3',
    benchmark: 'LiveCodeBench (2024-08 to 2025-01)',
    metric: 'pass@1, 64 samples',
    takeaway: 'DeepSeek-R1-Distill-Qwen-32B, fine-tuned on ~800k reasoning samples from R1 with no RL, scores 57.2 against 53.8 for o1-mini and 36.2 for DeepSeek-V3.',
    verdict: 'suggests',
    small: { name: 'R1-Distill-Qwen-32B', total: 32.8 },
    large: { name: 'DeepSeek-V3', total: 671, active: 37 },
    scores: [
      { model: 'R1-Distill-Qwen · 32B', score: 57.2, small: true },
      { model: 'o1-mini · undisclosed', score: 53.8, small: false },
      { model: 'DeepSeek-V3 · 671B / 37B', score: 36.2, small: false },
    ],
    conditions: 'Temperature 0.6, top-p 0.95, up to 32,768 tokens; paper v1, Tables 4–5.',
    limitations: 'V3 is a non-reasoning model, so this compares reasoning distillation with no reasoning. o1-mini’s size is undisclosed. The paper’s v2 (January 2026) drops o1-mini from this table. It loses on Codeforces (1691 vs 1820).',
    verification: 'Self-reported by the developer.',
    source: 'deepseek_r1',
  },
  {
    id: 'phi4',
    title: 'A 14B model beats 70B-class models on graduate-level science questions',
    benchmark: 'GPQA (simple-evals)',
    metric: 'accuracy',
    takeaway: 'Phi-4 (14B) scores 56.1 against 49.1 for Llama-3.3-70B, 49.0 for Qwen2.5-72B and 50.6 for GPT-4o, largely from curated and synthetic training data.',
    verdict: 'suggests',
    small: { name: 'Phi-4', total: 14 },
    large: { name: 'Llama-3.3-70B', total: 70 },
    scores: [
      { model: 'Phi-4 · 14B', score: 56.1, small: true },
      { model: 'GPT-4o · undisclosed', score: 50.6, small: false },
      { model: 'Llama-3.3 · 70B', score: 49.1, small: false },
      { model: 'Qwen2.5 · 72B', score: 49.0, small: false },
    ],
    conditions: 'simple-evals, temperature 0.5; Table 1 of the report.',
    limitations: 'Self-reported; GPT-4o was Phi-4’s teacher for synthetic data. Phi-4 is far weaker at factual recall and instruction following: see the counterexample.',
    verification: 'Self-reported by the developer.',
    source: 'phi4',
  },
  {
    id: 'gptoss',
    title: 'gpt-oss-20b (3.6B active) beats o3-mini on software engineering',
    benchmark: 'SWE-bench Verified (n = 477)',
    metric: '% resolved, reasoning effort high',
    takeaway: 'A 20.9B mixture-of-experts that runs on a 16 GB GPU resolves 60.7% of issues against 49.3% for o3-mini, in OpenAI’s own scaffold.',
    verdict: 'suggests',
    small: { name: 'gpt-oss-20b', total: 20.9, active: 3.6 },
    large: { name: 'o3-mini', total: 0 },
    scores: [
      { model: 'gpt-oss-20b · 20.9B / 3.6B', score: 60.7, small: true },
      { model: 'o3-mini · undisclosed', score: 49.3, small: false },
      { model: 'o4-mini · undisclosed', score: 68.1, small: false },
      { model: 'o3 · undisclosed', score: 69.1, small: false },
    ],
    conditions: 'OpenAI’s internal agent scaffold, reasoning effort “high”; o3-mini value read from Figure 2.',
    limitations: 'o3-mini’s size is undisclosed. Agentic scores depend heavily on the scaffold: the larger gpt-oss-120b drops from 62.4 to 26.0 on the independent bash-only leaderboard.',
    verification: 'Self-reported by the developer.',
    source: 'gptoss_card',
  },
  {
    id: 'against_qwen_swe',
    title: 'Counterexample: benchmark parity does not mean agentic parity',
    benchmark: 'SWE-bench Verified, bash-only leaderboard',
    metric: '% of issues resolved',
    takeaway: 'The same Qwen2.5-Coder-32B that ties GPT-4o on HumanEval+ resolves 9.0% of real issues against GPT-4o’s 21.6%. Function-level wins do not transfer to repository-level work.',
    verdict: 'against',
    small: { name: 'Qwen2.5-Coder-32B-Instruct', total: 32.8 },
    large: { name: 'GPT-4o (Nov 2024)', total: 0 },
    scores: [
      { model: 'Qwen2.5-Coder · 32B', score: 9.0, small: true },
      { model: 'GPT-4o (Nov 2024) · undisclosed', score: 21.6, small: false },
    ],
    conditions: 'mini-SWE-agent for both (v1.0.0 vs v0.0.0). On Aider Polyglot: 16.4 vs 23.1.',
    limitations: 'Agent versions and edit formats differ.',
    verification: 'Independent leaderboard.',
    source: 'swebench_lb',
  },
  {
    id: 'against_phi4',
    title: 'Counterexample: small models lose on breadth of knowledge',
    benchmark: 'SimpleQA (short factual questions)',
    metric: 'accuracy',
    takeaway: 'Phi-4 answers 3.0% of SimpleQA correctly against 39.4% for GPT-4o and 20.9% for Llama-3.3-70B. Specialization buys depth in a domain, not general knowledge.',
    verdict: 'against',
    small: { name: 'Phi-4', total: 14 },
    large: { name: 'Llama-3.3-70B', total: 70 },
    scores: [
      { model: 'Phi-4 · 14B', score: 3.0, small: true },
      { model: 'Llama-3.3 · 70B', score: 20.9, small: false },
      { model: 'GPT-4o · undisclosed', score: 39.4, small: false },
    ],
    conditions: 'simple-evals; same table as the GPQA result. On IFEval (instruction following): 63.0 vs 89.3 for Llama-3.3-70B.',
    limitations: 'Self-reported by the developer.',
    verification: 'Self-reported by the developer.',
    source: 'phi4',
  },
]
