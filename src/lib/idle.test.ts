import { describe, expect, it } from 'vitest'
import { IDLE_TTL_DAYS, IDLE_TTL_MS, idleCutoffIso, isIdleTimestamp } from './idle'

describe('idle policy', () => {
  it('uses a 12-day window', () => {
    expect(IDLE_TTL_DAYS).toBe(12)
    expect(IDLE_TTL_MS).toBe(12 * 24 * 60 * 60 * 1000)
  })

  it('treats timestamps older than 12 days as idle', () => {
    const now = Date.parse('2026-09-11T12:00:00.000Z')
    expect(isIdleTimestamp(now - IDLE_TTL_MS - 1, now)).toBe(true)
    expect(isIdleTimestamp(now - IDLE_TTL_MS + 1, now)).toBe(false)
    expect(isIdleTimestamp(0, now)).toBe(true)
  })

  it('formats the ISO cutoff', () => {
    const now = Date.parse('2026-09-24T00:00:00.000Z')
    expect(idleCutoffIso(now)).toBe('2026-09-12T00:00:00.000Z')
  })
})
