#!/usr/bin/env node
/**
 * Notify IndexNow (Bing, Yandex, Seznam, Yep, Naver, Amazon) that URLs changed.
 *
 * Usage:
 *   node scripts/ping-indexnow.mjs              # ping the homepage
 *   node scripts/ping-indexnow.mjs --dry-run    # print JSON, do not POST
 *   node scripts/ping-indexnow.mjs https://harshvardhanpareek.com/path
 *
 * The key is read from public/<key>.txt (Vite copies it to the site root).
 * Run this after the key file is live at https://harshvardhanpareek.com/<key>.txt
 */

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOST = 'harshvardhanpareek.com'
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const HOMEPAGE = `https://${HOST}/`
const KEY_RE = /^[a-zA-Z0-9-]{8,128}$/

function loadIndexNowKey(publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')) {
  const matches = readdirSync(publicDir).filter((name) => {
    if (!name.endsWith('.txt') || name === 'robots.txt') return false
    return KEY_RE.test(name.slice(0, -4))
  })
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one IndexNow key file in public/, found: ${matches.join(', ') || '(none)'}`,
    )
  }
  const filename = matches[0]
  const key = filename.slice(0, -4)
  const body = readFileSync(join(publicDir, filename), 'utf8').replace(/^\uFEFF/, '').replace(/\r?\n$/, '')
  if (body !== key) {
    throw new Error(`IndexNow key file ${filename} must contain exactly the key on one line`)
  }
  if (body.includes('\n') || body.includes('\r')) {
    throw new Error(`IndexNow key file ${filename} must be a single line`)
  }
  return {
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
  }
}

function buildIndexNowPayload(urlList) {
  const { key, keyLocation } = loadIndexNowKey()
  return {
    host: HOST,
    key,
    keyLocation,
    urlList,
  }
}

function parseArgs(argv) {
  const urls = []
  let dryRun = false
  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true
      continue
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown flag: ${arg}`)
    }
    urls.push(arg)
  }
  return { dryRun, urlList: urls.length > 0 ? urls : [HOMEPAGE] }
}

async function main() {
  const { dryRun, urlList } = parseArgs(process.argv.slice(2))
  const payload = buildIndexNowPayload(urlList)
  const body = JSON.stringify(payload, null, 2)

  if (dryRun) {
    console.log(`Would POST ${ENDPOINT}`)
    console.log(body)
    return
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  })
  const text = await response.text()
  if (response.status === 200 || response.status === 202) {
    console.log(`IndexNow ${response.status}: submitted ${urlList.join(', ')}`)
    if (text) console.log(text)
    return
  }
  console.error(`IndexNow ${response.status}: ${text || response.statusText}`)
  process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
