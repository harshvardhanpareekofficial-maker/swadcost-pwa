import { useCallback, useEffect, useRef, useState } from 'react'

const SMALL: Record<string, number> = {
  zero: 0,
  oh: 0,
  nought: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}

const UNIT_RE = /\b(percent|percentage|inch|inches|picks?|reed|rupees?|rs|dents?)\b/g
const RESTART_MS = 180

function speechEngine(): (new () => SpeechRecognition) | null {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function tokenValue(token: string): number | null {
  if (/^\d+(?:\.\d+)?$/.test(token)) {
    const n = Number(token)
    return Number.isFinite(n) ? n : null
  }
  return SMALL[token] ?? null
}

/** 0–99 from one or two mill-English tokens. */
function parseSmall(tokens: string[]): number | null {
  if (tokens.length === 0 || tokens.length > 2) return null
  if (tokens.length === 1) {
    const v = tokenValue(tokens[0])
    if (v === null || v < 0 || v > 99) return null
    return v
  }
  const a = tokenValue(tokens[0])
  const b = tokenValue(tokens[1])
  if (a === null || b === null) return null
  if (a >= 20 && a % 10 === 0 && b > 0 && b < 10) return a + b
  return null
}

function parseIntWords(tokens: string[]): number | null {
  if (tokens.length === 0 || tokens.length > 4) return null
  if (tokens.length === 1) {
    const v = tokenValue(tokens[0])
    if (v === null || v < 0) return null
    return v
  }

  const hundredAt = tokens.indexOf('hundred')
  if (hundredAt !== -1) {
    const left = tokens.slice(0, hundredAt)
    const right = tokens.slice(hundredAt + 1)
    const hundreds = left.length === 0 ? 1 : parseSmall(left)
    if (hundreds === null || hundreds < 1 || hundreds > 9) return null
    const rest = right.length === 0 ? 0 : parseSmall(right)
    if (rest === null) return null
    return hundreds * 100 + rest
  }

  // “one oh two” / “one zero two” → 102 (common for L2L)
  if (tokens.length === 3) {
    const a = tokenValue(tokens[0])
    const b = tokenValue(tokens[1])
    const c = tokenValue(tokens[2])
    const middleOh = tokens[1] === 'oh' || tokens[1] === 'zero'
    if (
      a !== null &&
      b !== null &&
      c !== null &&
      middleOh &&
      a >= 1 &&
      a <= 9 &&
      c >= 0 &&
      c <= 9
    ) {
      return a * 100 + b * 10 + c
    }
  }

  return parseSmall(tokens)
}

function parseFracTokens(tokens: string[]): number | null {
  if (tokens.length === 0 || tokens.length > 3) return null
  let digits = ''
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      digits += t
      continue
    }
    const v = SMALL[t]
    if (v === undefined || v > 9) return null
    digits += String(v)
  }
  if (!digits) return null
  const frac = Number(`0.${digits}`)
  return Number.isFinite(frac) ? frac : null
}

function parseNumberPhrase(stripped: string): number | null {
  const tokens = stripped.split(' ').filter((t) => t && t !== 'and' && t !== 'a')
  if (tokens.length === 0) return null

  const pointAt = tokens.indexOf('point')
  if (pointAt !== -1) {
    const left = tokens.slice(0, pointAt)
    const right = tokens.slice(pointAt + 1)
    const intPart = left.length === 0 ? 0 : parseIntWords(left)
    const frac = parseFracTokens(right)
    if (intPart === null || frac === null) return null
    return intPart + frac
  }

  return parseIntWords(tokens)
}

export function parseSpokenTokens(stripped: string): number | null {
  return parseNumberPhrase(stripped)
}

/**
 * Accept a spoken mill number only when the utterance is essentially numeric.
 * Does not pull a digit out of a long misheard sentence.
 */
