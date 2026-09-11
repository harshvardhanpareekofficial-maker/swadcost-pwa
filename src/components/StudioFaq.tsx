import { STUDIO_FAQS } from '../lib/seo'

export function StudioFaq({
  className = '',
  id,
}: {
  className?: string
  id?: string
}) {
  const headingId = id ? `${id}-heading` : 'studio-faq-heading'
  return (
    <section id={id} className={className} aria-labelledby={headingId}>
      <h2 id={headingId} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-plum/55">
        About this fabric cost calculator
      </h2>
      <dl className="mt-3 space-y-3">
        {STUDIO_FAQS.map((item) => (
          <div key={item.q}>
            <dt className="text-sm font-semibold text-ink">{item.q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-plum/70">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
