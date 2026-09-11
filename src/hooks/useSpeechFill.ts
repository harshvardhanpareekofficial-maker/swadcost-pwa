import { useCallback, useEffect, useRef, useState } from 'react'

const SMALL: Record<string, number> = {
  zero: 0,
  oh: 0,
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

function tokenValue(token: string): number | null {
  if (/^-?\d+(?:\.\d+)?$/.test(token)) {
    const n = Number(token)
    return Number.isFinite(n) ? n : null
  }
  return SMALL[token] ?? null
}

/** Parse a short mill number such as "65", "sixty five", or "eighty". */
export function parseSpokenTokens(stripped: string): number | null {
  const parts = stripped.split(' ').filter((p) => p && p !== 'and')
  if (parts.length === 0 || parts.length > 2) return null
  if (parts.length === 1) return tokenValue(parts[0])
  const a = tokenValue(parts[0])
  const b = tokenValue(parts[1])
  if (a === null || b === null) return null
  if (a >= 20 && a % 10 === 0 && b > 0 && b < 10) return a + b
  return null
}

/**
 * Accept a spoken number only when the utterance is essentially numeric.
 * Avoids filling a field from a long misheard sentence.
 */
export function extractSpokenNumber(transcript: string): number | null {
  const cleaned = transcript.replace(/,/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!cleaned) return null
  const stripped = cleaned
    .replace(/\b(percent|percentage|inch|inches|picks?|reed|rupees?|rs|point)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!stripped) return null
  return parseSpokenTokens(stripped)
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
  start: () => void
  stop: () => void
} {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)
  const wantListenRef = useRef(false)
  const onNumberRef = useRef(onNumber)
  onNumberRef.current = onNumber

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(Boolean(SR) && enabled)
  }, [enabled])

  const stop = useCallback(() => {
    wantListenRef.current = false
    recRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    if (!enabled) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition is not supported in this browser. Use Type, or try Chrome.')
      return
    }
    wantListenRef.current = false
    recRef.current?.abort()
    recRef.current = null
    setError(null)
    wantListenRef.current = true
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-IN'
    rec.maxAlternatives = 1
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (!ev.results[i].isFinal) continue
        const t = ev.results[i][0]?.transcript ?? ''
        const n = extractSpokenNumber(t)
        if (n !== null) onNumberRef.current(n)
      }
    }
    rec.onerror = (ev) => {
      if (ev.error === 'aborted' || ev.error === 'no-speech') return
      wantListenRef.current = false
      setError(speechErrorMessage(ev.error))
      setListening(false)
    }
    rec.onend = () => {
      if (wantListenRef.current && enabled) {
        try {
          rec.start()
          setListening(true)
          return
        } catch {
          wantListenRef.current = false
        }
      }
      setListening(false)
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      wantListenRef.current = false
      setError('Could not start the microphone. Check permission and try again.')
      setListening(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      wantListenRef.current = false
      recRef.current?.abort()
      setListening(false)
    }
  }, [enabled])

  useEffect(
    () => () => {
      wantListenRef.current = false
      recRef.current?.abort()
    },
    [],
  )

  return { listening, supported, error, start, stop }
}
