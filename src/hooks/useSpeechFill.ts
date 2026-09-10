import { useCallback, useEffect, useRef, useState } from 'react'

function extractNumber(transcript: string): number | null {
  const cleaned = transcript.replace(/,/g, '').toLowerCase()
  const match = cleaned.match(/-?\d+(?:\.\d+)?/)
  if (match) return Number(match[0])
  return null
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
  const onNumberRef = useRef(onNumber)
  onNumberRef.current = onNumber

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(Boolean(SR) && enabled)
  }, [enabled])

  const stop = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    if (!enabled) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition not supported in this browser')
      return
    }
    setError(null)
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-IN'
    rec.maxAlternatives = 1
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0]?.transcript ?? ''
        const n = extractNumber(t)
        if (n !== null && Number.isFinite(n)) {
          onNumberRef.current(n)
        }
      }
    }
    rec.onerror = (ev) => {
      if (ev.error !== 'aborted' && ev.error !== 'no-speech') {
        setError(ev.error)
      }
      setListening(false)
    }
    rec.onend = () => setListening(false)
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setError('Could not start microphone')
      setListening(false)
    }
  }, [enabled])

  useEffect(() => () => recRef.current?.abort(), [])

  return { listening, supported, error, start, stop }
}
