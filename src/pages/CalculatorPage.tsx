import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '../components/Layout'
import { Stepper } from '../components/Stepper'
import { NumberField } from '../components/NumberField'
import { PrimaryButton } from '../components/PrimaryButton'
import { SectionLabel } from '../components/SectionLabel'
import { StudioSheet } from '../components/StudioSheet'
import { useSpeechFill } from '../hooks/useSpeechFill'
import { SAMPLE_MULTI, SAMPLE_SINGLE, type MultiInputs, type SingleInputs } from '../lib/costing'
import { DALAL_SECTION_LABEL, PICK_RATE_HINT, PICK_RATE_LABEL } from '../lib/labels'
import type { CostMode, InputMethod } from '../lib/types'

type Num = number | ''

type FieldDef = {
  key: string
  label: string
  unit?: string
  hint?: string
  get: () => Num
  set: (v: Num) => void
}

type Props = {
  fabricName: string
  mode: CostMode
  inputMethod: InputMethod
  single: SingleInputs
  multi: MultiInputs
  onChangeSingle: (s: SingleInputs) => void
  onChangeMulti: (m: MultiInputs) => void
  onCalculate: () => void
  onBack: () => void
  onLogout: () => void
}

function n(v: Num): number {
  return v === '' || !Number.isFinite(v) ? 0 : v
}

