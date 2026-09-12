import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  GUIDE_PAGES,
  GUIDE_PATHS,
  SITE_ORIGIN,
  guideByPath,
  guideBySlug,
  pageStructuredData,
} from './guides'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

describe('mill guide catalog', () => {
  it('publishes three indexable mill guides with distinct niche targets', () => {
    expect(GUIDE_PAGES).toHaveLength(3)
    expect(GUIDE_PATHS).toEqual([
      '/guides/fabric-cost-calculator-ichalkaranji',
      '/guides/grey-fabric-costing',
      '/guides/powerloom-fabric-cost',
    ])
    expect(guideBySlug('grey-fabric-costing')?.h1).toMatch(/[Gg]rey fabric costing/)
    expect(guideByPath('/guides/powerloom-fabric-cost/')?.slug).toBe('powerloom-fabric-cost')
    const main = readFileSync(join(root, 'src/main.tsx'), 'utf8')
    expect(main).toContain('path="/guides/:slug"')
    expect(main).toContain('GuidePage')
  })

  it('keeps mill-oriented copy, maker credit, and a calculator path — no SwadCost', () => {
    const json = readFileSync(join(root, 'src/lib/guides.json'), 'utf8')
    const page = readFileSync(join(root, 'src/pages/GuidePage.tsx'), 'utf8')
    expect(json).not.toMatch(/SwadCost|swadcost/)
    expect(page).not.toMatch(/SwadCost|swadcost/)
    expect(page).toContain('to="/"')
    expect(page).toContain('Open the fabric cost calculator')
    expect(page).toContain('MakerNote')

    for (const guide of GUIDE_PAGES) {
      expect(guide.title.length).toBeGreaterThan(40)
      expect(guide.title.length).toBeLessThan(70)
      expect(guide.description.length).toBeGreaterThan(110)
      expect(guide.description.length).toBeLessThan(170)
      expect(guide.h1.length).toBeGreaterThan(20)
      expect(guide.lead).toMatch(/reed|pick|warp|weft|sizing|dalal/i)
      expect(guide.sections.length).toBeGreaterThanOrEqual(3)
      const blob = [guide.lead, ...guide.sections.flatMap((s) => s.paragraphs)].join(' ')
      expect(blob).toMatch(/Harshvardhan Pareek/)
      expect(blob).toMatch(/reed/i)
      expect(blob).toMatch(/pick/i)
      expect(blob).toMatch(/warp/i)
      expect(blob).toMatch(/weft/i)
      expect(blob).toMatch(/sizing/i)
      expect(blob).toMatch(/dalal/i)
      expect(blob).not.toMatch(/#1|guaranteed ranking|buy links/i)
    }
  })

  it('emits HowTo and BreadcrumbList JSON-LD for each guide', () => {
    for (const guide of GUIDE_PAGES) {
      const data = pageStructuredData(guide)
      const types = (data['@graph'] as Array<Record<string, unknown>>).map((node) => node['@type'])
      expect(types).toEqual(['WebPage', 'BreadcrumbList', 'HowTo'])
      expect(JSON.stringify(data)).toContain(`${SITE_ORIGIN}${guide.path}`)
      expect(guide.howTo.steps.length).toBeGreaterThanOrEqual(3)
    }
  })
})
