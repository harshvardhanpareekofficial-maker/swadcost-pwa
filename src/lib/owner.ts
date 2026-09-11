import { OWNER_SESSION_KEY, migrateOwnerStorage } from './storage'

migrateOwnerStorage()

/** Secret owner vault path — not linked from the public UI. Do not add /admin. */
export const OWNER_PATH = '/owner-vault-hvp-7k9m2xq4'

export const OWNER_GATE_FALLBACK = 'LoomStudio#HVP5381'

export function ownerGate(): string {
  return (import.meta.env.VITE_OWNER_GATE || OWNER_GATE_FALLBACK).trim()
}

export function checkOwnerPin(pin: string): boolean {
  return pin.trim() === ownerGate()
}

export function isOwnerUnlocked(): boolean {
  migrateOwnerStorage()
  try {
    return sessionStorage.getItem(OWNER_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function unlockOwner(): void {
  try {
    sessionStorage.setItem(OWNER_SESSION_KEY, '1')
  } catch {
    /* private mode */
  }
}

export function lockOwner(): void {
  try {
    sessionStorage.removeItem(OWNER_SESSION_KEY)
  } catch {
    /* ignore */
  }
}
