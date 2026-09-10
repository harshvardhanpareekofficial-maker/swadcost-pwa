import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Stepper } from '../components/Stepper'
import { NumberField } from '../components/NumberField'
import { PrimaryButton } from '../components/PrimaryButton'
import {
  calculateMulti,
  calculateSingle,
  formatInr,
  type CostBreakdown,
  type MultiInputs,
  type SingleInputs,
} from '../lib/costing'
import { validateMultiInputs, validateSingleInputs, type CostMode } from '../lib/types'

type Props = {
  fabricName: string
  mode: CostMode
  single: SingleInputs
  multi: MultiInputs
  result: CostBreakdown
  onChangeSingle: (s: SingleInputs) => void
  onChangeMulti: (m: MultiInputs) => void
  onResult: (r: CostBreakdown) => void
  onHome: () => void
  onBackEdit: () => void
}

export function ResultsPage({
  fabricName,
  mode,
  single,
  multi,
  result,
  onChangeSingle,
  onChangeMulti,
  onResult,
  onHome,
  onBackEdit,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function recalculate() {
    try {
      setError(null)
      const err = mode === 'single' ? validateSingleInputs(single) : validateMultiInputs(multi)
      if (err) {
        setError(err)
        return
      }
      const r = mode === 'single' ? calculateSingle(single) : calculateMulti(multi)
      onResult(r)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed')
    }
  }

  return (
    <Layout title="Cost breakdown" subtitle={fabricName || 'Untitled fabric'}>
      <Stepper step={3} />

      <div className="mb-5 rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/20 to-indigo-deep/60 p-5 text-center shadow-xl">
        <p className="text-xs uppercase tracking-widest text-accent-soft">Final cost</p>
        <p className="mt-1 text-4xl font-bold tabular-nums text-cream">{formatInr(result.grandTotal)}</p>
        <p className="mt-2 text-sm text-muted">
          Per length unit: <span className="text-cream">{formatInr(result.costPerUnitLength)}</span>
        </p>
      </div>

      <section className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-card/70 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Summary</h3>
        <Row label="Total ends (Reed × RS)" value={String(result.totalEnds)} />
        <Row label="Warp yarn cost (raw)" value={formatInr(result.warpCostRaw)} />
        <Row label="Weft yarn cost (raw)" value={formatInr(result.weftCostRaw)} />
        <Row label="Yarns after wastage" value={formatInr(result.yarnCostAfterWastage)} />
        <Row label="Sizing" value={formatInr(result.sizingCost)} />
        <Row label="Majuri" value={formatInr(result.majuri)} />
        <Row label="Warping" value={formatInr(result.warping)} />
        <Row label="K constant" value={result.k.toFixed(4)} muted />
      </section>

      <section className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-card/70 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Warp yarns</h3>
        {result.warpLines.map((l) => (
          <div key={l.label} className="rounded-xl bg-ink/40 px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-cream">{l.label}</span>
              <span className="tabular-nums text-accent-soft">{formatInr(l.yarnCostRaw)}</span>
            </div>
            <p className="text-xs text-muted">
              {l.pct}% · Ne {l.count} · rate {l.rate}
              {l.sizingCost != null ? ` · sizing ${formatInr(l.sizingCost)}` : ''}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-card/70 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Weft yarns</h3>
        {result.weftLines.map((l) => (
          <div key={l.label} className="rounded-xl bg-ink/40 px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-cream">{l.label}</span>
              <span className="tabular-nums text-accent-soft">{formatInr(l.yarnCostRaw)}</span>
            </div>
            <p className="text-xs text-muted">
              {l.pct}% · Ne {l.count} · rate {l.rate}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-5 space-y-2 rounded-2xl border border-white/10 bg-card/70 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Markups on final</h3>
        <div className="grid grid-cols-3 gap-2">
          {result.markups.map((m) => (
            <div key={m.pct} className="rounded-xl bg-ink/40 px-2 py-2 text-center">
              <p className="text-[10px] text-muted">+{m.pct}%</p>
              <p className="text-xs font-semibold tabular-nums text-cream">{formatInr(m.amount)}</p>
            </div>
          ))}
        </div>
      </section>

      {editing ? (
        <section className="mb-5 space-y-3 rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <h3 className="text-sm font-semibold text-cream">Edit inputs & recalculate</h3>
          {mode === 'single' ? (
            <>
              {(
                [
                  ['reed', 'Reed', single.reed],
                  ['warpReedspace', 'Warp RS', single.warpReedspace],
                  ['l2l', 'L2L', single.l2l],
                  ['warpCount', 'Warp Count', single.warpCount],
                  ['warpRate', 'Warp Rate', single.warpRate],
                  ['sizingRate', 'Sizing', single.sizingRate],
                  ['pick', 'Pick', single.pick],
                  ['weftReedspace', 'Weft RS', single.weftReedspace],
                  ['weftCount', 'Weft Count', single.weftCount],
                  ['weftRate', 'Weft Rate', single.weftRate],
                  ['wastagePct', 'Wastage %', single.wastagePct],
                  ['majuri', 'Majuri', single.majuri],
                  ['warping', 'Warping', single.warping],
                ] as const
              ).map(([key, label, val]) => (
                <NumberField
                  key={key}
                  label={label}
                  value={val || ''}
                  onChange={(v) =>
                    onChangeSingle({ ...single, [key]: v === '' ? 0 : v })
                  }
                />
              ))}
            </>
          ) : (
            <p className="text-sm text-muted">
              For multi-yarn edits, go back to the fields step for full yarn % / count / rate controls, or tweak
              shared values below.
            </p>
          )}
          {mode === 'multi' ? (
            <>
              {(
                [
                  ['reed', 'Reed', multi.reed],
                  ['warpReedspace', 'Warp RS', multi.warpReedspace],
                  ['l2l', 'L2L', multi.l2l],
                  ['pick', 'Pick', multi.pick],
                  ['weftReedspace', 'Weft RS', multi.weftReedspace],
                  ['wastagePct', 'Wastage %', multi.wastagePct],
                  ['majuri', 'Majuri', multi.majuri],
                  ['warping', 'Warping', multi.warping],
                ] as const
              ).map(([key, label, val]) => (
                <NumberField
                  key={key}
                  label={label}
                  value={val || ''}
                  onChange={(v) =>
                    onChangeMulti({ ...multi, [key]: v === '' ? 0 : v })
                  }
                />
              ))}
            </>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <PrimaryButton onClick={recalculate}>Recalculate</PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </PrimaryButton>
        </section>
      ) : null}

      <div className="space-y-3">
        {!editing ? (
          <PrimaryButton onClick={() => setEditing(true)}>Edit inputs</PrimaryButton>
        ) : null}
        <PrimaryButton variant="secondary" onClick={onBackEdit}>
          Back to all fields
        </PrimaryButton>
        <PrimaryButton variant="ghost" onClick={onHome}>
          New costing
        </PrimaryButton>
      </div>
    </Layout>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className={muted ? 'text-muted' : 'text-muted'}>{label}</span>
      <span className={`tabular-nums ${muted ? 'text-muted' : 'font-medium text-cream'}`}>{value}</span>
    </div>
  )
}
