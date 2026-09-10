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
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">SwadCost</p>
          {title ? (
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-cream">{title}</h1>
          ) : null}
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {showLogout && onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-muted hover:bg-white/10"
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
