import { describe, expect, it } from 'vitest'
import { checkOwnerPin, ownerGate, OWNER_PATH } from './owner'

describe('owner vault', () => {
  it('uses a non-admin secret path', () => {
    expect(OWNER_PATH).toMatch(/^\/owner-vault-/)
    expect(OWNER_PATH.includes('admin')).toBe(false)
  })

  it('accepts the configured gate and rejects a wrong pin', () => {
    const gate = ownerGate()
    expect(checkOwnerPin(gate)).toBe(true)
    expect(checkOwnerPin(`wrong-${gate}`)).toBe(false)
    expect(checkOwnerPin(`  ${gate}  `)).toBe(true)
  })
})
