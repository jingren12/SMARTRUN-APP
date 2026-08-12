// ─── Invite Store ───────────────────────────────────────────
// localStorage-backed invite persistence per user account

export interface TeamInvite {
  readonly id: string
  readonly fromUserId: string
  readonly fromName: string
  readonly teamName: string
  readonly members: readonly {
    name: string
    weeklyDist: number
    avgPace: string
    userId?: string
    status?: 'pending' | 'accepted'
  }[]
  readonly sentAt: string
}

function storageKey(userId: string): string {
  return `eos-invite-${userId}`
}

export function loadInvites(userId: string): TeamInvite[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as TeamInvite[]
    return []
  } catch {
    return []
  }
}

export function saveInvites(userId: string, invites: TeamInvite[]): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(invites))
  } catch {
    // storage unavailable — swallow
  }
}

export function sendInvite(
  fromUserId: string,
  fromName: string,
  toUserId: string,
  teamData: {
    name: string
    members: readonly {
      name: string
      weeklyDist: number
      avgPace: string
      userId?: string
      status?: 'pending' | 'accepted'
    }[]
  },
): void {
  const invites = loadInvites(toUserId)
  const invite: TeamInvite = {
    id: crypto.randomUUID(),
    fromUserId,
    fromName,
    teamName: teamData.name,
    members: teamData.members as TeamInvite['members'],
    sentAt: new Date().toISOString(),
  }
  invites.push(invite)
  saveInvites(toUserId, invites)
}

export function removeInvite(userId: string, inviteId: string): void {
  const invites = loadInvites(userId).filter(i => i.id !== inviteId)
  saveInvites(userId, invites)
}

export function clearInvites(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    // storage unavailable — swallow
  }
}