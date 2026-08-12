// ─── Team Store ────────────────────────────────────────────
// localStorage-backed team persistence per account

export interface TeamMember {
  readonly name: string
  readonly weeklyDist: number
  readonly avgPace: string
  readonly userId?: string
  readonly status?: 'pending' | 'accepted'
}

export interface TeamData {
  readonly name: string
  readonly members: readonly TeamMember[]
  readonly scheduledRun?: {
    readonly date: string
    readonly time: string
    readonly route: string
  }
}

function storageKey(userId: string): string {
  return `eos-team-${userId}`
}

export function loadTeam(userId: string): TeamData | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>).name === 'string' &&
      Array.isArray((parsed as Record<string, unknown>).members)
    ) {
      return parsed as TeamData
    }
    return null
  } catch {
    return null
  }
}

export function saveTeam(team: TeamData | null, userId: string): void {
  try {
    if (team === null) {
      localStorage.removeItem(storageKey(userId))
    } else {
      localStorage.setItem(storageKey(userId), JSON.stringify(team))
    }
  } catch {
    // storage unavailable — swallow
  }
}