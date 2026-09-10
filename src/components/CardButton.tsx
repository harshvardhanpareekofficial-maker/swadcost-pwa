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
      className="group w-full rounded-3xl border border-white/10 bg-gradient-to-br from-card to-indigo-deep/80 p-5 text-left shadow-xl transition hover:border-accent/40 hover:shadow-accent/10"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-2xl text-accent">
        {icon ?? '◈'}
      </div>
      <h2 className="text-lg font-bold text-cream group-hover:text-accent-soft">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
    </button>
  )
}
