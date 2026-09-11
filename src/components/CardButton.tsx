import type { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  icon?: ReactNode
  onClick: () => void
}

export function CardButton({ title, description, icon, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-3xl border border-plum/10 bg-paper px-5 py-5 text-left shadow-sheet transition hover:border-plum/25"
    >
      {icon ? <div className="mb-3 text-plum">{icon}</div> : null}
      <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-plum/75">{description}</p>
    </button>
  )
}
