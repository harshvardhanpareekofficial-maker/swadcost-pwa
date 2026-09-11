import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { OWNER_PATH } from './owner'
import { isOwnerVaultPath } from './seo'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

describe('on-page SEO', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8')
  const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8')
  const sitemap = readFileSync(join(root, 'public/sitemap.xml'), 'utf8')

  it('has a keyword-rich title, description, and canonical', () => {
    expect(html).toMatch(/<title>[^<]*[Ff]abric [Cc]ost [Cc]alculator[^<]*<\/title>/)
    expect(html).toMatch(/<title>[^<]*Harshvardhan Pareek[^<]*<\/title>/)
    expect(html).toMatch(/textile costing/i)
    expect(html).toMatch(/powerloom/i)
    expect(html).toMatch(/warp/i)
    expect(html).toMatch(/weft/i)
    expect(html).toMatch(/grey fabric/i)
    expect(html).toMatch(/Ichalkaranji/)
    expect(html).toContain('rel="canonical" href="https://harshvardhanpareek.com/"')
    expect(html).toMatch(/name="keywords"[^>]*content="[^"]*Harshvardhan Pareek/)
    expect(html).toMatch(/name="keywords"[^>]*content="[^"]*harshvardhan pareek/)
    expect(html).toMatch(/name="keywords"[^>]*content="[^"]*Pareektech/)
    expect(html).toMatch(/name="keywords"[^>]*content="[^"]*fabric cost calculator/)
  })

  it('completes Open Graph and Twitter tags', () => {
    expect(html).toContain('property="og:title"')
    expect(html).toContain('property="og:description"')
    expect(html).toContain('property="og:image"')
    expect(html).toContain('property="og:url"')
    expect(html).toContain('property="og:locale"')
    expect(html).toContain('name="twitter:card"')
    expect(html).toContain('summary_large_image')
    expect(html).toContain('name="twitter:image"')
  })

  it('embeds SoftwareApplication / WebApplication and Organization JSON-LD', () => {
    expect(html).toContain('application/ld+json')
    expect(html).toContain('SoftwareApplication')
    expect(html).toContain('WebApplication')
    expect(html).toContain('"@type": "Organization"')
    expect(html).toContain('"@type": "Person"')
    expect(html).toMatch(/"name": "Harshvardhan Pareek"/)
    expect(html).toMatch(/"keywords": "[^"]*fabric cost calculator/)
    expect(html).toContain('"creator": { "@id": "https://harshvardhanpareek.com/#person" }')
    expect(html).toContain('"author": { "@id": "https://harshvardhanpareek.com/#person" }')
    expect(html).toContain('https://github.com/harshvardhanpareekofficial-maker')
    expect(html).not.toMatch(/linkedin\.com|twitter\.com|instagram\.com/)

    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    expect(ldMatch).toBeTruthy()
    const graph = JSON.parse(ldMatch![1]) as {
      '@graph': Array<Record<string, unknown>>
    }
    const types = graph['@graph'].flatMap((node) =>
      Array.isArray(node['@type']) ? node['@type'] : [node['@type']],
    )
    expect(types).toEqual(expect.arrayContaining(['SoftwareApplication', 'WebApplication', 'Organization', 'Person']))
    const person = graph['@graph'].find((node) => node['@type'] === 'Person')
    expect(person?.sameAs).toEqual(
      expect.arrayContaining([
        'https://github.com/harshvardhanpareekofficial-maker',
        'https://harshvardhanpareek.com/',
      ]),
    )
  })

  it('allows the site and disallows the owner vault', () => {
    expect(robots).toMatch(/Allow:\s*\//)
    expect(robots).toContain(`Disallow: ${OWNER_PATH}`)
    expect(robots).toContain('Sitemap: https://harshvardhanpareek.com/sitemap.xml')
    expect(sitemap).toContain('https://harshvardhanpareek.com/')
    expect(sitemap).toContain('<lastmod>2026-09-11T00:00:00+00:00</lastmod>')
    expect(sitemap).not.toContain('<changefreq>')
    expect(sitemap).not.toContain('<priority>')
    expect(sitemap).not.toContain(OWNER_PATH)

    const render = readFileSync(join(root, 'render.yaml'), 'utf8')
    const vite = readFileSync(join(root, 'vite.config.ts'), 'utf8')
    expect(render.indexOf('source: /sitemap.xml')).toBeGreaterThan(-1)
    expect(render.indexOf('source: /sitemap.xml')).toBeLessThan(render.indexOf('source: /*'))
    expect(render).toContain('text/xml; charset=utf-8')
    expect(vite).toMatch(/navigateFallbackDenylist/)
    expect(vite).toMatch(/sitemap\\.xml/)
  })

  it('treats only the owner vault path as private', () => {
    expect(isOwnerVaultPath(OWNER_PATH)).toBe(true)
    expect(isOwnerVaultPath(`${OWNER_PATH}/`)).toBe(true)
    expect(isOwnerVaultPath('/')).toBe(false)
    expect(isOwnerVaultPath('/login')).toBe(false)
  })
})
