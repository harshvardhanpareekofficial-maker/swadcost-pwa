const WARP = ['#3B1F4A', '#E8A838', '#F3E6D2', '#6B3A7A', '#C48A22']
const WEFT = ['#C48A22', '#2A1534', '#E8A838', '#5A2F6E']

type Props = {
  className?: string
  compact?: boolean
}

export function WeaveGraphic({ className = '', compact = false }: Props) {
  const cols = compact ? 11 : 15
  const rows = compact ? 6 : 8
  const tw = compact ? 10 : 12
  const gap = compact ? 4 : 5
  const pad = 8
  const width = pad * 2 + cols * (tw + gap) - gap
  const height = pad * 2 + rows * (tw + gap) - gap

  return (
    <figure className={`relative ${className}`}>
      <p className="mb-2 text-center text-[10px] font-semibold tracking-[0.28em] text-plum/45">
        WEFT / CROSSWISE
      </p>
      <div className="relative">
        <p className="pointer-events-none absolute -right-2 top-1/2 hidden origin-center -translate-y-1/2 rotate-90 text-[10px] font-semibold tracking-[0.28em] text-plum/45 sm:block lg:-right-3">
          WARP / LENGTHWISE
        </p>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full max-w-md"
          role="img"
          aria-label="Warp and weft weave"
          style={{
            maskImage:
              'linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%), linear-gradient(180deg, transparent 0%, #000 10%, #000 90%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)',
            maskComposite: 'intersect',
          }}
        >
          {Array.from({ length: rows }, (_, r) => (
            <rect
              key={`weft-${r}`}
              x={pad}
              y={pad + r * (tw + gap)}
              width={cols * (tw + gap) - gap}
              height={tw}
              rx={tw / 2}
              fill={WEFT[r % WEFT.length]}
              opacity={0.88}
            />
          ))}
          {Array.from({ length: cols }, (_, c) =>
            Array.from({ length: rows }, (_, r) =>
              (c + r) % 2 === 0 ? (
                <rect
                  key={`warp-${c}-${r}`}
                  x={pad + c * (tw + gap)}
                  y={pad + r * (tw + gap) - gap / 2}
                  width={tw}
                  height={tw + gap}
                  rx={tw / 2}
                  fill={WARP[c % WARP.length]}
                  opacity={0.94}
                />
              ) : null,
            ),
          )}
        </svg>
      </div>
    </figure>
  )
}
