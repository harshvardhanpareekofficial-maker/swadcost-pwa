// @vitest-environment jsdom
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAccount, findAccount, isAuthenticated, loadAccounts, login, logout, NO_LOCAL_ACCOUNT } from './auth'
import { __setCloudAccountAdaptersForTests, CLOUD_NOT_CONFIGURED, CLOUD_UNAVAILABLE } from './cloudAccounts'
import {
  beginSignIn,
  CLOUD_SYNC_FAILED,
  createStudioAccount,
  finishDeviceSetup,
  retryCloudLink,
} from './studioAuth'
import { usernameNorm } from './usernames'

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

function clear() {
  localStorage.clear()
  __setCloudAccountAdaptersForTests()
}

beforeEach(clear)
afterEach(clear)

describe('usernameNorm', () => {
  it('treats Harshvardhan / harshvardhan / HARSHVARDHAN as one key', () => {
    expect(usernameNorm('Harshvardhan')).toBe('harshvardhan')
    expect(usernameNorm(' harshvardhan ')).toBe('harshvardhan')
    expect(usernameNorm('HARSHVARDHAN')).toBe('harshvardhan')
  })
})

describe('beginSignIn recovery', () => {
  it('offers Finish setup after a local wipe when the cloud row is present', async () => {
    __setCloudAccountAdaptersForTests({
      lookup: async (norm) =>
        norm === 'harshvardhan'
          ? { status: 'found', username: 'Harshvardhan', usernameNorm: 'harshvardhan' }
          : { status: 'missing' },
      upsert: async () => ({ ok: true }),
    })

    expect(await login('Harshvardhan', 'loompass')).toMatchObject({ ok: false, code: 'NO_LOCAL' })

    const started = await beginSignIn('HARSHVARDHAN', 'loompass')
    expect(started).toEqual({ status: 'finish-setup', username: 'Harshvardhan' })

    const finished = await finishDeviceSetup('HARSHVARDHAN', 'newpass', 'newpass')
    expect(finished).toEqual({ ok: true, username: 'Harshvardhan' })
    expect(isAuthenticated()).toBe(true)
    expect(findAccount('harshvardhan')?.username).toBe('Harshvardhan')

    logout()
    expect(await login('harshvardhan', 'newpass')).toEqual({ ok: true, username: 'Harshvardhan' })
  })

  it('does not say the account was never created when only the cloud row exists', async () => {
    __setCloudAccountAdaptersForTests({
      lookup: async () => ({ status: 'found', username: 'Harshvardhan', usernameNorm: 'harshvardhan' }),
    })
    const started = await beginSignIn('harshvardhan', 'x')
    expect(started.status).toBe('finish-setup')
    expect(started.status === 'finish-setup' && started.username).toBe('Harshvardhan')
  })

  it('does not say no account when getSupabase() is null / the studio list cannot be checked', async () => {
    __setCloudAccountAdaptersForTests({
      lookup: async () => ({ status: 'unavailable', error: CLOUD_NOT_CONFIGURED }),
    })
    const started = await beginSignIn('Harshvardhan', 'loompass')
    expect(started).toEqual({ status: 'error', error: CLOUD_NOT_CONFIGURED })
    expect(started.status === 'error' && started.error).not.toBe(NO_LOCAL_ACCOUNT)
    expect(started.status === 'error' && started.error).not.toMatch(/create an account if you are new/i)
  })

  it('does not say no account when lookup errors', async () => {
    __setCloudAccountAdaptersForTests({
      lookup: async () => ({ status: 'unavailable', error: CLOUD_UNAVAILABLE }),
    })
    const started = await beginSignIn('HARSHVARDHAN', 'loompass')
    expect(started).toEqual({ status: 'error', error: CLOUD_UNAVAILABLE })
    expect(started.status === 'error' && started.error).not.toBe(NO_LOCAL_ACCOUNT)
  })

  it('offers Finish setup for Harshvardhan case variants when the cloud row exists', async () => {
    __setCloudAccountAdaptersForTests({
      lookup: async (norm) =>
        norm === 'harshvardhan'
          ? { status: 'found', username: 'Harshvardhan', usernameNorm: norm }
          : { status: 'missing' },
    })
    for (const name of ['Harshvardhan', 'harshvardhan', 'HARSHVARDHAN', ' Harshvardhan ']) {
      await expect(beginSignIn(name, 'x')).resolves.toEqual({
        status: 'finish-setup',
        username: 'Harshvardhan',
      })
    }
  })
})

describe('createStudioAccount', () => {
  it('rejects a duplicate local username by username_norm', async () => {
    await createAccount('Harshvardhan', 'loompass', 'loompass')
    logout()
    const dup = await createStudioAccount('HARSHVARDHAN', 'otherpw', 'otherpw')
    expect(dup).toMatchObject({ ok: false, code: 'TAKEN' })
  })

  it('treats Create as Finish setup when cloud has the name and local is empty', async () => {
    __setCloudAccountAdaptersForTests({
      lookup: async (norm) =>
        norm === 'harshvardhan'
          ? { status: 'found', username: 'Harshvardhan', usernameNorm: norm }
          : { status: 'missing' },
      upsert: async () => ({ ok: true }),
    })
    const created = await createStudioAccount('harshvardhan', 'loompass', 'loompass')
    expect(created).toEqual({ ok: true, username: 'Harshvardhan' })
    expect(findAccount('HARSHVARDHAN')?.username).toBe('Harshvardhan')
  })

  it('does not claim success when the cloud upsert fails', async () => {
    __setCloudAccountAdaptersForTests({
      lookup: async () => ({ status: 'missing' }),
      upsert: async () => ({ ok: false, error: 'down' }),
    })
    const created = await createStudioAccount('Maya', 'loompass', 'loompass')
    expect(created).toEqual({
      ok: false,
      error: CLOUD_SYNC_FAILED,
      code: 'CLOUD_SYNC',
      username: 'Maya',
    })
    expect(isAuthenticated()).toBe(false)
    expect(findAccount('maya')?.username).toBe('Maya')

    __setCloudAccountAdaptersForTests({
      lookup: async () => ({ status: 'missing' }),
      upsert: async () => ({ ok: true }),
    })
    const retried = await retryCloudLink('MAYA')
    expect(retried).toEqual({ ok: true, username: 'Maya' })
    expect(isAuthenticated()).toBe(true)
  })
})

describe('local wipe simulation', () => {
  it('keeps a post-epoch hashed account and still recovers via cloud if hashes are cleared', async () => {
    __setCloudAccountAdaptersForTests({
      lookup: async (norm) =>
        norm === 'harshvardhan'
          ? { status: 'found', username: 'Harshvardhan', usernameNorm: norm }
          : { status: 'missing' },
      upsert: async () => ({ ok: true }),
    })
    await createAccount('Harshvardhan', 'loompass', 'loompass')
    logout()
    localStorage.removeItem('fabriccost.accounts')
    expect(loadAccounts()).toEqual([])

    const started = await beginSignIn('Harshvardhan', 'loompass')
    expect(started.status).toBe('finish-setup')
    const finished = await finishDeviceSetup('Harshvardhan', 'loompass', 'loompass')
    expect(finished.ok).toBe(true)
  })
})
