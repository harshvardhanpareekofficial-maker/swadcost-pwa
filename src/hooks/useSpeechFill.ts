import { useCallback, useEffect, useRef, useState } from 'react'
import { appendSpeechChunk, isUnstableSpeechTail, pickBestSpeechChunk } from '../lib/speechStream'
import { preferredSpeechLang } from '../lib/speechNumbers'

export { extractSpokenNumber, parseSpokenTokens, preferredSpeechLang } from '../lib/speechNumbers'

const RESTART_MS = 180
const STABILIZE_MS = 480

export type SpeechFillEvent = {
  fullTranscript: string
  chunk: string
  alternatives: string[]
  /** False while a short/low tail may still grow (12 → 120). */
  settled: boolean
}

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

function alternativesFrom(result: SpeechRecognitionResult): string[] {
  const transcripts: string[] = []
  for (let a = 0; a < result.length; a += 1) {
    const piece = result[a]?.transcript ?? ''
    if (piece) transcripts.push(piece)
  }
  return transcripts
}

export function useSpeechFill(
  enabled: boolean,
  onFinal: (ev: SpeechFillEvent) => void,
): {
  listening: boolean
  supported: boolean
  error: string | null
  transcript: string
  interim: string
  lastHeard: string | null
  ignored: boolean
  start: () => void
  stop: () => void
} {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [lastHeard, setLastHeard] = useState<string | null>(null)
  const [ignored, setIgnored] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)
  const wantListenRef = useRef(false)
  const enabledRef = useRef(enabled)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stabilizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onFinalRef = useRef(onFinal)
  const finalRef = useRef('')
  const lastChunkRef = useRef('')
  const lastAltsRef = useRef<string[]>([])
  enabledRef.current = enabled
  onFinalRef.current = onFinal

  useEffect(() => {
    setSupported(Boolean(speechEngine()))
  }, [])

  const clearRestart = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
  }

  const clearStabilize = () => {
    if (stabilizeTimerRef.current) {
      clearTimeout(stabilizeTimerRef.current)
      stabilizeTimerRef.current = null
    }
  }

  const emitFinal = (settled: boolean) => {
    const full = finalRef.current
    if (!full.trim()) return
    onFinalRef.current({
      fullTranscript: full,
      chunk: lastChunkRef.current,
      alternatives: lastAltsRef.current,
      settled,
    })
  }

  const halt = useCallback(() => {
    wantListenRef.current = false
    clearRestart()
    clearStabilize()
    const rec = recRef.current
    recRef.current = null
    rec?.abort()
    setListening(false)
    setInterim('')
  }, [])

  const stop = useCallback(() => {
    clearStabilize()
    emitFinal(true)
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
    finalRef.current = ''
    lastChunkRef.current = ''
    lastAltsRef.current = []
    setTranscript('')
    setInterim('')
    wantListenRef.current = true
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = preferredSpeechLang()
    rec.maxAlternatives = 5
    rec.onresult = (ev) => {
      let liveInterim = ''
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const result = ev.results[i]
        const alts = alternativesFrom(result)
        const top = result[0]
        const raw = top?.transcript ?? alts[0] ?? ''
        if (!result.isFinal) {
          liveInterim += raw
          continue
        }
        const confidence = top?.confidence ?? 0
        // Chrome often reports 0; only skip a genuinely low non-zero score.
        if (confidence > 0 && confidence < 0.28) {
          setLastHeard(raw.trim())
          setIgnored(true)
          continue
        }
        const chunk = pickBestSpeechChunk(alts.length ? alts : [raw]).trim()
        if (!chunk) continue
        const prev = finalRef.current
        const full = appendSpeechChunk(prev, chunk)
        if (full === prev && prev) {
          // Android Chrome often repeats the last final; keep the live transcript, do not refill.
          setTranscript(full)
          continue
        }
        finalRef.current = full
        lastChunkRef.current = chunk
        lastAltsRef.current = alts
        setTranscript(full)
        setLastHeard(chunk)
        setIgnored(false)
        const unstable = isUnstableSpeechTail(full)
        emitFinal(!unstable)
        clearStabilize()
        if (unstable) {
          stabilizeTimerRef.current = setTimeout(() => {
            stabilizeTimerRef.current = null
            emitFinal(true)
          }, STABILIZE_MS)
        }
      }
      setInterim(liveInterim.trim())
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

  return { listening, supported, error, transcript, interim, lastHeard, ignored, start, stop }
}
