import { describe, expect, it } from 'vitest'
import { extractSpokenNumber } from './useSpeechFill'

describe('extractSpokenNumber', () => {
  it('accepts a bare mill number', () => {
    expect(extractSpokenNumber('65')).toBe(65)
    expect(extractSpokenNumber('0.5')).toBe(0.5)
    expect(extractSpokenNumber('102')).toBe(102)
  })

  it('accepts a short number with a unit word', () => {
    expect(extractSpokenNumber('120 reed')).toBe(120)
    expect(extractSpokenNumber('5 percent')).toBe(5)
  })

  it('accepts short spoken English mill numbers', () => {
    expect(extractSpokenNumber('eighty')).toBe(80)
    expect(extractSpokenNumber('sixty five')).toBe(65)
    expect(extractSpokenNumber('forty reed')).toBe(40)
  })

  it('does not pick a number out of a glitch phrase', () => {
    expect(
      extractSpokenNumber('the weather in ichalkaranji today is 32 degrees and also 80 reed maybe'),
    ).toBeNull()
    expect(extractSpokenNumber('warp forty please wait')).toBeNull()
    expect(extractSpokenNumber('65 maybe')).toBeNull()
  })

  it('ignores empty or non-numeric speech', () => {
    expect(extractSpokenNumber('')).toBeNull()
    expect(extractSpokenNumber('hello')).toBeNull()
  })
})
