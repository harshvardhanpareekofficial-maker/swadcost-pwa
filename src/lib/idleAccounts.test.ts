// @vitest-environment jsdom
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAccount, findAccount, loadAccounts, touchAccountLastActive } from './auth'
import { IDLE_TTL_MS } from './idle'
import { purgeIdleLocalNow } from './idleAccounts'
import { ACCOUNT_META_KEY, CALC_EVENTS_KEY } from './storage'
import { loadLocalAccounts, loadLocalCalcs, markAccountActive } from './telemetry'

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

function clear() {
  localStorage.clear()
}

beforeEach(clear)
afterEach(clear)

describe('purgeIdleLocalNow', () => {
  it('drops idle hashed accounts and matching local telemetry', async () => {
    await createAccount('Maya', 'loompass', 'loompass')
    await markAccountActive('Maya')
    localStorage.setItem(
      CALC_EVENTS_KEY,
      JSON.stringify([
        {
          id: 'c1',
          username: 'Maya',
          fabricName: 'Grey',
          mode: 'single',
          reed: 80,
          pick: 50,
          warpRs: 60,
          qualityLabel: '80×50',
          finalCost: 10,
          payload: {},
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    )

    const now = Date.now()
    touchAccountLastActive('Maya', now - IDLE_TTL_MS - 1000)
    const meta = JSON.parse(localStorage.getItem(ACCOUNT_META_KEY) || '[]') as { username: string; lastActiveAt: string }[]
    if (meta[0]) {
      meta[0].lastActiveAt = new Date(now - IDLE_TTL_MS - 1000).toISOString()
      localStorage.setItem(ACCOUNT_META_KEY, JSON.stringify(meta))
    }

    const removed = purgeIdleLocalNow(now)
    expect(removed).toContain('Maya')
    expect(loadAccounts()).toEqual([])
    expect(findAccount('Maya')).toBeUndefined()
    expect(loadLocalAccounts()).toEqual([])
    expect(loadLocalCalcs()).toEqual([])
  })
})
