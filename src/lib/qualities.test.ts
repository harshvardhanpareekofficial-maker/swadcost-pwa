import { describe, expect, it } from 'vitest'
import { qualityGroupKey, rankQualities, type QualityCalc } from './qualities'

function row(partial: Partial<QualityCalc> & Pick<QualityCalc, 'qualityLabel'>): QualityCalc {
  return {
    reed: 0,
    pick: 0,
    warpRs: 0,
    fabricName: '',
    ...partial,
  }
}

describe('rankQualities', () => {
  it('returns empty when there are no calcs', () => {
    expect(rankQualities([])).toEqual([])
  })

  it('ranks the most-used quality first with reed, warp/pick, label, and fabric name', () => {
    const calcs: QualityCalc[] = [
      row({ reed: 80, pick: 50, warpRs: 60, qualityLabel: '80×50', fabricName: 'Grey 40s' }),
      row({ reed: 80, pick: 50, warpRs: 60, qualityLabel: '80×50', fabricName: 'Grey 40s' }),
      row({ reed: 80, pick: 50, warpRs: 60, qualityLabel: '80×50', fabricName: 'Untitled fabric' }),
      row({ reed: 120, pick: 68, warpRs: 65, qualityLabel: '120×68', fabricName: 'Shirtings' }),
    ]
    const ranked = rankQualities(calcs)
    expect(ranked[0]).toMatchObject({
      label: '80×50',
      count: 3,
      reed: 80,
      pick: 50,
      warpRs: 60,
      qualityLabel: '80×50',
      fabricName: 'Grey 40s',
    })
    expect(ranked[1]?.label).toBe('120×68')
    expect(ranked[1]?.count).toBe(1)
  })

  it('groups the same reed × pick when quality_label is missing', () => {
    const ranked = rankQualities([
      row({ reed: 72, pick: 68, qualityLabel: '', fabricName: 'A' }),
      row({ reed: 72, pick: 68, qualityLabel: '', fabricName: 'A' }),
    ])
    expect(qualityGroupKey(row({ reed: 72, pick: 68, qualityLabel: '' }))).toBe('rp:72×68')
    expect(ranked[0]).toMatchObject({ label: '72×68', count: 2, reed: 72, pick: 68 })
  })
})
