import { describe, expect, it } from 'vitest'
import { isInStandardRange, metricRangeFor, shouldAutoAdvance } from './metricRanges'

describe('metric ranges', () => {
  it('uses mill-typical bounds for reed and pick', () => {
    expect(metricRangeFor('reed')).toEqual(expect.objectContaining({ min: 24, max: 160 }))
    expect(isInStandardRange('reed', 120)).toBe(true)
    expect(isInStandardRange('reed', 8)).toBe(false)
    expect(isInStandardRange('pick', 68)).toBe(true)
    expect(isInStandardRange('pick', 4)).toBe(false)
  })

  it('auto-advances only when the heard value is in range', () => {
    expect(shouldAutoAdvance('reed', 80)).toBe(true)
    expect(shouldAutoAdvance('reed', 2)).toBe(false)
    expect(shouldAutoAdvance('l2l', 102)).toBe(true)
    expect(shouldAutoAdvance('wastagePct', 5)).toBe(true)
    expect(shouldAutoAdvance('wastagePct', 80)).toBe(false)
    expect(shouldAutoAdvance('warping', 0)).toBe(true)
    expect(shouldAutoAdvance('w0pct', 100)).toBe(true)
    expect(shouldAutoAdvance('w0count', 61)).toBe(true)
    expect(shouldAutoAdvance('pickRate', 0.5)).toBe(true)
  })

  it('treats yarn sizing keys as sizing, not generic rate', () => {
    expect(metricRangeFor('w0siz').max).toBe(metricRangeFor('sizingRate').max)
    expect(shouldAutoAdvance('w0siz', 10)).toBe(true)
  })
})
