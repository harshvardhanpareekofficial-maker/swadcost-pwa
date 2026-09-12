/**
 * Continuous speak-mode parse: one utterance → mill-sheet fills.
 * Field keys come from the calculator (notebook formula set).
 */

import type { MultiInputs, SingleInputs } from './costing'
import { isInStandardRange } from './metricRanges'
import {
  consumeSpokenNumber,
  speechStreamTokens,
  speechTokensLooselyEqual,
} from './speechNumbers'

export type SpeechField = {
  key: string
  label: string
}

export type SpeechFill = {
  key: string
  label: string
  value: number
  source: 'named' | 'sequential'
}

export type SpeechIgnore = {
  text: string
  reason: 'out-of-range' | 'unclear'
  fieldKey?: string
  fieldLabel?: string
}

export type SpeechStreamResult = {
  fills: SpeechFill[]
  ignored: SpeechIgnore[]
}

export type SpeechStreamOptions = {
  /** First sequential field (active metric when listening started). */
  startIndex?: number
  inRange?: (key: string, value: number) => boolean
}

const FILLER = new Set([
  'and',
  'a',
  'an',
  'the',
  'of',
  'per',
  'please',
  'ok',
  'okay',
  'next',
  'then',
  'now',
  'is',
  'in',
  'for',
  'to',
  'with',
  'value',
  'number',
  'figure',
])

const TRAILING_UNIT = new Set([
  'percent',
  'percentage',
  'pratisat',
  'pratishat',
  'प्रतिशत',
  'inch',
  'inches',
  'इंच',
  'rupee',
  'rupees',
  'rs',
  'dent',
  'dents',
  'ne',
  'picks',
])

/** Words that make a neighbouring number look like leftover chatter, not a mill value. */
const UNCLEAR = new Set([
  'maybe',
  'perhaps',
  'weather',
  'today',
  'degrees',
  'degree',
  'hello',
  'wait',
  'sorry',
  'um',
  'uh',
])

const FIELD_ALIASES: Record<string, string[]> = {
  reed: ['reed', 'read', 'रीड'],
  warpReedspace: [
    'warp reedspace',
    'warp reed space',
    'warp read space',
    'warp reedspace inches',
    'reed space',
    'read space',
    'reedspace',
  ],
  weftReedspace: ['weft reedspace', 'weft reed space', 'weft read space', 'weft reedspace inches'],
  l2l: ['l2l', 'l 2 l', 'el 2 el', 'l to l', 'l two l', 'el two el', 'ell 2 ell'],
  warpCount: ['warp count', 'warp kaunt', 'warp काउंट'],
  warpRate: ['warp rate', 'warp दर'],
  sizingRate: ['sizing rate', 'sizing', 'साइजिंग'],
  pick: ['pick', 'ppi', 'pick ppi', 'पिक'],
  weftCount: ['weft count', 'weft kaunt', 'weft काउंट'],
  weftRate: ['weft rate', 'weft दर'],
  wastagePct: ['wastage', 'wastage percent', 'waste percent', 'वेस्टेज'],
  pickRate: ['pick rate', 'dalal rate', 'dalal', 'broker rate', 'broker'],
  warping: ['warping'],
}

type Alias = {
  key: string
  label: string
  tokens: string[]
}

function phraseTokens(phrase: string): string[] {
  return speechStreamTokens(phrase.replace(/%/g, ' percent '))
}

function yarnPhrases(key: string): string[] {
  const m = /^([wf])(\d+)(pct|count|rate|siz)$/.exec(key)
  if (!m) return []
  const side = m[1] === 'w' ? 'warp' : 'weft'
  const n = Number(m[2]) + 1
  const word = ['one', 'two', 'three'][Number(m[2])]
  const kind =
    m[3] === 'pct' ? 'percent' : m[3] === 'siz' ? 'sizing' : m[3] === 'count' ? 'count' : 'rate'
  const extra = m[3] === 'siz' ? [`${side} yarn ${n} sizing rate`, `${side} ${n} sizing rate`] : []
  return [
    `${side} yarn ${n} ${kind}`,
    `${side} yarn ${word} ${kind}`,
    `${side} ${n} ${kind}`,
    `${side} ${word} ${kind}`,
    ...extra,
  ]
}

export function aliasesForField(field: SpeechField): string[] {
  const extra = FIELD_ALIASES[field.key] ?? []
  return [field.label, ...extra, ...yarnPhrases(field.key)]
}

export function buildFieldAliases(fields: SpeechField[]): Alias[] {
  const aliases: Alias[] = []
  for (const field of fields) {
    for (const phrase of aliasesForField(field)) {
      const tokens = phraseTokens(phrase)
      if (tokens.length) aliases.push({ key: field.key, label: field.label, tokens })
    }
  }
  aliases.sort((a, b) => b.tokens.length - a.tokens.length || a.key.localeCompare(b.key))
  return aliases
}

