import { IDLE_TTL_DAYS, isIdleTimestamp } from './idle'
import {
  AUTH_ACCOUNTS_KEY,
  AUTH_SESSION_KEY,
  AUTH_USER_KEY,
  migrateAuthStorage,
  safeGet,
  safeRemove,
  safeSet,
} from './storage'

migrateAuthStorage()

function localStore(): Storage | undefined {
  try {
    return localStorage
  } catch {
    return undefined
  }
}

export const MIN_PASSWORD_LENGTH = 6
export { IDLE_TTL_DAYS }

export type Account = {
  username: string
  passwordHash: string
  createdAt: number
  lastActiveAt: number
}

export type AuthResult = { ok: true; username: string } | { ok: false; error: string }

function readStorage(key: string): string | null {
  migrateAuthStorage()
  return safeGet(localStore(), key)
}

function writeStorage(key: string, value: string): void {
  safeSet(localStore(), key, value)
}

function removeStorage(key: string): void {
  safeRemove(localStore(), key)
}

function toAccount(value: unknown): Account | null {
  if (!value || typeof value !== 'object') return null
  const rec = value as Record<string, unknown>
  if (
    typeof rec.username !== 'string' ||
    rec.username.trim().length === 0 ||
    typeof rec.passwordHash !== 'string' ||
    rec.passwordHash.length === 0 ||
    typeof rec.createdAt !== 'number'
  ) {
    return null
  }
  const lastActiveAt =
    typeof rec.lastActiveAt === 'number' && Number.isFinite(rec.lastActiveAt)
      ? rec.lastActiveAt
      : rec.createdAt
  return {
    username: rec.username,
    passwordHash: rec.passwordHash,
    createdAt: rec.createdAt,
    lastActiveAt,
  }
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function loadAccounts(): Account[] {
  const raw = readStorage(AUTH_ACCOUNTS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(toAccount).filter((row): row is Account => Boolean(row))
  } catch {
    return []
  }
}

function saveAccounts(accounts: Account[]): void {
  writeStorage(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function findAccount(username: string, accounts = loadAccounts()): Account | undefined {
  const key = normalizeUsername(username)
  if (!key) return undefined
  return accounts.find((account) => normalizeUsername(account.username) === key)
}

async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('Secure hashing is unavailable in this browser.')
  }
  const data = new TextEncoder().encode(value)
  const digest = await subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Username-bound SHA-256 so identical passwords do not share a hash. */
export async function hashPassword(username: string, password: string): Promise<string> {
  return sha256Hex(`${normalizeUsername(username)}\0${password}`)
}

function setSession(username: string): void {
  writeStorage(AUTH_SESSION_KEY, '1')
  writeStorage(AUTH_USER_KEY, username)
}

export function isAuthenticated(): boolean {
  if (readStorage(AUTH_SESSION_KEY) !== '1') return false
  const user = readStorage(AUTH_USER_KEY)
  // Legacy “explore first” guest sessions are no longer valid.
  if (!user || normalizeUsername(user) === 'guest') {
    logout()
    return false
  }
  return true
}

export function currentUser(): string | null {
  if (!isAuthenticated()) return null
  return readStorage(AUTH_USER_KEY)
}

export function logout(): void {
  removeStorage(AUTH_SESSION_KEY)
  removeStorage(AUTH_USER_KEY)
}

function loginFailure(error: string): AuthResult {
  return { ok: false, error }
}

/** Stamp last_active_at on a local hashed account. No-op if the user is not in the store. */
export function touchAccountLastActive(username: string, at = Date.now()): Account | undefined {
  const accounts = loadAccounts()
  const key = normalizeUsername(username)
  if (!key) return undefined
  let found: Account | undefined
  const next = accounts.map((account) => {
    if (normalizeUsername(account.username) !== key) return account
    found = { ...account, lastActiveAt: at }
    return found
  })
  if (found) saveAccounts(next)
  return found
}

/** Drop local hashed accounts idle longer than 12 days. Logs out if the current session was removed. */
export function purgeIdleLocalAccounts(now = Date.now()): string[] {
  const accounts = loadAccounts()
  const kept: Account[] = []
  const removed: string[] = []
  for (const account of accounts) {
    if (isIdleTimestamp(account.lastActiveAt, now)) removed.push(account.username)
    else kept.push(account)
  }
  if (removed.length > 0) saveAccounts(kept)

  const user = readStorage(AUTH_USER_KEY)
  if (user && removed.some((name) => normalizeUsername(name) === normalizeUsername(user))) {
    logout()
  }
  return removed
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const name = username.trim()
  if (!name) return loginFailure('Enter a username.')
  if (!password) return loginFailure('Enter a password.')

  const account = findAccount(name)
  if (!account) {
    return loginFailure('No account found for that username. Create an account if you are new.')
  }

  let hash: string
  try {
    hash = await hashPassword(account.username, password)
  } catch {
    return loginFailure('Could not verify the password in this browser. Try HTTPS or another browser.')
  }

  if (hash !== account.passwordHash) {
    return loginFailure('Incorrect password. Try again.')
  }

  touchAccountLastActive(account.username)
  setSession(account.username)
  return { ok: true, username: account.username }
}

export function validateNewAccount(
  username: string,
  password: string,
  confirmPassword: string,
): string | null {
  const name = username.trim()
  if (!name) return 'Enter a name to use as your username.'
  if (normalizeUsername(name) === 'guest') return 'That username is reserved. Choose another name.'
  if (!password) return 'Enter a password.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password !== confirmPassword) return 'Passwords do not match.'
  return null
}

export async function createAccount(
  username: string,
  password: string,
  confirmPassword: string,
): Promise<AuthResult> {
  const validationError = validateNewAccount(username, password, confirmPassword)
  if (validationError) return loginFailure(validationError)

  const name = username.trim()
  const accounts = loadAccounts()
  if (findAccount(name, accounts)) {
    return loginFailure('That username is already taken. Try another name or sign in.')
  }

  let passwordHash: string
  try {
    passwordHash = await hashPassword(name, password)
  } catch {
    return loginFailure('Could not save the password in this browser. Try HTTPS or another browser.')
  }

  const now = Date.now()
  accounts.push({
    username: name,
    passwordHash,
    createdAt: now,
    lastActiveAt: now,
  })
  saveAccounts(accounts)
  setSession(name)
  return { ok: true, username: name }
}
