/**
 * Typical powerloom grey-sheet ranges. Continuous speak fills a field only
 * when the heard value sits inside the range for that metric.
 */

export type MetricRange = {
  min: number
  max: number
  /** Short spoken prompt for the active field. */
  prompt: string
}

const REED: MetricRange = { min: 24, max: 160, prompt: 'Reed. Dents per inch.' }
const REEDSPACE: MetricRange = { min: 20, max: 120, prompt: 'Reed space. Inches.' }
const L2L: MetricRange = { min: 1, max: 250, prompt: 'L 2 L.' }
const COUNT: MetricRange = { min: 4, max: 200, prompt: 'Count. English cotton number.' }
const RATE: MetricRange = { min: 0, max: 2500, prompt: 'Rate. Rupees per weight.' }
const SIZING: MetricRange = { min: 0, max: 400, prompt: 'Sizing rate.' }
const PICK: MetricRange = { min: 16, max: 160, prompt: 'Pick. Picks per inch.' }
const WASTAGE: MetricRange = { min: 0, max: 25, prompt: 'Wastage. Percent of weft.' }
const PICK_RATE: MetricRange = { min: 0, max: 200, prompt: 'Pick rate. Rupees per pick.' }
const WARPING: MetricRange = { min: 0, max: 5000, prompt: 'Warping. Rupees.' }
const PCT: MetricRange = { min: 0, max: 100, prompt: 'Yarn percent.' }

export function metricRangeFor(key: string): MetricRange {
  const k = key.toLowerCase()
  if (k === 'reed') return REED
  if (k === 'warpreedspace' || k === 'weftreedspace') return REEDSPACE
  if (k === 'l2l') return L2L
  if (k === 'pick') return PICK
  if (k === 'wastagepct' || k === 'wastage') return WASTAGE
  if (k === 'pickrate') return PICK_RATE
  if (k === 'warping') return WARPING
  if (k === 'sizingrate' || k.endsWith('siz')) return SIZING
  if (k.endsWith('pct') || k.includes('pct')) return PCT
  if (k.endsWith('count') || k.includes('count')) return COUNT
  if (k.endsWith('rate') || k.includes('rate')) return RATE
  return { min: 0, max: 1_000_000, prompt: 'Number.' }
}

export function isInStandardRange(key: string, value: number): boolean {
  if (!Number.isFinite(value)) return false
  const { min, max } = metricRangeFor(key)
  return value >= min && value <= max
}

/** Fill always; advance only when the value is a typical mill figure. */
export function shouldAutoAdvance(key: string, value: number): boolean {
  return isInStandardRange(key, value)
}

export function rangeHint(key: string): string {
  const { min, max } = metricRangeFor(key)
  return `Typical ${min}–${max}`
}

export function spokenPromptFor(key: string, label?: string): string {
  const spec = metricRangeFor(key)
  if (label && spec.prompt === 'Number.') return `${label}.`
  return spec.prompt
}
