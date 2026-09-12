/**
 * Continuous speak-mode parse: one utterance → mill-sheet fills.
 * Field keys come from the calculator (notebook formula set).
 */

import type { MultiInputs, SingleInputs } from './costing'
import { isInStandardRange, metricRangeFor } from './metricRanges'
import {
  consumeSpokenNumber,
  isPureDigitToken,
  isTensSpeechToken,
  speechStreamTokens,
  speechTokenValue,
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
  /** Last number is still growing (12 → 120). Do not lock or warn yet. */
  pending: boolean
}

export type SpeechStreamOptions = {
  /** First sequential field (active metric when listening started). */
  startIndex?: number
  inRange?: (key: string, value: number) => boolean
  /**
   * When false, a trailing short/low number stays pending (live stream).
   * When true (silence / final settle), commit in-range tails and quietly drop leftovers.
   */
  settle?: boolean
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
  reed: ['reed', 'read', 'reads', 'reet', 'reid', 'रीड'],
  warpReedspace: [
    'warp reedspace',
    'warp reed space',
    'warp read space',
    'warp reedspace inches',
    'reed space',
    'read space',
    'reedspace',
    'readspace',
  ],
  weftReedspace: [
    'weft reedspace',
    'weft reed space',
    'weft read space',
    'weft reedspace inches',
    'weft readspace',
  ],
  l2l: ['l2l', 'l 2 l', 'el 2 el', 'l to l', 'l two l', 'el two el', 'ell 2 ell'],
  warpCount: ['warp count', 'warp kaunt', 'warp काउंट'],
  warpRate: ['warp rate', 'warp दर'],
  sizingRate: ['sizing rate', 'sizing', 'size rate', 'साइजिंग'],
  pick: ['pick', 'ppi', 'pick ppi', 'peak', 'pic', 'p p i', 'पीपीआई', 'पिक'],
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

export function collapseRepeatedDigitTokens(tokens: string[]): string[] {
  const out: string[] = []
  for (const token of tokens) {
    const prev = out[out.length - 1]
    if (prev && isPureDigitToken(token) && token.length >= 2 && token === prev) continue
    out.push(token)
  }
  return out
}

function lastSpokenNumber(tokens: string[]): number | null {
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const n = consumeSpokenNumber(tokens.slice(i))
    if (n && i + n.length === tokens.length) return n.value
  }
  return null
}

/** Chrome Android often re-emits the last phrase as a new "final". */
export function isEchoSpeechChunk(prev: string, chunk: string): boolean {
  const a = speechStreamTokens(prev)
  const b = speechStreamTokens(chunk)
  if (!b.length) return true
  if (a.length >= b.length && a.slice(-b.length).every((t, i) => t === b[i])) return true
  const chunkNum = consumeSpokenNumber(b)
  if (!chunkNum || chunkNum.length !== b.length) return false
  const prevNum = lastSpokenNumber(a)
  return prevNum !== null && prevNum === chunkNum.value
}

export function appendSpeechChunk(prev: string, chunk: string): string {
  const a = prev.trim()
  const b = chunk.trim()
  if (!b) return a
  if (!a) return b
  if (isEchoSpeechChunk(a, b)) return a
  return `${a} ${b}`
}

/** Live transcript still growing a 1–2 digit (or tens-word) tail. */
export function isUnstableSpeechTail(transcript: string): boolean {
  const tokens = speechStreamTokens(transcript)
  if (!tokens.length) return false
  const last = tokens[tokens.length - 1]
  if (isPureDigitToken(last) && last.length <= 2) return true
  if (isTensSpeechToken(last)) return true
  const v = speechTokenValue(last)
  return v !== null && v >= 0 && v <= 9 && !isPureDigitToken(last)
}

function canGrowMoreDigits(value: number, fieldKey: string): boolean {
  if (!Number.isInteger(value) || value < 0) return false
  return value * 10 <= metricRangeFor(fieldKey).max
}

function glueNextDigits(
  currentDigits: string,
  nextDigits: string,
  fieldKey: string,
  inRange: (key: string, value: number) => boolean,
): { take: number } | null {
  const currentN = Number(currentDigits)
  const combinedN = Number(currentDigits + nextDigits)
  const { max } = metricRangeFor(fieldKey)
  const currentIn = inRange(fieldKey, currentN)
  const bothWide = currentDigits.length >= 2 && nextDigits.length >= 2

  if (combinedN <= max) {
    if (currentIn && bothWide) return null
    if (!currentIn || currentDigits.length === 1 || nextDigits.length === 1) {
      return { take: nextDigits.length }
    }
    return null
  }

  if (currentIn && bothWide) return null
  for (let k = 1; k < nextDigits.length; k += 1) {
    const part = Number(currentDigits + nextDigits.slice(0, k))
    if (part > max) break
    if (inRange(fieldKey, part)) return { take: k }
  }
  return null
}

