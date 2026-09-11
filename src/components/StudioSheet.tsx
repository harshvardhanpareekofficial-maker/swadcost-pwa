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
    <div className={`${studioSheetClass} min-w-0 ${padded ? 'p-4 sm:p-7' : ''} ${className}`}>
      {children}
    </div>
  )
}
