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
    expect(html).toMatch(/textile costing/i)
    expect(html).toMatch(/powerloom/i)
    expect(html).toMatch(/warp/i)
    expect(html).toMatch(/weft/i)
    expect(html).toMatch(/grey fabric/i)
    expect(html).toMatch(/Ichalkaranji/)
    expect(html).toContain('rel="canonical" href="https://harshvardhanpareek.com/"')
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
    expect(html).toMatch(/"name": "Harshvardhan Pareek"/)
  })

  it('allows the site and disallows the owner vault', () => {
    expect(robots).toMatch(/Allow:\s*\//)
    expect(robots).toContain(`Disallow: ${OWNER_PATH}`)
    expect(robots).toContain('Sitemap: https://harshvardhanpareek.com/sitemap.xml')
    expect(sitemap).toContain('https://harshvardhanpareek.com/')
    expect(sitemap).not.toContain(OWNER_PATH)
  })

  it('treats only the owner vault path as private', () => {
    expect(isOwnerVaultPath(OWNER_PATH)).toBe(true)
    expect(isOwnerVaultPath(`${OWNER_PATH}/`)).toBe(true)
    expect(isOwnerVaultPath('/')).toBe(false)
    expect(isOwnerVaultPath('/login')).toBe(false)
  })
})