function aliasMatchAt(tokens: string[], index: number, aliases: Alias[]): Alias | null {
  for (const alias of aliases) {
    if (index + alias.tokens.length > tokens.length) continue
    let ok = true
    for (let k = 0; k < alias.tokens.length; k += 1) {
      if (!speechTokensLooselyEqual(tokens[index + k], alias.tokens[k])) {
        ok = false
        break
      }
    }
    if (ok) return alias
  }
  return null
}

function skipTrailingUnit(tokens: string[], index: number): number {
  if (index < tokens.length && TRAILING_UNIT.has(tokens[index])) return index + 1
  return index
}

function isUnclearNeighbour(tokens: string[], numberAt: number, numberLen: number): boolean {
  const before = tokens[numberAt - 1]
  const after = tokens[numberAt + numberLen]
  return (before !== undefined && UNCLEAR.has(before)) || (after !== undefined && UNCLEAR.has(after))
}

export function appendSpeechChunk(prev: string, chunk: string): string {
  const a = prev.trim()
  const b = chunk.trim()
  if (!b) return a
  if (!a) return b
  return `${a} ${b}`
}

export function pickBestSpeechChunk(alternatives: string[]): string {
  let best = alternatives[0] ?? ''
  let bestScore = -1
  for (const alt of alternatives) {
    if (!alt?.trim()) continue
    const tokens = speechStreamTokens(alt)
    let score = 0
    let i = 0
    while (i < tokens.length) {
      const n = consumeSpokenNumber(tokens.slice(i))
      if (n) {
        score += 2 + n.length
        i += n.length
      } else {
        i += 1
      }
    }
    if (score > bestScore) {
      best = alt
      bestScore = score
    }
  }
  return best
}

function nextSequentialField(
  fields: SpeechField[],
  assigned: Set<string>,
  from: number,
): SpeechField | null {
  for (let i = from; i < fields.length; i += 1) {
    if (!assigned.has(fields[i].key)) return fields[i]
  }
  return null
}

export function parseSpeechStream(
  transcript: string,
  fields: SpeechField[],
  options: SpeechStreamOptions = {},
): SpeechStreamResult {
  const inRange = options.inRange ?? isInStandardRange
  const startIndex = Math.max(0, options.startIndex ?? 0)
  const tokens = speechStreamTokens(transcript)
  const aliases = buildFieldAliases(fields)
  const fills: SpeechFill[] = []
  const ignored: SpeechIgnore[] = []
  const assigned = new Set<string>()
  let seqFrom = startIndex
  let i = 0

  const pushNamed = (field: SpeechField, value: number) => {
    assigned.add(field.key)
    const existing = fills.findIndex((f) => f.key === field.key)
    const row: SpeechFill = { key: field.key, label: field.label, value, source: 'named' }
    if (existing === -1) fills.push(row)
    else fills[existing] = row
  }

  const tryNumberAt = (at: number): { value: number; length: number } | null => {
    return consumeSpokenNumber(tokens.slice(at))
  }

  while (i < tokens.length) {
    const token = tokens[i]
    if (FILLER.has(token) || UNCLEAR.has(token)) {
      i += 1
      continue
    }

    const named = aliasMatchAt(tokens, i, aliases)
    if (named) {
      const afterName = i + named.tokens.length
      const num = tryNumberAt(afterName)
      const field = fields.find((f) => f.key === named.key)
      if (field && num && !isUnclearNeighbour(tokens, afterName, num.length)) {
        if (inRange(field.key, num.value)) {
          pushNamed(field, num.value)
          const fieldIdx = fields.findIndex((f) => f.key === field.key)
          if (fieldIdx >= 0) seqFrom = Math.max(seqFrom, fieldIdx + 1)
        } else {
          ignored.push({
            text: String(num.value),
            reason: 'out-of-range',
            fieldKey: field.key,
            fieldLabel: field.label,
          })
        }
        i = skipTrailingUnit(tokens, afterName + num.length)
        continue
      }
      i = afterName
      continue
    }

    const num = tryNumberAt(i)
    if (num) {
      if (isUnclearNeighbour(tokens, i, num.length)) {
        ignored.push({ text: String(num.value), reason: 'unclear' })
        i = skipTrailingUnit(tokens, i + num.length)
        continue
      }
      const afterNum = i + num.length
      const trailingName = aliasMatchAt(tokens, skipTrailingUnit(tokens, afterNum), aliases)
      if (trailingName) {
        const field = fields.find((f) => f.key === trailingName.key)
        if (field) {
          if (inRange(field.key, num.value)) {
            pushNamed(field, num.value)
            const fieldIdx = fields.findIndex((f) => f.key === field.key)
            if (fieldIdx >= 0) seqFrom = Math.max(seqFrom, fieldIdx + 1)
          } else {
            ignored.push({
              text: String(num.value),
              reason: 'out-of-range',
              fieldKey: field.key,
              fieldLabel: field.label,
            })
          }
          i = skipTrailingUnit(tokens, afterNum) + trailingName.tokens.length
          continue
        }
      }

      const field = nextSequentialField(fields, assigned, seqFrom)
      if (!field) {
        ignored.push({ text: String(num.value), reason: 'unclear' })
        i = skipTrailingUnit(tokens, afterNum)
        continue
      }
      if (!inRange(field.key, num.value)) {
        ignored.push({
          text: String(num.value),
          reason: 'out-of-range',
          fieldKey: field.key,
          fieldLabel: field.label,
        })
        i = skipTrailingUnit(tokens, afterNum)
        continue
      }
      assigned.add(field.key)
      fills.push({ key: field.key, label: field.label, value: num.value, source: 'sequential' })
      const fieldIdx = fields.findIndex((f) => f.key === field.key)
      seqFrom = fieldIdx + 1
      i = skipTrailingUnit(tokens, afterNum)
      continue
    }

    i += 1
  }

  return { fills, ignored }
}

