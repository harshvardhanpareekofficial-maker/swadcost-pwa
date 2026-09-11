import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Footer } from '../components/Footer'
import { PrimaryButton } from '../components/PrimaryButton'
import { Eyebrow, SectionLabel } from '../components/SectionLabel'
import { StudioBar, StudioBarAction } from '../components/StudioBar'
import { StudioSheet } from '../components/StudioSheet'
import { studioFieldClass, studioLabelClass } from '../components/studio'
import { formatInr } from '../lib/costing'
import { IDLE_TTL_DAYS } from '../lib/idle'
import {
  checkOwnerPin,
  isOwnerUnlocked,
  lockOwner,
  unlockOwner,
} from '../lib/owner'
import { applyDocumentIndexing, PUBLIC_ROBOTS } from '../lib/seo'
import {
  buildUsageReport,
  loadOwnerSnapshot,
  type AccountMeta,
  type CalcEvent,
} from '../lib/telemetry'

function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

function formatRelative(iso: string, now = Date.now()): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return iso
  const diff = now - t
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))} min ago`
  if (diff < 86_400_000) return `${Math.max(1, Math.floor(diff / 3_600_000))} h ago`
  const days = Math.floor(diff / 86_400_000)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function EmptyHint({ children }: { children: string }) {
  return (
    <p className="mt-3 rounded-[14px] border border-dashed border-plum/15 bg-paper/40 px-3.5 py-5 text-center text-sm leading-relaxed text-plum/60">
      {children}
    </p>
  )
}

function RankList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  return (
    <StudioSheet>
      <SectionLabel>{title}</SectionLabel>
      {items.length === 0 ? (
        <EmptyHint>No calculate events yet.</EmptyHint>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={item.label} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 break-words text-ink">
                <span className="mr-2 text-plum/40">{index + 1}.</span>
                {item.label}
              </span>
              <span className="tabular-nums font-semibold text-plum">{item.count}</span>
            </li>
          ))}
        </ol>
      )}
    </StudioSheet>
  )
}

export function OwnerVaultPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState(() => isOwnerUnlocked())
  const [accounts, setAccounts] = useState<AccountMeta[]>([])
  const [calcs, setCalcs] = useState<CalcEvent[]>([])
  const [source, setSource] = useState<'supabase' | 'local' | 'mixed'>('local')
  const [loading, setLoading] = useState(false)

  const report = useMemo(() => buildUsageReport(calcs), [calcs])

  useEffect(() => {
    const prevTitle = document.title
    applyDocumentIndexing(window.location.pathname)
    return () => {
      const robots = document.querySelector('meta[name="robots"]')
      robots?.setAttribute('content', PUBLIC_ROBOTS)
      document.title = prevTitle
    }
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const snap = await loadOwnerSnapshot()
      setAccounts(snap.accounts)
      setCalcs(snap.calcs)
      setSource(snap.source)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (unlocked) void refresh()
  }, [unlocked])

  function submitPin(e: FormEvent) {
    e.preventDefault()
    if (!checkOwnerPin(pin)) {
      setError('That gate code is not right.')
      return
    }
    unlockOwner()
    setError(null)
    setPin('')
    setUnlocked(true)
  }

  if (!unlocked) {
    return (
      <div className="studio-atmosphere flex min-h-dvh min-w-0 flex-col overflow-x-hidden text-ink">
        <StudioBar />
        <main className="mx-auto flex w-full min-w-0 max-w-md flex-1 flex-col justify-center px-4 py-8 sm:px-5 sm:py-10">
          <StudioSheet>
            <Eyebrow>Private ledger</Eyebrow>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink">Owner vault</h1>
            <p className="mt-2 text-sm text-plum/70">Enter the studio gate to read account and quality reports.</p>
            <form onSubmit={submitPin} className="mt-6 space-y-4">
              <label className="block">
                <span className={`mb-1.5 block ${studioLabelClass}`}>Gate</span>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setError(null)
                    setPin(e.target.value)
                  }}
                  className={studioFieldClass}
                  autoComplete="current-password"
                  required
                />
              </label>
              {error ? (
                <p className="rounded-[14px] border border-rose/25 bg-rose/8 px-3.5 py-2.5 text-sm text-rose">
                  {error}
                </p>
              ) : null}
              <PrimaryButton type="submit">Unlock</PrimaryButton>
            </form>
          </StudioSheet>
        </main>
        <Footer className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8" />
      </div>
    )
  }

  const sourceLabel =
    source === 'supabase' ? 'Live workspace' : source === 'mixed' ? 'Workspace + this device' : 'This device'

  return (
    <div className="studio-atmosphere flex min-h-dvh min-w-0 flex-col overflow-x-hidden text-ink">
      <StudioBar
        trailing={
          <>
            <StudioBarAction onClick={() => void refresh()}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </StudioBarAction>
            <StudioBarAction
              variant="plum"
              onClick={() => {
                lockOwner()
                setUnlocked(false)
              }}
            >
              Lock
            </StudioBarAction>
          </>
        }
      />

      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 space-y-4 px-4 py-4 sm:space-y-6 sm:px-8 sm:py-8">
        <div>
          <Eyebrow>Owner vault · {sourceLabel}</Eyebrow>
          <h1 className="font-display mt-1.5 text-[1.65rem] font-semibold tracking-[-0.03em] text-ink sm:mt-2 sm:text-[1.85rem]">
            Usage ledger
          </h1>
          <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-plum/75 sm:text-[0.95rem]">
            Accounts and quality reports from this workspace. Passwords never appear here. Idle accounts
            auto-delete after {IDLE_TTL_DAYS} days without a sign-in or Calculate.
          </p>
        </div>

        <section className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          <div className="rounded-3xl bg-plum px-5 py-4 text-ivory shadow-sheet sm:py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ivory/70">Accounts</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{accounts.length}</p>
          </div>
          <StudioSheet>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Calculations</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">{calcs.length}</p>
          </StudioSheet>
          <StudioSheet>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Single / Multi</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">
              {report.modeCounts.single} / {report.modeCounts.multi}
            </p>
          </StudioSheet>
        </section>

        <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          <RankList title="Most-used fabric names" items={report.topFabrics} />
          <RankList title="Top reed × pick" items={report.topReedPick} />
          <RankList title="Top quality labels" items={report.topQualities} />
        </div>

        <StudioSheet>
          <SectionLabel>Accounts</SectionLabel>
          <p className="mt-1.5 text-xs leading-relaxed text-plum/60">
            Last active updates on successful sign-in and Calculate. Unused accounts are removed after{' '}
            {IDLE_TTL_DAYS} days.
          </p>
          {accounts.length === 0 ? (
            <EmptyHint>No accounts recorded yet. Fresh studios start empty.</EmptyHint>
          ) : (
            <>
              <ul className="mt-3 space-y-2 md:hidden">
                {accounts.map((account) => (
                  <li
                    key={account.id}
                    className="rounded-[14px] border border-plum/10 bg-paper/50 px-3.5 py-3"
                  >
                    <p className="font-medium text-ink">{account.username}</p>
                    <p className="mt-1 text-xs text-plum/65" title={formatWhen(account.lastActiveAt)}>
                      Last active {formatRelative(account.lastActiveAt)}
                    </p>
                    <p className="text-xs text-plum/50">Created {formatWhen(account.createdAt)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-plum/50">
                    <tr>
                      <th className="pb-2 font-semibold">User ID</th>
                      <th className="pb-2 font-semibold">Last active</th>
                      <th className="pb-2 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-t border-plum/10">
                        <td className="py-2.5 font-medium text-ink">{account.username}</td>
                        <td className="py-2.5 text-plum/70" title={formatWhen(account.lastActiveAt)}>
                          {formatRelative(account.lastActiveAt)}
                        </td>
                        <td className="py-2.5 text-plum/70">{formatWhen(account.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </StudioSheet>

        <StudioSheet>
          <SectionLabel>Recent calculations</SectionLabel>
          {calcs.length === 0 ? (
            <EmptyHint>No calculate events yet.</EmptyHint>
          ) : (
            <>
              <ul className="mt-3 space-y-2 md:hidden">
                {calcs.slice(0, 40).map((row) => (
                  <li key={row.id} className="rounded-[14px] border border-plum/10 bg-paper/50 px-3.5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 break-words font-medium text-ink">{row.fabricName || 'Untitled'}</p>
                      <p className="shrink-0 tabular-nums font-semibold text-plum">{formatInr(row.finalCost)}</p>
                    </div>
                    <p className="mt-1 text-xs text-plum/65">
                      {row.username} · {row.mode} · {row.qualityLabel || '—'}
                    </p>
                    <p className="text-xs text-plum/50">{formatWhen(row.createdAt)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-plum/50">
                    <tr>
                      <th className="pb-2 font-semibold">When</th>
                      <th className="pb-2 font-semibold">User</th>
                      <th className="pb-2 font-semibold">Fabric</th>
                      <th className="pb-2 font-semibold">Mode</th>
                      <th className="pb-2 font-semibold">Quality</th>
                      <th className="pb-2 font-semibold">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcs.slice(0, 40).map((row) => (
                      <tr key={row.id} className="border-t border-plum/10">
                        <td className="py-2.5 text-plum/70">{formatWhen(row.createdAt)}</td>
                        <td className="py-2.5 text-ink">{row.username}</td>
                        <td className="py-2.5 text-ink">{row.fabricName || '—'}</td>
                        <td className="py-2.5 capitalize text-ink">{row.mode}</td>
                        <td className="py-2.5 text-ink">{row.qualityLabel || '—'}</td>
                        <td className="py-2.5 tabular-nums font-semibold text-plum">{formatInr(row.finalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </StudioSheet>
      </main>

      <Footer className="px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8" />
    </div>
  )
}
