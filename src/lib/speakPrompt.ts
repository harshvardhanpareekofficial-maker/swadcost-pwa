/**
 * Speak-mode field prompts.
 * Default high-quality path: browser speechSynthesis (no API key).
 * ElevenLabs only when VITE_ELEVENLABS_API_KEY is set.
 * Fish Audio is skipped — paid lock-in without a clear mill-floor win.
 */

import { preferredSpeechLang } from './speechNumbers'
import { safeGet, safeRemove, safeSet } from './storage'

export const DEFAULT_ELEVENLABS_VOICE = 'JBFqnCBsd6RMkjVDRZzb'
export const ELEVENLABS_MODEL = 'eleven_turbo_v2_5'

/** Preferred locales for mill-floor English / Hindi prompts. */
export const PREFERRED_TTS_LANGS = ['en-IN', 'hi-IN', 'en-GB', 'en-US'] as const

/**
 * Slightly slower, fuller prompts so reed / pick / count land clearly
 * on a noisy mill floor without dragging auto-advance.
 */
export const BROWSER_TTS = {
  rate: 0.92,
  pitch: 0.96,
  volume: 1,
} as const

export const TTS_VOICE_STORAGE_KEY = 'fabriccost.ttsVoice'

export type SpeakEnv = {
  apiKey?: string
  voiceId?: string
}

export type VoiceLike = {
  name: string
  lang: string
  voiceURI?: string
  default?: boolean
  localService?: boolean
}

type CachedVoice = {
  name: string
  lang: string
  voiceURI: string
  preferredLang: string
}

let currentAudio: HTMLAudioElement | null = null
const audioCache = new Map<string, string>()
let memoryVoice: CachedVoice | null = null
let voicesListenerBound = false

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

export function resetBrowserVoiceCache(): void {
  memoryVoice = null
  try {
    safeRemove(globalThis.localStorage, TTS_VOICE_STORAGE_KEY)
  } catch {
    /* node / private mode */
  }
}

function normalizeLang(lang: string): string {
  const n = lang.toLowerCase().replace(/_/g, '-')
  const [primary, region] = n.split('-')
  if (primary === 'hi') return 'hi-in'
  if (primary && region) return `${primary}-${region}`
  return n
}

function preferredLangOrder(preferredLang: string): string[] {
  const first = normalizeLang(preferredLang)
  const rest = PREFERRED_TTS_LANGS.map((l) => normalizeLang(l)).filter((l) => l !== first)
  if (first === 'hi-in' || first.startsWith('hi')) {
    return ['hi-in', ...rest.filter((l) => l !== 'hi-in')]
  }
  if (first === 'en-in') return ['en-in', ...rest]
  return [first, ...rest]
}

const NOVELTY =
  /\b(fred|whisper|zarvox|albert|bells|boing|bubbles|cellos|deranged|jester|junior|kathy|trinoids|wobble|bad news|good news|pipe organ)\b/i

export function scoreBrowserVoice(voice: VoiceLike, preferredLang = 'en-IN'): number {
  const lang = normalizeLang(voice.lang)
  const name = voice.name
  const order = preferredLangOrder(preferredLang)
  const langIdx = order.findIndex((l) => lang === l)
  let score = 0
  if (langIdx !== -1) score += (order.length - langIdx) * 100
  else if (lang.startsWith('en') || lang.startsWith('hi')) score += 20

  const n = name.toLowerCase()
  if (n.includes('google')) score += 90
  else if (n.includes('microsoft')) score += 82
  else if (n.includes('apple')) score += 78
  else if (/\b(rishi|veena|lekha|samantha|daniel|karen|moira|serena)\b/i.test(name)) score += 74
  else if (n.includes('samsung')) score += 42
  else score += 16

  if (n.includes('natural') || n.includes('neural') || n.includes('enhanced') || n.includes('premium')) {
    score += 16
  }
  if (n.includes('espeak') || n.includes('compact')) score -= 40
  if (NOVELTY.test(name)) score -= 80
  if (voice.localService) score += 6
  if (voice.default) score += 3
  return score
}

