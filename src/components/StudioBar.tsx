import type { ReactNode } from 'react'
import { Mark } from './Mark'
import { studioQuietBtnClass } from './studio'

interface StudioBarProps {
  trailing?: ReactNode
  onBack?: () => void
  backLabel?: string
  onLogout?: () => void
}

export function StudioBar({ trailing, onBack, backLabel = 'Back', onLogout }: StudioBarProps) {
  return (
    <header className="studio-bar flex min-h-14 items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] py-2.5 pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.65rem,env(safe-area-inset-top))] sm:gap-3 sm:px-8 sm:py-3">
      <p className="flex min-w-0 items-center gap-2.5">
        <Mark className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
        <span className="min-w-0 leading-tight">
          <span className="block font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
            fabriccost
          </span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.32em] text-saffron sm:text-[10px]">
            STUDIO
          </span>
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        {onBack ? (
          <StudioBarAction onClick={onBack}>{backLabel}</StudioBarAction>
        ) : null}
        {onLogout ? (
          <StudioBarAction onClick={onLogout}>Log out</StudioBarAction>
        ) : null}
        {trailing}
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-plum/70">
          <span className="h-2 w-2 rounded-full bg-ready" />
          <span className="hidden sm:inline">Workspace ready</span>
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
          ? 'inline-flex min-h-11 shrink-0 items-center justify-center rounded-[14px] bg-plum px-3 py-2 text-xs font-semibold text-ivory hover:bg-plum-deep'
          : studioQuietBtnClass
      }
    >
      {children}
    </button>
  )
}
