import { afterEach, describe, expect, it } from 'vitest'
import {
  BROWSER_TTS,
  DEFAULT_ELEVENLABS_VOICE,
  PREFERRED_TTS_LANGS,
  applyBrowserVoice,
  buildElevenLabsRequest,
  elevenLabsConfigured,
  resetBrowserVoiceCache,
  resolveBrowserVoice,
  scoreBrowserVoice,
  selectBrowserVoice,
  ttsEngine,
  type VoiceLike,
} from './speakPrompt'

function voice(partial: VoiceLike): VoiceLike {
  return {
    default: false,
    localService: false,
    voiceURI: partial.voiceURI ?? partial.name,
    ...partial,
  }
}

describe('speakPrompt engine', () => {
  it('uses ElevenLabs only when a key is set', () => {
    expect(elevenLabsConfigured({ apiKey: '' })).toBe(false)
    expect(ttsEngine({ apiKey: '' })).toBe('speechSynthesis')
    expect(ttsEngine({ apiKey: '  sk-test  ' })).toBe('elevenlabs')
  })

  it('builds an ElevenLabs TTS request without Fish Audio', () => {
    const req = buildElevenLabsRequest('Reed. Dents per inch.', {
      apiKey: 'sk-test',
      voiceId: '',
    })
    expect(req.url).toContain(DEFAULT_ELEVENLABS_VOICE)
    expect(req.url).toContain('api.elevenlabs.io')
    expect(req.url.toLowerCase()).not.toContain('fish')
    expect(req.headers['xi-api-key']).toBe('sk-test')
    expect(req.body).toContain('Reed. Dents per inch.')
  })
})

describe('free browser TTS voice pick', () => {
  afterEach(() => {
    resetBrowserVoiceCache()
  })

  it('lists Indian and English locales first', () => {
    expect(PREFERRED_TTS_LANGS).toEqual(['en-IN', 'hi-IN', 'en-GB', 'en-US'])
  })

  it('tunes rate, pitch and volume for mill-field prompts', () => {
    expect(BROWSER_TTS.rate).toBeGreaterThanOrEqual(0.85)
    expect(BROWSER_TTS.rate).toBeLessThan(1)
    expect(BROWSER_TTS.pitch).toBeGreaterThanOrEqual(0.9)
    expect(BROWSER_TTS.pitch).toBeLessThanOrEqual(1)
    expect(BROWSER_TTS.volume).toBe(1)
  })

  it('prefers Google en-IN over Microsoft en-US and novelty voices', () => {
    const picked = selectBrowserVoice([
      voice({ name: 'Fred', lang: 'en-US', localService: true }),
      voice({ name: 'Microsoft David', lang: 'en-US' }),
      voice({ name: 'Google UK English Female', lang: 'en-GB' }),
      voice({ name: 'Google English India', lang: 'en-IN' }),
    ])
    expect(picked?.name).toBe('Google English India')
  })

  it('prefers Google Hindi when the UI language is Hindi', () => {
    const voices = [
      voice({ name: 'Google US English', lang: 'en-US' }),
      voice({ name: 'Google English India', lang: 'en-IN' }),
      voice({ name: 'Google हिन्दी', lang: 'hi-IN' }),
    ]
    expect(selectBrowserVoice(voices, 'hi-IN')?.name).toBe('Google हिन्दी')
    expect(selectBrowserVoice(voices, 'en-IN')?.name).toBe('Google English India')
  })

  it('treats hi-HI as Hindi and prefers Microsoft Natural en-IN over compact', () => {
    const picked = selectBrowserVoice(
      [
        voice({ name: 'eSpeak Compact', lang: 'en-IN', localService: true }),
        voice({ name: 'Microsoft Neerja Online (Natural)', lang: 'en-IN' }),
        voice({ name: 'Google हिन्दी', lang: 'hi-HI' }),
      ],
      'en-IN',
    )
    expect(picked?.name).toBe('Microsoft Neerja Online (Natural)')
  })

  it('prefers Apple Rishi (en-IN) when Google/Microsoft are missing', () => {
    const picked = selectBrowserVoice([
      voice({ name: 'Samantha', lang: 'en-US', localService: true }),
      voice({ name: 'Rishi', lang: 'en-IN', localService: true }),
      voice({ name: 'Daniel', lang: 'en-GB', localService: true }),
    ])
    expect(picked?.name).toBe('Rishi')
  })

  it('falls back to any remaining voice and returns null for an empty list', () => {
    expect(selectBrowserVoice([])).toBeNull()
    expect(selectBrowserVoice([voice({ name: 'System', lang: 'de-DE' })])?.name).toBe('System')
  })

  it('scores Google/Microsoft/Apple Indian voices above generic English', () => {
    const google = scoreBrowserVoice(voice({ name: 'Google English India', lang: 'en-IN' }))
    const ms = scoreBrowserVoice(voice({ name: 'Microsoft Heera', lang: 'en-IN' }))
    const apple = scoreBrowserVoice(voice({ name: 'Veena', lang: 'en-IN', localService: true }))
    const us = scoreBrowserVoice(voice({ name: 'eSpeak', lang: 'en-US' }))
    expect(google).toBeGreaterThan(ms)
    expect(ms).toBeGreaterThan(us)
    expect(apple).toBeGreaterThan(us)
  })

  it('caches the chosen voice and reuses it while it is still available', () => {
    const googleIn = voice({ name: 'Google English India', lang: 'en-IN' })
    const googleUs = voice({ name: 'Google US English', lang: 'en-US' })
    const first = resolveBrowserVoice([googleUs, googleIn], 'en-IN')
    expect(first?.name).toBe('Google English India')
    const second = resolveBrowserVoice([googleIn, googleUs], 'en-IN')
    expect(second?.name).toBe('Google English India')
  })

  it('applies mill-field settings and the cached voice onto an utterance', () => {
    const utter = { lang: '', rate: 1, pitch: 1, volume: 0.5, voice: null }
    const picked = applyBrowserVoice(
      utter,
      [voice({ name: 'Google UK English Female', lang: 'en-GB' })],
      'en-IN',
    )
    expect(picked?.name).toBe('Google UK English Female')
    expect(utter.lang).toBe('en-GB')
    expect(utter.rate).toBe(BROWSER_TTS.rate)
    expect(utter.pitch).toBe(BROWSER_TTS.pitch)
    expect(utter.volume).toBe(BROWSER_TTS.volume)
  })

  it('falls back to the preferred lang when no voices are installed', () => {
    const utter = { lang: '', rate: 1, pitch: 1, volume: 1, voice: null }
    expect(applyBrowserVoice(utter, [], 'hi-IN')).toBeNull()
    expect(utter.lang).toBe('hi-IN')
    expect(utter.rate).toBe(BROWSER_TTS.rate)
  })
})
