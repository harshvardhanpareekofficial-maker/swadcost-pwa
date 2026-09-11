import type { ReactNode } from 'react'
import { studioSheetClass } from './studio'

export function StudioSheet({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div className={`${studioSheetClass} ${padded ? 'p-5 sm:p-8' : ''} ${className}`}>
      {children}
    </div>
  )
}
