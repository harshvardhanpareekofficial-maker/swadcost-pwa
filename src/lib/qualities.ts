export type QualityCalc = {
  reed: number
  pick: number
  warpRs: number
  qualityLabel: string
  fabricName: string
}

export type RankedQuality = {
  /** Display title: quality_label, else reed×pick. */
  label: string
  count: number
  reed: number | null
  pick: number | null
  warpRs: number | null
  qualityLabel: string
  fabricName: string
}

type QualityBucket = {
  label: string
  count: number
  reeds: Map<number, number>
  picks: Map<number, number>
  warps: Map<number, number>
  fabrics: Map<string, number>
  qualityLabels: Map<string, number>
}

function bump<T extends string | number>(map: Map<T, number>, key: T): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function topKey<T extends string | number>(map: Map<T, number>): T | null {
  let best: T | null = null
  let n = -1
  for (const [key, count] of map) {
    if (count > n || (count === n && best !== null && String(key).localeCompare(String(best)) < 0)) {
      best = key
      n = count
    }
  }
  return best
}

function positive(n: number): number | null {
  return Number.isFinite(n) && n > 0 ? n : null
}

function reedPickLabel(reed: number, pick: number): string {
  if (!Number.isFinite(reed) || !Number.isFinite(pick) || reed <= 0 || pick <= 0) return ''
  return `${reed}×${pick}`
}

/** Group key so the same mill quality stacks even when fabric names differ. */
export function qualityGroupKey(row: QualityCalc): string {
  const named = row.qualityLabel.trim().toLowerCase()
  if (named) return `ql:${named}`
  const built = reedPickLabel(row.reed, row.pick)
  if (built) return `rp:${built.toLowerCase()}`
  return 'unknown'
}

function displayLabel(row: QualityCalc): string {
  const named = row.qualityLabel.trim()
  if (named) return named
  return reedPickLabel(row.reed, row.pick) || '(n/a)'
}

export function rankQualities(calcs: QualityCalc[], limit = 8): RankedQuality[] {
  const buckets = new Map<string, QualityBucket>()

  for (const row of calcs) {
    const key = qualityGroupKey(row)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = {
        label: displayLabel(row),
        count: 0,
        reeds: new Map(),
        picks: new Map(),
        warps: new Map(),
        fabrics: new Map(),
        qualityLabels: new Map(),
      }
      buckets.set(key, bucket)
    }
    bucket.count += 1
    if (positive(row.reed) !== null) bump(bucket.reeds, row.reed)
    if (positive(row.pick) !== null) bump(bucket.picks, row.pick)
    if (positive(row.warpRs) !== null) bump(bucket.warps, row.warpRs)
    if (row.qualityLabel.trim()) bump(bucket.qualityLabels, row.qualityLabel.trim())
    const fabric = row.fabricName.trim()
    if (fabric && fabric.toLowerCase() !== 'untitled fabric' && fabric.toLowerCase() !== 'untitled') {
      bump(bucket.fabrics, fabric)
    }
    if (bucket.label === '(n/a)' && displayLabel(row) !== '(n/a)') {
      bucket.label = displayLabel(row)
    }
  }

  return [...buckets.values()]
    .map((bucket) => {
      const reed = topKey(bucket.reeds)
      const pick = topKey(bucket.picks)
      const qualityFromRows = topKey(bucket.qualityLabels) ?? ''
      const label = qualityFromRows || bucket.label || reedPickLabel(reed ?? 0, pick ?? 0) || '(n/a)'
      return {
        label,
        count: bucket.count,
        reed: reed === null ? null : Number(reed),
        pick: pick === null ? null : Number(pick),
        warpRs: (() => {
          const w = topKey(bucket.warps)
          return w === null ? null : Number(w)
        })(),
        qualityLabel: qualityFromRows,
        fabricName: (topKey(bucket.fabrics) as string | null) ?? '',
      }
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
}
