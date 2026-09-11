const STEPS = ['Home', 'Input', 'Fields', 'Results'] as const

type Props = { step: 0 | 1 | 2 | 3 }

export function Stepper({ step }: Props) {
  return (
    <ol className="mb-7 flex items-start gap-2">
      {STEPS.map((label, i) => {
        const active = i === step
        const done = i < step
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={[
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                active ? 'bg-saffron text-ink' : done ? 'bg-plum text-ivory' : 'bg-plum/10 text-plum/55',
              ].join(' ')}
            >
              {i + 1}
            </span>
            <span className={`text-[11px] font-medium ${active ? 'text-ink' : 'text-plum/55'}`}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
