#!/usr/bin/env node
/**
 * Copy dist/index.html to known client-route folders so Render (and any
 * static host) serves the SPA shell when those paths exist as real files.
 * Catch-all unknown paths still need a CDN rewrite (render.yaml / Dashboard).
 */

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export const CREATE_ACCOUNT_PATH = '/create-account'

export function clientShellPaths(ownerSource) {
  const match = ownerSource.match(/export const OWNER_PATH = '(\/[^']+)'/)
  if (!match) throw new Error('OWNER_PATH export not found in src/lib/owner.ts')
  return [CREATE_ACCOUNT_PATH, match[1]]
}

export function writeSpaShellPages({
  distDir = join(root, 'dist'),
  ownerSource = readFileSync(join(root, 'src/lib/owner.ts'), 'utf8'),
} = {}) {
  const indexHtml = join(distDir, 'index.html')
  const html = readFileSync(indexHtml)
  const written = []
  for (const pathname of clientShellPaths(ownerSource)) {
    const dest = join(distDir, pathname.replace(/^\//, ''), 'index.html')
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(indexHtml, dest)
    written.push(dest)
  }
  return { indexHtml, written, bytes: html.byteLength }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const result = writeSpaShellPages()
  console.log(`spa-shell: wrote ${result.written.length} client-route index.html copies`)
}
