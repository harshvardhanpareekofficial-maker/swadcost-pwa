const STEPS = ['Home', 'Input', 'Fields', 'Results'] as const

type Props = { step: 0 | 1 | 2 | 3 }

export function Stepper({ step }: Props) {
  return (
    <ol className="mb-4 flex min-w-0 items-start sm:mb-8">
      {STEPS.map((label, i) => {
        const active = i === step
        const done = i < step
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="flex w-full items-center">
              <span
                className={`h-px flex-1 ${i === 0 ? 'bg-transparent' : done || active ? 'bg-plum/25' : 'bg-plum/10'}`}
              />
              <span
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  active ? 'bg-saffron text-ink' : done ? 'bg-plum text-ivory' : 'bg-plum/10 text-plum/55',
                ].join(' ')}
              >
                {i + 1}
              </span>
              <span
                className={`h-px flex-1 ${i === STEPS.length - 1 ? 'bg-transparent' : done ? 'bg-plum/25' : 'bg-plum/10'}`}
              />
            </span>
            <span className={`text-[10px] font-medium sm:text-[11px] ${active ? 'text-ink' : 'text-plum/55'}`}>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
