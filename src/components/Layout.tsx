import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Eyebrow } from './SectionLabel'
import { StudioBar } from './StudioBar'

type Props = {
  children: ReactNode
  eyebrow?: string
  title?: string
  subtitle?: string
  onLogout?: () => void
  onBack?: () => void
  backLabel?: string
  stickyFooter?: ReactNode
}

export function Layout({
  children,
  eyebrow,
  title,
  subtitle,
  onLogout,
  onBack,
  backLabel,
  stickyFooter,
}: Props) {
  return (
    <div className="studio-atmosphere flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden text-ink">
      <StudioBar onBack={onBack} backLabel={backLabel} onLogout={onLogout} />
      <main className="mx-auto flex w-full min-h-0 min-w-0 max-w-lg flex-1 flex-col overflow-y-auto px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3.5 sm:max-w-xl sm:px-8 sm:pt-8">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {title ? (
          <h1
            className={`font-display text-[1.55rem] font-semibold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[2rem] ${eyebrow ? 'mt-1.5' : ''}`}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="mt-1.5 max-w-[42ch] text-sm leading-relaxed text-plum/75 sm:mt-2 sm:text-[0.95rem]">
            {subtitle}
          </p>
        ) : null}
        <div className={title || eyebrow ? 'mt-4 min-w-0 flex-1 sm:mt-7' : 'min-w-0 flex-1'}>{children}</div>
        <Footer className="mt-8 pt-4 sm:mt-12 sm:pt-5" />
      </main>
      {stickyFooter}
    </div>
  )
}
