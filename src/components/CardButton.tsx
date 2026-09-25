import type { ReactNode } from 'react'
import { IconArrow } from './Icons'

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
      className="construction-card"
    >
      {icon ? (
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-plum/8 text-plum">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-plum/75">{description}</p>
      </span><span className="card-arrow" aria-hidden="true"><IconArrow className="h-5 w-5"/></span>
    </button>
  )
}
