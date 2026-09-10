/**
 * SwadCost-calibrated Indian powerloom grey fabric costing.
 *
 * Empirically fitted to SwadCost (pareektech) ASP.NET oracles — see
 * /workspace/fabric-cost-notes/FORMULA_FIT.md and FORMULAS.md.
 *
 * Units (UI labels):
 * - Reed: dents/inch → ends = Reed × Warp Reedspace (inches)
 * - Reedspace: inches
 * - L2L: length (same unit as SwadCost demo; treat as metres in UI copy)
 * - Pick: picks per inch
 * - Count: English cotton Ne
 * - Rate / Sizing: ₹ (cost scale of original app)
 * - Majuri / Warping: flat ₹
 *
 * Single constant K_SINGLE ≈ 71.59056591483743 hits Final Cost 1698.77
 * Multi constant K_MULTI ≈ 82.12366778293267 hits Final Cost 1482.17
 * (yarn1-only same inputs — multi path uses a different scale in the source app)
 *
 * Model (yarn costs × wastage; sizing without wastage):
 *   ends = Reed * WarpRS
 *   warpCost = ends * L2L * WarpRate / (WarpCount * K)
 *   weftCost = Pick * WeftRS * L2L * WeftRate / (WeftCount * K)
 *   sizing   = ends * L2L * Sizing / (WarpCount * K)
 *   total    = (warpCost + weftCost) * (1 + Wastage/100) + sizing + Majuri + Warping
 */

export const K_SINGLE = 71.59056591483743
export const K_MULTI = 82.12366778293267

/** @deprecated historical cotton-Ne kg constant — not used for SwadCost fit */
export const COTTON_NE_KG = 1693.6

export const MARKUP_PCTS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const

export type SingleInputs = {
  fabricName?: string
  reed: number
  warpReedspace: number
  l2l: number
  warpCount: number
  warpRate: number
  sizingRate: number
  pick: number
  weftReedspace: number
  weftCount: number
  weftRate: number
  wastagePct: number
  majuri: number
  warping: number
}

export type YarnSlot = {
  pct: number
  count: number
  rate: number
  sizingRate?: number
}

export type MultiInputs = {
  fabricName?: string
  reed: number
  warpReedspace: number
  l2l: number
  warpYarns: YarnSlot[]
  pick: number
  weftReedspace: number
  wastagePct: number
  weftYarns: YarnSlot[]
  majuri: number
  warping: number
}

export type YarnLine = {
  label: string
  pct: number
  count: number
  /** Pre-wastage yarn cost share (₹) */
  yarnCostRaw: number
  rate: number
  sizingRate?: number
  sizingCost?: number
}

