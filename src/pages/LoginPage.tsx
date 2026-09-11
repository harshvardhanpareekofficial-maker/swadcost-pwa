import { useEffect, useState, type FormEvent } from 'react'
import {
  createAccount,
  DEMO_USERNAME,
  enterGuest,
  login,
  MIN_PASSWORD_LENGTH,
} from '../lib/auth'
import { IconArrow, IconCheck } from '../components/Icons'
import { recordAccount } from '../lib/telemetry'

type Props = { onSuccess: () => void }
type Mode = 'signin' | 'signup'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M4 5.5 19.5 21M10.2 10.4A2.6 2.6 0 0 0 12 14.6c.5 0 1-.1 1.4-.4M7 8.2C5 9.6 3.6 11.4 3 12c0 0 3.5 7 9 7 1.6 0 3-.4 4.3-1M10.7 6.2A8.6 8.6 0 0 1 12 5c5.5 0 9 7 9 7a16 16 0 0 1-2.2 3.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">
        {label}
      </span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-plum/15 bg-ivory/80 px-3 py-3 pr-12 text-ink placeholder:text-plum/35"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-plum/50 hover:text-plum"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </label>
  )
}

function WeaveGraphic() {
  return (
    <div className="relative mx-auto mt-8 max-w-md">
      <div className="absolute -left-1 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[10px] font-semibold tracking-[0.28em] text-plum/45 sm:block">
        WARP / LENGTHWISE
      </div>
      <div className="rounded-3xl border border-plum/10 bg-white/55 p-5 shadow-inner">
        <p className="mb-3 text-center text-[10px] font-semibold tracking-[0.28em] text-plum/45">
          WEFT / CROSSWISE
        </p>
        <div className="relative h-40 overflow-hidden rounded-2xl bg-ivory">
          <div className="absolute inset-0 flex justify-between px-3">
            {Array.from({ length: 11 }, (_, i) => (
              <div
                key={`warp-${i}`}
                className="h-full w-1.5 rounded-full"
                style={{
                  background: i % 3 === 0 ? '#3B1F4A' : i % 3 === 1 ? '#E8A838' : '#6B3A7A',
                  opacity: 0.78,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col justify-between py-3">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={`weft-${i}`}
                className="h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? 'rgba(232,168,56,0.72)' : 'rgba(26,20,35,0.28)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginPage({ onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void recordAccount(DEMO_USERNAME)
  }, [])

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setPassword('')
    setConfirmPassword('')
  }

  function updateField(setter: (value: string) => void) {
    return (value: string) => {
      setError(null)
      setter(value)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result =
        mode === 'signin'
          ? await login(username, password)
          : await createAccount(username, password, confirmPassword)
      if (result.ok) {
        if (mode === 'signup') void recordAccount(result.username)
        onSuccess()
        return
      }
      setError(result.error)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function exploreFirst() {
    enterGuest()
    onSuccess()
  }

  const signingIn = mode === 'signin'

  return (
    <div className="min-h-dvh bg-ivory text-ink">
      <header className="flex items-center justify-between gap-3 border-b border-plum/10 px-4 py-3 sm:px-6">
        <p className="font-display text-lg tracking-tight">
          <span className="font-bold text-ink">fabriccost</span>
          <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-plum/70">
            STUDIO
          </span>
        </p>
        <p className="flex items-center gap-2 text-[11px] font-medium text-plum/70">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
          Workspace ready
        </p>
      </header>

      <main className="mx-auto grid min-h-[calc(100dvh-7.25rem)] w-full max-w-6xl lg:grid-cols-2">
        <section className="relative overflow-hidden px-5 py-8 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-saffron/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-plum/10 blur-3xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-plum/60">
            The fabric costing workspace
          </p>
          <h1 className="font-display mt-4 max-w-md text-4xl font-bold leading-[1.08] text-ink sm:text-5xl">
            Every thread. Every rupee. Clearly accounted for.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-plum/75">
            Bring your warp, weft and making charges together in one considered cost sheet.
          </p>
          <WeaveGraphic />
          <ul className="mt-8 space-y-2.5 text-sm text-ink">
            {['Single & multiple yarns', 'Editable calculations', 'Voice entry'].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-plum text-ivory">
                  <IconCheck />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex items-center justify-center px-4 py-6 sm:px-8">
          <div className="w-full max-w-md rounded-3xl border border-plum/10 bg-white p-6 shadow-[0_24px_60px_rgba(59,31,74,0.12)] sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-saffron">
              Your work, in one place
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold text-ink">
              {signingIn ? 'Welcome to the studio.' : 'Create your studio account.'}
            </h2>
            <p className="mt-1 text-sm text-plum/70">
              {signingIn
                ? 'Sign in to keep your cost sheets together.'
                : 'Choose a name and password. They stay on this device.'}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/70">
                  {signingIn ? 'User ID' : 'Name'}
                </span>
                <input
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => updateField(setUsername)(e.target.value)}
                  placeholder={signingIn ? 'Your user ID' : 'Display name or username'}
                  className="w-full rounded-xl border border-plum/15 bg-ivory/80 px-3 py-3 text-ink placeholder:text-plum/35"
                  required
                />
              </label>

              <PasswordField
                label="Password"
                value={password}
                onChange={updateField(setPassword)}
                autoComplete={signingIn ? 'current-password' : 'new-password'}
                placeholder={signingIn ? 'Your password' : `At least ${MIN_PASSWORD_LENGTH} characters`}
              />

              {!signingIn ? (
                <PasswordField
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={updateField(setConfirmPassword)}
                  autoComplete="new-password"
                  placeholder="Type the same password again"
                />
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-300/70 bg-rose-50 px-3 py-2.5 text-sm leading-relaxed text-rose-800"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-plum px-4 py-3 text-base font-semibold text-ivory shadow-lg shadow-plum/25 transition hover:bg-plum-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy
                  ? signingIn
                    ? 'Signing in…'
                    : 'Creating account…'
                  : signingIn
                    ? 'Sign in'
                    : 'Create account'}
                <IconArrow />
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-plum/70">
              {signingIn ? (
                <>
                  New to the studio?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-semibold text-plum underline-offset-2 hover:underline"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="font-semibold text-plum underline-offset-2 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
            <p className="mt-2 text-center">
              <button
                type="button"
                onClick={exploreFirst}
                className="text-sm font-medium text-saffron hover:underline"
              >
                or explore first
              </button>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-plum/10 px-4 py-3 text-left text-sm text-plum/70 sm:px-6">
        Made by <span className="font-semibold text-plum">Harshvardhan Pareek</span>
      </footer>
    </div>
  )
}
