import { OWNER_PATH } from './owner'

export const PUBLIC_ROBOTS = 'index, follow'
export const VAULT_ROBOTS = 'noindex, nofollow'

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
