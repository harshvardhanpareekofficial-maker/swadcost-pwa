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
      className="studio-sheet group flex min-h-14 w-full min-w-0 items-start gap-3.5 rounded-3xl px-4 py-4 text-left transition hover:border-plum/20 active:translate-y-px sm:gap-4 sm:px-5 sm:py-5"
    >
      {icon ? (
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-plum/8 text-plum">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-plum/75">{description}</p>
      </span>
    </button>
  )
}