function splitInRangePrefix(
  digits: string,
  fieldKey: string,
  inRange: (key: string, value: number) => boolean,
): { value: number; leftover: string } | null {
  for (let len = digits.length; len >= 1; len -= 1) {
    const n = Number(digits.slice(0, len))
    if (inRange(fieldKey, n)) {
      return { value: n, leftover: digits.slice(len) }
    }
  }
  return null
}

function nextLooksLikeContinuation(value: number, tokens: string[], after: number): boolean {
  if (after >= tokens.length) return false
  const next = tokens[after]
  if (isPureDigitToken(next) && next.startsWith(String(value))) return true
  const following = consumeSpokenNumber(tokens.slice(after))
  return Boolean(following && String(following.value).startsWith(String(value)))
}

type FieldNumber =
  | { kind: 'value'; value: number; length: number; leftover?: string }
  | { kind: 'pending'; length: number }
  | { kind: 'skip'; length: number; leftover?: string }

export function consumeNumberForField(
  tokens: string[],
  at: number,
  fieldKey: string,
  inRange: (key: string, value: number) => boolean,
  settle: boolean,
): FieldNumber | null {
  const head = tokens[at]
  if (head === undefined) return null

  if (isPureDigitToken(head)) {
    let digits = head
    let length = 1
    let leftover: string | undefined

    const overMax = Number(digits) > metricRangeFor(fieldKey).max
    if (overMax) {
      const split = splitInRangePrefix(digits, fieldKey, inRange)
      // 12067 → 120 + 67. Do not carve 355 into 35 + 5 for the current field.
      if (split && split.leftover.length >= 2) {
        digits = String(split.value)
        leftover = split.leftover
      }
    }

    while (!leftover && at + length < tokens.length && isPureDigitToken(tokens[at + length])) {
      const next = tokens[at + length]
      const glue = glueNextDigits(digits, next, fieldKey, inRange)
      if (!glue) break
      digits += next.slice(0, glue.take)
      if (glue.take < next.length) leftover = next.slice(glue.take)
      length += 1
    }

    const value = Number(digits)
    if (!Number.isFinite(value)) return null
    const atEnd = at + length >= tokens.length && !leftover
    const inNow = inRange(fieldKey, value)

    if (inNow) {
      if (!settle && atEnd && canGrowMoreDigits(value, fieldKey) && String(Math.trunc(value)).length <= 2) {
        return { kind: 'pending', length }
      }
      return leftover ? { kind: 'value', value, length, leftover } : { kind: 'value', value, length }
    }

    if (value < metricRangeFor(fieldKey).min) {
      if (!settle && atEnd) return { kind: 'pending', length }
      if (nextLooksLikeContinuation(value, tokens, at + length)) {
        return leftover ? { kind: 'skip', length, leftover } : { kind: 'skip', length }
      }
      if (atEnd) return leftover ? { kind: 'skip', length, leftover } : { kind: 'skip', length }
    }

    return leftover ? { kind: 'value', value, length, leftover } : { kind: 'value', value, length }
  }

  const spoken = consumeSpokenNumber(tokens.slice(at))
  if (!spoken) return null
  const atEnd = at + spoken.length >= tokens.length
  const lastTok = tokens[at + spoken.length - 1]
  if (!settle && atEnd && spoken.length === 1 && isTensSpeechToken(lastTok ?? '')) {
    return { kind: 'pending', length: spoken.length }
  }
  if (!settle && atEnd && !inRange(fieldKey, spoken.value) && spoken.value < metricRangeFor(fieldKey).min) {
    return { kind: 'pending', length: spoken.length }
  }
  if (
    !inRange(fieldKey, spoken.value) &&
    spoken.value < metricRangeFor(fieldKey).min &&
    nextLooksLikeContinuation(spoken.value, tokens, at + spoken.length)
  ) {
    return { kind: 'skip', length: spoken.length }
  }
  if (!inRange(fieldKey, spoken.value) && spoken.value < metricRangeFor(fieldKey).min && atEnd) {
    return { kind: 'skip', length: spoken.length }
  }
  return { kind: 'value', value: spoken.value, length: spoken.length }
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

function applyLeftover(tokens: string[], at: number, length: number, leftover?: string): number {
  if (leftover) tokens.splice(at + length, 0, leftover)
  return skipTrailingUnit(tokens, at + length)
}

function lastFillValue(fills: SpeechFill[]): number | null {
  return fills.length ? fills[fills.length - 1].value : null
}

export function parseSpeechStream(
  transcript: string,
  fields: SpeechField[],
  options: SpeechStreamOptions = {},
): SpeechStreamResult {
  const inRange = options.inRange ?? isInStandardRange
  const settle = options.settle ?? true
  const startIndex = Math.max(0, options.startIndex ?? 0)
  const tokens = collapseRepeatedDigitTokens(speechStreamTokens(transcript))
  const aliases = buildFieldAliases(fields)
  const fills: SpeechFill[] = []
  const ignored: SpeechIgnore[] = []
  const assigned = new Set<string>()
  let seqFrom = startIndex
  let i = 0
  let pending = false

  const pushNamed = (field: SpeechField, value: number) => {
    assigned.add(field.key)
    const existing = fills.findIndex((f) => f.key === field.key)
    const row: SpeechFill = { key: field.key, label: field.label, value, source: 'named' }
    if (existing === -1) fills.push(row)
    else fills[existing] = row
  }

  const takeNumber = (at: number, fieldKey: string): FieldNumber | null => {
    return consumeNumberForField(tokens, at, fieldKey, inRange, settle)
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
      const field = fields.find((f) => f.key === named.key)
      if (!field) {
        i = afterName
        continue
      }
      const num = takeNumber(afterName, field.key)
      if (num?.kind === 'pending') {
        pending = true
        break
      }
      if (num?.kind === 'skip') {
        i = applyLeftover(tokens, afterName, num.length, num.leftover)
        continue
      }
      if (num?.kind === 'value' && !isUnclearNeighbour(tokens, afterName, num.length)) {
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
        i = applyLeftover(tokens, afterName, num.length, num.leftover)
        continue
      }
      i = afterName
      continue
    }

    const seqField = nextSequentialField(fields, assigned, seqFrom)
    const peek = consumeSpokenNumber(tokens.slice(i))
    if (peek) {
      if (isUnclearNeighbour(tokens, i, peek.length)) {
        ignored.push({ text: String(peek.value), reason: 'unclear' })
        i = skipTrailingUnit(tokens, i + peek.length)
        continue
      }
      const afterPeek = i + peek.length
      const trailingName = aliasMatchAt(tokens, skipTrailingUnit(tokens, afterPeek), aliases)
      if (trailingName) {
        const field = fields.find((f) => f.key === trailingName.key)
        if (field) {
          const num = takeNumber(i, field.key)
          if (num?.kind === 'pending') {
            pending = true
            break
          }
          if (num?.kind === 'skip') {
            i = applyLeftover(tokens, i, num.length, num.leftover)
            continue
          }
          if (num?.kind === 'value') {
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
            i = skipTrailingUnit(tokens, applyLeftover(tokens, i, num.length, num.leftover))
            i += trailingName.tokens.length
            continue
          }
        }
      }

      if (!seqField) {
        ignored.push({ text: String(peek.value), reason: 'unclear' })
        i = skipTrailingUnit(tokens, afterPeek)
        continue
      }

      const num = takeNumber(i, seqField.key)
      if (num?.kind === 'pending') {
        pending = true
        break
      }
      if (num?.kind === 'skip') {
        i = applyLeftover(tokens, i, num.length, num.leftover)
        continue
      }
      if (num?.kind !== 'value') {
        i += 1
        continue
      }
      if (!inRange(seqField.key, num.value)) {
        ignored.push({
          text: String(num.value),
          reason: 'out-of-range',
          fieldKey: seqField.key,
          fieldLabel: seqField.label,
        })
        i = applyLeftover(tokens, i, num.length, num.leftover)
        continue
      }
      if (lastFillValue(fills) === num.value) {
        i = applyLeftover(tokens, i, num.length, num.leftover)
        continue
      }
      assigned.add(seqField.key)
      fills.push({ key: seqField.key, label: seqField.label, value: num.value, source: 'sequential' })
      const fieldIdx = fields.findIndex((f) => f.key === seqField.key)
      seqFrom = fieldIdx + 1
      i = applyLeftover(tokens, i, num.length, num.leftover)
      continue
    }

    i += 1
  }

  return { fills, ignored, pending }
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
