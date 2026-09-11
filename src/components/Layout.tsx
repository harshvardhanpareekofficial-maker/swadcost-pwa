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
    <div className="flex min-h-dvh flex-col bg-ivory text-ink">
      <StudioBar
        trailing={
          showLogout && onLogout ? (
            <StudioBarAction onClick={onLogout}>Log out</StudioBarAction>
          ) : null
        }
      />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-8 pt-8 sm:max-w-xl sm:px-8">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <h1
            className={`font-display text-[1.85rem] font-semibold leading-[1.12] tracking-[-0.03em] text-ink ${eyebrow ? 'mt-2' : ''}`}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="mt-1.5 max-w-[36ch] text-[0.95rem] leading-relaxed text-plum/75">{subtitle}</p>
        ) : null}
        <div className={title || eyebrow ? 'mt-7 flex-1' : 'flex-1'}>{children}</div>
        <Footer className="mt-10 pt-4" />
      </main>
    </div>
  )
}