export type CostBreakdown = {
  mode: 'single' | 'multi'
  k: number
  totalEnds: number
  length: number
  warpCostRaw: number
  weftCostRaw: number
  yarnCostAfterWastage: number
  sizingCost: number
  majuri: number
  warping: number
  grandTotal: number
  costPerUnitLength: number
  markups: { pct: number; amount: number }[]
  warpLines: YarnLine[]
  weftLines: YarnLine[]
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

function assertNonNeg(values: number[], label: string): void {
  for (const v of values) {
    if (!Number.isFinite(v) || v < 0) {
      throw new Error(`Invalid ${label}: values must be finite and ≥ 0`)
    }
  }
}

export function totalEnds(reed: number, reedspace: number): number {
  return reed * reedspace
}

export function yarnCost(factor: number, length: number, rate: number, count: number, k: number): number {
  if (count <= 0 || k <= 0) return 0
  return (factor * length * rate) / (count * k)
}

export function applyWastageToYarnCosts(warpCost: number, weftCost: number, wastagePct: number): number {
  return (warpCost + weftCost) * (1 + Math.max(0, wastagePct) / 100)
}

function withMarkups(grandTotal: number): { pct: number; amount: number }[] {
  return MARKUP_PCTS.map((pct) => ({ pct, amount: round(grandTotal * (1 + pct / 100)) }))
}

export function calculateSingle(input: SingleInputs): CostBreakdown {
  assertNonNeg(
    [
      input.reed, input.warpReedspace, input.l2l, input.warpCount, input.warpRate,
      input.sizingRate, input.pick, input.weftReedspace, input.weftCount, input.weftRate,
      input.wastagePct, input.majuri, input.warping,
    ],
    'single costing',
  )
  if (input.warpCount <= 0 || input.weftCount <= 0) {
    throw new Error('Warp and weft counts must be > 0')
  }
  if (input.reed <= 0 || input.warpReedspace <= 0) {
    throw new Error('Reed and warp reedspace must be > 0 (total ends would be 0)')
  }
  if (input.l2l <= 0) {
    throw new Error('L2L must be > 0')
  }
  if (input.pick <= 0 || input.weftReedspace <= 0) {
    throw new Error('Pick and weft reedspace must be > 0 when weft is expected')
  }

  const k = K_SINGLE
  const ends = totalEnds(input.reed, input.warpReedspace)
  const warpCostRaw = yarnCost(ends, input.l2l, input.warpRate, input.warpCount, k)
  const weftCostRaw = yarnCost(input.pick * input.weftReedspace, input.l2l, input.weftRate, input.weftCount, k)
  const sizingCost = yarnCost(ends, input.l2l, input.sizingRate, input.warpCount, k)
  const yarnCostAfterWastage = applyWastageToYarnCosts(warpCostRaw, weftCostRaw, input.wastagePct)
  const grandTotal = yarnCostAfterWastage + sizingCost + input.majuri + input.warping

  return {
    mode: 'single',
    k,
    totalEnds: ends,
    length: input.l2l,
    warpCostRaw: round(warpCostRaw, 4),
    weftCostRaw: round(weftCostRaw, 4),
    yarnCostAfterWastage: round(yarnCostAfterWastage, 4),
    sizingCost: round(sizingCost, 4),
    majuri: round(input.majuri),
    warping: round(input.warping),
    grandTotal: round(grandTotal),
    costPerUnitLength: input.l2l > 0 ? round(grandTotal / input.l2l) : 0,
    markups: withMarkups(round(grandTotal)),
    warpLines: [
      {
        label: 'Warp',
        pct: 100,
        count: input.warpCount,
        yarnCostRaw: round(warpCostRaw, 4),
        rate: input.warpRate,
        sizingRate: input.sizingRate,
        sizingCost: round(sizingCost, 4),
      },
    ],
    weftLines: [
      {
        label: 'Weft',
        pct: 100,
        count: input.weftCount,
        yarnCostRaw: round(weftCostRaw, 4),
        rate: input.weftRate,
      },
    ],
  }
}

function activeYarns(yarns: YarnSlot[]): YarnSlot[] {
  const active = yarns.filter((y) => y.pct > 0 && y.count > 0)
  if (active.length === 0) throw new Error('At least one yarn with pct > 0 and count > 0 is required')
  return active
}

export function calculateMulti(input: MultiInputs): CostBreakdown {
  assertNonNeg(
    [input.reed, input.warpReedspace, input.l2l, input.pick, input.weftReedspace, input.wastagePct, input.majuri, input.warping],
    'multi costing',
  )
  if (input.reed <= 0 || input.warpReedspace <= 0) {
    throw new Error('Reed and warp reedspace must be > 0 (total ends would be 0)')
  }
  if (input.l2l <= 0) {
    throw new Error('L2L must be > 0')
  }
  if (input.pick <= 0 || input.weftReedspace <= 0) {
    throw new Error('Pick and weft reedspace must be > 0 when weft is expected')
  }
  const warpYarns = activeYarns(input.warpYarns)
  const weftYarns = activeYarns(input.weftYarns)

  const k = K_MULTI
  const ends = totalEnds(input.reed, input.warpReedspace)
  const weftFactor = input.pick * input.weftReedspace

  const warpLines: YarnLine[] = warpYarns.map((y, i) => {
    const factor = ends * (y.pct / 100)
    const cost = yarnCost(factor, input.l2l, y.rate, y.count, k)
    const sizingRate = y.sizingRate ?? 0
    const sizing = yarnCost(factor, input.l2l, sizingRate, y.count, k)
    return {
      label: `Warp yarn ${i + 1}`,
      pct: y.pct,
      count: y.count,
      yarnCostRaw: round(cost, 4),
      rate: y.rate,
      sizingRate,
      sizingCost: round(sizing, 4),
    }
  })

  const weftLines: YarnLine[] = weftYarns.map((y, i) => {
    const factor = weftFactor * (y.pct / 100)
    const cost = yarnCost(factor, input.l2l, y.rate, y.count, k)
    return {
      label: `Weft yarn ${i + 1}`,
      pct: y.pct,
      count: y.count,
      yarnCostRaw: round(cost, 4),
      rate: y.rate,
    }
  })

  const warpCostRaw = warpLines.reduce((s, l) => s + l.yarnCostRaw, 0)
  const weftCostRaw = weftLines.reduce((s, l) => s + l.yarnCostRaw, 0)
  const sizingCost = warpLines.reduce((s, l) => s + (l.sizingCost ?? 0), 0)
  const yarnCostAfterWastage = applyWastageToYarnCosts(warpCostRaw, weftCostRaw, input.wastagePct)
  const grandTotal = yarnCostAfterWastage + sizingCost + input.majuri + input.warping

  return {
    mode: 'multi',
    k,
    totalEnds: ends,
    length: input.l2l,
    warpCostRaw: round(warpCostRaw, 4),
    weftCostRaw: round(weftCostRaw, 4),
    yarnCostAfterWastage: round(yarnCostAfterWastage, 4),
    sizingCost: round(sizingCost, 4),
    majuri: round(input.majuri),
    warping: round(input.warping),
    grandTotal: round(grandTotal),
    costPerUnitLength: input.l2l > 0 ? round(grandTotal / input.l2l) : 0,
    markups: withMarkups(round(grandTotal)),
    warpLines,
    weftLines,
  }
}

export function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)
}

/** Demo fixture matching SwadCost Costing.aspx */
export const DEMO_SINGLE: SingleInputs = {
  reed: 80,
  warpReedspace: 60,
  l2l: 2,
  warpCount: 40,
  warpRate: 300,
  sizingRate: 5,
  pick: 50,
  weftReedspace: 60,
  weftCount: 40,
  weftRate: 280,
  wastagePct: 5,
  majuri: 10,
  warping: 0,
}

/** Demo fixture matching MultiCosting.aspx yarn1-only */
export const DEMO_MULTI: MultiInputs = {
  reed: 80,
  warpReedspace: 60,
  l2l: 2,
  warpYarns: [{ pct: 100, count: 40, rate: 300, sizingRate: 5 }],
  pick: 50,
  weftReedspace: 60,
  wastagePct: 5,
  weftYarns: [{ pct: 100, count: 40, rate: 280 }],
  majuri: 10,
  warping: 0,
}
