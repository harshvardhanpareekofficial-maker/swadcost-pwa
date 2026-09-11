// @vitest-environment jsdom
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createAccount,
  currentUser,
  DEMO_PASSWORD,
  DEMO_USERNAME,
  ensureSeedAccounts,
  findAccount,
  hashPassword,
  isAuthenticated,
  loadAccounts,
  login,
  logout,
  MIN_PASSWORD_LENGTH,
  normalizeUsername,
  validateNewAccount,
} from './auth'

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

function clearAuthStorage() {
  localStorage.removeItem('fabriccost.accounts')
  localStorage.removeItem('fabriccost.auth_session')
  localStorage.removeItem('fabriccost.auth_user')
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

  it('accepts a valid payload', () => {
    expect(validateNewAccount('Maya', 'secret1', 'secret1')).toBeNull()
  })
})

describe('legacy key migration', () => {
  it('promotes an old session so existing users stay signed in', () => {
    localStorage.setItem('swadcost_auth_session', '1')
    localStorage.setItem('swadcost_auth_user', 'rohitbohara')
    expect(isAuthenticated()).toBe(true)
    expect(currentUser()).toBe('rohitbohara')
    expect(localStorage.getItem('fabriccost.auth_session')).toBe('1')
    expect(localStorage.getItem('swadcost_auth_session')).toBeNull()
  })
})

describe('ensureSeedAccounts + demo login', () => {
  it('seeds the demo account and signs in with those credentials', async () => {
    await ensureSeedAccounts()
    const demo = findAccount(DEMO_USERNAME)
    expect(demo?.username).toBe(DEMO_USERNAME)
    expect(demo?.passwordHash).toBe(await hashPassword(DEMO_USERNAME, DEMO_PASSWORD))

    const result = await login(DEMO_USERNAME, DEMO_PASSWORD)
    expect(result).toEqual({ ok: true, username: DEMO_USERNAME })
    expect(isAuthenticated()).toBe(true)
    expect(currentUser()).toBe(DEMO_USERNAME)
  })

  it('accepts the demo username case-insensitively', async () => {
    const result = await login('RohitBohara', DEMO_PASSWORD)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.username).toBe(DEMO_USERNAME)
  })

  it('does not duplicate the demo seed on later loads', async () => {
    await ensureSeedAccounts()
    await ensureSeedAccounts()
    expect(loadAccounts().filter((a) => normalizeUsername(a.username) === DEMO_USERNAME)).toHaveLength(1)
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
  })

  it('explains an incorrect password without a cryptic fail', async () => {
    await expectFail(await login(DEMO_USERNAME, 'wrong-password'), /incorrect password/i)
  })
})

describe('createAccount', () => {
  it('stores a hashed password, auto-logs in, and survives reload', async () => {
    const created = await createAccount('Maya Weaver', 'loompass', 'loompass')
    expect(created).toEqual({ ok: true, username: 'Maya Weaver' })
    expect(isAuthenticated()).toBe(true)
    expect(currentUser()).toBe('Maya Weaver')

    const stored = findAccount('maya weaver')
    expect(stored?.username).toBe('Maya Weaver')
    expect(stored?.passwordHash).toBe(await hashPassword('Maya Weaver', 'loompass'))
    expect(stored?.passwordHash).not.toContain('loompass')

    logout()
    expect(isAuthenticated()).toBe(false)

    const again = await login('maya weaver', 'loompass')
    expect(again).toEqual({ ok: true, username: 'Maya Weaver' })
  })

  it('rejects a duplicate username case-insensitively', async () => {
    await createAccount('Maya', 'loompass', 'loompass')
    logout()
    const dup = await createAccount('maya', 'otherpw', 'otherpw')
    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.error).toMatch(/already taken/i)
  })

  it('does not collide with the seeded demo username', async () => {
    const dup = await createAccount('RohitBohara', 'newpass', 'newpass')
    expect(dup.ok).toBe(false)
    if (!dup.ok) expect(dup.error).toMatch(/already taken/i)
  })
})
