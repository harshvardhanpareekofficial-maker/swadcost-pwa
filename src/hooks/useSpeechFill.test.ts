import { describe, expect, it } from 'vitest'
import { extractSpokenNumber } from './useSpeechFill'

describe('extractSpokenNumber', () => {
  it('accepts a bare mill number', () => {
    expect(extractSpokenNumber('65')).toBe(65)
    expect(extractSpokenNumber('0.5')).toBe(0.5)
    expect(extractSpokenNumber('102')).toBe(102)
    expect(extractSpokenNumber('65.')).toBe(65)
  })

  it('accepts a short number with a unit word', () => {
    expect(extractSpokenNumber('120 reed')).toBe(120)
    expect(extractSpokenNumber('5 percent')).toBe(5)
  })

  it('accepts short spoken English mill numbers', () => {
    expect(extractSpokenNumber('eighty')).toBe(80)
    expect(extractSpokenNumber('sixty five')).toBe(65)
    expect(extractSpokenNumber('sixty-five')).toBe(65)
    expect(extractSpokenNumber('forty reed')).toBe(40)
    expect(extractSpokenNumber('zero')).toBe(0)
  })

  it('accepts point-decimals and hundreds used on the mill sheet', () => {
    expect(extractSpokenNumber('point five')).toBe(0.5)
    expect(extractSpokenNumber('five point five')).toBe(5.5)
    expect(extractSpokenNumber('one hundred two')).toBe(102)
    expect(extractSpokenNumber('one oh two')).toBe(102)
    expect(extractSpokenNumber('two hundred')).toBe(200)
    expect(extractSpokenNumber('two hundred eighty')).toBe(280)
  })

  it('does not pick a number out of a glitch phrase', () => {
    expect(
      extractSpokenNumber('the weather in ichalkaranji today is 32 degrees and also 80 reed maybe'),
    ).toBeNull()
    expect(extractSpokenNumber('warp forty please wait')).toBeNull()
    expect(extractSpokenNumber('65 maybe')).toBeNull()
    expect(extractSpokenNumber('minus five')).toBeNull()
    expect(extractSpokenNumber('-5')).toBeNull()
  })

  it('ignores empty or non-numeric speech', () => {
    expect(extractSpokenNumber('')).toBeNull()
    expect(extractSpokenNumber('hello')).toBeNull()
  })
})
