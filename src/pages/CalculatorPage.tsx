import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '../components/Layout'
import { Stepper } from '../components/Stepper'
import { NumberField } from '../components/NumberField'
import { PrimaryButton } from '../components/PrimaryButton'
import { useSpeechFill } from '../hooks/useSpeechFill'
import { DEMO_SINGLE, type MultiInputs, type SingleInputs } from '../lib/costing'
import { emptyMulti, type CostMode, type InputMethod } from '../lib/types'

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
}: Props) {
  const [focusIdx, setFocusIdx] = useState(0)
  const fieldRefs = useRef<(HTMLInputElement | null)[]>([])

  const fields: FieldDef[] = useMemo(() => {
    if (mode === 'single') {
      const s = single
      const set = (patch: Partial<SingleInputs>) => onChangeSingle({ ...s, ...patch })
      return [
        { key: 'reed', label: 'Reed', unit: 'dents/inch', hint: 'Ends ≈ Reed × Warp RS', get: () => s.reed || '', set: (v) => set({ reed: n(v) }) },
        { key: 'warpReedspace', label: 'Warp Reedspace', unit: 'inches', get: () => s.warpReedspace || '', set: (v) => set({ warpReedspace: n(v) }) },
        { key: 'l2l', label: 'L2L (length)', unit: 'length units', hint: 'Same length unit as L2L / tape length', get: () => s.l2l || '', set: (v) => set({ l2l: n(v) }) },
        { key: 'warpCount', label: 'Warp Count', unit: 'Ne', get: () => s.warpCount || '', set: (v) => set({ warpCount: n(v) }) },
        { key: 'warpRate', label: 'Warp Rate', unit: '₹', get: () => s.warpRate || '', set: (v) => set({ warpRate: n(v) }) },
        { key: 'sizingRate', label: 'Sizing rate', unit: '₹', get: () => s.sizingRate || '', set: (v) => set({ sizingRate: n(v) }) },
        { key: 'pick', label: 'Pick (PPI)', unit: 'picks/inch', get: () => s.pick || '', set: (v) => set({ pick: n(v) }) },
        { key: 'weftReedspace', label: 'Weft Reedspace', unit: 'inches', get: () => s.weftReedspace || '', set: (v) => set({ weftReedspace: n(v) }) },
        { key: 'weftCount', label: 'Weft Count', unit: 'Ne', get: () => s.weftCount || '', set: (v) => set({ weftCount: n(v) }) },
        { key: 'weftRate', label: 'Weft Rate', unit: '₹', get: () => s.weftRate || '', set: (v) => set({ weftRate: n(v) }) },
        { key: 'wastagePct', label: 'Wastage', unit: '%', get: () => s.wastagePct || '', set: (v) => set({ wastagePct: n(v) }) },
        { key: 'majuri', label: 'Majuri', unit: '₹', get: () => s.majuri || '', set: (v) => set({ majuri: n(v) }) },
        { key: 'warping', label: 'Warping', unit: '₹', get: () => s.warping || '', set: (v) => set({ warping: n(v) }) },
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
      { key: 'l2l', label: 'L2L (length)', unit: 'length units', get: () => m.l2l || '', set: (v) => setM({ l2l: n(v) }) },
    ]
    for (let i = 0; i < 3; i++) {
      const y = m.warpYarns[i]
      list.push(
        { key: `w${i}pct`, label: `Warp yarn ${i + 1} %`, unit: '%', get: () => y.pct || '', set: (v) => setWarp(i, { pct: n(v) }) },
        { key: `w${i}count`, label: `Warp yarn ${i + 1} Count`, unit: 'Ne', get: () => y.count || '', set: (v) => setWarp(i, { count: n(v) }) },
        { key: `w${i}rate`, label: `Warp yarn ${i + 1} Rate`, unit: '₹', get: () => y.rate || '', set: (v) => setWarp(i, { rate: n(v) }) },
        { key: `w${i}siz`, label: `Warp yarn ${i + 1} Sizing`, unit: '₹', get: () => y.sizingRate || '', set: (v) => setWarp(i, { sizingRate: n(v) }) },
      )
    }
    list.push(
      { key: 'pick', label: 'Pick (PPI)', unit: 'picks/inch', get: () => m.pick || '', set: (v) => setM({ pick: n(v) }) },
      { key: 'weftReedspace', label: 'Weft Reedspace', unit: 'inches', get: () => m.weftReedspace || '', set: (v) => setM({ weftReedspace: n(v) }) },
      { key: 'wastagePct', label: 'Wastage', unit: '%', get: () => m.wastagePct || '', set: (v) => setM({ wastagePct: n(v) }) },
    )
    for (let i = 0; i < 3; i++) {
      const y = m.weftYarns[i]
      list.push(
        { key: `f${i}pct`, label: `Weft yarn ${i + 1} %`, unit: '%', get: () => y.pct || '', set: (v) => setWeft(i, { pct: n(v) }) },
        { key: `f${i}count`, label: `Weft yarn ${i + 1} Count`, unit: 'Ne', get: () => y.count || '', set: (v) => setWeft(i, { count: n(v) }) },
        { key: `f${i}rate`, label: `Weft yarn ${i + 1} Rate`, unit: '₹', get: () => y.rate || '', set: (v) => setWeft(i, { rate: n(v) }) },
      )
    }
    list.push(
      { key: 'majuri', label: 'Majuri', unit: '₹', get: () => m.majuri || '', set: (v) => setM({ majuri: n(v) }) },
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

  useEffect(() => {
    if (inputMethod === 'speak' && speech.supported && !speech.listening) {
      // user starts via button
    }
  }, [inputMethod, speech.supported, speech.listening])

  return (
    <Layout
      title={mode === 'single' ? 'Single Warp' : 'Multiple Warp / Weft'}
      subtitle={`${fabricName || 'Untitled'} · ${inputMethod === 'speak' ? 'Speak' : 'Type'}`}
    >
      <Stepper step={2} />

      {inputMethod === 'speak' ? (
        <div className="mb-4 rounded-[14px] border border-saffron/40 bg-paper p-4">
          <p className="text-sm text-ink">
            Active field: <strong>{fields[focusIdx]?.label}</strong>
          </p>
          <p className="mt-1 text-xs text-plum/70">Say a number — it fills this field and moves to the next.</p>
          <div className="mt-3 flex gap-2">
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
          {speech.error ? <p className="mt-2 text-xs text-rose">{speech.error}</p> : null}
        </div>
      ) : null}

      <div className="space-y-3">
        {mode === 'single' ? (
          <>
            <h3 className="pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Warp</h3>
            {fields.slice(0, 6).map((f, i) => (
              <NumberField
                key={f.key}
                ref={(el) => { fieldRefs.current[i] = el }}
                label={f.label}
                unit={f.unit}
                hint={f.hint}
                value={f.get()}
                onChange={f.set}
                active={focusIdx === i}
                id={f.key}
              />
            ))}
            <h3 className="pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Weft</h3>
            {fields.slice(6, 11).map((f, i) => {
              const idx = i + 6
              return (
                <NumberField
                  key={f.key}
                  ref={(el) => { fieldRefs.current[idx] = el }}
                  label={f.label}
                  unit={f.unit}
                  value={f.get()}
                  onChange={f.set}
                  active={focusIdx === idx}
                  id={f.key}
                />
              )
            })}
            <h3 className="pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">Other</h3>
            {fields.slice(11).map((f, i) => {
              const idx = i + 11
              return (
                <NumberField
                  key={f.key}
                  ref={(el) => { fieldRefs.current[idx] = el }}
                  label={f.label}
                  unit={f.unit}
                  value={f.get()}
                  onChange={f.set}
                  active={focusIdx === idx}
                  id={f.key}
                />
              )
            })}
          </>
        ) : (
          fields.map((f, i) => (
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
          ))
        )}
      </div>

      <div className="mt-6 space-y-3">
        <PrimaryButton onClick={onCalculate}>
          Calculate
        </PrimaryButton>
        <PrimaryButton
          variant="secondary"
          onClick={() => {
            if (mode === 'single') onChangeSingle({ ...DEMO_SINGLE })
            else onChangeMulti(emptyMulti())
          }}
        >
          Load demo sample
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={onBack}>
          Back
        </PrimaryButton>
      </div>
    </Layout>
  )
}
