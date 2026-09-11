import { describe, expect, it } from 'vitest'
import { migrateStorageKey } from './storage'

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
