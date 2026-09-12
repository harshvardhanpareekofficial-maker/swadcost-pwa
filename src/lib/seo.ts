import { OWNER_PATH } from './owner'

export const PUBLIC_ROBOTS = 'index, follow'
export const VAULT_ROBOTS = 'noindex, nofollow'

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

/** Apply indexing rules as soon as the route is known (before React paint). */
export function applyDocumentIndexing(pathname: string): void {
  const robots = robotsMeta()
  if (isOwnerVaultPath(pathname)) {
    robots?.setAttribute('content', VAULT_ROBOTS)
    document.title = 'Owner vault'
    return
  }
  robots?.setAttribute('content', PUBLIC_ROBOTS)
}
