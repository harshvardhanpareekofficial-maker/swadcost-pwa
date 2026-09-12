import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  CREATE_ACCOUNT_PATH,
  applyPublicDocument,
  clientShellPaths,
  guidePaths,
  writeSpaShellPages,
} from '../../scripts/spa-shell-pages.mjs'
import { GUIDE_PAGES, SITE_ORIGIN } from './guides'
import { CREATE_ACCOUNT_PATH as AUTH_CREATE_PATH } from './studioAuth'
import { OWNER_PATH } from './owner'

describe('spa shell pages', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
  })

  it('keeps the create-account path in sync with studio auth', () => {
    expect(CREATE_ACCOUNT_PATH).toBe(AUTH_CREATE_PATH)
    expect(clientShellPaths(`export const OWNER_PATH = '${OWNER_PATH}'`)).toEqual([
      ...GUIDE_PAGES.map((guide) => guide.path),
      CREATE_ACCOUNT_PATH,
      OWNER_PATH,
    ])
    expect(guidePaths()).toEqual(GUIDE_PAGES.map((guide) => guide.path))
  })

  it('copies the SPA shell into each known client-route folder', () => {
    const distDir = mkdtempSync(join(tmpdir(), 'spa-shell-'))
    dirs.push(distDir)
    writeFileSync(join(distDir, 'index.html'), '<html>shell</html>')
    const result = writeSpaShellPages({
      distDir,
      ownerSource: `export const OWNER_PATH = '${OWNER_PATH}'`,
    })
    expect(readFileSync(join(distDir, 'create-account/index.html'), 'utf8')).toBe('<html>shell</html>')
    expect(readFileSync(join(distDir, OWNER_PATH.slice(1), 'index.html'), 'utf8')).toBe(
      '<html>shell</html>',
    )
    for (const guide of GUIDE_PAGES) {
      expect(readFileSync(join(distDir, guide.path.slice(1), 'index.html'), 'utf8')).toBe(
        '<html>shell</html>',
      )
    }
    expect(result.written).toHaveLength(GUIDE_PAGES.length + 2)
  })

  it('rewrites title, canonical, HowTo JSON-LD and noscript on guide shells', () => {
    const guide = GUIDE_PAGES[0]
    const source = `<!doctype html><html><head>
      <title>Home title</title>
      <meta name="description" content="Home description" />
      <meta name="keywords" content="home" />
      <meta property="og:url" content="${SITE_ORIGIN}/" />
      <meta property="og:title" content="Home og" />
      <meta property="og:description" content="Home ogd" />
      <meta name="twitter:title" content="Home og" />
      <meta name="twitter:description" content="Home tw" />
      <link rel="canonical" href="${SITE_ORIGIN}/" />
      <link rel="alternate" hrefLang="en-IN" href="${SITE_ORIGIN}/" />
      <link rel="alternate" hrefLang="hi-IN" href="${SITE_ORIGIN}/" />
      <link rel="alternate" hrefLang="x-default" href="${SITE_ORIGIN}/" />
    </head><body><noscript><h1>Home noscript</h1></noscript><div id="root"></div></body></html>`
    const html = applyPublicDocument(source, {
      slug: guide.slug,
      navLabel: guide.navLabel,
      title: guide.title,
      ogTitle: guide.ogTitle,
      description: guide.description,
      keywords: guide.keywords,
      h1: guide.h1,
      lead: guide.lead,
      sections: guide.sections,
      howTo: guide.howTo,
    })
    expect(html).toContain(`<title>${guide.title}</title>`)
    expect(html).toContain(`content="${guide.description}"`)
    expect(html).toContain(`rel="canonical" href="${SITE_ORIGIN}${guide.path}"`)
    expect(html).toContain('id="page-jsonld"')
    expect(html).toContain('"@type": "HowTo"')
    expect(html).toContain('"@type": "BreadcrumbList"')
    expect(html).toContain(`<h1>${guide.h1}</h1>`)
    expect(html).toContain('Made by Harshvardhan Pareek')
    expect(html).not.toMatch(/SwadCost|swadcost/)
  })
})
