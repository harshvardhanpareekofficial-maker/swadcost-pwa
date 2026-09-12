import { Link } from 'react-router-dom'
import { GUIDE_PAGES } from '../lib/guides'
import { studioEyebrowClass } from './studio'

export function GuideLinks({ className = '' }: { className?: string }) {
  return (
    <nav className={className} aria-label="Mill costing guides">
      <p className={studioEyebrowClass}>Mill guides</p>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
        {GUIDE_PAGES.map((guide) => (
          <li key={guide.slug}>
            <Link
              to={guide.path}
              className="inline-flex min-h-11 items-center font-semibold text-plum underline-offset-4 hover:underline"
            >
              {guide.navLabel}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
