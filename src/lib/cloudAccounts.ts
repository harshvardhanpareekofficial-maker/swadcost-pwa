import { getSupabase } from './supabase'
import { displayUsername, usernameNorm } from './usernames'

export type CloudName = { username: string; usernameNorm: string }

export type CloudLookupResult =
  | { status: 'found'; username: string; usernameNorm: string }
  | { status: 'missing' }
  | { status: 'unavailable'; error: string }

export type CloudLookup = (norm: string) => Promise<CloudLookupResult>
export type CloudUpsert = (username: string) => Promise<{ ok: true } | { ok: false; error: string }>

export const CLOUD_UNAVAILABLE = 'Studio list is unreachable. Check the connection and retry.'
export const CLOUD_NOT_CONFIGURED =
  'The studio list is not available on this build. Refresh after an update and retry — we cannot tell if this username already exists.'

let lookupImpl: CloudLookup = lookupCloudAccountDefault
let upsertImpl: CloudUpsert = upsertCloudAccountDefault

export function __setCloudAccountAdaptersForTests(adapters?: {
  lookup?: CloudLookup
  upsert?: CloudUpsert
}): void {
  lookupImpl = adapters?.lookup ?? lookupCloudAccountDefault
  upsertImpl = adapters?.upsert ?? upsertCloudAccountDefault
}

export async function lookupCloudAccount(username: string): Promise<CloudLookupResult> {
  const norm = usernameNorm(username)
  if (!norm || norm === 'guest') return { status: 'missing' }
  return lookupImpl(norm)
}

export async function upsertCloudAccount(
  username: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = displayUsername(username)
  if (!name) return { ok: false, error: 'Enter a username.' }
  return upsertImpl(name)
}

function looksMissingColumn(message: string | undefined, column: string): boolean {
  if (!message) return false
  return message.toLowerCase().includes(column.toLowerCase())
}

async function lookupCloudAccountDefault(norm: string): Promise<CloudLookupResult> {
  const client = getSupabase()
  if (!client) return { status: 'unavailable', error: CLOUD_NOT_CONFIGURED }
  try {
    const byNorm = await client.from('swadcost_accounts').select('username').eq('username_norm', norm).limit(1)
    if (!byNorm.error && Array.isArray(byNorm.data) && byNorm.data[0] && typeof byNorm.data[0].username === 'string') {
      return { status: 'found', username: byNorm.data[0].username, usernameNorm: norm }
    }
    if (byNorm.error && !looksMissingColumn(byNorm.error.message, 'username_norm')) {
      return { status: 'unavailable', error: CLOUD_UNAVAILABLE }
    }
    const byName = await client.from('swadcost_accounts').select('username').ilike('username', norm).limit(1)
    if (byName.error) return { status: 'unavailable', error: CLOUD_UNAVAILABLE }
    const row = Array.isArray(byName.data) ? byName.data[0] : null
    if (row && typeof row.username === 'string' && usernameNorm(row.username) === norm) {
      return { status: 'found', username: row.username, usernameNorm: norm }
    }
    return { status: 'missing' }
  } catch {
    return { status: 'unavailable', error: CLOUD_UNAVAILABLE }
  }
}

async function upsertCloudAccountDefault(
  username: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getSupabase()
  if (!client) return { ok: true }
  const atIso = new Date().toISOString()
  try {
    const withStamp = await client.from('swadcost_accounts').upsert(
      { username, last_active_at: atIso },
      { onConflict: 'username_norm' },
    )
    if (!withStamp.error) return { ok: true }
    if (looksMissingColumn(withStamp.error.message, 'last_active_at')) {
      const fallback = await client.from('swadcost_accounts').upsert({ username }, { onConflict: 'username_norm' })
      if (!fallback.error) return { ok: true }
    }
    return { ok: false, error: CLOUD_UNAVAILABLE }
  } catch {
    return { ok: false, error: CLOUD_UNAVAILABLE }
  }
}
