/**
 * Simple JWT utility — decode token payload without verification
 * (verification happens server-side; client only checks expiry)
 */

export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // Replace URL-safe base64 chars and pad
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Check if a token is expired by reading its `exp` claim.
 * Returns true if the token is missing, invalid, or expired.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return true
  const exp = Number(payload.exp) * 1000 // convert seconds → ms
  return Date.now() >= exp
}
