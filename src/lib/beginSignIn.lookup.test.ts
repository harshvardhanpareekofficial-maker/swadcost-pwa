// @vitest-environment jsdom
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  localStorage.clear()
})

describe('beginSignIn default cloud lookup', () => {
  it('supabase null → not NO_LOCAL_ACCOUNT', async () => {
    vi.doMock('./supabase', () => ({
      getSupabase: () => null,
      isSupabaseConfigured: () => false,
    }))
    const { beginSignIn } = await import('./studioAuth')
    const { NO_LOCAL_ACCOUNT } = await import('./auth')
    const started = await beginSignIn('Harshvardhan', 'loompass')
    expect(started.status).toBe('error')
    if (started.status === 'error') {
      expect(started.error).not.toBe(NO_LOCAL_ACCOUNT)
      expect(started.error).not.toMatch(/create an account if you are new/i)
      expect(started.error).toMatch(/studio list|retry/i)
    }
  })

  it('cloud hit → finish-setup for case variants', async () => {
    vi.doMock('./supabase', () => ({
      getSupabase: () => ({
        from: () => ({
          select: () => ({
            eq: (_col: string, norm: string) => ({
              limit: async () =>
                norm === 'harshvardhan'
                  ? { data: [{ username: 'Harshvardhan' }], error: null }
                  : { data: [], error: null },
            }),
            ilike: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }))
    const { beginSignIn } = await import('./studioAuth')
    for (const name of ['Harshvardhan', 'harshvardhan', 'HARSHVARDHAN']) {
      await expect(beginSignIn(name, 'x')).resolves.toEqual({
        status: 'finish-setup',
        username: 'Harshvardhan',
      })
    }
  })
})
