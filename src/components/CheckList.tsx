import { IconCheck } from './Icons'

export function CheckList({
  items,
  layout = 'stack',
}: {
  items: string[]
  layout?: 'stack' | 'row'
}) {
  return (
    <ul
      className={
        layout === 'row'
          ? 'flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-ink'
          : 'space-y-2.5 text-sm text-ink'
      }
    >
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-plum text-ivory">
            <IconCheck />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}
