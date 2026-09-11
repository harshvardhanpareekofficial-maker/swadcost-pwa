import { forwardRef } from 'react'
import { studioLabelClass } from './studio'

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
        'block min-w-0 rounded-[14px] border px-3.5 py-3 transition',
        active ? 'border-saffron bg-paper shadow-[0_0_0_3px_rgba(232,168,56,0.22)]' : 'border-plum/12 bg-paper',
      ].join(' ')}
    >
      <div className="mb-1 flex min-w-0 items-baseline justify-between gap-2">
        <span className={`${studioLabelClass} min-w-0 break-words`}>{label}</span>
        {unit ? <span className="shrink-0 text-[11px] text-plum/50">{unit}</span> : null}
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
        className="min-h-11 w-full bg-transparent text-lg font-semibold tabular-nums text-ink placeholder:text-plum/35"
        placeholder="0"
      />
      {hint ? <p className="mt-1 text-[11px] leading-relaxed text-plum/55">{hint}</p> : null}
    </label>
  )
})
