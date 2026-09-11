// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACCOUNT_META_KEY, ACCOUNTS_EPOCH, ACCOUNTS_EPOCH_KEY } from './storage'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(ACCOUNTS_EPOCH_KEY, ACCOUNTS_EPOCH)
  vi.resetModules()
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('accountRememberedElsewhere', () => {
  it('matches a local telemetry name case-insensitively', async () => {
    localStorage.setItem(
      ACCOUNT_META_KEY,
      JSON.stringify([
        {
          id: '1',
          username: 'Harshvardhan Pareek',
          createdAt: '2026-09-11T00:00:00.000Z',
          lastActiveAt: '2026-09-11T00:00:00.000Z',
        },
      ]),
    )
    const { accountRememberedElsewhere } = await import('./telemetry')
    await expect(accountRememberedElsewhere('HARSHVARDHAN PAREEK')).resolves.toBe(true)
    await expect(accountRememberedElsewhere('nobody-yet')).resolves.toBe(false)
  })

  it('treats a Supabase username_norm hit as remembered', async () => {
    vi.doMock('./supabase', () => ({
      getSupabase: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: async () => ({ data: [{ username: 'Harshvardhan Pareek' }], error: null }),
            }),
            ilike: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
    }))
    const { accountRememberedElsewhere } = await import('./telemetry')
    await expect(accountRememberedElsewhere('harshvardhan pareek')).resolves.toBe(true)
  })
})
