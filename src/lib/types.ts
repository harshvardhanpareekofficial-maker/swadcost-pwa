import type { MultiInputs, SingleInputs, YarnSlot } from './costing'

export type CostMode = 'single' | 'multi'
export type InputMethod = 'speak' | 'type'

export type AppSession = {
  fabricName: string
  mode: CostMode | null
  inputMethod: InputMethod | null
  single: SingleInputs
  multi: MultiInputs
  result: import('./costing').CostBreakdown | null
}

const emptyYarn = (withSizing: boolean): YarnSlot =>
  withSizing ? { pct: 0, count: 0, rate: 0, sizingRate: 0 } : { pct: 0, count: 0, rate: 0 }

/** Blank calculator defaults — no demo reed/rates. */
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
  pickRate: 0,
  warping: 0,
})

/** Three empty yarn slots for the calculator UI. */
export const emptyMulti = (): MultiInputs => ({
  reed: 0,
  warpReedspace: 0,
  l2l: 0,
  warpYarns: [emptyYarn(true), emptyYarn(true), emptyYarn(true)],
  pick: 0,
  weftReedspace: 0,
  wastagePct: 0,
  weftYarns: [emptyYarn(false), emptyYarn(false), emptyYarn(false)],
  pickRate: 0,
  warping: 0,
})

function mustPositive(label: string, v: number): string | null {
  if (!Number.isFinite(v) || v <= 0) return `${label} must be greater than 0`
  return null
}

/** Returns an error message, or null if inputs are safe to calculate. */
export function validateSingleInputs(s: SingleInputs): string | null {
  return (
    mustPositive('Reed', s.reed) ||
    mustPositive('Warp Reedspace', s.warpReedspace) ||
    mustPositive('L2L', s.l2l) ||
    mustPositive('Warp Count', s.warpCount) ||
    mustPositive('Weft Count', s.weftCount) ||
    mustPositive('Pick', s.pick) ||
    mustPositive('Weft Reedspace', s.weftReedspace) ||
    (!Number.isFinite(s.warpRate) ? 'Warp Rate must be a valid number' : null) ||
    (!Number.isFinite(s.weftRate) ? 'Weft Rate must be a valid number' : null) ||
    (!Number.isFinite(s.pickRate) ? 'Pick rate must be a valid number' : null)
  )
}

/** Returns an error message, or null if inputs are safe to calculate. */
export function validateMultiInputs(m: MultiInputs): string | null {
  const base =
    mustPositive('Reed', m.reed) ||
    mustPositive('Warp Reedspace', m.warpReedspace) ||
    mustPositive('L2L', m.l2l) ||
    mustPositive('Pick', m.pick) ||
    mustPositive('Weft Reedspace', m.weftReedspace)
  if (base) return base

  const activeWarp = m.warpYarns.filter((y) => y.pct > 0)
  const activeWeft = m.weftYarns.filter((y) => y.pct > 0)
  if (activeWarp.length === 0) return 'At least one warp yarn with % > 0 is required'
  if (activeWeft.length === 0) return 'At least one weft yarn with % > 0 is required'

  for (const y of activeWarp) {
    if (!(y.count > 0)) return 'Active warp yarns must have count > 0'
    if (!Number.isFinite(y.rate)) return 'Active warp yarn rates must be valid numbers'
  }
  for (const y of activeWeft) {
    if (!(y.count > 0)) return 'Active weft yarns must have count > 0'
    if (!Number.isFinite(y.rate)) return 'Active weft yarn rates must be valid numbers'
  }

  const warpPct = m.warpYarns.reduce((sum, y) => sum + (Number.isFinite(y.pct) ? y.pct : 0), 0)
  const weftPct = m.weftYarns.reduce((sum, y) => sum + (Number.isFinite(y.pct) ? y.pct : 0), 0)
  if (Math.abs(warpPct - 100) > 5) {
    return `Warp yarn % shares should total ~100 (got ${warpPct})`
  }
  if (Math.abs(weftPct - 100) > 5) {
    return `Weft yarn % shares should total ~100 (got ${weftPct})`
  }
  return null
}
