import { describe, it, expect } from 'vitest'
import reference from './fixtures/live-reference.json'
import { calculateSingle, calculateMulti, type SingleInputs, type MultiInputs } from './costing'
describe('Parity with the live September PWA, including every rounding stage', () => {
  for (const row of reference.cases) {
    it(row.name, () => {
      const result = row.mode === 'single' ? calculateSingle(row.input as SingleInputs) : calculateMulti(row.input as MultiInputs)
      expect(result).toEqual(row.result)
    })
  }
})
