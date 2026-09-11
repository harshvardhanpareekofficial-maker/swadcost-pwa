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
    <figure className={className}>
      <p className="mb-2 text-center text-[10px] font-semibold tracking-[0.28em] text-plum/45">
        WEFT / CROSSWISE
      </p>
      <div className="flex items-center gap-2 sm:gap-3">
        <p
          className="hidden shrink-0 text-[9px] font-semibold tracking-[0.28em] text-plum/45 sm:block"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          WARP / LENGTHWISE
        </p>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Warp and weft weave"
          style={{
            WebkitMaskImage:
              'linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)',
            maskImage: 'linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)',
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
