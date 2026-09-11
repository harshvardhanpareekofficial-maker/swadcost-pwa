/**
 * Owner mill-sheet grey fabric costing (handwritten notebook).
 *
 * Replaces the old empirically fitted SwadCost ASP.NET K constants
 * (K_SINGLE ≈ 71.59 / K_MULTI ≈ 82.12 targeting Final Cost 1698.77 / 1482.17).
 * Those oracles did not match the mill measures; this file follows the sheet.
 *
 * Spelling on the sheet: Read = Reed, Picke = Pick/PPI, Weft = weft count.
 *
 * 1) Warp weight =
 *      (ReedSpace × Reed × 120) / (1825 × WarpCount × L2L)
 *    Worked example: ReedSpace=65", Reed=120, WarpCount=61, L2L=102
 *      (65 × 120 × 120) / (1825 × 61 × 102) = 0.082429… → 0.082
 *
 * 2) Weft weight:
 *      base = (ReedSpace × Pick) / (1693.33 × WeftCount)
 *      weftWeight = base × (1 + wastagePct/100)
 *    Wastage is “some % of” that weft base only (arrow on the sheet).
 *    The weft line has no L2L — do not invent one.
 *
 * 3) Sizing = Warp weight × Sizing Rate
 *
 * 4) Job rate = Pick × Pick rate  (maps to the old flat majuri field)
 *
 * Cost assembly (hypothesis — sheet lists weights and rates separately):
 *   warpCost    = warpWeight × warpRate
 *   weftCost    = weftWeight × weftRate
 *   sizingCost  = warpWeight × sizingRate
 *   jobCost     = pick × pickRate
 *   grandTotal  = warpCost + weftCost + sizingCost + jobCost + warping
 *
 * Further assumptions (not on the sheet — labeled):
 * - One “Read Space” on the notebook; the UI already has warp + weft reedspace,
 *   so warp reedspace feeds warp weight and weft reedspace feeds weft weight.
 * - Warping stays an optional flat ₹ add-on because it is still in the UI.
 * - Multi-yarn: each slot takes (pct/100) of the same weight formula using that
 *   slot’s count / rate / sizing. Job and warping are not split by yarn %.
 * - Markup table 5–16% remains on grandTotal (existing UI; not on the sheet).
 * - costPerUnitLength = grandTotal / L2L is a derived display only. L2L already
 *   divides warp weight, so this is not a second mill formula.
 */

export const WARP_NUMERATOR = 120
export const WARP_DENOMINATOR = 1825
export const WEFT_DENOMINATOR = 1693.33

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
  /** ₹ per pick — jobCost = pick × pickRate (notebook “Job rate”). */
  pickRate: number
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
  pickRate: number
  warping: number
}

export type YarnLine = {
  label: string
  pct: number
  count: number
  weight: number
  yarnCostRaw: number
  rate: number
  sizingRate?: number
  sizingCost?: number
}

