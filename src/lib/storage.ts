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
/**
 * Historic one-time leftover wipe (PR #5). The delete path is retired:
 * we only stamp the marker so older clients do not re-enter wipe logic.
 */
export const ACCOUNTS_EPOCH_KEY = 'fabriccost.accounts_epoch'
export const ACCOUNTS_EPOCH = 'empty-2026-09'

function stampAccountsEpoch(local: Storage | undefined): void {
  if (!local) return
  if (safeGet(local, ACCOUNTS_EPOCH_KEY) === ACCOUNTS_EPOCH) return
  safeSet(local, ACCOUNTS_EPOCH_KEY, ACCOUNTS_EPOCH)
}

export function migrateAuthStorage(): void {
  const local = browserLocal()
  migrateStorageKey('swadcost.accounts', AUTH_ACCOUNTS_KEY, local)
  migrateStorageKey('swadcost_auth_session', AUTH_SESSION_KEY, local)
  migrateStorageKey('swadcost_auth_user', AUTH_USER_KEY, local)
  stampAccountsEpoch(local)
}

export function migrateTelemetryStorage(): void {
  const local = browserLocal()
  migrateStorageKey('swadcost.account_meta', ACCOUNT_META_KEY, local)
  migrateStorageKey('swadcost.calc_events', CALC_EVENTS_KEY, local)
}

export function migrateOwnerStorage(): void {
  migrateStorageKey('swadcost.owner_ok', OWNER_SESSION_KEY, browserSession())
}
