import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Eyebrow } from './SectionLabel'
import { StudioBar, StudioBarAction } from './StudioBar'

type Props = {
  children: ReactNode
  eyebrow?: string
  title?: string
  subtitle?: string
  onLogout?: () => void
  showLogout?: boolean
}

export function Layout({ children, eyebrow, title, subtitle, onLogout, showLogout }: Props) {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-ivory text-ink">
      <StudioBar
        trailing={
          showLogout && onLogout ? (
            <StudioBarAction onClick={onLogout}>Log out</StudioBarAction>
          ) : null
        }
      />
      <main className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:max-w-xl sm:px-8 sm:pt-8">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <h1
            className={`font-display text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[1.85rem] ${eyebrow ? 'mt-2' : ''}`}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="mt-1.5 max-w-[36ch] text-[0.95rem] leading-relaxed text-plum/75">{subtitle}</p>
        ) : null}
        <div className={title || eyebrow ? 'mt-4 min-w-0 flex-1 sm:mt-7' : 'min-w-0 flex-1'}>{children}</div>
        <Footer className="mt-8 pt-4 sm:mt-10" />
      </main>
    </div>
  )
}
