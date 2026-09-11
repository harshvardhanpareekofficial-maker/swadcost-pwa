import { IDLE_TTL_DAYS, isIdleTimestamp } from './idle'
import {
  AUTH_ACCOUNTS_KEY,
  AUTH_SESSION_KEY,
  AUTH_USER_KEY,
  DEVICE_BIND_KEY,
  migrateAuthStorage,
  safeGet,
  safeRemove,
  safeSet,
} from './storage'
import { displayUsername, usernameNorm } from './usernames'

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

export const NO_LOCAL_ACCOUNT =
  'No account found for that username on this device. Create an account if you are new.'

export const ACCOUNT_SAVE_FAILED =
  'Could not save the account in this browser. Allow site data / localStorage and try Create account again.'

export const USERNAME_TAKEN =
  'That username is already set up on this device. Sign in instead.'

export { usernameNorm }

export type Account = {
  username: string
  passwordHash: string
  createdAt: number
  lastActiveAt: number
}

export type AuthResult =
  | { ok: true; username: string }
  | { ok: false; error: string; code?: 'NO_LOCAL' | 'CLOUD_SYNC' | 'TAKEN' | 'INVALID' | 'BOUND'; username?: string }

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

/** @deprecated Use usernameNorm — kept as the same trim + lower key. */
export function normalizeUsername(username: string): string {
  return usernameNorm(username)
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

function persistAccounts(accounts: Account[]): boolean {
  const payload = JSON.stringify(accounts)
  writeStorage(AUTH_ACCOUNTS_KEY, payload)
  const raw = safeGet(localStore(), AUTH_ACCOUNTS_KEY)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) && parsed.length === accounts.length
  } catch {
    return false
  }
}

export function findAccount(username: string, accounts = loadAccounts()): Account | undefined {
  const key = usernameNorm(username)
  if (!key) return undefined
  return accounts.find((account) => usernameNorm(account.username) === key)
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
  return sha256Hex(`${usernameNorm(username)}\0${password}`)
}

export function establishSession(username: string): void {
  writeStorage(AUTH_SESSION_KEY, '1')
  writeStorage(AUTH_USER_KEY, username)
  stampDeviceBind(username)
}

export function deviceBoundMessage(bound: string): string {
  return `This device is set up for ${bound}. Sign in as ${bound}, or use Switch account.`
}

/** Prefer the local hashed account; fall back to the bind stamp after logout or a hash wipe. */
export function boundUsername(): string | null {
  const accounts = loadAccounts()
  if (accounts[0]?.username) return accounts[0].username
  const stamp = readStorage(DEVICE_BIND_KEY)
  const name = stamp ? displayUsername(stamp) : ''
  return name || null
}

export function stampDeviceBind(username: string): void {
  const name = displayUsername(username)
  if (!name || usernameNorm(name) === 'guest') return
  writeStorage(DEVICE_BIND_KEY, name)
}

/** Block Create / Sign-in / Finish setup for a different username than this device is bound to. */
export function deviceBoundBlock(username: string): string | null {
  if (findAccount(username)) return null
  const bound = boundUsername()
  if (!bound) return null
  if (usernameNorm(bound) === usernameNorm(username)) return null
  return deviceBoundMessage(bound)
}

export function deviceBoundError(username: string): Extract<AuthResult, { ok: false }> | null {
  const error = deviceBoundBlock(username)
  if (!error) return null
  return { ok: false, error, code: 'BOUND', username: boundUsername() ?? undefined }
}

/** Clears local hashed accounts + bind stamp. Does not touch the cloud. */
export function clearLocalDevice(): void {
  persistAccounts([])
  logout()
  removeStorage(DEVICE_BIND_KEY)
}

/** Switch account — same as clearLocalDevice. Call only after the user confirms. */
export function switchAccount(): void {
  clearLocalDevice()
}

export function isAuthenticated(): boolean {
  if (readStorage(AUTH_SESSION_KEY) !== '1') return false
  const user = readStorage(AUTH_USER_KEY)
  // Legacy “explore first” guest sessions are no longer valid.
  if (!user || usernameNorm(user) === 'guest') {
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
  const key = usernameNorm(username)
  if (!key) return undefined
  let found: Account | undefined
  const next = accounts.map((account) => {
    if (usernameNorm(account.username) !== key) return account
    found = { ...account, lastActiveAt: at }
    return found
  })
  if (found) persistAccounts(next)
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
  if (removed.length > 0) persistAccounts(kept)

  const user = readStorage(AUTH_USER_KEY)
  if (user && removed.some((name) => usernameNorm(name) === usernameNorm(user))) {
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
    return { ok: false, error: NO_LOCAL_ACCOUNT, code: 'NO_LOCAL' }
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
  establishSession(account.username)
  return { ok: true, username: account.username }
}

export function validateNewAccount(
  username: string,
  password: string,
  confirmPassword: string,
): string | null {
  const name = displayUsername(username)
  if (!name) return 'Enter a name to use as your username.'
  if (usernameNorm(name) === 'guest') return 'That username is reserved. Choose another name.'
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
  const registered = await registerLocalPassword(username, password, confirmPassword)
  if (!registered.ok) return registered
  establishSession(registered.username)
  return registered
}

/** Persist a local hash without opening a session. Used by Finish setup / atomic create. */
export async function registerLocalPassword(
  username: string,
  password: string,
  confirmPassword: string,
): Promise<AuthResult> {
  const validationError = validateNewAccount(username, password, confirmPassword)
  if (validationError) return { ok: false, error: validationError, code: 'INVALID' }

  const name = displayUsername(username)
  const accounts = loadAccounts()
  if (findAccount(name, accounts)) {
    return { ok: false, error: USERNAME_TAKEN, code: 'TAKEN', username: findAccount(name, accounts)?.username }
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
  if (!persistAccounts(accounts) || !findAccount(name)) {
    return loginFailure(ACCOUNT_SAVE_FAILED)
  }
  stampDeviceBind(name)
  return { ok: true, username: name }
}
