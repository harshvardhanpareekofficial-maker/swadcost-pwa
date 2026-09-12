import { OWNER_PATH } from './owner'
import { SITE_ORIGIN, guideByPath, pageStructuredData } from './guides'

export const PUBLIC_ROBOTS = 'index, follow'
export const VAULT_ROBOTS = 'noindex, nofollow'

export const HOME_SEO = {
  title:
    'fabriccost STUDIO by Harshvardhan Pareek | Fabric Cost Calculator — Textile & Powerloom',
  description:
    'Free fabric cost calculator for Ichalkaranji powerloom mills by Harshvardhan Pareek. Powerloom grey fabric costing: warp, weft, reed, pick, sizing and job rate. Speak or type mill-sheet values.',
  keywords:
    'Harshvardhan Pareek, harshvardhan pareek, Harshvardhan Pareek maker, fabric cost calculator, fabric cost calculator Ichalkaranji, textile costing, powerloom, powerloom grey fabric costing, warp weft, grey fabric, reed pick, sizing, job rate, India, Ichalkaranji, fabriccost STUDIO, Pareektech, maker',
  ogTitle: 'fabriccost STUDIO by Harshvardhan Pareek | Fabric Cost Calculator',
  ogDescription:
    'Harshvardhan Pareek’s fabric cost calculator for Ichalkaranji powerloom mills — grey fabric costing: warp, weft, sizing and job rate. Speak or type. Installable PWA.',
  twitterDescription:
    'Harshvardhan Pareek — fabric cost calculator for Ichalkaranji. Powerloom grey fabric costing: warp, weft, sizing and job rate.',
  path: '/',
} as const

/** Visible + JSON-LD FAQs. Keep answers honest — no ranking guarantees. */
export const STUDIO_FAQS = [
  {
    q: 'What is fabriccost STUDIO?',
    a: 'A free fabric cost calculator for Indian powerloom grey fabric costing. It works out warp, weft, reed, pick, sizing and job rate from mill-sheet values.',
  },
  {
    q: 'Is this a fabric cost calculator for Ichalkaranji mills?',
    a: 'Yes. Harshvardhan Pareek built fabriccost STUDIO in Ichalkaranji for local powerloom mills. The same grey-fabric formulas are used across India.',
  },
  {
    q: 'How does powerloom grey fabric costing work here?',
    a: 'Sign in, name the dalal or broker, choose Single Warp or Multiple Warp / Weft, then speak or type reed, pick, counts and rates. Warp weight uses 1825; weft weight uses 1693.33.',
  },
  {
    q: 'Who is Harshvardhan Pareek, the maker?',
    a: 'Harshvardhan Pareek is the maker of fabriccost STUDIO (Pareektech), based in Ichalkaranji, Maharashtra.',
  },
  {
    q: 'Do spoken field prompts need a paid API key?',
    a: 'No. Speak mode uses free Chrome Web Speech for continuous dictation. Browser speechSynthesis voices (Google, Microsoft or Apple) are optional and stay quiet while you talk. An ElevenLabs key is optional and not required.',
  },
] as const

export function isOwnerVaultPath(pathname: string): boolean {
  return pathname === OWNER_PATH || pathname.startsWith(`${OWNER_PATH}/`)
}

function robotsMeta(): HTMLMetaElement | null {
  return document.querySelector('meta[name="robots"]')
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  const el = document.querySelector(`meta[${attr}="${key}"]`)
  el?.setAttribute('content', content)
}

function setCanonicalAndAlternates(href: string): void {
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', href)
  document.querySelectorAll('link[rel="alternate"]').forEach((link) => {
    link.setAttribute('href', href)
  })
}

function upsertPageJsonLd(data: Record<string, unknown> | null): void {
  const existing = document.getElementById('page-jsonld')
  if (!data) {
    existing?.remove()
    return
  }
  let el = existing
  if (!el) {
    el = document.createElement('script')
    el.id = 'page-jsonld'
    el.setAttribute('type', 'application/ld+json')
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function applyHomeDocument(): void {
  document.title = HOME_SEO.title
  setMeta('name', 'description', HOME_SEO.description)
  setMeta('name', 'keywords', HOME_SEO.keywords)
  setMeta('property', 'og:url', `${SITE_ORIGIN}/`)
  setMeta('property', 'og:title', HOME_SEO.ogTitle)
  setMeta('property', 'og:description', HOME_SEO.ogDescription)
  setMeta('name', 'twitter:title', HOME_SEO.ogTitle)
  setMeta('name', 'twitter:description', HOME_SEO.twitterDescription)
  setCanonicalAndAlternates(`${SITE_ORIGIN}/`)
  upsertPageJsonLd(null)
}

/** Apply indexing rules as soon as the route is known (before React paint). */
export function applyDocumentIndexing(pathname: string): void {
  const robots = robotsMeta()
  if (isOwnerVaultPath(pathname)) {
    robots?.setAttribute('content', VAULT_ROBOTS)
    document.title = 'Owner vault'
    return
  }
  robots?.setAttribute('content', PUBLIC_ROBOTS)
  const guide = guideByPath(pathname)
  if (!guide) {
    applyHomeDocument()
    return
  }
  const url = `${SITE_ORIGIN}${guide.path}`
  document.title = guide.title
  setMeta('name', 'description', guide.description)
  setMeta('name', 'keywords', guide.keywords)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:title', guide.ogTitle)
  setMeta('property', 'og:description', guide.description)
  setMeta('name', 'twitter:title', guide.ogTitle)
  setMeta('name', 'twitter:description', guide.description)
  setCanonicalAndAlternates(url)
  upsertPageJsonLd(pageStructuredData(guide))
}
