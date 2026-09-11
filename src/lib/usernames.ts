/**
 * Stable account key. Same contract as swadcost_accounts.username_norm:
 * trim + lower. Harshvardhan == harshvardhan == HARSHVARDHAN.
 */
export function usernameNorm(username: string): string {
  return username.trim().toLowerCase()
}

export function displayUsername(username: string): string {
  return username.trim()
}
