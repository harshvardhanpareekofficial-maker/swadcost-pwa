import { describe, expect, it } from 'vitest'
import {
  DEMO_MULTI,
  DEMO_SINGLE,
  K_MULTI,
  K_SINGLE,
  applyWastageToYarnCosts,
  calculateMulti,
  calculateSingle,
  totalEnds,
  yarnCost,
} from './costing'

describe('helpers', () => {
  it('computes ends = Reed × Reedspace', () => {
    expect(totalEnds(80, 60)).toBe(4800)
  })

  it('computes yarn cost with K', () => {
    const c = yarnCost(4800, 2, 300, 40, K_SINGLE)
    expect(c).toBeCloseTo((4800 * 2 * 300) / (40 * K_SINGLE), 10)
  })

  it('applies wastage to combined yarn costs', () => {
    expect(applyWastageToYarnCosts(100, 50, 5)).toBeCloseTo(157.5, 10)
  })
})

describe('calculateSingle', () => {
  it('hits SwadCost oracle Final Cost 1698.77', () => {
    const r = calculateSingle(DEMO_SINGLE)
    expect(r.grandTotal).toBe(1698.77)
    expect(r.mode).toBe('single')
    expect(r.k).toBe(K_SINGLE)
    expect(r.totalEnds).toBe(4800)
  })

  it('matches markup table 5% and 16%', () => {
    const r = calculateSingle(DEMO_SINGLE)
    expect(r.markups.find((m) => m.pct === 5)?.amount).toBe(1783.71)
    expect(r.markups.find((m) => m.pct === 16)?.amount).toBe(1970.57)
  })

  it('throws on zero warp count', () => {
    expect(() => calculateSingle({ ...DEMO_SINGLE, warpCount: 0 })).toThrow(/count/i)
  })
})

describe('calculateMulti', () => {
  it('hits SwadCost multi oracle Final Cost 1482.17 (yarn1-only)', () => {
    const r = calculateMulti(DEMO_MULTI)
    expect(r.grandTotal).toBe(1482.17)
    expect(r.mode).toBe('multi')
    expect(r.k).toBe(K_MULTI)
    expect(r.warpLines).toHaveLength(1)
    expect(r.weftLines).toHaveLength(1)
  })

  it('splits cost by yarn percent across multiple yarns', () => {
    const r = calculateMulti({
      ...DEMO_MULTI,
      warpYarns: [
        { pct: 60, count: 40, rate: 300, sizingRate: 5 },
        { pct: 40, count: 20, rate: 280, sizingRate: 4 },
      ],
      weftYarns: [
        { pct: 70, count: 40, rate: 280 },
        { pct: 30, count: 30, rate: 260 },
      ],
    })
    expect(r.warpLines).toHaveLength(2)
    expect(r.weftLines).toHaveLength(2)
    const w1 = yarnCost(4800 * 0.6, 2, 300, 40, K_MULTI)
    const w2 = yarnCost(4800 * 0.4, 2, 280, 20, K_MULTI)
    expect(r.warpLines[0].yarnCostRaw).toBeCloseTo(w1, 3)
    expect(r.warpLines[1].yarnCostRaw).toBeCloseTo(w2, 3)
    expect(r.grandTotal).toBeGreaterThan(0)
  })

  it('throws when no active yarns', () => {
    expect(() =>
      calculateMulti({ ...DEMO_MULTI, warpYarns: [{ pct: 0, count: 40, rate: 1 }] }),
    ).toThrow(/yarn/i)
  })
})
