#!/usr/bin/env node
/**
 * Copy dist/index.html to known client-route folders so Render (and any
 * static host) serves the SPA shell when those paths exist as real files.
 * Public mill guides get unique title/description/canonical/JSON-LD/noscript
 * so crawlers receive crawlable HTML, not only the homepage shell.
 * Catch-all unknown paths still need a CDN rewrite (render.yaml / Dashboard).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export const CREATE_ACCOUNT_PATH = '/create-account'

export function loadGuideCatalog(catalogSource) {
  const catalog =
    catalogSource ??
    JSON.parse(readFileSync(join(root, 'src/lib/guides.json'), 'utf8'))
  return catalog
}

export function guidePaths(catalog = loadGuideCatalog()) {
  return catalog.guides.map((guide) => `/guides/${guide.slug}`)
}

export function clientShellPaths(ownerSource, catalog = loadGuideCatalog()) {
  const match = ownerSource.match(/export const OWNER_PATH = '(\/[^']+)'/)
  if (!match) throw new Error('OWNER_PATH export not found in src/lib/owner.ts')
  return [...guidePaths(catalog), CREATE_ACCOUNT_PATH, match[1]]
}

function escapeAttr(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeText(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function replaceMeta(html, attr, key, content) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")([^"]*)(")`, 'i')
  return html.replace(re, `$1${escapeAttr(content)}$3`)
}

function replaceHref(html, rel, hrefLang, href) {
  const lang = hrefLang ? ` hrefLang="${hrefLang}"` : ''
  const re = new RegExp(`(rel="${rel}"${lang} href=")([^"]*)(")`, hrefLang ? '' : 'i')
  return html.replace(re, `$1${href}$3`)
}

function pageStructuredData(guide, origin, lastmod) {
  const path = `/guides/${guide.slug}`
  const url = `${origin}${path}`
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
        isPartOf: { '@id': `${origin}/#app` },
        author: { '@id': `${origin}/#person` },
        creator: { '@id': `${origin}/#person` },
        dateModified: lastmod.slice(0, 10),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'fabriccost STUDIO',
            item: `${origin}/`,
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

function noscriptArticle(guide, origin) {
  const sections = guide.sections
    .map((section) => {
      const paras = section.paragraphs.map((p) => `<p>${escapeText(p)}</p>`).join('')
      return `<h2>${escapeText(section.heading)}</h2>${paras}`
    })
    .join('')
  return `<noscript>
      <article>
        <h1>${escapeText(guide.h1)}</h1>
        <p>${escapeText(guide.lead)}</p>
        ${sections}
        <p>Open the fabric cost calculator at ${origin}/ — Made by Harshvardhan Pareek.</p>
      </article>
    </noscript>`
}

export function applyPublicDocument(html, guide, catalog = loadGuideCatalog()) {
  const origin = catalog.siteOrigin
  const lastmod = catalog.lastmod
  const path = `/guides/${guide.slug}`
  const url = `${origin}${path}`
  let out = html
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeText(guide.title)}</title>`)
  out = replaceMeta(out, 'name', 'description', guide.description)
  out = replaceMeta(out, 'name', 'keywords', guide.keywords)
  out = replaceMeta(out, 'property', 'og:url', url)
  out = replaceMeta(out, 'property', 'og:title', guide.ogTitle)
  out = replaceMeta(out, 'property', 'og:description', guide.description)
  out = replaceMeta(out, 'name', 'twitter:title', guide.ogTitle)
  out = replaceMeta(out, 'name', 'twitter:description', guide.description)
  out = replaceHref(out, 'canonical', '', url)
  out = replaceHref(out, 'alternate', 'en-IN', url)
  out = replaceHref(out, 'alternate', 'hi-IN', url)
  out = replaceHref(out, 'alternate', 'x-default', url)
  const json = JSON.stringify(pageStructuredData(guide, origin, lastmod), null, 2)
  if (out.includes('id="page-jsonld"')) {
    out = out.replace(
      /<script type="application\/ld\+json" id="page-jsonld">[\s\S]*?<\/script>/,
      `<script type="application/ld+json" id="page-jsonld">\n      ${json}\n    </script>`,
    )
  } else {
    out = out.replace(
      '</head>',
      `    <script type="application/ld+json" id="page-jsonld">\n      ${json}\n    </script>\n  </head>`,
    )
  }
  out = out.replace(/<noscript>[\s\S]*?<\/noscript>/, noscriptArticle(guide, origin))
  return out
}

export function writeSpaShellPages({
  distDir = join(root, 'dist'),
  ownerSource = readFileSync(join(root, 'src/lib/owner.ts'), 'utf8'),
  catalog = loadGuideCatalog(),
} = {}) {
  const indexHtml = join(distDir, 'index.html')
  const raw = readFileSync(indexHtml, 'utf8')
  const written = []
  const guidesByPath = new Map(catalog.guides.map((guide) => [`/guides/${guide.slug}`, guide]))
  for (const pathname of clientShellPaths(ownerSource, catalog)) {
    const dest = join(distDir, pathname.replace(/^\//, ''), 'index.html')
    mkdirSync(dirname(dest), { recursive: true })
    const guide = guidesByPath.get(pathname)
    const html = guide ? applyPublicDocument(raw, guide, catalog) : raw
    writeFileSync(dest, html)
    written.push(dest)
  }
  return { indexHtml, written, bytes: Buffer.byteLength(raw) }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const result = writeSpaShellPages()
  console.log(`spa-shell: wrote ${result.written.length} client-route index.html copies`)
}
