import { getSupabase } from './supabase'
import { gateway } from './gateway'
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

async function lookupCloudAccountDefault(norm: string): Promise<CloudLookupResult> {
  if(!getSupabase()) return {status:'unavailable',error:CLOUD_NOT_CONFIGURED}
  try { return await gateway<CloudLookupResult>({action:'lookup',username:norm}) }
  catch { return {status:'unavailable',error:CLOUD_UNAVAILABLE} }
}
async function upsertCloudAccountDefault(username: string): Promise<{ok:true}|{ok:false;error:string}> {
  try { await gateway({action:'activity',username}); return {ok:true} }
  catch { return {ok:false,error:CLOUD_UNAVAILABLE} }
}
