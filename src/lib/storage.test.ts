import { describe, expect, it } from 'vitest'
import { IDLE_TTL_MS } from './idle'
import { hasFreshHashedAccounts, migrateStorageKey } from './storage'

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => (data.has(key) ? data.get(key)! : null),
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    raw: data,
  }
}

describe('migrateStorageKey', () => {
  it('copies a legacy key once and removes it', () => {
    const store = memoryStore({ 'swadcost.accounts': '[{"username":"rohitbohara"}]' })
    migrateStorageKey('swadcost.accounts', 'fabriccost.accounts', store)
    expect(store.getItem('fabriccost.accounts')).toContain('rohitbohara')
    expect(store.getItem('swadcost.accounts')).toBeNull()
  })

  it('keeps an existing new key and still drops the legacy key', () => {
    const store = memoryStore({
      'swadcost.accounts': 'old',
      'fabriccost.accounts': 'new',
    })
    migrateStorageKey('swadcost.accounts', 'fabriccost.accounts', store)
    expect(store.getItem('fabriccost.accounts')).toBe('new')
    expect(store.getItem('swadcost.accounts')).toBeNull()
  })
})

describe('hasFreshHashedAccounts', () => {
  it('keeps a just-created hashed account and ignores leftover stubs', () => {
    const now = Date.parse('2026-09-11T15:00:00.000Z')
    expect(
      hasFreshHashedAccounts(
        JSON.stringify([{ username: 'Harshvardhan Pareek', passwordHash: 'abc', createdAt: now, lastActiveAt: now }]),
        now,
      ),
    ).toBe(true)
    expect(
      hasFreshHashedAccounts(
        JSON.stringify([{ username: 'legacy-user', passwordHash: 'hash', createdAt: 1, lastActiveAt: 1 }]),
        now,
      ),
    ).toBe(false)
    expect(
      hasFreshHashedAccounts(
        JSON.stringify([
          {
            username: 'idle',
            passwordHash: 'hash',
            createdAt: now - IDLE_TTL_MS - 1,
            lastActiveAt: now - IDLE_TTL_MS - 1,
          },
        ]),
        now,
      ),
    ).toBe(false)
  })
})
