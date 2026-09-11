// @vitest-environment jsdom
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ACCOUNT_SAVE_FAILED,
  createAccount,
  currentUser,
  findAccount,
  hashPassword,
  isAuthenticated,
  loadAccounts,
  login,
  logout,
  MIN_PASSWORD_LENGTH,
  NO_LOCAL_ACCOUNT,
  normalizeUsername,
  purgeIdleLocalAccounts,
  touchAccountLastActive,
  validateNewAccount,
} from './auth'
import { IDLE_TTL_MS } from './idle'
import { ACCOUNTS_EPOCH, ACCOUNTS_EPOCH_KEY } from './storage'

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

function clearAuthStorage() {
  localStorage.removeItem('fabriccost.accounts')
  localStorage.removeItem('fabriccost.auth_session')
  localStorage.removeItem('fabriccost.auth_user')
  localStorage.removeItem('fabriccost.accounts_epoch')
  localStorage.removeItem('fabriccost.account_meta')
  localStorage.removeItem('swadcost.accounts')
  localStorage.removeItem('swadcost_auth_session')
  localStorage.removeItem('swadcost_auth_user')
}

beforeEach(() => {
  clearAuthStorage()
})

afterEach(() => {
  clearAuthStorage()
})

describe('validateNewAccount', () => {
  it('rejects empty name, short password, and mismatch', () => {
    expect(validateNewAccount('   ', 'abcdef', 'abcdef')).toMatch(/name/i)
    expect(validateNewAccount('maya', '', '')).toMatch(/password/i)
    expect(validateNewAccount('maya', 'abc', 'abc')).toMatch(new RegExp(String(MIN_PASSWORD_LENGTH)))
    expect(validateNewAccount('maya', 'abcdef', 'abcdeg')).toMatch(/match/i)
  })

  it('rejects a reserved guest username', () => {
    expect(validateNewAccount('Guest', 'abcdef', 'abcdef')).toMatch(/reserved/i)
    expect(validateNewAccount('guest', 'abcdef', 'abcdef')).toMatch(/reserved/i)
  })

  it('accepts a valid payload', () => {
    expect(validateNewAccount('Maya', 'secret1', 'secret1')).toBeNull()
  })
})

describe('empty account store', () => {
  it('starts with no local accounts and does not seed a demo user', () => {
    expect(loadAccounts()).toEqual([])
    expect(localStorage.getItem('fabriccost.accounts')).toBeNull()
  })

  it('wipes a leftover local account store once', () => {
    localStorage.setItem(
      'fabriccost.accounts',
      JSON.stringify([{ username: 'legacy-user', passwordHash: 'hash', createdAt: 1, lastActiveAt: 1 }]),
    )
    localStorage.setItem('fabriccost.auth_session', '1')
    localStorage.setItem('fabriccost.auth_user', 'legacy-user')
    expect(loadAccounts()).toEqual([])
    expect(isAuthenticated()).toBe(false)
    expect(localStorage.getItem(ACCOUNTS_EPOCH_KEY)).toBe(ACCOUNTS_EPOCH)
  })
})

describe('legacy key migration', () => {
  it('clears a leftover Guest explore-first session', () => {
    localStorage.setItem(ACCOUNTS_EPOCH_KEY, ACCOUNTS_EPOCH)
    localStorage.setItem('fabriccost.auth_session', '1')
    localStorage.setItem('fabriccost.auth_user', 'Guest')
    expect(isAuthenticated()).toBe(false)
    expect(currentUser()).toBeNull()
    expect(localStorage.getItem('fabriccost.auth_session')).toBeNull()
  })

  it('promotes an old session after the empty-store epoch is applied', () => {
    localStorage.setItem(ACCOUNTS_EPOCH_KEY, ACCOUNTS_EPOCH)
    localStorage.setItem('swadcost_auth_session', '1')
    localStorage.setItem('swadcost_auth_user', 'maya')
    expect(isAuthenticated()).toBe(true)
    expect(currentUser()).toBe('maya')
    expect(localStorage.getItem('fabriccost.auth_session')).toBe('1')
    expect(localStorage.getItem('swadcost_auth_session')).toBeNull()
  })
})

async function expectFail(result: Awaited<ReturnType<typeof login>>, pattern: RegExp) {
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.error).toMatch(pattern)
}

describe('login errors', () => {
  it('explains a missing username and password', async () => {
    await expectFail(await login('  ', 'x'), /username/i)
    await expectFail(await login('maya', ''), /password/i)
  })

  it('explains an unknown username', async () => {
    await expectFail(await login('nobody-yet', 'abcdef'), /no account/i)
    const missing = await login('nobody-yet', 'abcdef')
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.error).toBe(NO_LOCAL_ACCOUNT)
  })

  it('explains an incorrect password without a cryptic fail', async () => {
    await createAccount('Maya', 'loompass', 'loompass')
    logout()
    await expectFail(await login('Maya', 'wrong-password'), /incorrect password/i)
  })
})

