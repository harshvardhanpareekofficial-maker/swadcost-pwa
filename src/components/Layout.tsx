import type { ReactNode } from 'react'
import { Footer } from './Footer'

type Props = {
  children: ReactNode
  title?: string
  subtitle?: string
  onLogout?: () => void
  showLogout?: boolean
}

export function Layout({ children, title, subtitle, onLogout, showLogout }: Props) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-6 pt-5 sm:max-w-xl">
      <header className="mb-7 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[1.05rem] tracking-tight">
            <span className="font-semibold text-ink">fabriccost</span>
            <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-[0.26em] text-plum/70">
              STUDIO
            </span>
          </p>
          {title ? (
            <h1 className="font-display mt-2 text-[1.85rem] font-semibold leading-tight tracking-[-0.03em] text-ink">
              {title}
            </h1>
          ) : null}
          {subtitle ? <p className="mt-1.5 max-w-[34ch] text-[0.95rem] leading-relaxed text-plum/75">{subtitle}</p> : null}
        </div>
        {showLogout && onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="shrink-0 rounded-xl border border-plum/15 bg-paper px-3 py-2 text-xs font-semibold text-plum hover:border-plum/30"
          >
            Log out
          </button>
        ) : null}
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
