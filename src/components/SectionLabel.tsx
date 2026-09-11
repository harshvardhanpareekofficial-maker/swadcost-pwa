import type { ReactNode } from 'react'
import { studioEyebrowClass, studioLabelClass } from './studio'

export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`${studioLabelClass} ${className}`}>{children}</h2>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={studioEyebrowClass}>{children}</p>
}
