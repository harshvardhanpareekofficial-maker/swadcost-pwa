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
        'block rounded-2xl border px-3 py-3 transition',
        active
          ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]'
          : 'border-white/10 bg-card/80',
      ].join(' ')}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-cream">{label}</span>
        {unit ? <span className="text-[11px] text-muted">{unit}</span> : null}
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
        className="w-full rounded-xl border border-white/10 bg-ink/50 px-3 py-3 text-lg font-semibold text-cream tabular-nums placeholder:text-muted/50"
        placeholder="0"
      />
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </label>
  )
})
