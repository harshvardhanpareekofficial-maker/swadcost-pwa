import { IDLE_TTL_MS } from './idle'

/** Copy a legacy swadcost_* key to fabriccost_* once, then drop the old key. */
export function migrateStorageKey(
  oldKey: string,
  newKey: string,
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined,
): void {
  if (!storage || oldKey === newKey) return
  try {
    const next = storage.getItem(newKey)
    const prev = storage.getItem(oldKey)
    if (next == null && prev != null) {
      storage.setItem(newKey, prev)
    }
    if (prev != null) storage.removeItem(oldKey)
  } catch {
    /* private mode / quota */
  }
}

export function safeGet(storage: Pick<Storage, 'getItem'> | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function safeSet(storage: Pick<Storage, 'setItem'> | undefined, key: string, value: string): void {
  try {
    storage?.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function safeRemove(storage: Pick<Storage, 'removeItem'> | undefined, key: string): void {
  try {
    storage?.removeItem(key)
  } catch {
    /* ignore */
  }
}

function browserLocal(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function browserSession(): Storage | undefined {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}

export const AUTH_ACCOUNTS_KEY = 'fabriccost.accounts'
export const AUTH_SESSION_KEY = 'fabriccost.auth_session'
export const AUTH_USER_KEY = 'fabriccost.auth_user'
export const ACCOUNT_META_KEY = 'fabriccost.account_meta'
export const CALC_EVENTS_KEY = 'fabriccost.calc_events'
export const OWNER_SESSION_KEY = 'fabriccost.owner_ok'
/** Bump to empty the local account store once (drops historic demo seeds). */
export const ACCOUNTS_EPOCH_KEY = 'fabriccost.accounts_epoch'
export const ACCOUNTS_EPOCH = 'empty-2026-09'

function stampAccountsEpoch(local: Storage): boolean {
  try {
    local.setItem(ACCOUNTS_EPOCH_KEY, ACCOUNTS_EPOCH)
  } catch {
    return false
  }
  return safeGet(local, ACCOUNTS_EPOCH_KEY) === ACCOUNTS_EPOCH
}

/** Keep hashed accounts that are still inside the idle window — never loop-wipe a new studio login. */
export function hasFreshHashedAccounts(raw: string | null, now = Date.now()): boolean {
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return false
    return parsed.some((row) => {
      if (!row || typeof row !== 'object') return false
      const rec = row as Record<string, unknown>
      if (typeof rec.passwordHash !== 'string' || rec.passwordHash.length === 0) return false
      const created = typeof rec.createdAt === 'number' ? rec.createdAt : 0
      const active = typeof rec.lastActiveAt === 'number' ? rec.lastActiveAt : created
      const at = active > 0 ? active : created
      return Number.isFinite(at) && at > 0 && now - at <= IDLE_TTL_MS
    })
  } catch {
    return false
  }
}

function wipeLocalAccountStore(local: Storage | undefined): void {
  if (!local) return
  if (safeGet(local, ACCOUNTS_EPOCH_KEY) === ACCOUNTS_EPOCH) return
  // Stamp first. If the marker cannot persist, skip the delete so every load
  // cannot wipe a brand-new Create account.
  if (!stampAccountsEpoch(local)) return
  if (hasFreshHashedAccounts(safeGet(local, AUTH_ACCOUNTS_KEY))) return
  safeRemove(local, AUTH_ACCOUNTS_KEY)
  safeRemove(local, AUTH_SESSION_KEY)
  safeRemove(local, AUTH_USER_KEY)
  safeRemove(local, ACCOUNT_META_KEY)
}

export function migrateAuthStorage(): void {
  const local = browserLocal()
  migrateStorageKey('swadcost.accounts', AUTH_ACCOUNTS_KEY, local)
  migrateStorageKey('swadcost_auth_session', AUTH_SESSION_KEY, local)
  migrateStorageKey('swadcost_auth_user', AUTH_USER_KEY, local)
  wipeLocalAccountStore(local)
}

export function migrateTelemetryStorage(): void {
  const local = browserLocal()
  migrateStorageKey('swadcost.account_meta', ACCOUNT_META_KEY, local)
  migrateStorageKey('swadcost.calc_events', CALC_EVENTS_KEY, local)
  // Epoch wipe stays on migrateAuthStorage only — a telemetry read must not
  // delete hashed accounts.
}

export function migrateOwnerStorage(): void {
  migrateStorageKey('swadcost.owner_ok', OWNER_SESSION_KEY, browserSession())
}