const SINGLE_KEYS = new Set<keyof SingleInputs>([
  'reed',
  'warpReedspace',
  'l2l',
  'warpCount',
  'warpRate',
  'sizingRate',
  'pick',
  'weftReedspace',
  'weftCount',
  'weftRate',
  'wastagePct',
  'pickRate',
  'warping',
])

export function applySingleFills(base: SingleInputs, fills: SpeechFill[]): SingleInputs {
  const next = { ...base }
  for (const fill of fills) {
    if (SINGLE_KEYS.has(fill.key as keyof SingleInputs)) {
      next[fill.key as keyof SingleInputs] = fill.value as never
    }
  }
  return next
}

export function applyMultiFills(base: MultiInputs, fills: SpeechFill[]): MultiInputs {
  const next: MultiInputs = {
    ...base,
    warpYarns: base.warpYarns.map((y) => ({ ...y })),
    weftYarns: base.weftYarns.map((y) => ({ ...y })),
  }
  for (const fill of fills) {
    const yarn = /^([wf])(\d+)(pct|count|rate|siz)$/.exec(fill.key)
    if (yarn) {
      const [, side, idxRaw, kind] = yarn
      const idx = Number(idxRaw)
      const slot = side === 'w' ? next.warpYarns[idx] : next.weftYarns[idx]
      if (!slot) continue
      if (kind === 'pct') slot.pct = fill.value
      else if (kind === 'count') slot.count = fill.value
      else if (kind === 'rate') slot.rate = fill.value
      else slot.sizingRate = fill.value
      continue
    }
    if (fill.key === 'fabricName' || fill.key === 'warpYarns' || fill.key === 'weftYarns') continue
    if (Object.prototype.hasOwnProperty.call(next, fill.key)) {
      ;(next as Record<string, unknown>)[fill.key] = fill.value
    }
  }
  return next
}

function readMultiValue(m: MultiInputs, key: string): number {
  const yarn = /^([wf])(\d+)(pct|count|rate|siz)$/.exec(key)
  if (yarn) {
    const slot = yarn[1] === 'w' ? m.warpYarns[Number(yarn[2])] : m.weftYarns[Number(yarn[2])]
    if (!slot) return 0
    if (yarn[3] === 'pct') return slot.pct
    if (yarn[3] === 'count') return slot.count
    if (yarn[3] === 'rate') return slot.rate
    return slot.sizingRate ?? 0
  }
  const raw = (m as Record<string, unknown>)[key]
  return typeof raw === 'number' ? raw : 0
}

/** Re-parse friendly: undo the last voice keys, then apply the new fill set. */
export function overlayVoiceFillsSingle(
  current: SingleInputs,
  baseline: SingleInputs,
  previousKeys: string[],
  fills: SpeechFill[],
): SingleInputs {
  const next = { ...current }
  for (const key of previousKeys) {
    if (SINGLE_KEYS.has(key as keyof SingleInputs)) {
      next[key as keyof SingleInputs] = baseline[key as keyof SingleInputs] as never
    }
  }
  return applySingleFills(next, fills)
}

export function overlayVoiceFillsMulti(
  current: MultiInputs,
  baseline: MultiInputs,
  previousKeys: string[],
  fills: SpeechFill[],
): MultiInputs {
  const revert = previousKeys.map((key) => ({
    key,
    label: '',
    value: readMultiValue(baseline, key),
    source: 'named' as const,
  }))
  return applyMultiFills(applyMultiFills(current, revert), fills)
}