export type CostBreakdown = {
  mode: 'single' | 'multi'
  totalEnds: number
  length: number
  warpWeight: number
  weftWeightBase: number
  weftWeight: number
  warpCostRaw: number
  weftCostRaw: number
  sizingCost: number
  jobCost: number
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

/** (ReedSpace × Reed × 120) / (1825 × WarpCount × L2L) */
export function warpWeight(reedSpace: number, reed: number, warpCount: number, l2l: number): number {
  if (warpCount <= 0 || l2l <= 0) return 0
  return (reedSpace * reed * WARP_NUMERATOR) / (WARP_DENOMINATOR * warpCount * l2l)
}

/** (ReedSpace × Pick) / (1693.33 × WeftCount) — wastage not applied. */
export function weftWeightBase(reedSpace: number, pick: number, weftCount: number): number {
  if (weftCount <= 0) return 0
  return (reedSpace * pick) / (WEFT_DENOMINATOR * weftCount)
}

/** weftWeight = base × (1 + wastagePct/100) */
export function applyWastagePct(base: number, wastagePct: number): number {
  return base * (1 + Math.max(0, wastagePct) / 100)
}

function withMarkups(grandTotal: number): { pct: number; amount: number }[] {
  return MARKUP_PCTS.map((pct) => ({ pct, amount: round(grandTotal * (1 + pct / 100)) }))
}

export function calculateSingle(input: SingleInputs): CostBreakdown {
  assertNonNeg(
    [
      input.reed, input.warpReedspace, input.l2l, input.warpCount, input.warpRate,
      input.sizingRate, input.pick, input.weftReedspace, input.weftCount, input.weftRate,
      input.wastagePct, input.pickRate, input.warping,
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

  const ends = totalEnds(input.reed, input.warpReedspace)
  const warpWt = warpWeight(input.warpReedspace, input.reed, input.warpCount, input.l2l)
  const weftBase = weftWeightBase(input.weftReedspace, input.pick, input.weftCount)
  const weftWt = applyWastagePct(weftBase, input.wastagePct)
  const warpCostRaw = warpWt * input.warpRate
  const weftCostRaw = weftWt * input.weftRate
  const sizingCost = warpWt * input.sizingRate
  const jobCost = input.pick * input.pickRate
  const grandTotal = warpCostRaw + weftCostRaw + sizingCost + jobCost + input.warping

  return {
    mode: 'single',
    totalEnds: ends,
    length: input.l2l,
    warpWeight: round(warpWt, 6),
    weftWeightBase: round(weftBase, 6),
    weftWeight: round(weftWt, 6),
    warpCostRaw: round(warpCostRaw, 4),
    weftCostRaw: round(weftCostRaw, 4),
    sizingCost: round(sizingCost, 4),
    jobCost: round(jobCost, 4),
    warping: round(input.warping),
    grandTotal: round(grandTotal),
    costPerUnitLength: input.l2l > 0 ? round(grandTotal / input.l2l) : 0,
    markups: withMarkups(round(grandTotal)),
    warpLines: [
      {
        label: 'Warp',
        pct: 100,
        count: input.warpCount,
        weight: round(warpWt, 6),
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
        weight: round(weftWt, 6),
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
    [input.reed, input.warpReedspace, input.l2l, input.pick, input.weftReedspace, input.wastagePct, input.pickRate, input.warping],
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

  const ends = totalEnds(input.reed, input.warpReedspace)

  const warpLines: YarnLine[] = warpYarns.map((y, i) => {
    const share = y.pct / 100
    const weight = warpWeight(input.warpReedspace, input.reed, y.count, input.l2l) * share
    const cost = weight * y.rate
    const sizingRate = y.sizingRate ?? 0
    const sizing = weight * sizingRate
    return {
      label: `Warp yarn ${i + 1}`,
      pct: y.pct,
      count: y.count,
      weight: round(weight, 6),
      yarnCostRaw: round(cost, 4),
      rate: y.rate,
      sizingRate,
      sizingCost: round(sizing, 4),
    }
  })

  const weftLines: YarnLine[] = weftYarns.map((y, i) => {
    const share = y.pct / 100
    const base = weftWeightBase(input.weftReedspace, input.pick, y.count) * share
    const weight = applyWastagePct(base, input.wastagePct)
    const cost = weight * y.rate
    return {
      label: `Weft yarn ${i + 1}`,
      pct: y.pct,
      count: y.count,
      weight: round(weight, 6),
      yarnCostRaw: round(cost, 4),
      rate: y.rate,
    }
  })

  const warpWeightTotal = warpLines.reduce((s, l) => s + l.weight, 0)
  const weftWeightTotal = weftLines.reduce((s, l) => s + l.weight, 0)
  const weftBaseTotal = weftYarns.reduce((s, y) => {
    return s + weftWeightBase(input.weftReedspace, input.pick, y.count) * (y.pct / 100)
  }, 0)
  const warpCostRaw = warpLines.reduce((s, l) => s + l.yarnCostRaw, 0)
  const weftCostRaw = weftLines.reduce((s, l) => s + l.yarnCostRaw, 0)
  const sizingCost = warpLines.reduce((s, l) => s + (l.sizingCost ?? 0), 0)
  const jobCost = input.pick * input.pickRate
  const grandTotal = warpCostRaw + weftCostRaw + sizingCost + jobCost + input.warping

  return {
    mode: 'multi',
    totalEnds: ends,
    length: input.l2l,
    warpWeight: round(warpWeightTotal, 6),
    weftWeightBase: round(weftBaseTotal, 6),
    weftWeight: round(weftWeightTotal, 6),
    warpCostRaw: round(warpCostRaw, 4),
    weftCostRaw: round(weftCostRaw, 4),
    sizingCost: round(sizingCost, 4),
    jobCost: round(jobCost, 4),
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

/**
 * Optional “Load sample” fixture. Warp numbers are the notebook example;
 * weft / rates / pick-rate are labeled sample values so Calculate has a full sheet.
 */
export const SAMPLE_SINGLE: SingleInputs = {
  reed: 120,
  warpReedspace: 65,
  l2l: 102,
  warpCount: 61,
  warpRate: 200,
  sizingRate: 10,
  pick: 68,
  weftReedspace: 65,
  weftCount: 61,
  weftRate: 180,
  wastagePct: 5,
  pickRate: 0.5,
  warping: 0,
}

export const SAMPLE_MULTI: MultiInputs = {
  reed: SAMPLE_SINGLE.reed,
  warpReedspace: SAMPLE_SINGLE.warpReedspace,
  l2l: SAMPLE_SINGLE.l2l,
  warpYarns: [
    { pct: 100, count: SAMPLE_SINGLE.warpCount, rate: SAMPLE_SINGLE.warpRate, sizingRate: SAMPLE_SINGLE.sizingRate },
    { pct: 0, count: 0, rate: 0, sizingRate: 0 },
    { pct: 0, count: 0, rate: 0, sizingRate: 0 },
  ],
  pick: SAMPLE_SINGLE.pick,
  weftReedspace: SAMPLE_SINGLE.weftReedspace,
  wastagePct: SAMPLE_SINGLE.wastagePct,
  weftYarns: [
    { pct: 100, count: SAMPLE_SINGLE.weftCount, rate: SAMPLE_SINGLE.weftRate },
    { pct: 0, count: 0, rate: 0 },
    { pct: 0, count: 0, rate: 0 },
  ],
  pickRate: SAMPLE_SINGLE.pickRate,
  warping: SAMPLE_SINGLE.warping,
}
