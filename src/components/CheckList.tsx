import { IconCheck } from './Icons'

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 text-sm text-ink">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-plum text-ivory">
            <IconCheck />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}