export function extractSpokenNumber(transcript: string): number | null {
  const cleaned = transcript
    .replace(/,/g, ' ')
    .replace(/([a-z])-([a-z])/gi, '$1 $2')
    .replace(/[^\w.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  if (!cleaned) return null
  const stripped = cleaned
    .replace(UNIT_RE, ' ')
    .replace(/(\d)\.(?=\s|$)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  if (!stripped) return null
  const n = parseNumberPhrase(stripped)
  if (n === null || !Number.isFinite(n) || n < 0 || n > 1_000_000) return null
  return n
}

function speechErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
      return 'Microphone permission is blocked. Allow the mic in the browser, then tap Start mic again.'
    case 'service-not-allowed':
      return 'Speech recognition is not allowed in this browser or context (try HTTPS).'
    case 'audio-capture':
      return 'No microphone was found. Connect a mic and try again.'
    case 'network':
      return 'Speech service needs a network connection. Check the connection and try again.'
    case 'language-not-supported':
      return 'This browser does not support Indian English speech. Try Chrome on Android or desktop.'
    default:
      return `Microphone error: ${code}`
  }
}

export function useSpeechFill(
  enabled: boolean,
  onNumber: (n: number) => void,
): {
  listening: boolean
  supported: boolean
  error: string | null
  lastHeard: string | null
  ignored: boolean
  start: () => void
  stop: () => void
} {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(false)
  const [lastHeard, setLastHeard] = useState<string | null>(null)
  const [ignored, setIgnored] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)
  const wantListenRef = useRef(false)
  const enabledRef = useRef(enabled)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onNumberRef = useRef(onNumber)
  enabledRef.current = enabled
  onNumberRef.current = onNumber

  useEffect(() => {
    setSupported(Boolean(speechEngine()))
  }, [])

  const clearRestart = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
  }

  const halt = useCallback(() => {
    wantListenRef.current = false
    clearRestart()
    const rec = recRef.current
    recRef.current = null
    rec?.abort()
    setListening(false)
  }, [])

  const stop = useCallback(() => {
    halt()
  }, [halt])

  const start = useCallback(() => {
    if (!enabledRef.current) return
    const SR = speechEngine()
    if (!SR) {
      setError('Speech recognition is not supported in this browser. Use Type, or try Chrome.')
      return
    }
    halt()
    setError(null)
    setLastHeard(null)
    setIgnored(false)
    wantListenRef.current = true
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-IN'
    rec.maxAlternatives = 1
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (!ev.results[i].isFinal) continue
        const alt = ev.results[i][0]
        const t = alt?.transcript ?? ''
        const confidence = alt?.confidence ?? 0
        // Chrome often reports 0; only skip a genuinely low non-zero score.
        if (confidence > 0 && confidence < 0.35) {
          setLastHeard(t.trim())
          setIgnored(true)
          continue
        }
        const n = extractSpokenNumber(t)
        setLastHeard(t.trim() || null)
        if (n === null) {
          setIgnored(true)
          continue
        }
        setIgnored(false)
        onNumberRef.current(n)
      }
    }
    rec.onerror = (ev) => {
      if (ev.error === 'aborted' || ev.error === 'no-speech') return
      wantListenRef.current = false
      clearRestart()
      setError(speechErrorMessage(ev.error))
      setListening(false)
    }
    rec.onend = () => {
      if (recRef.current !== rec) return
      if (!wantListenRef.current || !enabledRef.current) {
        setListening(false)
        return
      }
      // Chrome drops continuous sessions; restart after a beat so start() is legal.
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null
        if (!wantListenRef.current || !enabledRef.current) return
        try {
          rec.start()
          setListening(true)
        } catch {
          wantListenRef.current = false
          setListening(false)
        }
      }, RESTART_MS)
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch (err) {
      wantListenRef.current = false
      const name = err instanceof DOMException ? err.name : ''
      setError(
        name === 'NotAllowedError'
          ? speechErrorMessage('not-allowed')
          : 'Could not start the microphone. Check permission and try again.',
      )
      setListening(false)
    }
  }, [halt])

  useEffect(() => {
    if (!enabled) halt()
  }, [enabled, halt])

  useEffect(
    () => () => {
      halt()
    },
    [halt],
  )

  return { listening, supported, error, lastHeard, ignored, start, stop }
}