/** Pure pick — no cache. Returns null when the list is empty. */
export function selectBrowserVoice(
  voices: VoiceLike[],
  preferredLang = 'en-IN',
): VoiceLike | null {
  if (!voices.length) return null
  let best = voices[0]
  let bestScore = scoreBrowserVoice(best, preferredLang)
  for (let i = 1; i < voices.length; i++) {
    const next = voices[i]
    const score = scoreBrowserVoice(next, preferredLang)
    if (score > bestScore) {
      best = next
      bestScore = score
    }
  }
  return best
}

function readStoredVoice(preferredLang: string): CachedVoice | null {
  try {
    const raw = safeGet(globalThis.localStorage, TTS_VOICE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedVoice
    if (!parsed?.name || parsed.preferredLang !== preferredLang) return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredVoice(voice: VoiceLike, preferredLang: string): CachedVoice {
  const cached: CachedVoice = {
    name: voice.name,
    lang: voice.lang,
    voiceURI: voice.voiceURI || voice.name,
    preferredLang,
  }
  memoryVoice = cached
  try {
    safeSet(globalThis.localStorage, TTS_VOICE_STORAGE_KEY, JSON.stringify(cached))
  } catch {
    /* ignore */
  }
  return cached
}

function matchCached(voices: VoiceLike[], cached: CachedVoice | null): VoiceLike | null {
  if (!cached) return null
  return (
    voices.find((v) => cached.voiceURI && v.voiceURI === cached.voiceURI) ??
    voices.find((v) => v.name === cached.name && normalizeLang(v.lang) === normalizeLang(cached.lang)) ??
    null
  )
}

/** Cached pick. Reuses a still-available voice; otherwise scores again. */
export function resolveBrowserVoice(
  voices: VoiceLike[],
  preferredLang = preferredSpeechLang(),
): VoiceLike | null {
  if (!voices.length) return null
  const cached =
    memoryVoice?.preferredLang === preferredLang ? memoryVoice : readStoredVoice(preferredLang)
  const hit = matchCached(voices, cached)
  if (hit) {
    if (!memoryVoice || memoryVoice.preferredLang !== preferredLang) writeStoredVoice(hit, preferredLang)
    return hit
  }
  const picked = selectBrowserVoice(voices, preferredLang)
  if (picked) writeStoredVoice(picked, preferredLang)
  return picked
}

function currentVoices(): SpeechSynthesisVoice[] {
  if (typeof globalThis.speechSynthesis === 'undefined') return []
  try {
    return globalThis.speechSynthesis.getVoices() ?? []
  } catch {
    return []
  }
}

export function applyBrowserVoice(
  utter: { lang: string; rate: number; pitch: number; volume: number; voice: SpeechSynthesisVoice | null },
  voices: VoiceLike[] = currentVoices(),
  preferredLang = preferredSpeechLang(),
): VoiceLike | null {
  utter.rate = BROWSER_TTS.rate
  utter.pitch = BROWSER_TTS.pitch
  utter.volume = BROWSER_TTS.volume
  const picked = resolveBrowserVoice(voices, preferredLang)
  if (picked && 'voiceURI' in picked) {
    utter.voice = picked as SpeechSynthesisVoice
    utter.lang = picked.lang
    return picked
  }
  if (picked) {
    utter.lang = picked.lang
    return picked
  }
  utter.lang = preferredLang
  return null
}

function warmBrowserVoices(): void {
  if (voicesListenerBound || typeof globalThis.speechSynthesis === 'undefined') return
  voicesListenerBound = true
  const synth = globalThis.speechSynthesis
  const warm = () => {
    const voices = currentVoices()
    if (voices.length) resolveBrowserVoice(voices)
  }
  warm()
  try {
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', warm)
    } else {
      synth.onvoiceschanged = warm
    }
  } catch {
    /* ignore */
  }
}

function speakBrowser(text: string): void {
  if (typeof globalThis.speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
    return
  }
  warmBrowserVoices()
  const utter = new SpeechSynthesisUtterance(text)
  applyBrowserVoice(utter)
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

warmBrowserVoices()
