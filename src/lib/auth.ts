const SESSION_KEY = 'swadcost_auth_session'

const DEFAULT_USER = 'rohitbohara'
const DEFAULT_PASS = 'rohitbohara'

export function getCredentials(): { username: string; password: string } {
  return {
    username: import.meta.env.VITE_AUTH_USERNAME || DEFAULT_USER,
    password: import.meta.env.VITE_AUTH_PASSWORD || DEFAULT_PASS,
  }
}

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function login(username: string, password: string): boolean {
  const creds = getCredentials()
  if (username === creds.username && password === creds.password) {
    localStorage.setItem(SESSION_KEY, '1')
    localStorage.setItem('swadcost_auth_user', username)
    return true
  }
  return false
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('swadcost_auth_user')
}

export function currentUser(): string | null {
  try {
    return localStorage.getItem('swadcost_auth_user')
  } catch {
    return null
  }
}
