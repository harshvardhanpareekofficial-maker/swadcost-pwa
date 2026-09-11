export function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`border-t border-plum/10 text-left text-sm text-plum/70 ${className}`}>
      <p>
        Made by <span className="font-semibold text-plum">Harshvardhan Pareek</span>
      </p>
    </footer>
  )
}
