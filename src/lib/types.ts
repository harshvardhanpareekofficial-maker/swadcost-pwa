import type { CostBreakdown, MultiInputs, SingleInputs } from './costing'

export type CostMode = 'single' | 'multi'
export type InputMethod = 'speak' | 'type'

export type AppSession = {
  fabricName: string
  mode: CostMode | null
  inputMethod: InputMethod | null
  single: SingleInputs
  multi: MultiInputs
  result: CostBreakdown | null
}

export const emptySingle = (): SingleInputs => ({
  reed: 0,
  warpReedspace: 0,
  l2l: 0,
  warpCount: 0,
  warpRate: 0,
  sizingRate: 0,
  pick: 0,
  weftReedspace: 0,
  weftCount: 0,
  weftRate: 0,
  wastagePct: 0,
  majuri: 0,
  warping: 0,
})

export const emptyMulti = (): MultiInputs => ({
  reed: 0,
  warpReedspace: 0,
  l2l: 0,
  warpYarns: [
    { pct: 100, count: 0, rate: 0, sizingRate: 0 },
    { pct: 0, count: 0, rate: 0, sizingRate: 0 },
    { pct: 0, count: 0, rate: 0, sizingRate: 0 },
  ],
  pick: 0,
  weftReedspace: 0,
  wastagePct: 0,
  weftYarns: [
    { pct: 100, count: 0, rate: 0 },
    { pct: 0, count: 0, rate: 0 },
    { pct: 0, count: 0, rate: 0 },
  ],
  majuri: 0,
  warping: 0,
})
