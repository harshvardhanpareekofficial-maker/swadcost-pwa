import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { GUIDE_PAGES, GUIDES_LASTMOD } from './guides'
import { OWNER_PATH } from './owner'
import { STUDIO_FAQS, isOwnerVaultPath } from './seo'

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
    expect(html).toMatch(/fabric cost calculator Ichalkaranji/)
    expect(html).toMatch(/powerloom grey fabric costing/)
    expect(html).toMatch(/Harshvardhan Pareek maker/)
    expect(html).toContain('rel="alternate" hrefLang="en-IN"')
    expect(html).toContain('rel="alternate" hrefLang="x-default"')
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
    expect(types).toEqual(
      expect.arrayContaining([
        'SoftwareApplication',
        'WebApplication',
        'Organization',
        'Person',
        'FAQPage',
        'WebPage',
        'HowTo',
      ]),
    )
    const howto = graph['@graph'].find((node) => node['@type'] === 'HowTo') as {
      step?: unknown[]
    }
    expect(howto?.step).toHaveLength(4)
    const faq = graph['@graph'].find((node) => node['@type'] === 'FAQPage') as {
      mainEntity?: Array<{ name?: string; acceptedAnswer?: { text?: string } }>
    }
    expect(faq?.mainEntity).toHaveLength(STUDIO_FAQS.length)
    expect(faq?.mainEntity?.map((q) => q.name)).toEqual(STUDIO_FAQS.map((item) => item.q))
    expect(faq?.mainEntity?.map((q) => q.acceptedAnswer?.text)).toEqual(STUDIO_FAQS.map((item) => item.a))
    expect(STUDIO_FAQS.length).toBeGreaterThanOrEqual(3)
    expect(STUDIO_FAQS.length).toBeLessThanOrEqual(6)
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
    expect(sitemap).toContain(`<lastmod>${GUIDES_LASTMOD}</lastmod>`)
    expect(sitemap).not.toContain('<changefreq>')
    expect(sitemap).not.toContain('<priority>')
    expect(sitemap).not.toContain(OWNER_PATH)
    for (const guide of GUIDE_PAGES) {
      expect(sitemap).toContain(`https://harshvardhanpareek.com${guide.path}`)
    }
    expect((sitemap.match(/<url>/g) ?? []).length).toBe(1 + GUIDE_PAGES.length)

    const render = readFileSync(join(root, 'render.yaml'), 'utf8')
    const vite = readFileSync(join(root, 'vite.config.ts'), 'utf8')
    expect(render.indexOf('source: /sitemap.xml')).toBeGreaterThan(-1)
    expect(render.indexOf('source: /sitemap.xml')).toBeLessThan(render.indexOf('source: /*'))
    expect(render).toContain('destination: /index.html')
    expect(render).toContain('text/xml; charset=utf-8')
    const redirects = readFileSync(join(root, 'public/_redirects'), 'utf8')
    expect(redirects).toMatch(/\/\*\s+\/index\.html\s+200/)
    expect(vite).toMatch(/navigateFallbackDenylist/)
    expect(vite).toMatch(/sitemap\\.xml/)
  })

  it('treats only the owner vault path as private', () => {
    expect(isOwnerVaultPath(OWNER_PATH)).toBe(true)
    expect(isOwnerVaultPath(`${OWNER_PATH}/`)).toBe(true)
    expect(isOwnerVaultPath('/')).toBe(false)
    expect(isOwnerVaultPath('/login')).toBe(false)
    expect(isOwnerVaultPath('/guides/grey-fabric-costing')).toBe(false)
  })

  it('keeps FAQ copy on the public login page and documents a post-deploy recrawl', () => {
    const login = readFileSync(join(root, 'src/pages/LoginPage.tsx'), 'utf8')
    const readme = readFileSync(join(root, 'README.md'), 'utf8')
    const envExample = readFileSync(join(root, '.env.example'), 'utf8')
    expect(login).toContain('StudioFaq')
    expect(login).toContain('GuideLinks')
    expect(login).toContain('fabric cost calculator for Ichalkaranji')
    expect(readme).toMatch(/URL Inspection/)
    expect(readme).toMatch(/days to weeks/)
    expect(readme).toMatch(/cannot guarantee overnight/)
    expect(readme).toMatch(/\/guides\//)
    expect(envExample).toMatch(/No API key required/)
    expect(envExample).toMatch(/speechSynthesis/)
  })
})
