import {
  establishSession,
  findAccount,
  login,
  NO_LOCAL_ACCOUNT,
  registerLocalPassword,
  USERNAME_TAKEN,
  type AuthResult,
} from './auth'
import { lookupCloudAccount, upsertCloudAccount } from './cloudAccounts'
import { accountRememberedElsewhere } from './telemetry'
import { displayUsername } from './usernames'

export { CLOUD_NOT_CONFIGURED, CLOUD_UNAVAILABLE } from './cloudAccounts'

export const CLOUD_SYNC_FAILED =
  'The password is saved on this device, but the studio list did not update. Tap Retry to finish.'

export const FINISH_SETUP_HINT =
  'This name is on the studio list. Finish setup on this device — set a password for this browser. The cloud never stores your password.'

export type SignInStart =
  | { status: 'ok'; username: string }
  | { status: 'finish-setup'; username: string }
  | { status: 'error'; error: string }

export async function beginSignIn(username: string, password: string): Promise<SignInStart> {
  if (findAccount(username)) {
    const result = await login(username, password)
    if (result.ok) return { status: 'ok', username: result.username }
    return { status: 'error', error: result.error }
  }

  const cloud = await lookupCloudAccount(username)
  if (cloud.status === 'found') return { status: 'finish-setup', username: cloud.username }
  if (await accountRememberedElsewhere(username)) {
    return { status: 'finish-setup', username: displayUsername(username) }
  }
  if (cloud.status === 'unavailable') return { status: 'error', error: cloud.error }

  if (!displayUsername(username)) return { status: 'error', error: 'Enter a username.' }
  if (!password) return { status: 'error', error: 'Enter a password.' }
  return { status: 'error', error: NO_LOCAL_ACCOUNT }
}

export async function finishDeviceSetup(
  username: string,
  password: string,
  confirmPassword: string,
): Promise<AuthResult> {
  const existing = findAccount(username)
  if (existing) {
    return { ok: false, error: USERNAME_TAKEN, code: 'TAKEN', username: existing.username }
  }

  const cloud = await lookupCloudAccount(username)
  const display = cloud.status === 'found' ? cloud.username : displayUsername(username)

  const registered = await registerLocalPassword(display, password, confirmPassword)
  if (!registered.ok) return registered

  const synced = await upsertCloudAccount(registered.username)
  if (!synced.ok) {
    return {
      ok: false,
      error: CLOUD_SYNC_FAILED,
      code: 'CLOUD_SYNC',
      username: registered.username,
    }
  }

  establishSession(registered.username)
  return { ok: true, username: registered.username }
}

/** Create on this device. If the cloud already has the name and local is empty, this is Finish setup — not “taken”. */
export async function createStudioAccount(
  username: string,
  password: string,
  confirmPassword: string,
): Promise<AuthResult> {
  const existing = findAccount(username)
  if (existing) {
    return { ok: false, error: USERNAME_TAKEN, code: 'TAKEN', username: existing.username }
  }
  return finishDeviceSetup(username, password, confirmPassword)
}

export async function retryCloudLink(username: string): Promise<AuthResult> {
  const account = findAccount(username)
  if (!account) return { ok: false, error: NO_LOCAL_ACCOUNT, code: 'NO_LOCAL' }
  const synced = await upsertCloudAccount(account.username)
  if (!synced.ok) {
    return { ok: false, error: CLOUD_SYNC_FAILED, code: 'CLOUD_SYNC', username: account.username }
  }
  establishSession(account.username)
  return { ok: true, username: account.username }
}
