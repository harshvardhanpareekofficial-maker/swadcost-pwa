import { purgeIdleLocalAccounts } from './auth'
import { purgeIdleLocalTelemetry, purgeIdleSupabase, purgeLocalTelemetryForUsers } from './telemetry'

/**
 * On every app load:
 * 1. Drop hashed localStorage accounts idle > 12 days (and their local telemetry).
 * 2. Delete matching Supabase `swadcost_accounts` + `swadcost_calcs` rows.
 *
 * Remote deletes rely on RLS that only permits idle rows — see
 * `supabase/migrations/20260911_last_active_idle_purge.sql`.
 */
export async function purgeIdleOnLoad(now = Date.now()): Promise<{ local: string[]; remote: number }> {
  const local = purgeIdleLocalNow(now)
  const remote = await purgeIdleSupabase(now)
  return { local, remote }
}

export function purgeIdleLocalNow(now = Date.now()): string[] {
  const fromAuth = purgeIdleLocalAccounts(now)
  purgeLocalTelemetryForUsers(fromAuth)
  const fromMeta = purgeIdleLocalTelemetry(now)
  return [...new Set([...fromAuth, ...fromMeta])]
}
