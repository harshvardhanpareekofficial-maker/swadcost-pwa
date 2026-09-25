import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function PrimaryButton({ children, variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-12'
  const styles =
    variant === 'primary'
      ? 'bg-plum text-ivory shadow-none hover:bg-plum-deep'
      : variant === 'secondary'
        ? 'border border-plum/15 bg-paper/80 text-plum hover:border-plum/35'
        : 'text-plum/70 hover:text-plum'
  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  )
}
