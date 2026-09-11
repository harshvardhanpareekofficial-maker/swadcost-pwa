import { describe, expect, it } from 'vitest'
import { buildUsageReport, qualityLabel, rankLabels, type CalcEvent } from './telemetry'

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
