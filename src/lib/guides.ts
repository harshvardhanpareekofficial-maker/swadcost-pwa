import catalog from './guides.json' with { type: 'json' }

export const SITE_ORIGIN = catalog.siteOrigin
export const GUIDES_LASTMOD = catalog.lastmod

export type GuideHowToStep = {
  name: string
  text: string
}

export type GuideSection = {
  heading: string
  paragraphs: string[]
}

export type GuidePage = {
  slug: string
  path: string
  navLabel: string
  title: string
  ogTitle: string
  description: string
  keywords: string
  h1: string
  lead: string
  sections: GuideSection[]
  howTo: {
    name: string
    description: string
    steps: GuideHowToStep[]
  }
}

export const GUIDE_PAGES: GuidePage[] = catalog.guides.map((guide) => ({
  ...guide,
  path: `/guides/${guide.slug}`,
}))

export const GUIDE_PATHS = GUIDE_PAGES.map((guide) => guide.path)

export function normalizePublicPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

export function guideBySlug(slug: string | undefined): GuidePage | undefined {
  if (!slug) return undefined
  return GUIDE_PAGES.find((guide) => guide.slug === slug)
}

export function guideByPath(pathname: string): GuidePage | undefined {
  const path = normalizePublicPath(pathname)
  return GUIDE_PAGES.find((guide) => guide.path === path)
}

export function relatedGuides(slug: string): GuidePage[] {
  return GUIDE_PAGES.filter((guide) => guide.slug !== slug)
}

export function guideAbsoluteUrl(guide: GuidePage): string {
  return `${SITE_ORIGIN}${guide.path}`
}

export function pageStructuredData(guide: GuidePage): Record<string, unknown> {
  const url = guideAbsoluteUrl(guide)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: guide.h1,
        description: guide.description,
        inLanguage: 'en-IN',
        isPartOf: { '@id': `${SITE_ORIGIN}/#app` },
        author: { '@id': `${SITE_ORIGIN}/#person` },
        creator: { '@id': `${SITE_ORIGIN}/#person` },
        dateModified: GUIDES_LASTMOD.slice(0, 10),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'fabriccost STUDIO',
            item: `${SITE_ORIGIN}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: guide.h1,
            item: url,
          },
        ],
      },
      {
        '@type': 'HowTo',
        '@id': `${url}#howto`,
        name: guide.howTo.name,
        description: guide.howTo.description,
        inLanguage: 'en-IN',
        step: guide.howTo.steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
        })),
      },
    ],
  }
}
