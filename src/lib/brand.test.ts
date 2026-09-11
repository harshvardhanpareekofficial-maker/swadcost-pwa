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

  it('keeps maker attribution', () => {
    expect(read('src/components/Footer.tsx')).toContain('Harshvardhan Pareek')
  })
})
