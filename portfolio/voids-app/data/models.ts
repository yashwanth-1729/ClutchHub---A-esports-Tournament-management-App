// Model architectures (from each model's official config.json), the frontier models
// we compare against (sizes as published by their developers), and reference devices
// (memory and bandwidth from the manufacturers' spec sheets). Edit here; the page follows.
import type { Arch, Device } from '@/lib/memory'
import type { SourceId } from './sources'

export const ARCHS: Arch[] = [
  { id: 'qwen25coder32', label: 'Qwen2.5-Coder-32B-Instruct', totalB: 32.8, activeB: 32.8, layers: 64, kvHeads: 8, headDim: 128, maxContext: 131072, source: 'hf_qwen25coder32_cfg' },
  { id: 'qwen3_32', label: 'Qwen3-32B', totalB: 32.8, activeB: 32.8, layers: 64, kvHeads: 8, headDim: 128, maxContext: 131072, source: 'hf_qwen3_32_cfg' },
  { id: 'qwen3_30a3', label: 'Qwen3-30B-A3B (MoE)', totalB: 30.5, activeB: 3.3, layers: 48, kvHeads: 4, headDim: 128, maxContext: 131072, source: 'hf_qwen3_30a3_cfg' },
  { id: 'devstral24', label: 'Devstral Small (24B)', totalB: 23.6, activeB: 23.6, layers: 40, kvHeads: 8, headDim: 128, maxContext: 131072, source: 'hf_devstral_cfg' },
  { id: 'gptoss20', label: 'gpt-oss-20b (MoE)', totalB: 20.9, activeB: 3.6, layers: 24, kvHeads: 8, headDim: 64, fullAttnLayers: 12, slidingWindow: 128, maxContext: 131072, source: 'gptoss_card' },
  { id: 'gemma3_27', label: 'Gemma 3 27B', totalB: 27.4, activeB: 27.4, layers: 62, kvHeads: 16, headDim: 128, fullAttnLayers: 10, slidingWindow: 1024, maxContext: 131072, source: 'gemma3_report' },
]

/** The reference layout for a hypothetical dense VOIDS model: Qwen2.5-32B's attention shape. */
export const VOIDS_ARCH: Arch = { id: 'voids', label: 'VOIDS (hypothetical)', totalB: 32.8, activeB: 32.8, layers: 64, kvHeads: 8, headDim: 128, maxContext: 131072, source: 'hf_qwen25coder32_cfg' }

export type Frontier = { id: string; label: string; totalB: number; activeB: number; note: string; source: SourceId }

export const FRONTIER: Frontier[] = [
  { id: 'dsv3', label: 'DeepSeek-V3 / R1', totalB: 671, activeB: 37, note: 'Mixture of experts: 671B parameters stored, 37B activated per token.', source: 'deepseek_v3' },
  { id: 'kimik2', label: 'Kimi K2', totalB: 1000, activeB: 32, note: 'Mixture of experts: about 1 trillion parameters stored, 32B activated per token.', source: 'kimi_k2' },
  { id: 'llama405', label: 'Llama 3.1 405B', totalB: 405, activeB: 405, note: 'Dense: all 405B parameters are used for every token.', source: 'llama31' },
  { id: 'qwen3_235', label: 'Qwen3-235B-A22B', totalB: 235, activeB: 22, note: 'Mixture of experts: 235B stored, 22B activated per token.', source: 'qwen3_report' },
]

export const DEVICES: Device[] = [
  { id: 'cpu16', label: 'Laptop · 16 GB RAM · CPU only', kind: 'cpu', memoryGB: 16, bandwidth: 90, note: 'Dual-channel DDR5-5600 ≈ 90 GB/s. Everything runs on the CPU from system memory.' },
  { id: 'm4_16', label: 'MacBook Air · Apple M4 · 16 GB', kind: 'unified', memoryGB: 16, bandwidth: 120, note: 'Apple M4: 120 GB/s unified memory bandwidth.' },
  { id: 'm4pro_24', label: 'MacBook Pro · M4 Pro · 24 GB', kind: 'unified', memoryGB: 24, bandwidth: 273, note: 'Apple M4 Pro: 273 GB/s unified memory bandwidth.' },
  { id: 'cpu32', label: 'Laptop · 32 GB RAM · CPU only', kind: 'cpu', memoryGB: 32, bandwidth: 90, note: 'Dual-channel DDR5-5600 ≈ 90 GB/s.' },
  { id: 'm4max_36', label: 'MacBook Pro · M4 Max · 36 GB', kind: 'unified', memoryGB: 36, bandwidth: 410, note: 'Apple M4 Max (32-core GPU): 410 GB/s.' },
  { id: 'm4max_64', label: 'MacBook Pro · M4 Max · 64 GB', kind: 'unified', memoryGB: 64, bandwidth: 546, note: 'Apple M4 Max (40-core GPU): 546 GB/s.' },
  { id: 'cpu64', label: 'Desktop · 64 GB RAM · CPU only', kind: 'cpu', memoryGB: 64, bandwidth: 90, note: 'Dual-channel DDR5 ≈ 90 GB/s: it fits, but generation is slow.' },
  { id: 'rtx4090l', label: 'Gaming laptop · RTX 4090 Laptop · 16 GB VRAM', kind: 'cuda', memoryGB: 16, bandwidth: 576, note: 'RTX 4090 Laptop GPU: 16 GB GDDR6, 576 GB/s.' },
  { id: 'rtx4090', label: 'Desktop · RTX 4090 · 24 GB VRAM', kind: 'cuda', memoryGB: 24, bandwidth: 1008, note: 'RTX 4090: 24 GB GDDR6X, 1,008 GB/s.' },
  { id: 'rtx5090', label: 'Desktop · RTX 5090 · 32 GB VRAM', kind: 'cuda', memoryGB: 32, bandwidth: 1792, note: 'RTX 5090: 32 GB GDDR7, 1,792 GB/s.' },
  { id: 'm3ultra', label: 'Mac Studio · M3 Ultra · 96 GB', kind: 'unified', memoryGB: 96, bandwidth: 819, note: 'Apple M3 Ultra: 819 GB/s.' },
  { id: 'pro6000', label: 'Workstation · RTX PRO 6000 Blackwell · 96 GB', kind: 'cuda', memoryGB: 96, bandwidth: 1792, note: 'RTX PRO 6000 Blackwell: 96 GB GDDR7 ECC, 1,792 GB/s.' },
]
