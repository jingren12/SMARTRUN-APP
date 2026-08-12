// ─── Team Store ────────────────────────────────────────────
// localStorage-backed team persistence per account

export interface TeamData {
  readonly name: string
  readonly members: readonly {
    readonly name: string
    readonly weeklyDist: number
    readonly avgPace: string
  }[]
  readonly scheduledRun?: {
    readonly date: string
    readonly time: string
    readonly route: string
  }
}

const STORAGE_KEY = 'eos-team-v1'

export function loadTeam(): TeamData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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

export function saveTeam(team: TeamData | null): void {
  try {
    if (team === null) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(team))
    }
  } catch {
    // storage unavailable — swallow
  }
}