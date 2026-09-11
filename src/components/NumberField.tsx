import { forwardRef } from 'react'

type Props = {
  label: string
  hint?: string
  value: number | ''
  onChange: (v: number | '') => void
  unit?: string
  min?: number
  step?: string
  active?: boolean
  id?: string
}

export const NumberField = forwardRef<HTMLInputElement, Props>(function NumberField(
  { label, hint, value, onChange, unit, min = 0, step = 'any', active, id },
  ref,
) {
  return (
    <label
      className={[
        'block rounded-[14px] border px-3.5 py-3 transition',
        active ? 'border-saffron bg-paper shadow-[0_0_0_3px_rgba(232,168,56,0.22)]' : 'border-plum/12 bg-paper',
      ].join(' ')}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">{label}</span>
        {unit ? <span className="text-[11px] text-plum/50">{unit}</span> : null}
      </div>
      <input
        ref={ref}
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value === '' ? '' : value}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') onChange('')
          else onChange(Number(raw))
        }}
        className="w-full bg-transparent text-lg font-semibold tabular-nums text-ink placeholder:text-plum/35"
        placeholder="0"
      />
      {hint ? <p className="mt-1 text-[11px] leading-relaxed text-plum/55">{hint}</p> : null}
    </label>
  )
})
