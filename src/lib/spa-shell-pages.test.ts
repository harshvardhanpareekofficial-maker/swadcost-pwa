import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  CREATE_ACCOUNT_PATH,
  clientShellPaths,
  writeSpaShellPages,
} from '../../scripts/spa-shell-pages.mjs'
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
      CREATE_ACCOUNT_PATH,
      OWNER_PATH,
    ])
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
    expect(result.written).toHaveLength(2)
  })
})
