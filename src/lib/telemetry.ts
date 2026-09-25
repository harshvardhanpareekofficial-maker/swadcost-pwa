import { touchAccountLastActive } from './auth'
import { usernameNorm } from './usernames'
import type { CostBreakdown, MultiInputs, SingleInputs } from './costing'
import { isIdleTimestamp, parseIsoMillis } from './idle'
import { rankQualities, type RankedQuality } from './qualities'
import { ACCOUNT_META_KEY, CALC_EVENTS_KEY, migrateTelemetryStorage } from './storage'
import { gateway } from './gateway'
import { queueCalculation } from './pendingSync'
import { ownerCredential } from './owner'
import { lookupCloudAccount, upsertCloudAccount } from './cloudAccounts'
import type { CostMode } from './types'

migrateTelemetryStorage()

export type AccountMeta = {
  id: string
  username: string
  createdAt: string
  lastActiveAt: string
}

export type CalcEvent = {
  id: string
  username: string
  fabricName: string
  mode: CostMode
  reed: number
  pick: number
  warpRs: number
  qualityLabel: string
  finalCost: number
  payload: Record<string, unknown>
  createdAt: string
}

export type RankedItem = { label: string; count: number }

export type UsageReport = {
  topFabrics: RankedItem[]
  topReedPick: RankedItem[]
  topQualities: RankedItem[]
  rankedQualities: RankedQuality[]
  topQuality: RankedQuality | null
  modeCounts: { single: number; multi: number }
}

function readJson<T>(key: string, fallback: T): T {
  migrateTelemetryStorage()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as unknown
    return parsed as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode */
  }
}

function newId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toAccountMeta(value: unknown): AccountMeta | null {
  if (!value || typeof value !== 'object') return null
  const rec = value as Record<string, unknown>
  if (typeof rec.id !== 'string' || typeof rec.username !== 'string' || typeof rec.createdAt !== 'string') {
    return null
  }
  const lastActiveAt =
    typeof rec.lastActiveAt === 'string' && rec.lastActiveAt.length > 0 ? rec.lastActiveAt : rec.createdAt
  return {
    id: rec.id,
    username: rec.username,
    createdAt: rec.createdAt,
    lastActiveAt,
  }
}

function isCalcEvent(value: unknown): value is CalcEvent {
  if (!value || typeof value !== 'object') return false
  const rec = value as Record<string, unknown>
  return (
    typeof rec.id === 'string' &&
    typeof rec.username === 'string' &&
    (rec.mode === 'single' || rec.mode === 'multi') &&
    typeof rec.createdAt === 'string'
  )
}

export function loadLocalAccounts(): AccountMeta[] {
  const raw = readJson<unknown>(ACCOUNT_META_KEY, [])
  return Array.isArray(raw) ? raw.map(toAccountMeta).filter((row): row is AccountMeta => Boolean(row)) : []
}

export function loadLocalCalcs(): CalcEvent[] {
  const raw = readJson<unknown>(CALC_EVENTS_KEY, [])
  return Array.isArray(raw) ? raw.filter(isCalcEvent) : []
}

function saveLocalAccounts(accounts: AccountMeta[]): void {
  writeJson(ACCOUNT_META_KEY, accounts)
}

function saveLocalCalcs(events: CalcEvent[]): void {
  writeJson(CALC_EVENTS_KEY, events)
}

export function qualityLabel(reed: number, pick: number): string {
  if (!Number.isFinite(reed) || !Number.isFinite(pick) || reed <= 0 || pick <= 0) return ''
  return `${reed}×${pick}`
}

export function rankLabels(values: string[], limit = 8): RankedItem[] {
  const counts = new Map<string, number>()
  for (const value of values) {
    const label = value.trim() || '(untitled)'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }))
}

export function buildUsageReport(calcs: CalcEvent[]): UsageReport {
  const rankedQualities = rankQualities(calcs)
  return {
    topFabrics: rankLabels(calcs.map((c) => c.fabricName)),
    topReedPick: rankLabels(calcs.map((c) => qualityLabel(c.reed, c.pick) || '(n/a)')),
    topQualities: rankedQualities.map((q) => ({ label: q.label, count: q.count })),
    rankedQualities,
    topQuality: rankedQualities[0] ?? null,
    modeCounts: {
      single: calcs.filter((c) => c.mode === 'single').length,
      multi: calcs.filter((c) => c.mode === 'multi').length,
    },
  }
}

function usernameKey(name: string): string {
  return usernameNorm(name)
}

/** True when local telemetry or Supabase remembers the name (no password is stored remotely). */
export async function accountRememberedElsewhere(username: string): Promise<boolean> {
  const key = usernameNorm(username)
  if (!key) return false
  if (loadLocalAccounts().some((row) => usernameNorm(row.username) === key)) return true

  return (await lookupCloudAccount(username)).status === 'found'
}
async function syncLastActiveRemote(username: string, _atIso: string): Promise<void> {
  await upsertCloudAccount(username)
}

/** Record (or refresh) an account and stamp last_active_at. Never sends a password. */
export async function markAccountActive(username: string, at = new Date()): Promise<void> {
  const name = username.trim()
  if (!name || usernameNorm(name) === 'guest') return

  touchAccountLastActive(name, at.getTime())

  const existing = loadLocalAccounts()
  const key = usernameKey(name)
  const atIso = at.toISOString()
  const already = existing.find((a) => usernameKey(a.username) === key)
  if (already) {
    already.lastActiveAt = atIso
    saveLocalAccounts(existing)
  } else {
    existing.unshift({
      id: newId(),
      username: name,
      createdAt: atIso,
      lastActiveAt: atIso,
    })
    saveLocalAccounts(existing)
  }

  await syncLastActiveRemote(name, atIso)
}

