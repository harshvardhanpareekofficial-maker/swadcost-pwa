import { describe, expect, it } from 'vitest'
import { buildUsageReport, mergeAccountsByUsername, qualityLabel, rankLabels, type AccountMeta, type CalcEvent } from './telemetry'

describe('qualityLabel', () => {
  it('formats reed × pick as textile quality', () => {
    expect(qualityLabel(80, 50)).toBe('80×50')
    expect(qualityLabel(0, 50)).toBe('')
  })
})

describe('buildUsageReport', () => {
  it('ranks fabrics, qualities, and modes', () => {
    const calcs: CalcEvent[] = [
      {
        id: '1',
        username: 'maya',
        fabricName: 'Grey 40s',
        mode: 'single',
        reed: 80,
        pick: 50,
        warpRs: 60,
        qualityLabel: '80×50',
        finalCost: 1698.77,
        payload: {},
        createdAt: '2026-09-11T00:00:00.000Z',
      },
      {
        id: '2',
        username: 'maya',
        fabricName: 'Grey 40s',
        mode: 'single',
        reed: 80,
        pick: 50,
        warpRs: 60,
        qualityLabel: '80×50',
        finalCost: 1700,
        payload: {},
        createdAt: '2026-09-11T01:00:00.000Z',
      },
      {
        id: '3',
        username: 'rohitbohara',
        fabricName: 'Shirtings',
        mode: 'multi',
        reed: 72,
        pick: 68,
        warpRs: 60,
        qualityLabel: '72×68',
        finalCost: 1482.17,
        payload: {},
        createdAt: '2026-09-11T02:00:00.000Z',
      },
    ]

    expect(rankLabels(['Grey 40s', 'Grey 40s', 'Shirtings'])[0]).toEqual({ label: 'Grey 40s', count: 2 })
    const report = buildUsageReport(calcs)
    expect(report.modeCounts).toEqual({ single: 2, multi: 1 })
    expect(report.topFabrics[0]).toEqual({ label: 'Grey 40s', count: 2 })
    expect(report.topReedPick[0]).toEqual({ label: '80×50', count: 2 })
    expect(report.topQualities[0]).toEqual({ label: '80×50', count: 2 })
  })
})

describe('mergeAccountsByUsername', () => {
  it('keys vault accounts by username_norm so case variants are one row', () => {
    const remote: AccountMeta[] = [
      {
        id: 'r1',
        username: 'HARSHVARDHAN',
        createdAt: '2026-09-10T00:00:00.000Z',
        lastActiveAt: '2026-09-11T02:00:00.000Z',
      },
    ]
    const local: AccountMeta[] = [
      {
        id: 'l1',
        username: 'Harshvardhan',
        createdAt: '2026-09-11T00:00:00.000Z',
        lastActiveAt: '2026-09-11T01:00:00.000Z',
      },
    ]
    const merged = mergeAccountsByUsername(remote, local)
    expect(merged).toHaveLength(1)
    expect(merged[0]?.username.toLowerCase()).toBe('harshvardhan')
    expect(merged[0]?.lastActiveAt).toBe('2026-09-11T02:00:00.000Z')
  })
})
