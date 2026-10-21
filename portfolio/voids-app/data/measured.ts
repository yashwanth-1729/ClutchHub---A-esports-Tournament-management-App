// Measured local inference: only numbers someone actually ran, with who ran them.
// pp = prompt processing (reading the prompt), tg = token generation (writing the answer).
import type { SourceId } from './sources'

export type Measurement = { model: string; quant: string; hardware: string; runtime: string; context: string; pp: number | null; tg: number; source: SourceId }

export const MEASURED: Measurement[] = [
  { model: 'Qwen3-32B (dense)', quant: '4-bit Q4_K_XL', hardware: 'RTX 5090 32 GB', runtime: 'llama.cpp', context: '4K deep', pp: 2931, tg: 61.4, source: 'hwcorner5090' },
  { model: 'Qwen3-32B (dense)', quant: '4-bit Q4_K_XL', hardware: 'RTX 5090 32 GB', runtime: 'llama.cpp', context: '32K deep', pp: 1451, tg: 43.8, source: 'hwcorner5090' },
  { model: 'Qwen3-30B-A3B (MoE)', quant: '4-bit Q4_K_XL', hardware: 'RTX 5090 32 GB', runtime: 'llama.cpp', context: '4K deep', pp: 6630, tg: 234.3, source: 'hwcorner5090' },
  { model: 'gpt-oss-20b (MoE)', quant: 'MXFP4', hardware: 'RTX 5090 32 GB', runtime: 'llama.cpp', context: 'pp 2K · tg 128', pp: 9848, tg: 282.5, source: 'llamacpp15396' },
  { model: 'gpt-oss-20b (MoE)', quant: 'MXFP4', hardware: 'RTX 4090 24 GB', runtime: 'llama.cpp', context: 'pp 2K · tg 128', pp: 8022, tg: 222.0, source: 'llamacpp15396' },
  { model: 'gpt-oss-20b (MoE)', quant: 'MXFP4', hardware: 'RTX 5060 Ti 16 GB', runtime: 'llama.cpp', context: 'pp 2K · tg 128', pp: 3839, tg: 111.5, source: 'llamacpp15396' },
  { model: 'gpt-oss-20b (MoE)', quant: 'MXFP4', hardware: 'Apple M4 Max 36 GB', runtime: 'llama.cpp Metal', context: 'pp 2K · tg 128', pp: 1277, tg: 92.4, source: 'llamacpp15396' },
  { model: 'gpt-oss-20b (MoE)', quant: 'MXFP4', hardware: 'Apple M3 Ultra 512 GB', runtime: 'llama.cpp Metal', context: 'pp 2K · tg 128', pp: 2816, tg: 115.5, source: 'llamacpp15396' },
  { model: 'gpt-oss-20b (MoE)', quant: 'MXFP4', hardware: 'Apple M1 Pro 32 GB', runtime: 'llama.cpp Metal', context: 'pp 2K · tg 128', pp: 516, tg: 45.7, source: 'llamacpp15396' },
  { model: 'Qwen2.5-Coder-32B (dense)', quant: '8-bit MLX', hardware: 'Apple M2 Max 64 GB', runtime: 'MLX', context: 'short prompt · peak 32.7 GB', pp: null, tg: 10.0, source: 'willison_qwen25' },
]

/** Training memory, from the papers and documentation, for the economics charts. */
export const TRAIN_MEMORY = [
  { method: 'Full fine-tune', detail: '16 bytes/param (weights, gradients, fp32 master copy, Adam states) before activations', gb32: 512, source: 'zero' as SourceId },
  { method: 'LoRA, 16-bit base', detail: 'Unsloth documented minimum for 32B', gb32: 76, source: 'unsloth_req' as SourceId },
  { method: 'QLoRA, 4-bit base', detail: 'Unsloth documented minimum for 32B; QLoRA paper: 33B on one 24 GB GPU', gb32: 26, source: 'unsloth_req' as SourceId },
]
