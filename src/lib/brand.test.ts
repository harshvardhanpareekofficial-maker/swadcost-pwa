import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8')
}

const uiFiles = [
  'src/pages/LoginPage.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/InputMethodPage.tsx',
  'src/pages/CalculatorPage.tsx',
  'src/pages/ResultsPage.tsx',
  'src/components/StudioBar.tsx',
  'src/components/Layout.tsx',
  'src/components/Footer.tsx',
  'index.html',
]

describe('studio chrome', () => {
  const login = read('src/pages/LoginPage.tsx')
  const bar = read('src/components/StudioBar.tsx')
  const layout = read('src/components/Layout.tsx')
  const home = read('src/pages/HomePage.tsx')
  const method = read('src/pages/InputMethodPage.tsx')
  const calc = read('src/pages/CalculatorPage.tsx')
  const results = read('src/pages/ResultsPage.tsx')
  const ui = uiFiles.map(read).join('\n')

  it('shows the sign-in card first on small screens', () => {
    expect(login).toContain('hidden lg:col-start-1 lg:row-start-1 lg:block')
    expect(login).toContain('About the studio')
    expect(login).toContain('lg:hidden')
  })

  it('keeps the mockup welcome line and omits explore/guest', () => {
    expect(login).toContain('Welcome to the studio.')
    expect(login).toContain('Sign in to keep your cost sheets together.')
    expect(login).toMatch(/Every thread/)
    expect(login).not.toMatch(/explore first/i)
    expect(login).not.toMatch(/temporary workspace/i)
  })

  it('places Back and Log out on the StudioBar', () => {
    expect(bar).toContain('Log out')
    expect(bar).toContain('onBack')
    expect(layout).toContain('onBack')
    expect(layout).toContain('onLogout')
    expect(home).toContain('onLogout={onLogout}')
    expect(method).toContain('onBack={onBack}')
    expect(method).toContain('onLogout={onLogout}')
    expect(calc).toContain('onBack={onBack}')
    expect(calc).toContain('onLogout={onLogout}')
    expect(results).toContain('onBack={onBackEdit}')
    expect(results).toContain('onLogout={onLogout}')
    expect(home).not.toContain('Switch account')
  })

  it('does not print SwadCost in the visitor UI', () => {
    expect(ui).not.toMatch(/SwadCost/)
    expect(ui).not.toMatch(/swadcost/)
  })

  it('does not bake demo account credentials', () => {
    const auth = read('src/lib/auth.ts')
    const login = read('src/pages/LoginPage.tsx')
    const envExample = read('.env.example')
    expect(auth).not.toMatch(/DEMO_PASSWORD/)
    expect(auth).not.toMatch(/DEMO_USERNAME/)
    expect(auth).not.toMatch(/ensureSeedAccounts/)
    expect(auth).not.toMatch(/rohitbohara/)
    expect(login).not.toMatch(/DEMO_USERNAME/)
    expect(login).not.toMatch(/rohitbohara/)
    expect(envExample).not.toMatch(/VITE_AUTH_PASS=/)
    expect(envExample).not.toMatch(/VITE_AUTH_PASSWORD=/)
  })

  it('keeps maker attribution', () => {
    expect(read('src/components/Footer.tsx')).toContain('Harshvardhan Pareek')
  })

  it('offers Finish setup copy instead of a dead-end missing-account message', () => {
    expect(login).toContain('Finish setup on this device')
    expect(login).toContain('FINISH_SETUP_HINT')
    expect(login).toContain('beginSignIn')
    expect(login).toContain('CLOUD_NOT_CONFIGURED')
    expect(login).toContain('CLOUD_UNAVAILABLE')
    expect(login).not.toContain('accountRememberedElsewhere')
    const studioAuth = read('src/lib/studioAuth.ts')
    expect(studioAuth).toContain("cloud.status === 'unavailable'")
    expect(studioAuth).toContain("cloud.status === 'found'")
  })

  it('activates new PWA builds without requiring clear-data every visit', () => {
    const vite = read('vite.config.ts')
    const main = read('src/main.tsx')
    const pwa = read('src/pwa.ts')
    expect(vite).toContain("registerType: 'autoUpdate'")
    expect(vite).toContain('skipWaiting: true')
    expect(vite).toContain('clientsClaim: true')
    expect(main).toContain("./pwa")
    expect(pwa).toContain('virtual:pwa-register')
    expect(pwa).toContain('immediate: true')
  })

  it('labels the job identifier as Dalal name / Broker name', () => {
    const labels = read('src/lib/labels.ts')
    expect(labels).toContain("export const DALAL_NAME_LABEL = 'Dalal name / Broker name'")
    expect(labels).toContain("export const PICK_RATE_LABEL = 'Pick rate / Dalal rate'")
    expect(labels).toContain("export const DALAL_COST_LINE_LABEL = 'Dalal / Broker (pick × pick rate)'")
    expect(home).toContain('DALAL_NAME_LABEL')
    expect(home).not.toMatch(/Fabric \/ job name/i)
    expect(home).not.toMatch(/>Job</)
    expect(calc).toContain('PICK_RATE_LABEL')
    expect(calc).toContain('DALAL_SECTION_LABEL')
    expect(calc).not.toMatch(/Job rate/)
    expect(calc).not.toMatch(/Job & other/)
    expect(results).toContain('DALAL_COST_LINE_LABEL')
    expect(results).toContain('PICK_RATE_LABEL')
    expect(results).not.toMatch(/Job \(pick/)
    expect(results).not.toMatch(/Job rate/)
  })
})
