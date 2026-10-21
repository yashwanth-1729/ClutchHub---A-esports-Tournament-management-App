// Buying GPUs in India: in-stock retail prices read on 21 October 2026, board power and
// bandwidth from NVIDIA's product pages, and two complete-workstation platforms priced
// part by part. Every listing is in RESEARCH.md. Prices move weekly: indicative only.
import type { SourceId } from './sources'

export type Gpu = { id: string; name: string; vram: number; priceInr: number; tdpW: number; category: string; bandwidth: string; priceNote: string; source: SourceId }
export type Workstation = {
  id: string
  label: string
  summary: string
  maxGpus: number
  /** watts the power supply can give the GPUs after the rest of the system */
  gpuBudgetW: number
  baseW: number
  components: { part: string; name: string; priceInr: number }[]
}

export const GPUS: Gpu[] = [
  { id: 'rtx5090', name: 'GeForce RTX 5090', vram: 32, priceInr: 883410, tdpW: 575, category: 'Consumer', bandwidth: '1,792 GB/s', priceNote: 'lowest in-stock listing; most stores are sold out, and older out-of-stock listings showed ₹4.4–5.9 L', source: 'it_5090' },
  { id: 'rtx5080', name: 'GeForce RTX 5080', vram: 16, priceInr: 196999, tdpW: 360, category: 'Consumer', bandwidth: '960 GB/s', priceNote: 'in stock at several stores, ₹1.97–2.33 L', source: 'it_5080' },
  { id: 'rtx6000ada', name: 'RTX 6000 Ada', vram: 48, priceInr: 647375, tdpW: 300, category: 'Workstation', bandwidth: '960 GB/s', priceNote: 'in stock, ₹6.47–9.73 L depending on seller', source: 'it_6000ada' },
  { id: 'pro6000', name: 'RTX PRO 6000 Blackwell Max-Q', vram: 96, priceInr: 1840800, tdpW: 300, category: 'Workstation', bandwidth: '1,792 GB/s', priceNote: 'in stock; the 600 W Workstation Edition was listed at ₹15.85 L but sold out', source: 'pg_pro6000' },
]

const SINGLE: Workstation['components'] = [
  { part: 'CPU', name: 'AMD Ryzen 9 9950X', priceInr: 61385 },
  { part: 'Motherboard', name: 'Gigabyte X870E Aorus Pro', priceInr: 41850 },
  { part: 'Memory', name: '128 GB (2 × 64 GB) DDR5-6000', priceInr: 233168 },
  { part: 'Storage', name: 'Samsung 990 Pro 4 TB', priceInr: 79768 },
  { part: 'Power supply', name: 'Corsair HX1500i', priceInr: 34450 },
  { part: 'Case', name: 'Lian Li O11 Dynamic EVO XL', priceInr: 24180 },
  { part: 'Cooling', name: 'Arctic Liquid Freezer III Pro 360', priceInr: 10499 },
  { part: 'UPS', name: 'APC SRV3KL-IN 3 kVA online', priceInr: 49600 },
]

const MULTI: Workstation['components'] = [
  { part: 'CPU', name: 'AMD Threadripper 7970X', priceInr: 212015 },
  { part: 'Motherboard', name: 'ASRock TRX50 WS', priceInr: 71300 },
  { part: 'Memory', name: '128 GB (4 × 32 GB) DDR5-5600 ECC RDIMM', priceInr: 481064 },
  { part: 'Storage', name: 'Samsung 990 Pro 4 TB', priceInr: 79768 },
  { part: 'Power supply', name: 'Cooler Master V Platinum 1600 W', priceInr: 38795 },
  { part: 'Case', name: 'Lian Li O11 Dynamic EVO XL', priceInr: 24180 },
  { part: 'Cooling', name: 'Noctua NH-U14S TR5-SP6', priceInr: 13795 },
  { part: 'UPS', name: 'APC SRV3KL-IN 3 kVA online', priceInr: 49600 },
]

export const WORKSTATIONS: Workstation[] = [
  { id: 'single', label: 'Single-GPU desktop', summary: 'Ryzen 9 9950X, 128 GB DDR5, 1500 W, online UPS', maxGpus: 1, gpuBudgetW: 1000, baseW: 250, components: SINGLE },
  { id: 'multi', label: 'Threadripper workstation, 2–4 GPUs', summary: 'Threadripper 7970X, 128 GB ECC, one 1600 W supply: two ~575 W cards or four 300 W cards', maxGpus: 4, gpuBudgetW: 1250, baseW: 450, components: MULTI },
]

/** Telangana LT-II commercial energy charge, FY2025-26 (retained for FY2026-27); fixed charges excluded. */
export const ELECTRICITY_DEFAULT = { inrPerKwh: 8.5 }

/** open.er-api.com, 21 Oct 2026: ₹94.995 per US$, rounded. */
export const FX = { inrPerUsd: 95 }

export const CLOUD_REFERENCE = {
  text: 'renting an H100 80 GB in India costs ₹379 an hour excluding GST (E2E Networks, 21 Oct 2026), and the IndiaAI Mission’s subsidised pool advertises GPUs from ₹65 an hour (PIB, Feb 2026).',
}

export const HARDWARE_SOURCES: SourceId[] = ['it_5090', 'it_5080', 'it_6000ada', 'pg_pro6000', 'nv_5090', 'nv_pro6000', 'pg_store', 'it_store', 'eh_store', 'tg_tariff', 'fx_rate', 'e2e_h100', 'indiaai_pib']

type Fit = { task: string; ok: 'yes' | 'tight' | 'no'; note: string }

/** What a given amount of VRAM allows for a 20–32B model, from the memory figures in section 07 and the training documentation. */
export function fineTuneFit(totalVram: number, perGpuVram: number): Fit[] {
  const multi = totalVram > perGpuVram
  return [
    {
      task: 'Run a 24–32B model at 4-bit with 32K context',
      ok: perGpuVram >= 32 ? 'yes' : perGpuVram >= 24 || totalVram >= 32 ? 'tight' : 'no',
      note: perGpuVram >= 32 ? '~20 GB weights + ~8 GB KV cache on one card' : perGpuVram >= 24 ? '24B fits on one card; 32B needs shorter context or a quantized KV cache' : totalVram >= 32 ? 'split across cards, slower' : 'needs CPU offload',
    },
    {
      task: 'Run at 8-bit (closest to full quality)',
      ok: totalVram >= 48 ? (multi && perGpuVram < 48 ? 'tight' : 'yes') : 'no',
      note: totalVram >= 48 ? '~35 GB of 8-bit weights for 32B, plus cache' : 'needs ~48 GB',
    },
    {
      task: 'QLoRA fine-tune (4-bit base)',
      ok: perGpuVram >= 32 ? 'yes' : perGpuVram >= 24 ? 'tight' : 'no',
      note: perGpuVram >= 32 ? 'Unsloth documents a 26 GB minimum for 32B' : perGpuVram >= 24 ? 'fits ~24B; 32B is just over' : 'too little memory per card',
    },
    {
      task: 'LoRA fine-tune on a 16-bit base',
      ok: perGpuVram >= 80 ? 'yes' : totalVram >= 96 ? 'tight' : 'no',
      note: perGpuVram >= 80 ? 'Unsloth documents 76 GB for 32B' : totalVram >= 96 ? 'possible with the model sharded across cards' : 'needs ~76 GB',
    },
    {
      task: 'Full fine-tune',
      ok: totalVram >= 512 ? 'tight' : 'no',
      note: '~512 GB before activations for 32B (16 bytes per parameter): a multi-node job or a rented cluster',
    },
  ]
}
