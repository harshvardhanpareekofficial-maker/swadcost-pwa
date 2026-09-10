import { useState, type FormEvent } from 'react'
import { Layout } from '../components/Layout'
import { PrimaryButton } from '../components/PrimaryButton'
import { login } from '../lib/auth'

type Props = { onSuccess: () => void }

export function LoginPage({ onSuccess }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (login(username.trim(), password)) {
      setError(null)
      onSuccess()
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <Layout title="Sign in" subtitle="Textile fabric cost calculator">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-white/10 bg-card/70 p-5 shadow-xl">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Username</span>
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink/50 px-3 py-3 text-cream"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink/50 px-3 py-3 text-cream"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <PrimaryButton type="submit">Enter SwadCost</PrimaryButton>
      </form>
    </Layout>
  )
}
