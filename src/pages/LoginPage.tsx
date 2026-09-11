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
import { Eyebrow } from '../components/SectionLabel'
import { StudioBar } from '../components/StudioBar'
import { StudioSheet } from '../components/StudioSheet'
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

function WeaveGraphic() {
  return (
    <div className="relative mx-auto mt-5 max-w-md lg:mt-8">
      <div className="absolute -left-1 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[10px] font-semibold tracking-[0.28em] text-plum/45 sm:block">
        WARP / LENGTHWISE
      </div>
      <div className="rounded-3xl border border-plum/10 bg-paper/80 p-4 shadow-inner sm:p-5">
        <p className="mb-3 text-center text-[10px] font-semibold tracking-[0.28em] text-plum/45">
          WEFT / CROSSWISE
        </p>
        <div className="relative h-24 overflow-hidden rounded-2xl bg-ivory sm:h-40">
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
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-ivory text-ink">
      <StudioBar />

      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col-reverse lg:grid lg:min-h-[calc(100dvh-7.25rem)] lg:grid-cols-2 lg:flex-none">
        <section className="relative hidden overflow-hidden px-4 py-6 sm:px-10 sm:py-10 lg:block lg:py-12">
          <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-saffron/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-plum/10 blur-3xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-plum/60">
            The fabric costing workspace
          </p>
          <p className="font-display mt-3 max-w-md text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
            Every thread. Every rupee. Clearly accounted for.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-plum/75">
            Fabric cost calculator for Indian powerloom grey fabric — warp, weft, sizing and job rate,
            including mills in Ichalkaranji.
          </p>
          <WeaveGraphic />
          <div className="mt-8 hidden lg:block">
            <CheckList items={['Single & multiple yarns', 'Editable calculations', 'Voice entry']} />
          </div>
        </section>

        <section className="flex flex-1 items-start justify-center px-4 py-5 sm:px-8 sm:py-8 lg:items-center lg:py-6">
          <StudioSheet className="w-full max-w-md">
            <Eyebrow>Your work, in one place</Eyebrow>
            <h1 className="font-display mt-2 text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-2xl">
              {signingIn
                ? 'Sign in to fabriccost STUDIO'
                : 'Create your fabriccost STUDIO account'}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-plum/70">
              {signingIn
                ? 'Textile fabric cost calculator for powerloom grey fabric — warp, weft, sizing and job rate. Accounts stay on this device.'
                : 'Choose a name and password. They stay on this device. Then cost grey fabric warp and weft on the mill sheet.'}
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
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
                  className="rounded-[14px] border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-sm leading-relaxed text-rose"
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
                    className="min-h-11 font-semibold text-plum underline-offset-2 hover:underline"
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
                    className="min-h-11 font-semibold text-plum underline-offset-2 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </StudioSheet>
        </section>
      </main>

      <Footer className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8" />
    </div>
  )
}
