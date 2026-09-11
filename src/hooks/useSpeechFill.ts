import { useCallback, useEffect, useRef, useState } from 'react'
import { extractSpokenNumberFromAlternatives, preferredSpeechLang } from '../lib/speechNumbers'

export { extractSpokenNumber, parseSpokenTokens, preferredSpeechLang } from '../lib/speechNumbers'

const RESTART_MS = 180

function speechEngine(): (new () => SpeechRecognition) | null {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
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
      return 'This browser does not support Hindi/English mill speech. Try Chrome on Android or desktop (HTTPS).'
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
      setError('Speech recognition needs Chrome on Android or desktop (HTTPS). Use Type if the mic is missing.')
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
    rec.lang = preferredSpeechLang()
    rec.maxAlternatives = 5
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (!ev.results[i].isFinal) continue
        const result = ev.results[i]
        const transcripts: string[] = []
        for (let a = 0; a < result.length; a++) {
          const piece = result[a]?.transcript ?? ''
          if (piece) transcripts.push(piece)
        }
        const top = result[0]
        const t = top?.transcript ?? transcripts[0] ?? ''
        const confidence = top?.confidence ?? 0
        // Chrome often reports 0; only skip a genuinely low non-zero score.
        if (confidence > 0 && confidence < 0.28) {
          setLastHeard(t.trim())
          setIgnored(true)
          continue
        }
        const n = extractSpokenNumberFromAlternatives(transcripts)
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
