import { touchAccountLastActive } from './auth'
import { usernameNorm } from './usernames'
import type { CostBreakdown, MultiInputs, SingleInputs } from './costing'
import { idleCutoffIso, isIdleTimestamp, parseIsoMillis } from './idle'
import { ACCOUNT_META_KEY, CALC_EVENTS_KEY, migrateTelemetryStorage } from './storage'
import { getSupabase } from './supabase'
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
  return {
    topFabrics: rankLabels(calcs.map((c) => c.fabricName)),
    topReedPick: rankLabels(calcs.map((c) => qualityLabel(c.reed, c.pick) || '(n/a)')),
    topQualities: rankLabels(calcs.map((c) => c.qualityLabel || qualityLabel(c.reed, c.pick) || '(n/a)')),
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

  const client = getSupabase()
  if (!client) return false
  try {
    const byNorm = await client.from('swadcost_accounts').select('username').eq('username_norm', key).limit(1)
    if (!byNorm.error && Array.isArray(byNorm.data) && byNorm.data.length > 0) return true
    if (byNorm.error && !looksMissingColumn(byNorm.error.message, 'username_norm')) return false
    const byName = await client.from('swadcost_accounts').select('username').ilike('username', key).limit(1)
    return !byName.error && Array.isArray(byName.data) && byName.data.length > 0
  } catch {
    return false
  }
}

async function syncLastActiveRemote(username: string, atIso: string): Promise<void> {
  const client = getSupabase()
  if (!client) return
  try {
    const withStamp = await client.from('swadcost_accounts').upsert(
      { username, last_active_at: atIso },
      { onConflict: 'username_norm' },
    )
    if (withStamp.error) {
      await client.from('swadcost_accounts').upsert({ username }, { onConflict: 'username_norm' })
    }
  } catch {
    /* network — local copy already saved */
  }
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

  const client = getSupabase()
  if (!client) return
  try {
    await client.from('swadcost_calcs').insert({
      username: row.username,
      fabric_name: row.fabricName,
      mode: row.mode,
      reed: row.reed,
      pick: row.pick,
      warp_rs: row.warpRs,
      quality_label: row.qualityLabel || null,
      final_cost: row.finalCost,
      payload: row.payload,
    })
  } catch {
    /* local copy already saved */
  }
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
  const payload =
    args.mode === 'single'
      ? {
          l2l: args.single.l2l,
          warpCount: args.single.warpCount,
          weftCount: args.single.weftCount,
          weftReedspace: args.single.weftReedspace,
          wastagePct: args.single.wastagePct,
          pickRate: args.single.pickRate,
          warping: args.single.warping,
        }
      : {
          l2l: args.multi.l2l,
          weftReedspace: args.multi.weftReedspace,
          wastagePct: args.multi.wastagePct,
          pickRate: args.multi.pickRate,
          warping: args.multi.warping,
          warpYarns: args.multi.warpYarns.map((y) => ({ pct: y.pct, count: y.count })),
          weftYarns: args.multi.weftYarns.map((y) => ({ pct: y.pct, count: y.count })),
        }

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

function mergeById<T extends { id: string; createdAt: string }>(remote: T[], local: T[]): T[] {
  const map = new Map<string, T>()
  for (const row of [...local, ...remote]) map.set(row.id, row)
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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

function looksMissingColumn(message: string | undefined, column: string): boolean {
  if (!message) return false
  return message.toLowerCase().includes(column.toLowerCase())
}

/** Delete idle rows from swadcost_accounts + matching swadcost_calcs. RLS only allows idle rows. */
export async function purgeIdleSupabase(now = Date.now()): Promise<number> {
  const client = getSupabase()
  if (!client) return 0
  const cutoff = idleCutoffIso(now)

  try {
    const listed = await client
      .from('swadcost_accounts')
      .select('username, last_active_at, created_at')
      .or(`last_active_at.lt.${cutoff},and(last_active_at.is.null,created_at.lt.${cutoff})`)

    let idleNames: string[] = []
    if (listed.error && looksMissingColumn(listed.error.message, 'last_active_at')) {
      const fallback = await client
        .from('swadcost_accounts')
        .select('username, created_at')
        .lt('created_at', cutoff)
      if (fallback.error || !Array.isArray(fallback.data)) return 0
      idleNames = fallback.data
        .map((row) => (typeof row.username === 'string' ? row.username : ''))
        .filter(Boolean)
    } else if (listed.error || !Array.isArray(listed.data)) {
      return 0
    } else {
      idleNames = listed.data
        .map((row) => (typeof row.username === 'string' ? row.username : ''))
        .filter(Boolean)
    }

    if (idleNames.length === 0) return 0

    for (const name of idleNames) {
      await client.from('swadcost_calcs').delete().ilike('username', name)
    }

    const byStamp = await client.from('swadcost_accounts').delete().lt('last_active_at', cutoff)
    if (byStamp.error && looksMissingColumn(byStamp.error.message, 'last_active_at')) {
      await client.from('swadcost_accounts').delete().lt('created_at', cutoff)
    }

    purgeLocalTelemetryForUsers(idleNames)
    return idleNames.length
  } catch {
    return 0
  }
}

export async function loadOwnerSnapshot(): Promise<{
  accounts: AccountMeta[]
  calcs: CalcEvent[]
  source: 'supabase' | 'local' | 'mixed'
}> {
  const localAccounts = loadLocalAccounts()
  const localCalcs = loadLocalCalcs()
  const client = getSupabase()
  if (!client) {
    return { accounts: localAccounts, calcs: localCalcs, source: 'local' }
  }

  try {
    const withStamp = await client
      .from('swadcost_accounts')
      .select('id, username, created_at, last_active_at')
      .order('created_at', { ascending: false })
    const accountsRes =
      withStamp.error && looksMissingColumn(withStamp.error.message, 'last_active_at')
        ? await client
            .from('swadcost_accounts')
            .select('id, username, created_at')
            .order('created_at', { ascending: false })
        : withStamp

    const calcsRes = await client
      .from('swadcost_calcs')
      .select('id, username, fabric_name, mode, reed, pick, warp_rs, quality_label, final_cost, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    const remoteAccounts = Array.isArray(accountsRes.data)
      ? accountsRes.data
          .map((row) => mapRemoteAccount(row as Record<string, unknown>))
          .filter((row): row is AccountMeta => Boolean(row))
      : []
    const remoteCalcs = Array.isArray(calcsRes.data)
      ? calcsRes.data.map((row) => mapRemoteCalc(row as Record<string, unknown>)).filter((row): row is CalcEvent => Boolean(row))
      : []

    const failed = Boolean(accountsRes.error || calcsRes.error)
    const accounts = mergeAccountsByUsername(remoteAccounts, localAccounts)
    const calcs = mergeById(remoteCalcs, localCalcs)
    const source = failed || remoteAccounts.length + remoteCalcs.length === 0 ? 'mixed' : 'supabase'
    return { accounts, calcs, source }
  } catch {
    return { accounts: localAccounts, calcs: localCalcs, source: 'local' }
  }
}
