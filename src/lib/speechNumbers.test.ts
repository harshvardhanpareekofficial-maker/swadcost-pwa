import { describe, expect, it } from 'vitest'
import {
  consumeSpokenNumber,
  extractSpokenNumber,
  extractSpokenNumberFromAlternatives,
  preferredSpeechLang,
  speechStreamTokens,
} from './speechNumbers'

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
    expect(extractSpokenNumber('120 रीड')).toBe(120)
  })

  it('accepts English mill speech including one-twenty and digit runs', () => {
    expect(extractSpokenNumber('eighty')).toBe(80)
    expect(extractSpokenNumber('sixty five')).toBe(65)
    expect(extractSpokenNumber('sixty-five')).toBe(65)
    expect(extractSpokenNumber('one twenty')).toBe(120)
    expect(extractSpokenNumber('one twenty five')).toBe(125)
    expect(extractSpokenNumber('one two zero')).toBe(120)
    expect(extractSpokenNumber('six five')).toBe(65)
    expect(extractSpokenNumber('one oh two')).toBe(102)
    expect(extractSpokenNumber('one hundred two')).toBe(102)
    expect(extractSpokenNumber('point five')).toBe(0.5)
    expect(extractSpokenNumber('five point five')).toBe(5.5)
    expect(extractSpokenNumber('two hundred eighty')).toBe(280)
  })

  it('accepts Hindi and Devanagari mill numbers', () => {
    expect(extractSpokenNumber('साठ')).toBe(60)
    expect(extractSpokenNumber('साठ पांच')).toBe(65)
    expect(extractSpokenNumber('पैंसठ')).toBe(65)
    expect(extractSpokenNumber('एक सौ दो')).toBe(102)
    expect(extractSpokenNumber('६५')).toBe(65)
    expect(extractSpokenNumber('पांच दशमलव पांच')).toBe(5.5)
    expect(extractSpokenNumber('saath paanch')).toBe(65)
    expect(extractSpokenNumber('ek sau do')).toBe(102)
    expect(extractSpokenNumber('bees')).toBe(20)
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

  it('picks the first Chrome alternative that parses', () => {
    expect(extractSpokenNumberFromAlternatives(['hmm reed maybe', 'sixty five'])).toBe(65)
    expect(extractSpokenNumberFromAlternatives(['hello', 'nope'])).toBeNull()
  })

  it('consumes the longest mill number at the head of a stream', () => {
    expect(consumeSpokenNumber(speechStreamTokens('sixty five 102'))).toEqual({
      value: 65,
      length: 2,
    })
    expect(consumeSpokenNumber(speechStreamTokens('eighty sixty four'))).toEqual({
      value: 80,
      length: 1,
    })
    expect(consumeSpokenNumber(speechStreamTokens('one hundred two reed'))).toEqual({
      value: 102,
      length: 3,
    })
    expect(consumeSpokenNumber(speechStreamTokens('reed 80'))).toBeNull()
  })

  it('prefers hi-IN when the device language is Hindi', () => {
    expect(preferredSpeechLang('hi-IN')).toBe('hi-IN')
    expect(preferredSpeechLang('en-IN')).toBe('en-IN')
    expect(preferredSpeechLang('en-US')).toBe('en-IN')
  })
})
