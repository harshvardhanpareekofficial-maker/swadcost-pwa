import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Stepper } from '../components/Stepper'
import { NumberField } from '../components/NumberField'
import { PrimaryButton } from '../components/PrimaryButton'
import { SectionLabel } from '../components/SectionLabel'
import { StudioSheet } from '../components/StudioSheet'
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
  onLogout: () => void
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
  onLogout,
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
    <Layout
      eyebrow="Cost sheet"
      title="Cost breakdown"
      subtitle={fabricName || 'Untitled fabric'}
      onBack={onBackEdit}
      onLogout={onLogout}
    >
      <Stepper step={3} />

      <StudioSheet className="mb-4 overflow-hidden sm:mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/55">Final cost</p>
        <p className="font-display mt-1 break-words text-[2.1rem] font-semibold tabular-nums tracking-[-0.03em] text-ink sm:text-5xl">
          {formatInr(result.grandTotal)}
        </p>
        {result.length > 0 ? (
          <p className="mt-2 text-xs text-plum/55">
            {formatInr(result.costPerUnitLength)} ÷ L2L (derived, not on the mill sheet)
          </p>
        ) : null}
      </StudioSheet>

      <StudioSheet className="mb-4 sm:mb-5">
        <SectionLabel>Summary</SectionLabel>
        <div className="mt-3 space-y-2">
          <Row label="Total ends (Reed × RS)" value={String(result.totalEnds)} />
          <Row label="Warp weight" value={String(result.warpWeight)} />
          <Row label="Weft weight (base)" value={String(result.weftWeightBase)} />
          <Row label="Weft weight (after wastage)" value={String(result.weftWeight)} />
          <Row label="Warp cost" value={formatInr(result.warpCostRaw)} />
          <Row label="Weft cost" value={formatInr(result.weftCostRaw)} />
          <Row label="Sizing" value={formatInr(result.sizingCost)} />
          <Row label="Job (pick × pick rate)" value={formatInr(result.jobCost)} />
          <Row label="Warping" value={formatInr(result.warping)} />
        </div>
      </StudioSheet>

      <StudioSheet className="mb-4 sm:mb-5">
        <SectionLabel>Warp yarns</SectionLabel>
        {result.warpLines.length === 0 ? (
          <p className="mt-3 text-sm text-plum/55">No warp lines on this sheet.</p>
        ) : (
          <div className="mt-1">
            {result.warpLines.map((l) => (
              <div key={l.label} className="border-t border-plum/10 py-2.5 text-sm first:border-t-0">
                <div className="flex min-w-0 justify-between gap-2">
                  <span className="min-w-0 break-words text-ink">{l.label}</span>
                  <span className="shrink-0 tabular-nums font-semibold text-plum">{formatInr(l.yarnCostRaw)}</span>
                </div>
                <p className="text-xs text-plum/60">
                  {l.pct}% · Ne {l.count} · wt {l.weight} · rate {l.rate}
                  {l.sizingCost != null ? ` · sizing ${formatInr(l.sizingCost)}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </StudioSheet>

      <StudioSheet className="mb-4 sm:mb-5">
        <SectionLabel>Weft yarns</SectionLabel>
        {result.weftLines.length === 0 ? (
          <p className="mt-3 text-sm text-plum/55">No weft lines on this sheet.</p>
        ) : (
          <div className="mt-1">
            {result.weftLines.map((l) => (
              <div key={l.label} className="border-t border-plum/10 py-2.5 text-sm first:border-t-0">
                <div className="flex min-w-0 justify-between gap-2">
                  <span className="min-w-0 break-words text-ink">{l.label}</span>
                  <span className="shrink-0 tabular-nums font-semibold text-plum">{formatInr(l.yarnCostRaw)}</span>
                </div>
                <p className="text-xs text-plum/60">
                  {l.pct}% · Ne {l.count} · wt {l.weight} · rate {l.rate}
                </p>
              </div>
            ))}
          </div>
        )}
      </StudioSheet>

      <StudioSheet className="mb-5 sm:mb-6">
        <SectionLabel>Markups on final</SectionLabel>
        <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4">
          {result.markups.map((m) => (
            <div key={m.pct} className="min-w-0 text-center">
              <p className="text-[11px] text-plum/55">+{m.pct}%</p>
              <p className="break-words text-xs font-semibold tabular-nums text-ink">{formatInr(m.amount)}</p>
            </div>
          ))}
        </div>
      </StudioSheet>

      {editing ? (
        <section className="mb-5 space-y-3">
          <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">Edit inputs & recalculate</h3>
          {mode === 'single' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  ['pickRate', 'Pick rate / Job rate', single.pickRate],
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
            </div>
          ) : (
            <p className="text-sm text-plum/70">
              For multi-yarn edits, go back to the fields step for full yarn % / count / rate controls, or tweak
              shared values below.
            </p>
          )}
          {mode === 'multi' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['reed', 'Reed', multi.reed],
                  ['warpReedspace', 'Warp RS', multi.warpReedspace],
                  ['l2l', 'L2L', multi.l2l],
                  ['pick', 'Pick', multi.pick],
                  ['weftReedspace', 'Weft RS', multi.weftReedspace],
                  ['wastagePct', 'Wastage %', multi.wastagePct],
                  ['pickRate', 'Pick rate / Job rate', multi.pickRate],
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
            </div>
          ) : null}
          {error ? (
            <p className="rounded-[14px] border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-sm text-rose">{error}</p>
          ) : null}
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
        <PrimaryButton variant="ghost" onClick={onHome}>
          New costing
        </PrimaryButton>
      </div>
    </Layout>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex min-w-0 items-baseline gap-3 text-sm">
      <span className={`min-w-0 break-words ${muted ? 'text-plum/50' : 'text-plum/70'}`}>{label}</span>
      <span className="min-w-4 flex-1 border-b border-dotted border-plum/20" aria-hidden />
      <span className={`max-w-[48%] shrink-0 text-right tabular-nums ${muted ? 'text-plum/50' : 'font-semibold text-ink'}`}>
        {value}
      </span>
    </div>
  )
}
