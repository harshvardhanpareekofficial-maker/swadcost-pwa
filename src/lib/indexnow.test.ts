import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const KEY_RE = /^[a-zA-Z0-9-]{8,128}$/

const CANONICAL_KEY = '210b711dd38b6f0a04fa5d4fa18030da'

describe('IndexNow', () => {
  const publicDir = join(root, 'public')
  const keyFiles = readdirSync(publicDir).filter((name) => {
    if (!name.endsWith('.txt') || name === 'robots.txt') return false
    return KEY_RE.test(name.slice(0, -4))
  })

  it('hosts a single-line canonical key file at the Vite public root', () => {
    expect(keyFiles).toContain(`${CANONICAL_KEY}.txt`)
    expect(keyFiles.length).toBeGreaterThanOrEqual(1)
    for (const filename of keyFiles) {
      const key = filename.slice(0, -4)
      const raw = readFileSync(join(publicDir, filename))
      expect(raw.includes(0x0d)).toBe(false)
      expect(raw.toString('utf8')).toBe(`${key}\n`)
      expect(key).toMatch(KEY_RE)
    }
  })

  it('documents a homepage ping to api.indexnow.org', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8')
    const ping = readFileSync(join(root, 'scripts/ping-indexnow.mjs'), 'utf8')
    const vite = readFileSync(join(root, 'vite.config.ts'), 'utf8')
    const render = readFileSync(join(root, 'render.yaml'), 'utf8')
    expect(readme).toContain(`https://harshvardhanpareek.com/${CANONICAL_KEY}.txt`)
    expect(readme).toContain(`"key": "${CANONICAL_KEY}"`)
    expect(readme).toContain(`"keyLocation": "https://harshvardhanpareek.com/${CANONICAL_KEY}.txt"`)
    expect(readme).toContain('https://api.indexnow.org/indexnow')
    expect(readme).toContain('"host": "harshvardhanpareek.com"')
    expect(readme).toContain('"urlList": ["https://harshvardhanpareek.com/"]')
    expect(ping).toContain(`CANONICAL_KEY = '${CANONICAL_KEY}'`)
    expect(ping).toContain("const HOST = 'harshvardhanpareek.com'")
    expect(ping).toContain("ENDPOINT = 'https://api.indexnow.org/indexnow'")
    expect(ping).toContain('host: HOST')
    expect(ping).toContain('keyLocation')
    expect(ping).toContain('urlList')
    expect(vite).toContain(`${CANONICAL_KEY}.txt`)
    expect(render.indexOf(`source: /${CANONICAL_KEY}.txt`)).toBeGreaterThan(-1)
    expect(render.indexOf(`source: /${CANONICAL_KEY}.txt`)).toBeLessThan(render.indexOf('source: /*'))
  })
})
