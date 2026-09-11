import type { ReactNode } from 'react'
import { studioQuietBtnClass } from './studio'

interface StudioBarProps {
  trailing?: ReactNode
}

export function StudioBar({ trailing }: StudioBarProps) {
  return (
    <header className="flex min-h-11 items-center justify-between gap-2 border-b border-plum/10 px-[max(1rem,env(safe-area-inset-left))] py-2.5 pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.65rem,env(safe-area-inset-top))] sm:gap-3 sm:px-8 sm:py-3.5">
      <p className="min-w-0 font-display text-base tracking-tight sm:text-lg">
        <span className="font-semibold text-ink">fabriccost</span>
        <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-[0.28em] text-plum/70 sm:ml-2 sm:text-[11px]">
          STUDIO
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {trailing}
        <p className="hidden items-center gap-2 text-[11px] font-medium text-plum/70 sm:flex">
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
          ? 'inline-flex min-h-11 shrink-0 items-center rounded-[14px] bg-plum px-3 py-2 text-xs font-semibold text-ivory hover:bg-plum-deep'
          : studioQuietBtnClass
      }
    >
      {children}
    </button>
  )
}
