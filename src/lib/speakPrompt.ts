/**
 * Speak-mode field prompts.
 * ElevenLabs when VITE_ELEVENLABS_API_KEY is set; otherwise speechSynthesis.
 * Fish Audio is skipped — paid lock-in without a clear mill-floor win.
 */

export const DEFAULT_ELEVENLABS_VOICE = 'JBFqnCBsd6RMkjVDRZzb'
export const ELEVENLABS_MODEL = 'eleven_turbo_v2_5'

export type SpeakEnv = {
  apiKey?: string
  voiceId?: string
}

let currentAudio: HTMLAudioElement | null = null
const audioCache = new Map<string, string>()

export function elevenLabsApiKey(env: SpeakEnv = viteSpeakEnv()): string {
  return (env.apiKey ?? '').trim()
}

export function elevenLabsConfigured(env: SpeakEnv = viteSpeakEnv()): boolean {
  return elevenLabsApiKey(env).length > 0
}

export function ttsEngine(env: SpeakEnv = viteSpeakEnv()): 'elevenlabs' | 'speechSynthesis' {
  return elevenLabsConfigured(env) ? 'elevenlabs' : 'speechSynthesis'
}

export function viteSpeakEnv(): SpeakEnv {
  return {
    apiKey: typeof import.meta !== 'undefined' ? import.meta.env.VITE_ELEVENLABS_API_KEY : '',
    voiceId: typeof import.meta !== 'undefined' ? import.meta.env.VITE_ELEVENLABS_VOICE_ID : '',
  }
}

export function elevenLabsUrl(voiceId = DEFAULT_ELEVENLABS_VOICE): string {
  return `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
}

export function buildElevenLabsRequest(
  text: string,
  env: SpeakEnv = viteSpeakEnv(),
): { url: string; headers: Record<string, string>; body: string } {
  const voiceId = (env.voiceId || '').trim() || DEFAULT_ELEVENLABS_VOICE
  return {
    url: elevenLabsUrl(voiceId),
    headers: {
      'xi-api-key': elevenLabsApiKey(env),
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: { stability: 0.45, similarity_boost: 0.75 },
    }),
  }
}

export function cancelSpeak(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (typeof globalThis.speechSynthesis !== 'undefined') {
    globalThis.speechSynthesis.cancel()
  }
}

function speakBrowser(text: string): void {
  if (typeof globalThis.speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
    return
  }
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-IN'
  utter.rate = 1
  globalThis.speechSynthesis.speak(utter)
}

async function speakElevenLabs(text: string, env: SpeakEnv, fetchImpl: typeof fetch): Promise<void> {
  const cached = audioCache.get(text)
  if (cached && typeof Audio !== 'undefined') {
    const audio = new Audio(cached)
    currentAudio = audio
    await audio.play()
    return
  }
  const req = buildElevenLabsRequest(text, env)
  const res = await fetchImpl(req.url, { method: 'POST', headers: req.headers, body: req.body })
  if (!res.ok) throw new Error(`elevenlabs ${res.status}`)
  const blob = await res.blob()
  if (typeof URL === 'undefined' || typeof Audio === 'undefined') return
  const url = URL.createObjectURL(blob)
  audioCache.set(text, url)
  const audio = new Audio(url)
  currentAudio = audio
  await audio.play()
}

export async function speakPrompt(
  text: string,
  env: SpeakEnv = viteSpeakEnv(),
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return
  cancelSpeak()
  if (elevenLabsConfigured(env)) {
    try {
      await speakElevenLabs(trimmed, env, fetchImpl)
      return
    } catch {
      /* paid key missing/quota — browser voice still works */
    }
  }
  speakBrowser(trimmed)
}
