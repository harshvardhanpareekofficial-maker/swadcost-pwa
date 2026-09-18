import { describe, expect, it } from 'vitest'
import {
  SAMPLE_MULTI,
  SAMPLE_SINGLE,
  SWADCOST_LIVE_SAMPLE,
  LIVE_DEMO_ORACLE_FINAL_COST,
  WEFT_DENOMINATOR,
  applyWastagePct,
  calculateMulti,
  calculateSingle,
  jobCostFromPickRatePaise,
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
    expect((65 * 120 * 120) / (1825 * 61 * 102)).toBeCloseTo(w, 12)
  })

  it('weft base agrees with cotton Ne kg per metre of cloth (no crimp, 1 m)', () => {
    // (PPI × reed width in) / (840 × 2.2046 × 0.9144 × Ne)
    const rs = 65
    const pick = 68
    const count = 61
    const textbookKgPerM = (pick * rs) / (840 * 2.2046 * 0.9144 * count)
    expect(weftWeightBase(rs, pick, count)).toBeCloseTo(textbookKgPerM, 3)
    expect(WEFT_DENOMINATOR).toBe(1693.33)
    expect(840 * 2.2046 * 0.9144).toBeCloseTo(1693.33, 1)
  })

  it('warp 120/1825 is the mill sheet, not textbook kg/m', () => {
    const rs = 65
    const reed = 120
    const count = 61
    const l2l = 102
    const ends = reed * rs
    const textbookKgPerM = ends / (840 * 2.2046 * 0.9144 * count)
    const notebook = warpWeight(rs, reed, count, l2l)
    expect(notebook).toBeCloseTo(0.082, 3)
    expect(Math.abs(notebook - textbookKgPerM)).toBeGreaterThan(0.005)
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
    expect(r.jobCost).toBeCloseTo(jobCostFromPickRatePaise(SAMPLE_SINGLE.pick, SAMPLE_SINGLE.pickRate), 4)
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

  it('does not silently match the live-demo 1698.77 oracle', () => {
    const asPickRate = calculateSingle(SWADCOST_LIVE_SAMPLE)
    const noMajuri = calculateSingle({ ...SWADCOST_LIVE_SAMPLE, pickRate: 0 })
    const majuriAsFlat = calculateSingle({ ...SWADCOST_LIVE_SAMPLE, pickRate: 0, warping: 10 })
    expect(LIVE_DEMO_ORACLE_FINAL_COST).toBe(1698.77)
    expect(asPickRate.grandTotal).not.toBe(LIVE_DEMO_ORACLE_FINAL_COST)
    expect(noMajuri.grandTotal).not.toBe(LIVE_DEMO_ORACLE_FINAL_COST)
    expect(majuriAsFlat.grandTotal).not.toBe(LIVE_DEMO_ORACLE_FINAL_COST)
    expect(asPickRate.jobCost).toBeCloseTo(50 * 10, 4)
    expect(asPickRate.grandTotal).toBeCloseTo(1716.31, 2)
    expect(noMajuri.grandTotal).toBeCloseTo(1216.31, 2)
    expect(majuriAsFlat.grandTotal).toBeCloseTo(1226.31, 2)
    expect(asPickRate.warpWeight).toBeCloseTo((60 * 80 * 120) / (1825 * 40 * 2), 6)
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

describe('locked Load sample fixture (notebook)', () => {
  it('keeps SAMPLE_SINGLE mill-sheet inputs stable', () => {
    expect(SAMPLE_SINGLE).toEqual({
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
      pickRate: 50,
      warping: 0,
    })
  })

  it('locks Load sample line items: majuri 50 paise → job ₹34, grand ₹59.40', () => {
    const r = calculateSingle(SAMPLE_SINGLE)
    expect(r.warpWeight).toBe(0.08243)
    expect(r.weftWeightBase).toBe(0.042791)
    expect(r.weftWeight).toBe(0.04493)
    expect(r.warpCostRaw).toBe(16.4859)
    expect(r.weftCostRaw).toBe(8.0875)
    expect(r.sizingCost).toBe(0.8243)
    expect(r.jobCost).toBe(34)
    expect(r.grandTotal).toBe(59.4)
    expect(r.jobCost).toBe(jobCostFromPickRatePaise(68, 50))
    expect(r.warpWeight).toBeCloseTo(warpWeight(65, 120, 61, 102), 6)
    expect(r.weftWeightBase).toBeCloseTo(weftWeightBase(65, 68, 61), 6)
  })

  it('locks SAMPLE_MULTI yarn-1 100% to the same Load sample grand', () => {
    const s = calculateSingle(SAMPLE_SINGLE)
    const m = calculateMulti(SAMPLE_MULTI)
    expect(m.grandTotal).toBe(59.4)
    expect(m.jobCost).toBe(34)
    expect(m.grandTotal).toBe(s.grandTotal)
  })
})

describe('locked historical live-form inputs through the notebook', () => {
  it('keeps the documentation fixture as 1000 paise (live Majuri box ₹10)', () => {
    expect(SWADCOST_LIVE_SAMPLE.reed).toBe(80)
    expect(SWADCOST_LIVE_SAMPLE.warpReedspace).toBe(60)
    expect(SWADCOST_LIVE_SAMPLE.l2l).toBe(2)
    expect(SWADCOST_LIVE_SAMPLE.warpCount).toBe(40)
    expect(SWADCOST_LIVE_SAMPLE.warpRate).toBe(300)
    expect(SWADCOST_LIVE_SAMPLE.sizingRate).toBe(5)
    expect(SWADCOST_LIVE_SAMPLE.pick).toBe(50)
    expect(SWADCOST_LIVE_SAMPLE.weftReedspace).toBe(60)
    expect(SWADCOST_LIVE_SAMPLE.weftCount).toBe(40)
    expect(SWADCOST_LIVE_SAMPLE.weftRate).toBe(280)
    expect(SWADCOST_LIVE_SAMPLE.wastagePct).toBe(5)
    expect(SWADCOST_LIVE_SAMPLE.pickRate).toBe(1000)
    expect(SWADCOST_LIVE_SAMPLE.warping).toBe(0)
  })

  it('locks notebook line items at grand ₹1716.31, not live-demo ₹1698.77', () => {
    const r = calculateSingle(SWADCOST_LIVE_SAMPLE)
    expect(r.warpWeight).toBe(3.945205)
    expect(r.weftWeightBase).toBe(0.044291)
    expect(r.weftWeight).toBe(0.046506)
    expect(r.warpCostRaw).toBe(1183.5616)
    expect(r.weftCostRaw).toBe(13.0217)
    expect(r.sizingCost).toBe(19.726)
    expect(r.jobCost).toBe(500)
    expect(r.grandTotal).toBe(1716.31)
    expect(r.grandTotal).not.toBe(LIVE_DEMO_ORACLE_FINAL_COST)
    expect(LIVE_DEMO_ORACLE_FINAL_COST).toBe(1698.77)
  })

  it('treats a typed 10 on that sheet as 10 paise (₹5 job), not the live-form rupee box', () => {
    const r = calculateSingle({ ...SWADCOST_LIVE_SAMPLE, pickRate: 10 })
    expect(r.jobCost).toBe(5)
    expect(r.grandTotal).toBe(1221.31)
  })
})

