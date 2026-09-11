import { useState, type FormEvent } from 'react'
import { Layout } from '../components/Layout'
import { PrimaryButton } from '../components/PrimaryButton'
import { createAccount, login, MIN_PASSWORD_LENGTH } from '../lib/auth'

type Props = { onSuccess: () => void }
type Mode = 'signin' | 'signup'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path
          d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M4 5.5 19.5 21M10.2 10.4A2.6 2.6 0 0 0 12 14.6c.5 0 1-.1 1.4-.4M7 8.2C5 9.6 3.6 11.4 3 12c0 0 3.5 7 9 7 1.6 0 3-.4 4.3-1M10.7 6.2A8.6 8.6 0 0 1 12 5c5.5 0 9 7 9 7a16 16 0 0 1-2.2 3.3"
        stroke="currentColor"
        strokeWidth="1.8"
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
      <span className="mb-1.5 block text-sm font-medium text-cream">{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-ink/50 px-3 py-3 pr-12 text-cream placeholder:text-muted/50"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-cream"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </label>
  )
}

export function LoginPage({ onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setPassword('')
    setConfirmPassword('')
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

  const signingIn = mode === 'signin'

  return (
    <Layout
      title={signingIn ? 'Sign in' : 'Create account'}
      subtitle="Textile fabric cost calculator"
    >
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card via-card to-indigo-deep/90 shadow-xl shadow-black/30">
        <div className="border-b border-white/10 bg-ink/35 px-4 pb-4 pt-5 sm:px-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-lg font-bold text-accent">
              SC
            </div>
            <div>
              <p className="text-sm font-semibold text-cream">Welcome to SwadCost</p>
              <p className="text-xs text-muted">
                {signingIn ? 'Use your saved account on this device.' : 'Save an account on this device.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 rounded-2xl bg-ink/70 p-1" role="tablist" aria-label="Auth mode">
            <button
              type="button"
              role="tab"
              aria-selected={signingIn}
              onClick={() => switchMode('signin')}
              className={[
                'rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                signingIn ? 'bg-accent text-ink shadow-md' : 'text-muted hover:text-cream',
              ].join(' ')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!signingIn}
              onClick={() => switchMode('signup')}
              className={[
                'rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                !signingIn ? 'bg-accent text-ink shadow-md' : 'text-muted hover:text-cream',
              ].join(' ')}
            >
              Create account
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 p-4 sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-cream">
              {signingIn ? 'Username' : 'Name'}
            </span>
            <input
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={signingIn ? 'Your username' : 'Display name or username'}
              className="w-full rounded-xl border border-white/10 bg-ink/50 px-3 py-3 text-cream placeholder:text-muted/50"
              required
            />
            {!signingIn ? (
              <span className="mt-1.5 block text-xs text-muted">Used to sign in. Must be unique on this device.</span>
            ) : null}
          </label>

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={signingIn ? 'current-password' : 'new-password'}
            placeholder={signingIn ? 'Your password' : `At least ${MIN_PASSWORD_LENGTH} characters`}
          />

          {!signingIn ? (
            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              placeholder="Type the same password again"
            />
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-400/25 bg-red-950/50 px-3 py-2.5 text-sm leading-relaxed text-red-200"
            >
              {error}
            </p>
          ) : null}

          <PrimaryButton type="submit" disabled={busy}>
            {busy
              ? signingIn
                ? 'Signing in…'
                : 'Creating account…'
              : signingIn
                ? 'Enter SwadCost'
                : 'Create account and continue'}
          </PrimaryButton>

          <p className="text-center text-sm text-muted">
            {signingIn ? (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-semibold text-accent-soft underline-offset-2 hover:underline"
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
                  className="font-semibold text-accent-soft underline-offset-2 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </section>
      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        Accounts are stored on this device only. The demo login{' '}
        <span className="font-medium text-cream/80">rohitbohara</span> still works.
      </p>
    </Layout>
  )
}
