import type { CostBreakdown, MultiInputs, SingleInputs } from './costing'
import { ACCOUNT_META_KEY, CALC_EVENTS_KEY, migrateTelemetryStorage } from './storage'
import { getSupabase } from './supabase'
import type { CostMode } from './types'

migrateTelemetryStorage()

export type AccountMeta = {
  id: string
  username: string
  createdAt: string
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

function isAccountMeta(value: unknown): value is AccountMeta {
  if (!value || typeof value !== 'object') return false
  const rec = value as Record<string, unknown>
  return typeof rec.id === 'string' && typeof rec.username === 'string' && typeof rec.createdAt === 'string'
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
  return Array.isArray(raw) ? raw.filter(isAccountMeta) : []
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

export async function recordAccount(username: string): Promise<void> {
  const name = username.trim()
  if (!name || name.toLowerCase() === 'guest') return

  const existing = loadLocalAccounts()
  const already = existing.some((a) => a.username.trim().toLowerCase() === name.toLowerCase())
  const row: AccountMeta = already
    ? existing.find((a) => a.username.trim().toLowerCase() === name.toLowerCase())!
    : { id: newId(), username: name, createdAt: new Date().toISOString() }

  if (!already) {
    existing.unshift(row)
    saveLocalAccounts(existing)
  }

  const client = getSupabase()
  if (!client) return
  try {
    await client.from('swadcost_accounts').insert({
      id: row.id,
      username: row.username,
      created_at: row.createdAt,
    })
  } catch {
    /* duplicate or network — local copy already saved */
  }
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
      id: row.id,
      username: row.username,
      fabric_name: row.fabricName,
      mode: row.mode,
      reed: row.reed,
      pick: row.pick,
      warp_rs: row.warpRs,
      quality_label: row.qualityLabel,
      final_cost: row.finalCost,
      payload: row.payload,
      created_at: row.createdAt,
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
          majuri: args.single.majuri,
          warping: args.single.warping,
        }
      : {
          l2l: args.multi.l2l,
          weftReedspace: args.multi.weftReedspace,
          wastagePct: args.multi.wastagePct,
          majuri: args.multi.majuri,
          warping: args.multi.warping,
          warpYarns: args.multi.warpYarns.map((y) => ({ pct: y.pct, count: y.count })),
          weftYarns: args.multi.weftYarns.map((y) => ({ pct: y.pct, count: y.count })),
        }

  void recordCalc({
    username: args.username?.trim() || 'Guest',
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
  return {
    id: typeof row.id === 'string' ? row.id : newId(),
    username,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  }
}

function mapRemoteCalc(row: Record<string, unknown>): CalcEvent | null {
  const mode = row.mode === 'multi' ? 'multi' : row.mode === 'single' ? 'single' : null
  if (!mode) return null
  return {
    id: typeof row.id === 'string' ? row.id : newId(),
    username: typeof row.username === 'string' ? row.username : 'Guest',
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
    const [accountsRes, calcsRes] = await Promise.all([
      client.from('swadcost_accounts').select('id, username, created_at').order('created_at', { ascending: false }),
      client
        .from('swadcost_calcs')
        .select('id, username, fabric_name, mode, reed, pick, warp_rs, quality_label, final_cost, payload, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
    ])

    const remoteAccounts = Array.isArray(accountsRes.data)
      ? accountsRes.data.map((row) => mapRemoteAccount(row as Record<string, unknown>)).filter((row): row is AccountMeta => Boolean(row))
      : []
    const remoteCalcs = Array.isArray(calcsRes.data)
      ? calcsRes.data.map((row) => mapRemoteCalc(row as Record<string, unknown>)).filter((row): row is CalcEvent => Boolean(row))
      : []

    const failed = Boolean(accountsRes.error || calcsRes.error)
    const accounts = mergeById(remoteAccounts, localAccounts)
    const calcs = mergeById(remoteCalcs, localCalcs)
    const source = failed || remoteAccounts.length + remoteCalcs.length === 0 ? 'mixed' : 'supabase'
    return { accounts, calcs, source }
  } catch {
    return { accounts: localAccounts, calcs: localCalcs, source: 'local' }
  }
}
