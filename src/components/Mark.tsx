export function Mark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      <rect width="36" height="36" rx="9" fill="#3B1F4A" />
      <g>
        {[0, 1, 2, 3].flatMap((row) =>
          [0, 1, 2, 3].map((col) => {
            const over = (row + col) % 2 === 0
            return (
              <rect
                key={`${row}-${col}`}
                x={6.5 + col * 6.2}
                y={6.5 + row * 6.2}
                width="4.6"
                height="4.6"
                rx="1.1"
                fill={over ? '#E8A838' : '#F7F1E8'}
                opacity={over ? 0.95 : 0.72}
              />
            )
          }),
        )}
      </g>
    </svg>
  )
}
