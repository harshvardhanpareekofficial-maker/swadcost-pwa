import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function PrimaryButton({ children, variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'
  const styles =
    variant === 'primary'
      ? 'bg-accent text-ink hover:bg-accent-soft shadow-lg shadow-amber-500/20'
      : variant === 'secondary'
        ? 'border border-white/15 bg-white/5 text-cream hover:bg-white/10'
        : 'text-muted hover:text-cream'
  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  )
}
