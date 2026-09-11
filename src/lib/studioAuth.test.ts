// @vitest-environment jsdom
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  boundUsername,
  createAccount,
  findAccount,
  isAuthenticated,
  loadAccounts,
  login,
  logout,
  NO_LOCAL_ACCOUNT,
} from './auth'
import { __setCloudAccountAdaptersForTests, CLOUD_NOT_CONFIGURED, CLOUD_UNAVAILABLE } from './cloudAccounts'
import {
  beginSignIn,
  CLOUD_SYNC_FAILED,
  createStudioAccount,
  finishDeviceSetup,
  retryCloudLink,
  switchStudioAccount,
  USERNAME_TAKEN_CLOUD,
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

  it('rejects Create when the cloud already has the username_norm — Sign-in is the Finish setup path', async () => {
    const upserts: string[] = []
    __setCloudAccountAdaptersForTests({
      lookup: async (norm) =>
        norm === 'harshvardhan'
          ? { status: 'found', username: 'Harshvardhan', usernameNorm: norm }
          : { status: 'missing' },
      upsert: async (username) => {
        upserts.push(username)
        return { ok: true }
      },
    })
    const created = await createStudioAccount('harshvardhan', 'loompass', 'loompass')
    expect(created).toEqual({
      ok: false,
      error: USERNAME_TAKEN_CLOUD,
      code: 'TAKEN',
      username: 'Harshvardhan',
    })
    expect(created.ok === false && created.error).toMatch(/name taken/i)
    expect(created.ok === false && created.error).toMatch(/already taken/i)
    expect(created.ok === false && created.error).toMatch(/mill initials/i)
    expect(findAccount('harshvardhan')).toBeUndefined()
    expect(upserts).toEqual([])

    const started = await beginSignIn('HARSHVARDHAN', 'x')
    expect(started).toEqual({ status: 'finish-setup', username: 'Harshvardhan' })
    const finished = await finishDeviceSetup('harshvardhan', 'loompass', 'loompass')
    expect(finished).toEqual({ ok: true, username: 'Harshvardhan' })
    expect(upserts).toEqual(['Harshvardhan'])
  })

  it('lets a different handle succeed when the first name is taken (rahul vs rahul2)', async () => {
    const upserts: string[] = []
    __setCloudAccountAdaptersForTests({
      lookup: async (norm) =>
        norm === 'rahul'
          ? { status: 'found', username: 'Rahul', usernameNorm: norm }
          : { status: 'missing' },
      upsert: async (username) => {
        upserts.push(username)
        return { ok: true }
      },
    })
    const taken = await createStudioAccount('Rahul', 'loompass', 'loompass')
    expect(taken).toMatchObject({ ok: false, code: 'TAKEN', username: 'Rahul' })
    expect(taken.ok === false && taken.error).toBe(USERNAME_TAKEN_CLOUD)
    expect(upserts).toEqual([])

    const other = await createStudioAccount('rahul2', 'loompass', 'loompass')
    expect(other).toEqual({ ok: true, username: 'rahul2' })
    expect(upserts).toEqual(['rahul2'])
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

describe('device bind + switch', () => {
  function cloudStore(seed: Record<string, string> = {}) {
    const byNorm = { ...seed }
    const upserts: string[] = []
    __setCloudAccountAdaptersForTests({
      lookup: async (norm) => {
        const username = byNorm[norm]
        return username
          ? { status: 'found', username, usernameNorm: norm }
          : { status: 'missing' }
      },
      upsert: async (username) => {
        upserts.push(username)
        const norm = usernameNorm(username)
        if (!byNorm[norm]) byNorm[norm] = username
        return { ok: true }
      },
    })
    return upserts
  }

  it('binds after Sign in, Finish setup, and Create', async () => {
    const upserts = cloudStore()
    const created = await createStudioAccount('Harshvardhan', 'loompass', 'loompass')
    expect(created).toEqual({ ok: true, username: 'Harshvardhan' })
    expect(boundUsername()).toBe('Harshvardhan')
    expect(localStorage.getItem('fabriccost.device_bind')).toBe('Harshvardhan')
    expect(upserts).toEqual(['Harshvardhan'])

    logout()
    expect(boundUsername()).toBe('Harshvardhan')
    const started = await beginSignIn('HARSHVARDHAN', 'loompass')
    expect(started).toEqual({ status: 'ok', username: 'Harshvardhan' })
    expect(boundUsername()).toBe('Harshvardhan')

    switchStudioAccount(true)
    expect(boundUsername()).toBeNull()

    const recovered = await beginSignIn('harshvardhan', 'x')
    expect(recovered).toEqual({ status: 'finish-setup', username: 'Harshvardhan' })
    const finished = await finishDeviceSetup('HARSHVARDHAN', 'newpass', 'newpass')
    expect(finished).toEqual({ ok: true, username: 'Harshvardhan' })
    expect(boundUsername()).toBe('Harshvardhan')
    expect(upserts).toEqual(['Harshvardhan', 'Harshvardhan'])
  })

  it('blocks Create / Sign-in for a different username and does not upsert a second cloud person', async () => {
    const upserts = cloudStore()
    await createStudioAccount('Harshvardhan', 'loompass', 'loompass')
    logout()

    const created = await createStudioAccount('Maya', 'otherpw', 'otherpw')
    expect(created).toMatchObject({ ok: false, code: 'BOUND', username: 'Harshvardhan' })
    expect(created.ok === false && created.error).toMatch(/set up for Harshvardhan/)
    expect(created.ok === false && created.error).toMatch(/Switch account/)
    expect(findAccount('Maya')).toBeUndefined()
    expect(loadAccounts().map((row) => row.username)).toEqual(['Harshvardhan'])

    const started = await beginSignIn('Maya', 'otherpw')
    expect(started.status).toBe('error')
    expect(started.status === 'error' && started.error).toMatch(/set up for Harshvardhan/)

    const finished = await finishDeviceSetup('Maya', 'otherpw', 'otherpw')
    expect(finished).toMatchObject({ ok: false, code: 'BOUND' })
    expect(upserts).toEqual(['Harshvardhan'])
  })

  it('Create of an existing cloud username_norm is taken (same row, never a case-variant person)', async () => {
    const upserts = cloudStore({ harshvardhan: 'Harshvardhan' })
    const created = await createStudioAccount('harshvardhan', 'loompass', 'loompass')
    expect(created).toMatchObject({ ok: false, code: 'TAKEN', username: 'Harshvardhan' })
    expect(created.ok === false && created.error).toBe(USERNAME_TAKEN_CLOUD)
    expect(findAccount('HARSHVARDHAN')).toBeUndefined()
    expect(upserts).toEqual([])
  })

  it('Switch account is a no-op without confirm and clears bind + hash only after confirm', async () => {
    cloudStore()
    await createStudioAccount('Harshvardhan', 'loompass', 'loompass')
    logout()

    const declined = switchStudioAccount(false)
    expect(declined).toEqual({ switched: false, bound: 'Harshvardhan' })
    expect(boundUsername()).toBe('Harshvardhan')
    expect(findAccount('Harshvardhan')?.username).toBe('Harshvardhan')

    const accepted = switchStudioAccount(true)
    expect(accepted).toEqual({ switched: true, bound: null })
    expect(boundUsername()).toBeNull()
    expect(loadAccounts()).toEqual([])
    expect(localStorage.getItem('fabriccost.device_bind')).toBeNull()

    const created = await createStudioAccount('Maya', 'loompass', 'loompass')
    expect(created).toEqual({ ok: true, username: 'Maya' })
    expect(boundUsername()).toBe('Maya')
  })

  it('blocks a second username when only the bind stamp remains (local hash wiped)', async () => {
    const upserts = cloudStore()
    await createStudioAccount('Harshvardhan', 'loompass', 'loompass')
    logout()
    localStorage.removeItem('fabriccost.accounts')
    expect(loadAccounts()).toEqual([])
    expect(boundUsername()).toBe('Harshvardhan')

    const created = await createStudioAccount('Maya', 'loompass', 'loompass')
    expect(created).toMatchObject({ ok: false, code: 'BOUND' })
    expect(upserts).toEqual(['Harshvardhan'])

    const recovered = await beginSignIn('Harshvardhan', 'x')
    expect(recovered).toEqual({ status: 'finish-setup', username: 'Harshvardhan' })
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
