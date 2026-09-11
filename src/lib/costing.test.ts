import { describe, expect, it } from 'vitest'
import {
  SAMPLE_MULTI,
  SAMPLE_SINGLE,
  applyWastagePct,
  calculateMulti,
  calculateSingle,
  totalEnds,
  warpWeight,
  weftWeightBase,
} from './costing'
import { emptyMulti, emptySingle } from './types'

describe('helpers', () => {
  it('computes ends = Reed × Reedspace', () => {
    expect(totalEnds(80, 60)).toBe(4800)
  })

  it('matches the notebook warp-weight example → 0.082', () => {
    // (65 × 120 × 120) / (1825 × 61 × 102) = 0.082429… rounds to 0.082
    const w = warpWeight(65, 120, 61, 102)
    expect(w).toBeCloseTo(0.082, 3)
    expect(Number(w.toFixed(3))).toBe(0.082)
  })

  it('computes weft base without L2L or wastage', () => {
    const base = weftWeightBase(65, 68, 61)
    expect(base).toBeCloseTo((65 * 68) / (1693.33 * 61), 10)
  })

  it('applies wastage as a percent of the weft base', () => {
    expect(applyWastagePct(100, 5)).toBeCloseTo(105, 10)
    expect(applyWastagePct(2, 0)).toBe(2)
  })
})

describe('calculateSingle', () => {
  it('uses notebook warp weight and cost = weight × rate', () => {
    const r = calculateSingle(SAMPLE_SINGLE)
    expect(r.mode).toBe('single')
    expect(r.warpWeight).toBeCloseTo(0.082, 3)
    expect(r.warpCostRaw).toBeCloseTo(r.warpWeight * SAMPLE_SINGLE.warpRate, 3)
    expect(r.sizingCost).toBeCloseTo(r.warpWeight * SAMPLE_SINGLE.sizingRate, 3)
    expect(r.jobCost).toBeCloseTo(SAMPLE_SINGLE.pick * SAMPLE_SINGLE.pickRate, 4)
    expect(r.totalEnds).toBe(120 * 65)
  })

  it('applies wastage only to weft weight', () => {
    const none = calculateSingle({ ...SAMPLE_SINGLE, wastagePct: 0 })
    const withWaste = calculateSingle({ ...SAMPLE_SINGLE, wastagePct: 10 })
    expect(withWaste.warpWeight).toBeCloseTo(none.warpWeight, 6)
    expect(withWaste.sizingCost).toBeCloseTo(none.sizingCost, 4)
    expect(withWaste.weftWeight).toBeCloseTo(none.weftWeightBase * 1.1, 6)
    expect(withWaste.weftCostRaw).toBeCloseTo(none.weftCostRaw * 1.1, 3)
  })

  it('adds warping as a flat rupee amount', () => {
    const a = calculateSingle({ ...SAMPLE_SINGLE, warping: 0 })
    const b = calculateSingle({ ...SAMPLE_SINGLE, warping: 12 })
    expect(b.grandTotal).toBeCloseTo(a.grandTotal + 12, 2)
  })

  it('builds markups on grandTotal', () => {
    const r = calculateSingle(SAMPLE_SINGLE)
    expect(r.markups.find((m) => m.pct === 5)?.amount).toBeCloseTo(r.grandTotal * 1.05, 2)
    expect(r.markups.find((m) => m.pct === 16)?.amount).toBeCloseTo(r.grandTotal * 1.16, 2)
  })

  it('throws on zero warp count', () => {
    expect(() => calculateSingle({ ...SAMPLE_SINGLE, warpCount: 0 })).toThrow(/count/i)
  })
})

describe('calculateMulti', () => {
  it('matches single when yarn1 is 100% of the same sheet', () => {
    const s = calculateSingle(SAMPLE_SINGLE)
    const m = calculateMulti(SAMPLE_MULTI)
    expect(m.mode).toBe('multi')
    expect(m.warpWeight).toBeCloseTo(s.warpWeight, 6)
    expect(m.weftWeight).toBeCloseTo(s.weftWeight, 6)
    expect(m.grandTotal).toBeCloseTo(s.grandTotal, 2)
    expect(m.warpLines).toHaveLength(1)
    expect(m.weftLines).toHaveLength(1)
  })

  it('splits weight and cost by yarn percent', () => {
    const r = calculateMulti({
      ...SAMPLE_MULTI,
      warpYarns: [
        { pct: 60, count: 61, rate: 200, sizingRate: 10 },
        { pct: 40, count: 40, rate: 180, sizingRate: 8 },
      ],
      weftYarns: [
        { pct: 70, count: 61, rate: 180 },
        { pct: 30, count: 40, rate: 160 },
      ],
    })
    expect(r.warpLines).toHaveLength(2)
    expect(r.weftLines).toHaveLength(2)

    const w1 = warpWeight(65, 120, 61, 102) * 0.6
    const w2 = warpWeight(65, 120, 40, 102) * 0.4
    expect(r.warpLines[0].weight).toBeCloseTo(w1, 5)
    expect(r.warpLines[1].weight).toBeCloseTo(w2, 5)
    expect(r.warpLines[0].yarnCostRaw).toBeCloseTo(w1 * 200, 3)
    expect(r.warpLines[1].yarnCostRaw).toBeCloseTo(w2 * 180, 3)

    const f1 = applyWastagePct(weftWeightBase(65, 68, 61) * 0.7, 5)
    const f2 = applyWastagePct(weftWeightBase(65, 68, 40) * 0.3, 5)
    expect(r.weftLines[0].weight).toBeCloseTo(f1, 5)
    expect(r.weftLines[1].weight).toBeCloseTo(f2, 5)
    expect(r.grandTotal).toBeGreaterThan(0)
  })

  it('throws when no active yarns', () => {
    expect(() =>
      calculateMulti({ ...SAMPLE_MULTI, warpYarns: [{ pct: 0, count: 40, rate: 1 }] }),
    ).toThrow(/yarn/i)
  })
})

describe('blank form seeds', () => {
  it('starts single and multi at zeros — no demo reed/rates', () => {
    const s = emptySingle()
    const m = emptyMulti()
    expect(s.reed).toBe(0)
    expect(s.warpRate).toBe(0)
    expect(s.pickRate).toBe(0)
    expect(m.reed).toBe(0)
    expect(m.warpYarns.every((y) => y.pct === 0 && y.count === 0 && y.rate === 0)).toBe(true)
    expect(m.weftYarns).toHaveLength(3)
  })
})
