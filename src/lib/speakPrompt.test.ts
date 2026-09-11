import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ELEVENLABS_VOICE,
  buildElevenLabsRequest,
  elevenLabsConfigured,
  ttsEngine,
} from './speakPrompt'

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
