import { gateway } from './gateway'
import { OWNER_SESSION_KEY } from './storage'
export const OWNER_PATH = '/owner-vault-c6e88deb0d1492a0d23e3ec9'
let gate = ''
let expires = 0
export async function checkOwnerPin(pin: string): Promise<boolean> {
  await gateway({action:'owner'},pin)
  gate=pin; expires=Date.now()+15*60*1000
  return true
}
export function ownerCredential(): string {
  if(!isOwnerUnlocked()) throw new Error('Owner session expired. Unlock the ledger again.')
  return gate
}
export function isOwnerUnlocked(): boolean { return !!gate && Date.now()<expires }
export function unlockOwner(): void { /* Only checkOwnerPin can establish access. */ }
export function lockOwner(): void { gate=''; expires=0; try {sessionStorage.removeItem(OWNER_SESSION_KEY)}catch{/* unavailable */} }
