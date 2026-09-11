import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('lookupCloudAccount default', () => {
  it('is unavailable when getSupabase() is null — never a confirmed miss', async () => {
    vi.doMock('./supabase', () => ({
      getSupabase: () => null,
    }))
    const { lookupCloudAccount, CLOUD_NOT_CONFIGURED } = await import('./cloudAccounts')
    await expect(lookupCloudAccount('Harshvardhan')).resolves.toEqual({
      status: 'unavailable',
      error: CLOUD_NOT_CONFIGURED,
    })
  })

  it('finds a username_norm hit for Harshvardhan case variants', async () => {
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
    const { lookupCloudAccount } = await import('./cloudAccounts')
    for (const name of ['Harshvardhan', 'harshvardhan', 'HARSHVARDHAN', ' Harshvardhan ']) {
      await expect(lookupCloudAccount(name)).resolves.toEqual({
        status: 'found',
        username: 'Harshvardhan',
        usernameNorm: 'harshvardhan',
      })
    }
  })

  it('is unavailable when the studio list query errors', async () => {
    vi.doMock('./supabase', () => ({
      getSupabase: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: async () => ({ data: null, error: { message: 'JWT expired' } }),
            }),
          }),
        }),
      }),
    }))
    const { lookupCloudAccount, CLOUD_UNAVAILABLE } = await import('./cloudAccounts')
    await expect(lookupCloudAccount('Harshvardhan')).resolves.toEqual({
      status: 'unavailable',
      error: CLOUD_UNAVAILABLE,
    })
  })

  it('returns missing only after a successful empty lookup', async () => {
    vi.doMock('./supabase', () => ({
      getSupabase: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
            ilike: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }))
    const { lookupCloudAccount } = await import('./cloudAccounts')
    await expect(lookupCloudAccount('nobody-yet')).resolves.toEqual({ status: 'missing' })
  })
})