export function CalculatorPage({
  fabricName,
  mode,
  inputMethod,
  single,
  multi,
  onChangeSingle,
  onChangeMulti,
  onCalculate,
  onBack,
  onLogout,
}: Props) {
  const [focusIdx, setFocusIdx] = useState(0)
  const fieldRefs = useRef<(HTMLInputElement | null)[]>([])

  const fields: FieldDef[] = useMemo(() => {
    if (mode === 'single') {
      const s = single
      const set = (patch: Partial<SingleInputs>) => onChangeSingle({ ...s, ...patch })
      return [
        { key: 'reed', label: 'Reed', unit: 'dents/inch', hint: 'Warp weight uses Reed × Warp RS × 120 / (1825 × count × L2L)', get: () => s.reed || '', set: (v) => set({ reed: n(v) }) },
        { key: 'warpReedspace', label: 'Warp Reedspace', unit: 'inches', get: () => s.warpReedspace || '', set: (v) => set({ warpReedspace: n(v) }) },
        { key: 'l2l', label: 'L2L', unit: 'as on mill sheet', hint: 'In the warp-weight denominator, as written on the notebook', get: () => s.l2l || '', set: (v) => set({ l2l: n(v) }) },
        { key: 'warpCount', label: 'Warp Count', unit: 'Ne', get: () => s.warpCount || '', set: (v) => set({ warpCount: n(v) }) },
        { key: 'warpRate', label: 'Warp Rate', unit: '₹ / weight', get: () => s.warpRate || '', set: (v) => set({ warpRate: n(v) }) },
        { key: 'sizingRate', label: 'Sizing rate', unit: '₹ / warp weight', hint: 'Sizing = warp weight × this rate', get: () => s.sizingRate || '', set: (v) => set({ sizingRate: n(v) }) },
        { key: 'pick', label: 'Pick (PPI)', unit: 'picks/inch', get: () => s.pick || '', set: (v) => set({ pick: n(v) }) },
        { key: 'weftReedspace', label: 'Weft Reedspace', unit: 'inches', get: () => s.weftReedspace || '', set: (v) => set({ weftReedspace: n(v) }) },
        { key: 'weftCount', label: 'Weft Count', unit: 'Ne', get: () => s.weftCount || '', set: (v) => set({ weftCount: n(v) }) },
        { key: 'weftRate', label: 'Weft Rate', unit: '₹ / weight', get: () => s.weftRate || '', set: (v) => set({ weftRate: n(v) }) },
        { key: 'wastagePct', label: 'Wastage', unit: '% of weft', hint: 'Added only to weft weight: base × (1 + %/100)', get: () => s.wastagePct || '', set: (v) => set({ wastagePct: n(v) }) },
        { key: 'pickRate', label: PICK_RATE_LABEL, unit: '₹ per pick', hint: PICK_RATE_HINT, get: () => s.pickRate || '', set: (v) => set({ pickRate: n(v) }) },
        { key: 'warping', label: 'Warping', unit: '₹', hint: 'Optional flat add-on — not on the mill sheet', get: () => s.warping || '', set: (v) => set({ warping: n(v) }) },
      ]
    }

    const m = multi
    const setM = (patch: Partial<MultiInputs>) => onChangeMulti({ ...m, ...patch })
    const setWarp = (i: number, patch: Partial<(typeof m.warpYarns)[0]>) => {
      const warpYarns = m.warpYarns.map((y, idx) => (idx === i ? { ...y, ...patch } : y))
      setM({ warpYarns })
    }
    const setWeft = (i: number, patch: Partial<(typeof m.weftYarns)[0]>) => {
      const weftYarns = m.weftYarns.map((y, idx) => (idx === i ? { ...y, ...patch } : y))
      setM({ weftYarns })
    }
    const list: FieldDef[] = [
      { key: 'reed', label: 'Reed', unit: 'dents/inch', get: () => m.reed || '', set: (v) => setM({ reed: n(v) }) },
      { key: 'warpReedspace', label: 'Warp Reedspace', unit: 'inches', get: () => m.warpReedspace || '', set: (v) => setM({ warpReedspace: n(v) }) },
      { key: 'l2l', label: 'L2L', unit: 'as on mill sheet', get: () => m.l2l || '', set: (v) => setM({ l2l: n(v) }) },
    ]
    for (let i = 0; i < 3; i++) {
      const y = m.warpYarns[i]
      list.push(
        { key: `w${i}pct`, label: `Warp yarn ${i + 1} %`, unit: '%', get: () => y.pct || '', set: (v) => setWarp(i, { pct: n(v) }) },
        { key: `w${i}count`, label: `Warp yarn ${i + 1} Count`, unit: 'Ne', get: () => y.count || '', set: (v) => setWarp(i, { count: n(v) }) },
        { key: `w${i}rate`, label: `Warp yarn ${i + 1} Rate`, unit: '₹ / weight', get: () => y.rate || '', set: (v) => setWarp(i, { rate: n(v) }) },
        { key: `w${i}siz`, label: `Warp yarn ${i + 1} Sizing`, unit: '₹ / warp weight', get: () => y.sizingRate || '', set: (v) => setWarp(i, { sizingRate: n(v) }) },
      )
    }
    list.push(
      { key: 'pick', label: 'Pick (PPI)', unit: 'picks/inch', get: () => m.pick || '', set: (v) => setM({ pick: n(v) }) },
      { key: 'weftReedspace', label: 'Weft Reedspace', unit: 'inches', get: () => m.weftReedspace || '', set: (v) => setM({ weftReedspace: n(v) }) },
      { key: 'wastagePct', label: 'Wastage', unit: '% of weft', get: () => m.wastagePct || '', set: (v) => setM({ wastagePct: n(v) }) },
    )
    for (let i = 0; i < 3; i++) {
      const y = m.weftYarns[i]
      list.push(
        { key: `f${i}pct`, label: `Weft yarn ${i + 1} %`, unit: '%', get: () => y.pct || '', set: (v) => setWeft(i, { pct: n(v) }) },
        { key: `f${i}count`, label: `Weft yarn ${i + 1} Count`, unit: 'Ne', get: () => y.count || '', set: (v) => setWeft(i, { count: n(v) }) },
        { key: `f${i}rate`, label: `Weft yarn ${i + 1} Rate`, unit: '₹ / weight', get: () => y.rate || '', set: (v) => setWeft(i, { rate: n(v) }) },
      )
    }
    list.push(
      { key: 'pickRate', label: PICK_RATE_LABEL, unit: '₹ per pick', hint: PICK_RATE_HINT, get: () => m.pickRate || '', set: (v) => setM({ pickRate: n(v) }) },
      { key: 'warping', label: 'Warping', unit: '₹', get: () => m.warping || '', set: (v) => setM({ warping: n(v) }) },
    )
    return list
  }, [mode, single, multi, onChangeSingle, onChangeMulti])

  const onNumber = useCallback(
    (num: number) => {
      const f = fields[focusIdx]
      if (!f) return
      f.set(num)
      setFocusIdx((i) => Math.min(i + 1, fields.length - 1))
    },
    [fields, focusIdx],
  )

  const speech = useSpeechFill(inputMethod === 'speak', onNumber)

  useEffect(() => {
    fieldRefs.current[focusIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusIdx])

  const renderField = (i: number) => {
    const f = fields[i]
    if (!f) return null
    return (
      <NumberField
        key={f.key}
        ref={(el) => { fieldRefs.current[i] = el }}
        label={f.label}
        unit={f.unit}
        hint={f.hint}
        value={f.get()}
        onChange={(v) => {
          f.set(v)
          setFocusIdx(i)
        }}
        active={focusIdx === i}
        id={f.key}
      />
    )
  }

  const pair = (a: number, b: number) => (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
      {renderField(a)}
      {renderField(b)}
    </div>
  )

  const millBlank = fields.every((f) => f.get() === '' || f.get() === 0)

  return (
    <Layout
      eyebrow="Mill sheet"
      title={mode === 'single' ? 'Single Warp' : 'Multiple Warp / Weft'}
      subtitle={`${fabricName || 'Untitled'} · ${inputMethod === 'speak' ? 'Speak' : 'Type'}`}
      onBack={onBack}
      onLogout={onLogout}
      stickyFooter={
        <div className="studio-sticky z-20 shrink-0 px-[max(1rem,env(safe-area-inset-left))] py-2.5 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-3">
          <div className="mx-auto max-w-lg sm:max-w-xl">
            <PrimaryButton onClick={onCalculate}>Calculate</PrimaryButton>
            <button
              type="button"
              onClick={() => {
                if (mode === 'single') onChangeSingle({ ...SAMPLE_SINGLE })
                else
                  onChangeMulti({
                    ...SAMPLE_MULTI,
                    warpYarns: SAMPLE_MULTI.warpYarns.map((y) => ({ ...y })),
                    weftYarns: SAMPLE_MULTI.weftYarns.map((y) => ({ ...y })),
                  })
              }}
              className="mt-1.5 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-plum/70 hover:text-plum"
            >
              Load sample
            </button>
          </div>
        </div>
      }
    >
      <Stepper step={2} />

      {millBlank ? (
        <p className="mb-3 rounded-[14px] border border-dashed border-plum/15 bg-paper/40 px-3.5 py-3 text-sm leading-relaxed text-plum/70">
          The mill sheet starts blank. Enter reed, counts and rates — or load a sample under Calculate.
        </p>
      ) : null}

      {inputMethod === 'speak' ? (
        <StudioSheet className="mb-3 sm:mb-4">
          <p className="text-sm text-ink">
            Active field: <strong>{fields[focusIdx]?.label}</strong>
          </p>
          <p className="mt-1 text-xs text-plum/70">
            Web Speech API (Chrome on HTTPS). Say one mill number. Fields stay editable if you need to
            type a correction.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {speech.listening ? (
              <PrimaryButton variant="secondary" onClick={speech.stop}>
                Stop mic
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={speech.start} disabled={!speech.supported}>
                {speech.supported ? 'Start mic' : 'Mic unavailable'}
              </PrimaryButton>
            )}
          </div>
          {!speech.supported ? (
            <p className="mt-2 text-xs text-plum/70">
              This browser has no speech engine. Use Type, or Chrome on Android / desktop over HTTPS.
            </p>
          ) : null}
          {speech.error ? <p className="mt-2 text-xs text-rose">{speech.error}</p> : null}
          {speech.lastHeard ? (
            <p className="mt-2 text-xs text-plum/70">
              Heard: “{speech.lastHeard}”
              {speech.ignored ? ' — not a mill number, field unchanged.' : null}
            </p>
          ) : null}
        </StudioSheet>
      ) : null}

      <div className="grid grid-cols-1 gap-2.5 pb-2 sm:gap-3 sm:pb-4">
        {mode === 'single' ? (
          <>
            <SectionLabel>Warp</SectionLabel>
            {pair(0, 1)}
            {renderField(2)}
            {pair(3, 4)}
            {renderField(5)}
            <SectionLabel className="pt-1.5 sm:pt-2">Weft</SectionLabel>
            {pair(6, 7)}
            {pair(8, 9)}
            {renderField(10)}
            <SectionLabel className="pt-1.5 sm:pt-2">{DALAL_SECTION_LABEL}</SectionLabel>
            {pair(11, 12)}
          </>
        ) : (
          <>
            <SectionLabel>Warp</SectionLabel>
            {pair(0, 1)}
            {renderField(2)}
            {[0, 1, 2].map((yarn) => {
              const base = 3 + yarn * 4
              return (
                <div key={`warp-yarn-${yarn}`} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {renderField(base)}
                  {renderField(base + 1)}
                  {renderField(base + 2)}
                  {renderField(base + 3)}
                </div>
              )
            })}
            <SectionLabel className="pt-1.5 sm:pt-2">Weft</SectionLabel>
            {pair(15, 16)}
            {renderField(17)}
            {[0, 1, 2].map((yarn) => {
              const base = 18 + yarn * 3
              return (
                <div key={`weft-yarn-${yarn}`} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {renderField(base)}
                  {renderField(base + 1)}
                  <div className="sm:col-span-2">{renderField(base + 2)}</div>
                </div>
              )
            })}
            <SectionLabel className="pt-1.5 sm:pt-2">{DALAL_SECTION_LABEL}</SectionLabel>
            {pair(fields.length - 2, fields.length - 1)}
          </>
        )}
      </div>

    </Layout>
  )
}
