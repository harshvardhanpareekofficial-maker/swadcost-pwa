import { Link, useNavigate, useParams } from 'react-router-dom'
import { Footer, MakerNote } from '../components/Footer'
import { IconArrow } from '../components/Icons'
import { StudioBar } from '../components/StudioBar'
import { studioEyebrowClass } from '../components/studio'
import { GUIDE_PAGES, guideBySlug, relatedGuides } from '../lib/guides'

function CalculatorLink({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-plum px-4 py-3 text-base font-semibold text-ivory shadow-[0_8px_20px_rgba(59,31,74,0.22)] hover:bg-plum-deep ${className}`}
    >
      Open the fabric cost calculator
      <IconArrow />
    </Link>
  )
}

function MissingGuide() {
  const navigate = useNavigate()
  return (
    <div className="studio-atmosphere flex min-h-dvh min-w-0 flex-col overflow-x-hidden text-ink">
      <StudioBar onBack={() => navigate('/')} backLabel="Calculator" />
      <main className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-[max(1rem,env(safe-area-inset-left))] py-6 pr-[max(1rem,env(safe-area-inset-right))] sm:px-8 sm:py-10">
        <p className={studioEyebrowClass}>Mill guide</p>
        <h1 className="font-display mt-2 text-[1.7rem] font-semibold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[2.1rem]">
          This guide is not on the mill sheet.
        </h1>
        <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-plum/75">
          The public costing guides live next to the calculator. Open fabriccost STUDIO to run a
          grey fabric sheet, or pick a guide below.
        </p>
        <CalculatorLink className="mt-6 max-w-md" />
        <ul className="mt-6 space-y-2 text-sm">
          {GUIDE_PAGES.map((guide) => (
            <li key={guide.slug}>
              <Link to={guide.path} className="font-semibold text-plum underline-offset-4 hover:underline">
                {guide.navLabel}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer className="px-[max(1rem,env(safe-area-inset-left))] py-3 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8" />
    </div>
  )
}

export function GuidePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const guide = guideBySlug(slug)
  if (!guide) return <MissingGuide />

  const others = relatedGuides(guide.slug)

  return (
    <div className="studio-atmosphere flex min-h-dvh min-w-0 flex-col overflow-x-hidden text-ink">
      <StudioBar onBack={() => navigate('/')} backLabel="Calculator" />
      <main className="mx-auto w-full min-w-0 max-w-2xl flex-1 px-[max(1rem,env(safe-area-inset-left))] py-5 pr-[max(1rem,env(safe-area-inset-right))] sm:px-8 sm:py-8">
        <p className={studioEyebrowClass}>Mill guide · fabriccost STUDIO</p>
        <h1 className="font-display mt-2 text-[1.7rem] font-semibold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[2.15rem]">
          {guide.h1}
        </h1>
        <p className="mt-3 max-w-[52ch] text-[0.98rem] leading-relaxed text-plum/80 sm:text-base">
          {guide.lead}
        </p>
        <MakerNote className="mt-3 max-w-[52ch]" />

        {guide.sections.map((section) => (
          <section key={section.heading} className="mt-7 sm:mt-8">
            <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="mt-2.5 text-sm leading-relaxed text-plum/80 sm:text-[0.95rem]">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-8 max-w-md sm:mt-10">
          <CalculatorLink />
          <p className="mt-3 text-center text-xs leading-relaxed text-plum/55">
            Sign in on the homepage to keep cost sheets on this device.
          </p>
        </section>

        <nav className="mt-8 border-t border-plum/10 pt-5" aria-label="Other mill guides">
          <p className={studioEyebrowClass}>Other mill guides</p>
          <ul className="mt-3 space-y-2">
            {others.map((item) => (
              <li key={item.slug}>
                <Link
                  to={item.path}
                  className="min-h-11 text-sm font-semibold text-plum underline-offset-4 hover:underline"
                >
                  {item.navLabel}
                </Link>
                <p className="mt-0.5 max-w-[46ch] text-xs leading-relaxed text-plum/60">{item.lead}</p>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <Footer className="px-[max(1rem,env(safe-area-inset-left))] py-3 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8" />
    </div>
  )
}
