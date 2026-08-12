// ─── Server-side session storage ────────────────────────────
// Replaces localStorage auth for cross-device sync

const TOKEN_KEY = 'eos-session-token'
const ACCOUNT_KEY = 'eos-account'

export interface SessionAccount {
  id: string
  email: string
  displayName: string
}

export function saveSession(token: string, account: SessionAccount): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
  } catch { /* storage unavailable */ }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch { return null }
}

export function getAccount(): SessionAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.id === 'string') return parsed as SessionAccount
    return null
  } catch { return null }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ACCOUNT_KEY)
  } catch { /* storage unavailable */ }
}