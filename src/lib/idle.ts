/** Idle-account policy for fabriccost STUDIO. */

export const IDLE_TTL_DAYS = 12
export const IDLE_TTL_MS = IDLE_TTL_DAYS * 24 * 60 * 60 * 1000

export function isIdleTimestamp(at: number, now = Date.now()): boolean {
  if (!Number.isFinite(at) || at <= 0) return true
  return now - at > IDLE_TTL_MS
}

export function idleCutoffIso(now = Date.now()): string {
  return new Date(now - IDLE_TTL_MS).toISOString()
}

export function parseIsoMillis(iso: string | undefined | null): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : null
}
