import type { ReactNode } from 'react'
import { studioQuietBtnClass } from './studio'

interface StudioBarProps {
  trailing?: ReactNode
}

export function StudioBar({ trailing }: StudioBarProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-plum/10 px-5 py-3.5 sm:px-8">
      <p className="font-display text-lg tracking-tight">
        <span className="font-semibold text-ink">fabriccost</span>
        <span className="ml-2 align-middle text-[11px] font-semibold uppercase tracking-[0.28em] text-plum/70">
          STUDIO
        </span>
      </p>
      <div className="flex items-center gap-3">
        {trailing}
        <p className="flex items-center gap-2 text-[11px] font-medium text-plum/70">
          <span className="h-2 w-2 rounded-full bg-ready" />
          Workspace ready
        </p>
      </div>
    </header>
  )
}

export function StudioBarAction({
  children,
  onClick,
  variant = 'quiet',
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'quiet' | 'plum'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === 'plum'
          ? 'shrink-0 rounded-[14px] bg-plum px-3 py-2 text-xs font-semibold text-ivory hover:bg-plum-deep'
          : studioQuietBtnClass
      }
    >
      {children}
    </button>
  )
}