/** @deprecated Prefer markAccountActive — kept for older call sites. */
export async function recordAccount(username: string): Promise<void> {
  await markAccountActive(username)
}

export async function recordCalc(event: Omit<CalcEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<void> {
  const row: CalcEvent = {
    id: event.id ?? newId(),
    username: event.username,
    fabricName: event.fabricName,
    mode: event.mode,
    reed: event.reed,
    pick: event.pick,
    warpRs: event.warpRs,
    qualityLabel: event.qualityLabel,
    finalCost: event.finalCost,
    payload: event.payload,
    createdAt: event.createdAt ?? new Date().toISOString(),
  }

  const events = loadLocalCalcs()
  events.unshift(row)
  saveLocalCalcs(events.slice(0, 400))

  try { queueCalculation(row) }
  catch { /* Storage is full; the local recent-history copy is already retained. */ }
}

export function recordSuccessfulCalc(args: {
  username: string | null
  fabricName: string
  mode: CostMode
  single: SingleInputs
  multi: MultiInputs
  result: CostBreakdown
}): void {
  const input = args.mode === 'single' ? args.single : args.multi
  const reed = input.reed
  const pick = input.pick
  const warpRs = input.warpReedspace
  const payload = { ...input, pickRateUnit: 'paise', result: args.result }

  const username = args.username?.trim() || 'unknown'
  if (args.username?.trim()) void markAccountActive(args.username)

  void recordCalc({
    username,
    fabricName: args.fabricName.trim() || 'Untitled fabric',
    mode: args.mode,
    reed,
    pick,
    warpRs,
    qualityLabel: qualityLabel(reed, pick),
    finalCost: args.result.grandTotal,
    payload,
  })
}

function mapRemoteAccount(row: Record<string, unknown>): AccountMeta | null {
  const username = typeof row.username === 'string' ? row.username : ''
  if (!username) return null
  const createdAt = typeof row.created_at === 'string' ? row.created_at : new Date().toISOString()
  const lastActiveAt = typeof row.last_active_at === 'string' ? row.last_active_at : createdAt
  return {
    id: typeof row.id === 'string' ? row.id : newId(),
    username,
    createdAt,
    lastActiveAt,
  }
}

function mapRemoteCalc(row: Record<string, unknown>): CalcEvent | null {
  const mode = row.mode === 'multi' ? 'multi' : row.mode === 'single' ? 'single' : null
  if (!mode) return null
  return {
    id: typeof row.id === 'string' ? row.id : newId(),
    username: typeof row.username === 'string' ? row.username : 'unknown',
    fabricName: typeof row.fabric_name === 'string' ? row.fabric_name : '',
    mode,
    reed: Number(row.reed) || 0,
    pick: Number(row.pick) || 0,
    warpRs: Number(row.warp_rs) || 0,
    qualityLabel: typeof row.quality_label === 'string' ? row.quality_label : '',
    finalCost: Number(row.final_cost) || 0,
    payload: row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : {},
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  }
}

function laterIso(a: string, b: string): string {
  return a > b ? a : b
}

export function mergeAccountsByUsername(remote: AccountMeta[], local: AccountMeta[]): AccountMeta[] {
  const map = new Map<string, AccountMeta>()
  for (const row of [...local, ...remote]) {
    const key = usernameKey(row.username)
    const prev = map.get(key)
    if (!prev) {
      map.set(key, row)
      continue
    }
    map.set(key, {
      id: remote.some((r) => r.id === row.id) ? row.id : prev.id,
      username: row.username || prev.username,
      createdAt: prev.createdAt <= row.createdAt ? prev.createdAt : row.createdAt,
      lastActiveAt: laterIso(prev.lastActiveAt, row.lastActiveAt),
    })
  }
  return [...map.values()].sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))
}

export function purgeLocalTelemetryForUsers(usernames: string[]): void {
  if (usernames.length === 0) return
  const keys = new Set(usernames.map(usernameKey))
  saveLocalAccounts(loadLocalAccounts().filter((row) => !keys.has(usernameKey(row.username))))
  saveLocalCalcs(loadLocalCalcs().filter((row) => !keys.has(usernameKey(row.username))))
}

export function purgeIdleLocalTelemetry(now = Date.now()): string[] {
  const idle = loadLocalAccounts().filter((row) => {
    const at = parseIsoMillis(row.lastActiveAt) ?? parseIsoMillis(row.createdAt) ?? 0
    return isIdleTimestamp(at, now)
  })
  const names = idle.map((row) => row.username)
  purgeLocalTelemetryForUsers(names)
  return names
}

/** Remote retention is not run by untrusted browsers. Existing data is preserved. */
export async function purgeIdleSupabase(_now = Date.now()): Promise<number> { return 0 }

export async function loadOwnerSnapshot(): Promise<{accounts:AccountMeta[];calcs:CalcEvent[];source:'supabase'}> {
  const snap=await gateway<{accounts:Record<string,unknown>[];calcs:Record<string,unknown>[]}>({action:'owner'},ownerCredential())
  return {
    accounts:snap.accounts.map(mapRemoteAccount).filter((r):r is AccountMeta=>!!r),
    calcs:snap.calcs.map(mapRemoteCalc).filter((r):r is CalcEvent=>!!r),
    source:'supabase',
  }
}