describe('createAccount', () => {
  it('stores a hashed password, stamps last active, auto-logs in, and survives reload', async () => {
    const created = await createAccount('Maya Weaver', 'loompass', 'loompass')
    expect(created).toEqual({ ok: true, username: 'Maya Weaver' })
    expect(isAuthenticated()).toBe(true)
    expect(currentUser()).toBe('Maya Weaver')

    const stored = findAccount('maya weaver')
    expect(stored?.username).toBe('Maya Weaver')
    expect(stored?.passwordHash).toBe(await hashPassword('Maya Weaver', 'loompass'))
    expect(stored?.passwordHash).not.toContain('loompass')
    expect(stored?.lastActiveAt).toBeGreaterThan(0)
    expect(stored?.lastActiveAt).toBe(stored?.createdAt)

    logout()
    expect(isAuthenticated()).toBe(false)

    const again = await login('maya weaver', 'loompass')
    expect(again).toEqual({ ok: true, username: 'Maya Weaver' })
    const afterLogin = findAccount('Maya Weaver')
    expect(afterLogin?.lastActiveAt).toBeGreaterThanOrEqual(stored?.lastActiveAt ?? 0)
  })

  it('rejects a duplicate username case-insensitively', async () => {
    await createAccount('Maya', 'loompass', 'loompass')
    logout()
    const dup = await createAccount('maya', 'otherpw', 'otherpw')
    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.error).toMatch(/already taken/i)
  })

  it('signs in case-insensitively (Harshvardhan == harshvardhan == HARSHVARDHAN)', async () => {
    const created = await createAccount('Harshvardhan Pareek', 'loompass', 'loompass')
    expect(created).toEqual({ ok: true, username: 'Harshvardhan Pareek' })
    logout()

    for (const name of ['harshvardhan pareek', 'HARSHVARDHAN PAREEK', 'Harshvardhan  Pareek']) {
      const result = await login(name, 'loompass')
      expect(result).toEqual({ ok: true, username: 'Harshvardhan Pareek' })
      logout()
    }

    expect(normalizeUsername('HARSHVARDHAN')).toBe(normalizeUsername('harshvardhan'))
    expect(await hashPassword('Harshvardhan', 'loompass')).toBe(await hashPassword('HARSHVARDHAN', 'loompass'))
    expect(await hashPassword('Harshvardhan Pareek', 'loompass')).toBe(
      await hashPassword('harshvardhan  pareek', 'loompass'),
    )
  })

  it('keeps a brand-new account if the epoch marker is missing', async () => {
    await createAccount('Harshvardhan Pareek', 'loompass', 'loompass')
    logout()
    localStorage.removeItem(ACCOUNTS_EPOCH_KEY)
    expect(findAccount('HARSHVARDHAN PAREEK')?.username).toBe('Harshvardhan Pareek')
    expect(localStorage.getItem(ACCOUNTS_EPOCH_KEY)).toBe(ACCOUNTS_EPOCH)
    const again = await login('harshvardhan pareek', 'loompass')
    expect(again).toEqual({ ok: true, username: 'Harshvardhan Pareek' })
  })

  it('does not claim Create succeeded when the account cannot be stored', async () => {
    const proto = Object.getPrototypeOf(localStorage) as Storage
    const original = proto.setItem
    proto.setItem = function (this: Storage, key: string, value: string) {
      if (key === 'fabriccost.accounts') throw new Error('quota')
      return original.call(this, key, value)
    }
    try {
      const result = await createAccount('Maya', 'loompass', 'loompass')
      expect(result).toEqual({ ok: false, error: ACCOUNT_SAVE_FAILED })
      expect(findAccount('Maya')).toBeUndefined()
    } finally {
      proto.setItem = original
    }
  })

  it('rejects creating a Guest account', async () => {
    const result = await createAccount('Guest', 'abcdef', 'abcdef')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/reserved/i)
  })
})

describe('last active + idle purge', () => {
  it('updates lastActiveAt on touch and login', async () => {
    await createAccount('Maya', 'loompass', 'loompass')
    const created = findAccount('Maya')!
    touchAccountLastActive('Maya', created.lastActiveAt + 5_000)
    expect(findAccount('Maya')?.lastActiveAt).toBe(created.lastActiveAt + 5_000)
  })

  it('removes accounts idle longer than 12 days and logs them out', async () => {
    await createAccount('Maya', 'loompass', 'loompass')
    expect(isAuthenticated()).toBe(true)
    const now = Date.now()
    touchAccountLastActive('Maya', now - IDLE_TTL_MS - 1_000)
    const removed = purgeIdleLocalAccounts(now)
    expect(removed).toEqual(['Maya'])
    expect(loadAccounts()).toEqual([])
    expect(isAuthenticated()).toBe(false)
  })

  it('keeps an account that signed in inside the window', async () => {
    await createAccount('Maya', 'loompass', 'loompass')
    const now = Date.now()
    touchAccountLastActive('Maya', now - IDLE_TTL_MS + 60_000)
    expect(purgeIdleLocalAccounts(now)).toEqual([])
    expect(findAccount('Maya')?.username).toBe('Maya')
  })
})
