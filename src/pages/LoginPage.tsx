import { useEffect, useState, type FormEvent } from 'react'
import {
  createAccount,
  DEMO_USERNAME,
  login,
  MIN_PASSWORD_LENGTH,
} from '../lib/auth'
import { IconArrow } from '../components/Icons'
import { CheckList } from '../components/CheckList'
import { Footer } from '../components/Footer'
import { PrimaryButton } from '../components/PrimaryButton'
import { StudioBar } from '../components/StudioBar'
import { WeaveGraphic } from '../components/WeaveGraphic'
import { studioFieldClass, studioLabelClass } from '../components/studio'
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
      <span className={`mb-1.5 block ${studioLabelClass}`}>{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${studioFieldClass} pr-12`}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center px-3 text-plum/50 hover:text-plum"
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
        if (mode === 'signup') await recordAccount(result.username)
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
    <div className="studio-atmosphere flex min-h-dvh min-w-0 flex-col overflow-x-hidden text-ink">
      <StudioBar />

      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-8 px-[max(1rem,env(safe-area-inset-left))] py-6 pr-[max(1rem,env(safe-area-inset-right))] sm:gap-10 sm:px-8 sm:py-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-8">
        <section className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-plum/55">
            The fabric costing workspace
          </p>
          <h1 className="font-display mt-3 text-[2.15rem] font-semibold leading-[1.06] tracking-[-0.03em] text-ink sm:text-5xl lg:text-[3.25rem]">
            <span className="block">Every thread.</span>
            <span className="block">Every rupee.</span>
            <span className="block text-plum">Clearly accounted for.</span>
          </h1>
          <p className="mt-4 max-w-[38ch] text-base leading-relaxed text-plum/75">
            Bring your warp, weft and making charges together in one considered cost sheet.
          </p>
          <WeaveGraphic className="mt-5 max-w-[18rem] sm:mt-7 sm:max-w-md" />
          <div className="mt-6 sm:mt-8">
            <CheckList
              layout="row"
              items={['Single & multiple yarns', 'Editable calculations', 'Voice entry']}
            />
          </div>
        </section>

        <section className="flex items-start justify-center lg:items-center">
          <div className="studio-sheet w-full max-w-md p-5 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-plum/55">
              Your work, in one place
            </p>
            <h2 className="font-display mt-2 text-[1.85rem] font-semibold leading-[1.12] tracking-[-0.03em] text-ink">
              {signingIn ? 'Welcome to the studio.' : 'Create your studio account.'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-plum/70">
              {signingIn
                ? 'Sign in to keep your cost sheets together.'
                : 'Choose a name and password. They stay on this device.'}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className={`mb-1.5 block ${studioLabelClass}`}>
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
                  className={studioFieldClass}
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
                  className="rounded-[14px] border border-rose/25 bg-rose/8 px-3.5 py-2.5 text-sm leading-relaxed text-rose"
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
                    ? 'Sign in'
                    : 'Create account'}
                <IconArrow />
              </PrimaryButton>
            </form>

            <p className="mt-5 text-center text-sm text-plum/70">
              {signingIn ? (
                <>
                  New to the studio?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="min-h-11 font-semibold text-plum underline-offset-4 hover:underline"
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
                    className="min-h-11 font-semibold text-plum underline-offset-4 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      </main>

      <Footer className="px-[max(1rem,env(safe-area-inset-left))] py-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8" />
    </div>
  )
}
