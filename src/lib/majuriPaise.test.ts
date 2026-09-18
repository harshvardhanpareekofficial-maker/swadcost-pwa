/**
 * Majuri / pick rate is paise per pick no matter what.
 * Typed or spoken `12` / `twelve` is 12 paise (₹0.12), never ₹12.
 */
import { describe, expect, it } from 'vitest'
import {
  SAMPLE_SINGLE,
  calculateSingle,
  jobCostFromPickRatePaise,
  pickRatePaiseToRupees,
} from './costing'
import { PICK_RATE_HINT, PICK_RATE_LABEL, PICK_RATE_UNIT } from './labels'
import { applySingleFills, parseSpeechStream, type SpeechField } from './speechStream'
import { emptySingle } from './types'

const FIELDS: SpeechField[] = [
  { key: 'reed', label: 'Reed' },
  { key: 'warpReedspace', label: 'Warp Reedspace' },
  { key: 'l2l', label: 'L2L' },
  { key: 'warpCount', label: 'Warp Count' },
  { key: 'warpRate', label: 'Warp Rate' },
  { key: 'sizingRate', label: 'Sizing rate' },
  { key: 'pick', label: 'Pick (PPI)' },
  { key: 'weftReedspace', label: 'Weft Reedspace' },
  { key: 'weftCount', label: 'Weft Count' },
  { key: 'weftRate', label: 'Weft Rate' },
  { key: 'wastagePct', label: 'Wastage' },
  { key: 'pickRate', label: PICK_RATE_LABEL },
  { key: 'warping', label: 'Warping' },
]

const PICK_RATE_INDEX = FIELDS.findIndex((f) => f.key === 'pickRate')

function sheetWithMajuri(pickRatePaise: number, pick = 50) {
  return { ...SAMPLE_SINGLE, pick, pickRate: pickRatePaise }
}

describe('majuri is paise, never rupees', () => {
  it('converts typed 12 to ₹0.12, not ₹12', () => {
    const typed = 12
    expect(pickRatePaiseToRupees(typed)).toBeCloseTo(0.12, 10)
    expect(pickRatePaiseToRupees(typed)).not.toBe(12)
    expect(jobCostFromPickRatePaise(1, typed)).toBeCloseTo(0.12, 4)
    expect(jobCostFromPickRatePaise(50, typed)).toBeCloseTo(6, 4)
    expect(jobCostFromPickRatePaise(50, typed)).not.toBeCloseTo(50 * 12, 4)
  })

  it('uses ₹0.12 equivalent in the notebook job line when the field is 12', () => {
    const r = calculateSingle(sheetWithMajuri(12, 50))
    expect(r.jobCost).toBeCloseTo(6, 4)
    expect(r.jobCost).toBeCloseTo(50 * 0.12, 4)
    const asRupees = calculateSingle(sheetWithMajuri(12 * 100, 50))
    expect(asRupees.jobCost).toBeCloseTo(50 * 12, 4)
    expect(r.jobCost).not.toBeCloseTo(asRupees.jobCost, 2)
  })

  it('Load sample stores 50 paise (₹0.50), matching the old 0.5 rupee sample', () => {
    expect(SAMPLE_SINGLE.pickRate).toBe(50)
    const r = calculateSingle(SAMPLE_SINGLE)
    expect(r.jobCost).toBeCloseTo(SAMPLE_SINGLE.pick * 0.5, 4)
  })

  it('fills spoken 12 onto majuri as 12 paise and costs ₹0.12 per pick', () => {
    const parsed = parseSpeechStream('12', FIELDS, { startIndex: PICK_RATE_INDEX })
    expect(parsed.fills.map((f) => [f.key, f.value, f.source])).toEqual([
      ['pickRate', 12, 'sequential'],
    ])
    const next = applySingleFills(emptySingle(), parsed.fills)
    expect(next.pickRate).toBe(12)
    const r = calculateSingle(sheetWithMajuri(next.pickRate, 50))
    expect(r.jobCost).toBeCloseTo(50 * 0.12, 4)
  })

  it('fills spoken twelve the same as 12 paise', () => {
    const parsed = parseSpeechStream('twelve', FIELDS, { startIndex: PICK_RATE_INDEX })
    expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([['pickRate', 12]])
    const r = calculateSingle(sheetWithMajuri(parsed.fills[0].value, 1))
    expect(r.jobCost).toBeCloseTo(0.12, 4)
  })

  it('maps majuri / majoori / मजदूरी names onto pickRate as paise', () => {
    for (const phrase of ['majuri 12', 'majoori twelve', 'मजदूरी 12', 'pick rate 12', 'dalal rate 12']) {
      const parsed = parseSpeechStream(phrase, FIELDS)
      expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([['pickRate', 12]])
    }
  })

  it('still treats 12 as paise if the speaker tags rupees', () => {
    const parsed = parseSpeechStream('majuri 12 rupees', FIELDS)
    expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([['pickRate', 12]])
    expect(pickRatePaiseToRupees(parsed.fills[0].value)).toBeCloseTo(0.12, 10)
  })

  it('shows paise unit and helper copy so 12 cannot be read as rupees', () => {
    expect(PICK_RATE_LABEL).toMatch(/Majuri/)
    expect(PICK_RATE_UNIT).toBe('paise per pick')
    expect(PICK_RATE_HINT).toContain('Enter paise, not rupees — 12 means ₹0.12')
  })
})
