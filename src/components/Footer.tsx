export function MakerNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-plum/55 ${className}`}>
      Harshvardhan Pareek built fabriccost STUDIO in Ichalkaranji, India.
    </p>
  )
}

export function Footer({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-plum/70 ${className}`}
    >
      <p>
        Made by <span className="font-semibold text-plum">Harshvardhan Pareek</span>
      </p>
      <p className="text-[11px] font-medium tracking-[0.04em] text-plum/45">fabriccost STUDIO</p>
    </footer>
  )
}
