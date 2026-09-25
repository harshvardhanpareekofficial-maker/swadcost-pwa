import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { boundUsername, MIN_PASSWORD_LENGTH } from '../lib/auth'
import { IconArrow } from '../components/Icons'
import { FabricStage } from '../components/FabricStage'
import { Footer } from '../components/Footer'
import { GuideLinks } from '../components/GuideLinks'
import { StudioFaq } from '../components/StudioFaq'
import { PrimaryButton } from '../components/PrimaryButton'
import { StudioBar } from '../components/StudioBar'
import { studioFieldClass, studioLabelClass } from '../components/studio'
import {
  beginSignIn,
  CLOUD_NOT_CONFIGURED,
  CLOUD_UNAVAILABLE,
  CREATE_ACCOUNT_PATH,
  createStudioAccount,
  FINISH_SETUP_HINT,
  finishDeviceSetup,
  initialStudioMode,
  retryCloudLink,
  STORE_CREDENTIALS_NOTE,
  switchStudioAccount,
} from '../lib/studioAuth'
import { markAccountActive } from '../lib/telemetry'

type Props = { onSuccess: () => void }
type Mode = 'signin' | 'signup' | 'finish-setup'

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
      <span className={`mb-1 block ${studioLabelClass}`}>{label}</span>
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
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(() => initialStudioMode(location.pathname))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingCloud, setPendingCloud] = useState<string | null>(null)
  const [bound, setBound] = useState<string | null>(() => boundUsername())
  const [readyName, setReadyName] = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setPendingCloud(null)
    setPassword('')
    setConfirmPassword('')
    setReadyName(null)
    if (next === 'signup' && location.pathname !== CREATE_ACCOUNT_PATH) {
      navigate(CREATE_ACCOUNT_PATH)
    } else if (next === 'signin' && location.pathname === CREATE_ACCOUNT_PATH) {
      navigate('/')
    }
  }

  function enterStudio() {
    if (location.pathname !== '/') navigate('/')
    onSuccess()
  }

  function updateField(setter: (value: string) => void) {
    return (value: string) => {
      setError(null)
      setter(value)
    }
  }

  function confirmSwitchAccount() {
    const name = boundUsername()
    if (!name) return
    const confirmed = window.confirm(
      `This device is set up for ${name}. Switch account clears the saved password and device bind on this browser only — not the cloud. Continue?`,
    )
    const result = switchStudioAccount(confirmed)
    if (!result.switched) return
    setBound(null)
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setPendingCloud(null)
    setReadyName(null)
    setMode('signin')
    if (location.pathname === CREATE_ACCOUNT_PATH) navigate('/')
  }

  async function completeOk(name: string, showStoreNote = false) {
    await markAccountActive(name)
    setPendingCloud(null)
    setBound(name)
    if (showStoreNote) {
      setReadyName(name)
      return
    }
    enterStudio()
  }

  async function applyAuthResult(
    result: Awaited<ReturnType<typeof createStudioAccount>>,
    showStoreNote = false,
  ) {
    if (result.ok) {
      await completeOk(result.username, showStoreNote)
      return
    }
    if (result.code === 'CLOUD_SYNC' && result.username) {
      setPendingCloud(result.username)
      setError(result.error)
      return
    }
    setError(result.error)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (pendingCloud) {
        await applyAuthResult(await retryCloudLink(pendingCloud), true)
        return
      }
      if (mode === 'signin') {
        const started = await beginSignIn(username, password)
        if (started.status === 'ok') {
          await completeOk(started.username)
          return
        }
        if (started.status === 'finish-setup') {
          setUsername(started.username)
          setMode('finish-setup')
          setConfirmPassword('')
          setError(null)
          return
        }
        setError(started.error)
        return
      }
      const result =
        mode === 'finish-setup'
          ? await finishDeviceSetup(username, password, confirmPassword)
          : await createStudioAccount(username, password, confirmPassword)
      await applyAuthResult(result, true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const signingIn = mode === 'signin'
  const finishing = mode === 'finish-setup'
  const heading = finishing
    ? 'Finish setup on this device'
    : signingIn
      ? 'Welcome to the studio.'
      : 'Create your studio account.'
  const blurb = finishing
    ? FINISH_SETUP_HINT
    : signingIn
      ? 'Sign in to keep your cost sheets together.'
      : 'Choose a unique handle and password. They stay on this device. Two people named Rahul need different IDs (rahul_loom / rahul2).'
  const cloudBlocked = error === CLOUD_UNAVAILABLE || error === CLOUD_NOT_CONFIGURED
  const actionLabel = pendingCloud
    ? 'Retry'
    : finishing
      ? 'Finish setup'
      : signingIn
        ? cloudBlocked
          ? 'Retry'
          : 'Sign in'
        : 'Create account'
  const busyLabel = pendingCloud || (signingIn && cloudBlocked)
    ? 'Retrying…'
    : finishing
      ? 'Finishing setup…'
      : signingIn
        ? 'Signing in…'
        : 'Creating account…'

  return (
    <div className="studio-atmosphere landing-page flex min-h-dvh min-w-0 flex-col overflow-x-hidden text-ink">
      <StudioBar landing />

      <main className="entrance">
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="hero-copy"><h1 id="hero-title">Know the fabric.<br/>Know the <span>cost.</span></h1><p>From warp and weft to your final quote. A considered costing studio for the people who make fabric.</p><div className="hero-actions"><a className="hero-primary" href="#studio">Start a cost sheet <IconArrow/></a><a className="hero-secondary" href="#method">Explore the process <IconArrow/></a></div></div>
          <div className="hero-object"><span className="hero-wordmark" aria-hidden="true">FABRIC</span><FabricStage/></div>
          <div className="hero-foot"><span>Built for Ichalkaranji’s loom floor</span><span>Single yarn. Multiple possibilities.</span><a href="#studio">Scroll to your studio <IconArrow/></a></div>
        </section>
        <section className="studio-entry">
          <div className="entry-story"><h2>Your craft.<br/>A clearer calculation.</h2><p>You know the cloth. Bring the reed, pick, yarn counts and rates. We’ll bring every component together in one readable cost sheet.</p><div className="entry-spec"><span>WARP + WEFT</span><span>SIZING + MAKING</span><span>YOUR FINAL COST</span></div><p className="entry-note">Your existing account works here. Sign in to begin.</p></div>
          <section className="entrance-form" id="studio" aria-label="Studio account"><div className="entrance-form-inner">
            <h2 className="font-display">{readyName ? 'Your studio account is ready.' : heading}</h2>
            <p className="entrance-blurb">{readyName ? `Keep ${readyName} and your password somewhere you can find them.` : blurb}</p>
            {readyName ? (
              <div className="mt-4 space-y-4 lg:mt-6">
                <p className="rounded-[14px] border border-plum/15 bg-ivory/80 px-3.5 py-2.5 text-sm leading-relaxed text-plum">
                  {STORE_CREDENTIALS_NOTE}
                </p>
                <PrimaryButton type="button" onClick={enterStudio}>
                  Enter the studio
                  <IconArrow />
                </PrimaryButton>
              </div>
            ) : null}

            {bound && !readyName ? (
              <div className="mt-3 rounded-[14px] border border-plum/15 bg-ivory/80 px-3.5 py-2.5 text-sm leading-relaxed text-plum">
                <p>
                  This device is set up for <span className="font-semibold">{bound}</span>. Sign in as{' '}
                  {bound}, or{' '}
                  <button
                    type="button"
                    onClick={confirmSwitchAccount}
                    className="min-h-11 font-semibold text-plum underline-offset-4 hover:underline"
                  >
                    Switch account
                  </button>
                  .
                </p>
              </div>
            ) : null}

            {readyName ? null : (
              <>
                <form onSubmit={submit} className="mt-4 space-y-3 lg:mt-6 lg:space-y-4">
                  <label className="block">
                    <span className={`mb-1 block ${studioLabelClass}`}>
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
                      readOnly={finishing}
                    />
                  </label>

                  <PasswordField
                    label="Password"
                    value={password}
                    onChange={updateField(setPassword)}
                    autoComplete={signingIn && !finishing ? 'current-password' : 'new-password'}
                    placeholder={signingIn && !finishing ? 'Your password' : `At least ${MIN_PASSWORD_LENGTH} characters`}
                  />

                  {!signingIn || finishing ? (
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

                  {!signingIn ? (
                    <p className="rounded-[14px] border border-plum/15 bg-ivory/80 px-3.5 py-2.5 text-sm leading-relaxed text-plum">
                      {STORE_CREDENTIALS_NOTE}
                    </p>
                  ) : null}

                  <PrimaryButton type="submit" disabled={busy}>
                    {busy ? busyLabel : actionLabel}
                    <IconArrow />
                  </PrimaryButton>
                </form>

                <p className="mt-3 text-center text-sm text-plum/70 lg:mt-5">
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
                      Already have an account on this device?{' '}
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
              </>
            )}
          </div>
        </section>

        </section>
        <section className="process-section" id="method"><div className="process-heading"><h2>From the first thread<br/>to the final figure.</h2><p>A familiar mill sheet. A more complete view.</p></div><ol className="process-steps"><li><span>01</span><h3>Define the construction.</h3><p>Choose single or multiple yarns. Enter reed, pick, counts and reedspace.</p></li><li><span>02</span><h3>Account for the work.</h3><p>Add yarn rates, sizing, weft wastage and making charges in paise per pick.</p></li><li><span>03</span><h3>Make the quote yours.</h3><p>Read the breakdown, compare markups, edit inputs, and print your cost sheet.</p></li></ol></section>
        <details className="entrance-about">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-plum [&::-webkit-details-marker]:hidden">
            About the studio
          </summary>
          <div className="space-y-3 pb-1">
            <p className="text-sm leading-relaxed text-plum/70">
              Every thread. Every rupee. Clearly accounted for. A fabric cost calculator for Ichalkaranji powerloom grey fabric costing — warp, weft, reed, pick, sizing and job
              rate on one mill sheet, single or multiple yarns, with voice entry if you want it.
              Harshvardhan Pareek is the maker.
            </p>
            <StudioFaq />
          </div>
        </details>
      </main>

      <GuideLinks className="mx-auto w-full max-w-6xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-8" />
      <Footer className="px-[max(1rem,env(safe-area-inset-left))] py-2.5 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-4" />
    </div>
  )
}
