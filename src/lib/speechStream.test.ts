import { describe, expect, it } from 'vitest'
import { emptyMulti, emptySingle } from './types'
import {
  aliasesForField,
  appendSpeechChunk,
  applyMultiFills,
  applySingleFills,
  consumeNumberForField,
  isEchoSpeechChunk,
  isUnstableSpeechTail,
  overlayVoiceFillsSingle,
  parseSpeechStream,
  pickBestSpeechChunk,
  type SpeechField,
} from './speechStream'
import { isInStandardRange } from './metricRanges'
import { speechStreamTokens } from './speechNumbers'

const SINGLE_FIELDS: SpeechField[] = [
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
  { key: 'pickRate', label: 'Pick rate / Dalal rate' },
  { key: 'warping', label: 'Warping' },
]

function keysOf(transcript: string, startIndex = 0) {
  const parsed = parseSpeechStream(transcript, SINGLE_FIELDS, { startIndex })
  return {
    fills: parsed.fills.map((f) => `${f.key}:${f.value}:${f.source}`),
    ignored: parsed.ignored.map((i) => `${i.text}:${i.reason}`),
  }
}

describe('speech stream parse', () => {
  it('fills mill-sheet fields from numbers spoken in order', () => {
    const parsed = parseSpeechStream('80 64 102 40', SINGLE_FIELDS)
    expect(parsed.fills.map((f) => [f.key, f.value, f.source])).toEqual([
      ['reed', 80, 'sequential'],
      ['warpReedspace', 64, 'sequential'],
      ['l2l', 102, 'sequential'],
      ['warpCount', 40, 'sequential'],
    ])
  })

  it('parses a Hindi number stream into sheet order', () => {
    const parsed = parseSpeechStream('अस्सी चौंसठ एक सौ दो', SINGLE_FIELDS)
    expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 80],
      ['warpReedspace', 64],
      ['l2l', 102],
    ])
  })

  it('parses a continuous English word stream into several fields', () => {
    const parsed = parseSpeechStream('eighty sixty four one oh two forty', SINGLE_FIELDS)
    expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 80],
      ['warpReedspace', 64],
      ['l2l', 102],
      ['warpCount', 40],
    ])
  })

  it('maps spoken metric names onto the matching calculator fields', () => {
    const parsed = parseSpeechStream(
      'reed 80 warp count 40 pick 68 wastage 5 pick rate 0.5',
      SINGLE_FIELDS,
    )
    expect(parsed.fills.map((f) => [f.key, f.value, f.source])).toEqual([
      ['reed', 80, 'named'],
      ['warpCount', 40, 'named'],
      ['pick', 68, 'named'],
      ['wastagePct', 5, 'named'],
      ['pickRate', 0.5, 'named'],
    ])
  })

  it('accepts number-then-name order used on the mill floor', () => {
    const parsed = parseSpeechStream('80 reed 64 warp reed space 102 l2l', SINGLE_FIELDS)
    expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 80],
      ['warpReedspace', 64],
      ['l2l', 102],
    ])
  })

  it('skips out-of-range values instead of writing them', () => {
    const parsed = parseSpeechStream('reed 8 warp count 40', SINGLE_FIELDS)
    expect(parsed.fills.map((f) => f.key)).toEqual(['warpCount'])
    expect(parsed.ignored.some((i) => i.reason === 'out-of-range' && i.text === '8')).toBe(true)
  })

  it('skips leftover chatter around a number', () => {
    const parsed = parseSpeechStream(
      'the weather in ichalkaranji today is 32 degrees and also 80 reed maybe',
      SINGLE_FIELDS,
    )
    expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([['reed', 80]])
    expect(parsed.ignored.some((i) => i.text === '32')).toBe(true)
  })

  it('re-parses a growing word number as one value, not two', () => {
    expect(parseSpeechStream('sixty', SINGLE_FIELDS).fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 60],
    ])
    expect(parseSpeechStream('sixty five', SINGLE_FIELDS).fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 65],
    ])
  })

  it('starts sequential fills from the active field', () => {
    const parsed = parseSpeechStream('40 220', SINGLE_FIELDS, { startIndex: 3 })
    expect(parsed.fills.map((f) => f.key)).toEqual(['warpCount', 'warpRate'])
  })

  it('mixes named fields then continues in sheet order', () => {
    expect(keysOf('reed 80 64 102').fills).toEqual([
      'reed:80:named',
      'warpReedspace:64:sequential',
      'l2l:102:sequential',
    ])
  })

  it('builds yarn aliases from multi-yarn calculator keys', () => {
    const phrases = aliasesForField({ key: 'w0count', label: 'Warp yarn 1 Count' })
    expect(phrases.some((p) => /warp yarn 1 count/i.test(p))).toBe(true)
    const fields: SpeechField[] = [
      { key: 'reed', label: 'Reed' },
      { key: 'w0pct', label: 'Warp yarn 1 %' },
      { key: 'w0count', label: 'Warp yarn 1 Count' },
      { key: 'w0rate', label: 'Warp yarn 1 Rate' },
    ]
    const parsed = parseSpeechStream('reed 80 warp yarn 1 count 61 warp yarn one rate 220', fields)
    expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 80],
      ['w0count', 61],
      ['w0rate', 220],
    ])
  })

  it('applies a batch of fills in one single-yarn patch', () => {
    const next = applySingleFills(emptySingle(), [
      { key: 'reed', label: 'Reed', value: 80, source: 'named' },
      { key: 'l2l', label: 'L2L', value: 102, source: 'sequential' },
    ])
    expect(next.reed).toBe(80)
    expect(next.l2l).toBe(102)
    expect(next.pick).toBe(0)
  })

  it('applies multi-yarn keys without dropping other slots', () => {
    const next = applyMultiFills(emptyMulti(), [
      { key: 'reed', label: 'Reed', value: 80, source: 'named' },
      { key: 'w0pct', label: 'Warp yarn 1 %', value: 100, source: 'named' },
      { key: 'w0count', label: 'Warp yarn 1 Count', value: 61, source: 'named' },
      { key: 'f1rate', label: 'Weft yarn 2 Rate', value: 210, source: 'named' },
    ])
    expect(next.reed).toBe(80)
    expect(next.warpYarns[0]).toMatchObject({ pct: 100, count: 61 })
    expect(next.weftYarns[1].rate).toBe(210)
    expect(next.warpYarns[1].pct).toBe(0)
  })

  it('re-parse overlay revises sixty → sixty five without leaving a stray next field', () => {
    const baseline = emptySingle()
    const first = overlayVoiceFillsSingle(baseline, baseline, [], [
      { key: 'reed', label: 'Reed', value: 60, source: 'sequential' },
      { key: 'warpReedspace', label: 'Warp Reedspace', value: 5, source: 'sequential' },
    ])
    expect(first.reed).toBe(60)
    expect(first.warpReedspace).toBe(5)
    const second = overlayVoiceFillsSingle(first, baseline, ['reed', 'warpReedspace'], [
      { key: 'reed', label: 'Reed', value: 65, source: 'sequential' },
    ])
    expect(second.reed).toBe(65)
    expect(second.warpReedspace).toBe(0)
  })

  it('joins chunks and prefers the alternative with more mill numbers', () => {
    expect(appendSpeechChunk('reed 80', 'warp count 40')).toBe('reed 80 warp count 40')
    expect(pickBestSpeechChunk(['hmm reed maybe', 'sixty five 102'])).toBe('sixty five 102')
  })

  it('maps named reed despite STT hearing “read”', () => {
    const parsed = parseSpeechStream('read 120', SINGLE_FIELDS)
    expect(parsed.fills.map((f) => [f.key, f.value, f.source])).toEqual([['reed', 120, 'named']])
    expect(parsed.ignored).toEqual([])
    expect(parsed.pending).toBe(false)
  })

  it('does not lock Reed on a partial 12 while 120 is still arriving', () => {
    const live = parseSpeechStream('read 12', SINGLE_FIELDS, { settle: false })
    expect(live.fills).toEqual([])
    expect(live.ignored).toEqual([])
    expect(live.pending).toBe(true)

    const grown = parseSpeechStream('read 12 0', SINGLE_FIELDS, { settle: false })
    expect(grown.fills.map((f) => [f.key, f.value, f.source])).toEqual([['reed', 120, 'named']])
    expect(grown.ignored).toEqual([])

    const spoken = parseSpeechStream('read 120', SINGLE_FIELDS, { settle: false })
    expect(spoken.fills.map((f) => [f.key, f.value])).toEqual([['reed', 120]])
  })

  it('quietly drops a settled 12 prefix instead of stacking a Reed range error', () => {
    const settled = parseSpeechStream('read 12', SINGLE_FIELDS, { settle: true })
    expect(settled.fills).toEqual([])
    expect(settled.ignored).toEqual([])
  })

  it('does not glue 120 and 67 into 12067', () => {
    const glued = parseSpeechStream('read 12067', SINGLE_FIELDS)
    expect(glued.fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 120],
      ['warpReedspace', 67],
    ])
    expect(glued.ignored.some((i) => i.text === '12067')).toBe(false)

    const spaced = parseSpeechStream('120 67', SINGLE_FIELDS)
    expect(spaced.fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 120],
      ['warpReedspace', 67],
    ])

    const splitChunk = parseSpeechStream('read 12 067', SINGLE_FIELDS)
    expect(splitChunk.fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 120],
      ['warpReedspace', 67],
    ])
  })

  it('does not spill the same sequential value into the next field', () => {
    const parsed = parseSpeechStream('120 99 99 41 355 355', SINGLE_FIELDS)
    expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 120],
      ['warpReedspace', 99],
      ['l2l', 41],
    ])
    expect(parsed.fills.find((f) => f.key === 'l2l')?.value).not.toBe(99)
    expect(parsed.fills.find((f) => f.key === 'sizingRate')).toBeUndefined()
    expect(parsed.fills.filter((f) => f.value === 99)).toHaveLength(1)
    expect(parsed.fills.filter((f) => f.value === 355)).toHaveLength(0)
  })

  it('allows repeating a value only when the metric is named again', () => {
    const parsed = parseSpeechStream('reed 120 warp reed space 99 l2l 99', SINGLE_FIELDS)
    expect(parsed.fills.map((f) => [f.key, f.value, f.source])).toEqual([
      ['reed', 120, 'named'],
      ['warpReedspace', 99, 'named'],
      ['l2l', 99, 'named'],
    ])
  })

  it('folds Chrome mill-speed finals without prefix errors, glue, or echo spill', () => {
    const full = ['read read 12', '0', '67', '99', '99', '41', '355', '355'].reduce(
      (acc, chunk) => appendSpeechChunk(acc, chunk),
      '',
    )
    expect(full).toBe('read read 12 0 67 99 41 355')
    const parsed = parseSpeechStream(full, SINGLE_FIELDS)
    expect(parsed.fills.map((f) => [f.key, f.value])).toEqual([
      ['reed', 120],
      ['warpReedspace', 67],
      ['l2l', 99],
      ['warpCount', 41],
      ['warpRate', 355],
    ])
    expect(parsed.ignored.some((i) => i.text === '12' || i.text === '12067')).toBe(false)
    expect(parsed.fills.find((f) => f.key === 'sizingRate')).toBeUndefined()
  })

  it('treats a trailing 1–2 digit token as an unstable Chrome tail', () => {
    expect(isUnstableSpeechTail('read 12')).toBe(true)
    expect(isUnstableSpeechTail('read 120')).toBe(false)
    expect(isUnstableSpeechTail('warp rate 355')).toBe(false)
    expect(isEchoSpeechChunk('read 120 99', '99')).toBe(true)
    expect(isEchoSpeechChunk('read 120 99', '41')).toBe(false)
  })

  it('grows 12 + 0 into 120 for Reed and splits leftover 67', () => {
    const tokens = speechStreamTokens('12 0 67')
    const first = consumeNumberForField(tokens, 0, 'reed', isInStandardRange, true)
    expect(first).toMatchObject({ kind: 'value', value: 120 })
  })
})
