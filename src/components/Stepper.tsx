const STEPS = ['Home', 'Input', 'Fields', 'Results'] as const

type Props = { step: 0 | 1 | 2 | 3 }

export function Stepper({ step }: Props) {
  return (
    <ol className="mb-5 flex items-center gap-1">
      {STEPS.map((label, i) => {
        const active = i === step
        const done = i < step
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={[
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                active ? 'bg-accent text-ink' : done ? 'bg-indigo-mid text-cream' : 'bg-white/10 text-muted',
              ].join(' ')}
            >
              {i + 1}
            </span>
            <span className={`text-[10px] ${active ? 'text-cream' : 'text-muted'}`}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
