// ─── API Client ──────────────────────────────────────────────
// Communicates with the Hono+SQLite backend at API_BASE

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://smartrun-api.eos-run.workers.dev' : '')

export interface ApiAccount {
  id: string
  email: string
  displayName: string
}

export interface ApiInvite {
  id: string
  fromUserId: string
  fromName: string
  teamId: string
  teamName: string
  status: string
  sentAt: string
}

export interface ApiTeamMember {
  name: string
  userId: string
  status: string
  weeklyDist: number
  avgPace: string
}

export interface ApiTeam {
  id: string
  name: string
  createdBy?: string
  members: ApiTeamMember[]
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    if (!res.ok || json.ok === false) {
      return { ok: false, error: json.error || 'request_failed' }
    }
    return { ok: true, data: json as T }
  } catch {
    return { ok: false, error: 'network_error' }
  }
}

// ─── Auth ────────────────────────────────────────────────────

export async function apiSignUp(email: string, password: string, displayName: string) {
  return request<{ sessionToken: string; account: ApiAccount }>('POST', '/api/auth/signup', {
    email, password, displayName,
  })
}

export async function apiSignIn(email: string, password: string) {
  return request<{ sessionToken: string; account: ApiAccount }>('POST', '/api/auth/signin', {
    email, password,
  })
}

// ─── Accounts ────────────────────────────────────────────────

export async function apiGetAccounts(token: string) {
  return request<{ accounts: ApiAccount[] }>('GET', '/api/accounts', undefined, token)
}

export async function apiSearchAccounts(token: string, q: string) {
  return request<{ accounts: ApiAccount[] }>('GET', `/api/accounts/search?q=${encodeURIComponent(q)}`, undefined, token)
}

// ─── Invites ─────────────────────────────────────────────────

export async function apiGetInvites(token: string) {
  return request<{ invites: ApiInvite[] }>('GET', '/api/invites', undefined, token)
}

export async function apiSendInvite(token: string, toAccountId: string, teamName: string, teamId?: string) {
  return request<{ invite: { id: string; teamId: string } }>('POST', '/api/invites', { toAccountId, teamName, teamId }, token)
}

export async function apiAcceptInvite(token: string, inviteId: string) {
  return request<{ team: ApiTeam }>('POST', `/api/invites/${inviteId}/accept`, undefined, token)
}

export async function apiDeclineInvite(token: string, inviteId: string) {
  return request<{ ok: boolean }>('POST', `/api/invites/${inviteId}/decline`, undefined, token)
}

// ─── Scheduled Runs ────────────────────────────────────────────

export interface ApiRsvp {
  accountId: string
  displayName: string
  status: 'going' | 'not_going'
}

export interface ApiScheduledRun {
  id: string
  teamId: string
  date: string
  time: string
  location: string
  createdBy: string
  createdByName: string
  createdAt: string
  rsvps: ApiRsvp[]
  goingCount: number
  notGoingCount: number
}

export async function apiCreateScheduledRun(
  token: string,
  teamId: string,
  date: string,
  time: string,
  location: string,
) {
  return request<{ run: ApiScheduledRun }>('POST', '/api/scheduled-runs', { teamId, date, time, location }, token)
}

export async function apiGetScheduledRuns(token: string, teamId: string) {
  return request<{ runs: ApiScheduledRun[] }>('GET', `/api/scheduled-runs?teamId=${encodeURIComponent(teamId)}`, undefined, token)
}

export async function apiSetRsvp(token: string, runId: string, status: 'going' | 'not_going') {
  return request<{ ok: boolean }>('POST', `/api/scheduled-runs/${runId}/rsvp`, { status }, token)
}

export async function apiCancelScheduledRun(token: string, runId: string) {
  return request<{ ok: boolean }>('DELETE', `/api/scheduled-runs/${runId}`, undefined, token)
}

// ─── Teams ───────────────────────────────────────────────────

export async function apiGetTeam(token: string) {
  return request<{ team: ApiTeam | null }>('GET', '/api/teams', undefined, token)
}

export async function apiDisbandTeam(token: string) {
  return request<{ ok: boolean }>('DELETE', '/api/teams', undefined, token)
}

export async function apiLeaveTeam(token: string) {
  return request<{ ok: boolean }>('POST', '/api/teams/leave', undefined, token)
}