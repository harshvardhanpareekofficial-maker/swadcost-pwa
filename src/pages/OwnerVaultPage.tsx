import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  checkOwnerPin,
  isOwnerUnlocked,
  lockOwner,
  unlockOwner,
} from '../lib/owner'
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

function RankList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  return (
    <section className="rounded-2xl border border-plum/10 bg-white p-4 shadow-sm">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-plum/60">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-plum/55">No calculate events yet.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={item.label} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink">
                <span className="mr-2 text-plum/40">{index + 1}.</span>
                {item.label}
              </span>
              <span className="tabular-nums font-semibold text-plum">{item.count}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
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
      <div className="flex min-h-dvh flex-col bg-ivory text-ink">
        <header className="border-b border-plum/10 px-5 py-4">
          <p className="font-display text-lg">
            <span className="font-bold">fabriccost</span>
            <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-plum/70">
              STUDIO
            </span>
          </p>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-saffron">Private ledger</p>
          <h1 className="font-display mt-2 text-3xl font-bold">Owner vault</h1>
          <p className="mt-2 text-sm text-plum/70">Enter the studio gate to read account and quality reports.</p>
          <form onSubmit={submitPin} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">
                Gate
              </span>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setError(null)
                  setPin(e.target.value)
                }}
                className="w-full rounded-xl border border-plum/15 bg-white px-3 py-3"
                autoComplete="current-password"
                required
              />
            </label>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-plum font-semibold text-ivory"
            >
              Unlock
            </button>
          </form>
        </main>
        <footer className="px-5 py-3 text-sm text-plum/70">
          Made by <span className="font-semibold text-plum">Harshvardhan Pareek</span>
        </footer>
      </div>
    )
  }

  const sourceLabel =
    source === 'supabase' ? 'Live workspace' : source === 'mixed' ? 'Workspace + this device' : 'This device'

  return (
    <div className="min-h-dvh bg-ivory text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-plum/10 px-5 py-4">
        <div>
          <p className="font-display text-lg">
            <span className="font-bold">fabriccost</span>
            <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-plum/70">
              STUDIO
            </span>
          </p>
          <p className="text-xs text-plum/60">Owner vault · {sourceLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-plum/15 bg-white px-3 py-2 text-xs font-semibold text-plum"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => {
              lockOwner()
              setUnlocked(false)
            }}
            className="rounded-xl bg-plum px-3 py-2 text-xs font-semibold text-ivory"
          >
            Lock
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-plum px-4 py-5 text-ivory">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/70">Accounts</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{accounts.length}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-plum/10">
            <p className="text-[11px] uppercase tracking-[0.18em] text-plum/60">Calculations</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{calcs.length}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-plum/10">
            <p className="text-[11px] uppercase tracking-[0.18em] text-plum/60">Single / Multi</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">
              {report.modeCounts.single} / {report.modeCounts.multi}
            </p>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <RankList title="Most-used fabric names" items={report.topFabrics} />
          <RankList title="Top reed × pick" items={report.topReedPick} />
          <RankList title="Top quality labels" items={report.topQualities} />
        </div>

        <section className="rounded-2xl border border-plum/10 bg-white p-4 shadow-sm">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-plum/60">Accounts</h3>
          {accounts.length === 0 ? (
            <p className="mt-3 text-sm text-plum/55">No accounts recorded yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-plum/50">
                  <tr>
                    <th className="pb-2 font-semibold">User ID</th>
                    <th className="pb-2 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-t border-plum/8">
                      <td className="py-2 font-medium">{account.username}</td>
                      <td className="py-2 text-plum/70">{formatWhen(account.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-plum/10 bg-white p-4 shadow-sm">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-plum/60">Recent calculations</h3>
          {calcs.length === 0 ? (
            <p className="mt-3 text-sm text-plum/55">No calculate events yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-plum/50">
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
                    <tr key={row.id} className="border-t border-plum/8">
                      <td className="py-2 text-plum/70">{formatWhen(row.createdAt)}</td>
                      <td className="py-2">{row.username}</td>
                      <td className="py-2">{row.fabricName || '—'}</td>
                      <td className="py-2 capitalize">{row.mode}</td>
                      <td className="py-2">{row.qualityLabel || '—'}</td>
                      <td className="py-2 tabular-nums">{row.finalCost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="px-5 py-4 text-sm text-plum/70">
        Made by <span className="font-semibold text-plum">Harshvardhan Pareek</span>
      </footer>
    </div>
  )
}
