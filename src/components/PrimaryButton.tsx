import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function PrimaryButton({ children, variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'
  const styles =
    variant === 'primary'
      ? 'bg-plum text-ivory shadow-sheet hover:bg-plum-deep'
      : variant === 'secondary'
        ? 'border border-plum/15 bg-paper text-plum hover:border-plum/35'
        : 'text-plum/70 hover:text-plum'
  return (
    <button type="button" className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  )
}
