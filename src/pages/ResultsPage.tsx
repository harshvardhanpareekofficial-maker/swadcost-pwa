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
import { currentUser } from '../lib/auth'
import { recordSuccessfulCalc } from '../lib/telemetry'
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
      recordSuccessfulCalc({
        username: currentUser(),
        fabricName,
        mode,
        single,
        multi,
        result: r,
      })
      onResult(r)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed')
    }
  }

  return (
    <Layout title="Cost breakdown" subtitle={fabricName || 'Untitled fabric'}>
      <Stepper step={3} />

      <div className="mb-8 border-b border-plum/10 pb-6">
        <p className="font-display text-4xl font-semibold tabular-nums tracking-[-0.03em] text-ink">
          {formatInr(result.grandTotal)}
        </p>
        <p className="mt-2 text-sm text-plum/70">
          Final cost · {formatInr(result.costPerUnitLength)} per length unit
        </p>
      </div>

      <section className="mb-6 space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Summary</h3>
        <Row label="Total ends (Reed × RS)" value={String(result.totalEnds)} />
        <Row label="Warp yarn cost (raw)" value={formatInr(result.warpCostRaw)} />
        <Row label="Weft yarn cost (raw)" value={formatInr(result.weftCostRaw)} />
        <Row label="Yarns after wastage" value={formatInr(result.yarnCostAfterWastage)} />
        <Row label="Sizing" value={formatInr(result.sizingCost)} />
        <Row label="Majuri" value={formatInr(result.majuri)} />
        <Row label="Warping" value={formatInr(result.warping)} />
        <Row label="K constant" value={result.k.toFixed(4)} muted />
      </section>

      <section className="mb-6 space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Warp yarns</h3>
        {result.warpLines.map((l) => (
          <div key={l.label} className="border-t border-plum/10 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-ink">{l.label}</span>
              <span className="tabular-nums font-semibold text-plum">{formatInr(l.yarnCostRaw)}</span>
            </div>
            <p className="text-xs text-plum/60">
              {l.pct}% · Ne {l.count} · rate {l.rate}
              {l.sizingCost != null ? ` · sizing ${formatInr(l.sizingCost)}` : ''}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-6 space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Weft yarns</h3>
        {result.weftLines.map((l) => (
          <div key={l.label} className="border-t border-plum/10 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-ink">{l.label}</span>
              <span className="tabular-nums font-semibold text-plum">{formatInr(l.yarnCostRaw)}</span>
            </div>
            <p className="text-xs text-plum/60">
              {l.pct}% · Ne {l.count} · rate {l.rate}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-6 space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Markups on final</h3>
        <div className="grid grid-cols-3 gap-x-3 gap-y-3">
          {result.markups.map((m) => (
            <div key={m.pct} className="text-center">
              <p className="text-[11px] text-plum/55">+{m.pct}%</p>
              <p className="text-xs font-semibold tabular-nums text-ink">{formatInr(m.amount)}</p>
            </div>
          ))}
        </div>
      </section>

      {editing ? (
        <section className="mb-5 space-y-3">
          <h3 className="font-display text-lg font-semibold text-ink">Edit inputs & recalculate</h3>
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
            <p className="text-sm text-plum/70">
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
          {error ? <p className="text-sm text-rose">{error}</p> : null}
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
      <span className={muted ? 'text-plum/50' : 'text-plum/70'}>{label}</span>
      <span className={`tabular-nums ${muted ? 'text-plum/50' : 'font-semibold text-ink'}`}>{value}</span>
    </div>
  )
}
