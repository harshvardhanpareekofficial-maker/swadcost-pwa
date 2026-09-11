const ACCOUNTS_KEY = 'swadcost.accounts'
const SESSION_KEY = 'swadcost_auth_session'
const USER_KEY = 'swadcost_auth_user'

export const DEMO_USERNAME = 'rohitbohara'
export const DEMO_PASSWORD = 'rohitbohara'
export const MIN_PASSWORD_LENGTH = 6

export type Account = {
  username: string
  passwordHash: string
  createdAt: number
}

export type AuthResult = { ok: true; username: string } | { ok: false; error: string }

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  localStorage.setItem(key, value)
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore quota / private-mode errors on logout */
  }
}

function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== 'object') return false
  const rec = value as Record<string, unknown>
  return (
    typeof rec.username === 'string' &&
    rec.username.trim().length > 0 &&
    typeof rec.passwordHash === 'string' &&
    rec.passwordHash.length > 0 &&
    typeof rec.createdAt === 'number'
  )
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function loadAccounts(): Account[] {
  const raw = readStorage(ACCOUNTS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isAccount)
  } catch {
    return []
  }
}

function saveAccounts(accounts: Account[]): void {
  writeStorage(ACCOUNTS_KEY, JSON.stringify(accounts))
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

function envSeedUser(): string {
  return (import.meta.env.VITE_AUTH_USER || import.meta.env.VITE_AUTH_USERNAME || '').trim()
}

function envSeedPass(): string {
  return import.meta.env.VITE_AUTH_PASS || import.meta.env.VITE_AUTH_PASSWORD || ''
}

async function addSeedIfMissing(
  accounts: Account[],
  username: string,
  password: string,
): Promise<boolean> {
  const name = username.trim()
  if (!name || !password) return false
  if (findAccount(name, accounts)) return false
  accounts.push({
    username: name,
    passwordHash: await hashPassword(name, password),
    createdAt: Date.now(),
  })
  return true
}

/** Seed demo + optional VITE_AUTH_* bootstrap accounts into localStorage. */
export async function ensureSeedAccounts(): Promise<void> {
  const accounts = loadAccounts()
  let changed = await addSeedIfMissing(accounts, DEMO_USERNAME, DEMO_PASSWORD)

  const envUser = envSeedUser()
  const envPass = envSeedPass()
  if (envUser && envPass) {
    changed = (await addSeedIfMissing(accounts, envUser, envPass)) || changed
  }

  if (changed) saveAccounts(accounts)
}

function setSession(username: string): void {
  writeStorage(SESSION_KEY, '1')
  writeStorage(USER_KEY, username)
}

export function isAuthenticated(): boolean {
  return readStorage(SESSION_KEY) === '1'
}

export function currentUser(): string | null {
  return readStorage(USER_KEY)
}

export function logout(): void {
  removeStorage(SESSION_KEY)
  removeStorage(USER_KEY)
}

function loginFailure(error: string): AuthResult {
  return { ok: false, error }
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const name = username.trim()
  if (!name) return loginFailure('Enter a username.')
  if (!password) return loginFailure('Enter a password.')

  try {
    await ensureSeedAccounts()
  } catch {
    return loginFailure('Could not prepare saved accounts. Try again.')
  }

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

  try {
    await ensureSeedAccounts()
  } catch {
    return loginFailure('Could not prepare saved accounts. Try again.')
  }

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

  accounts.push({
    username: name,
    passwordHash,
    createdAt: Date.now(),
  })
  saveAccounts(accounts)
  setSession(name)
  return { ok: true, username: name }
}

/** Kept for any leftover callers; prefer login() against the local account store. */
export function getCredentials(): { username: string; password: string } {
  return {
    username: envSeedUser() || DEMO_USERNAME,
    password: envSeedPass() || DEMO_PASSWORD,
  }
}
