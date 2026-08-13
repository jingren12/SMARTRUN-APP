import { Hono } from 'hono'
import { initSchema } from '../db'
import type { Bindings } from '../index'
import { requireAuth } from '../middleware'

async function ensureSchema(c: { env: { DB: D1Database } }): Promise<void> {
  try { await initSchema(c.env.DB) } catch { /* init already done */ }
}

export const invitesRoutes = new Hono<{
  Bindings: Bindings
  Variables: { account: { id: string; email: string; displayName: string } }
}>()

invitesRoutes.use('/*', requireAuth)

interface InviteRow {
  id: string
  from_account_id: string
  to_account_id: string
  team_id: string
  status: string
  created_at: string
  from_name: string
  team_name: string
}

interface TeamMemberRow {
  account_id: string
  display_name: string
  status: string
  weekly_dist: number
  avg_pace: string
}

interface TeamRow {
  id: string
  name: string
  created_by: string
}

// GET /api/invites — pending invites for current user
invitesRoutes.get('/', async (c) => {
  await ensureSchema(c)
  const account = c.get('account')
  const result = await c.env.DB
    .prepare(
      `SELECT i.id, i.from_account_id, i.to_account_id, i.team_id, i.status, i.created_at,
              a.display_name AS from_name, t.name AS team_name
       FROM invites i
       JOIN accounts a ON i.from_account_id = a.id
       JOIN teams t ON i.team_id = t.id
       WHERE i.to_account_id = ? AND i.status = 'pending'
       ORDER BY i.created_at DESC`,
    )
    .bind(account.id)
    .all<InviteRow>()

  return c.json({
    ok: true,
    invites: result.results.map((i) => ({
      id: i.id,
      fromUserId: i.from_account_id,
      fromName: i.from_name,
      teamId: i.team_id,
      teamName: i.team_name,
      status: i.status,
      sentAt: i.created_at,
    })),
  })
})

// POST /api/invites — send invite
invitesRoutes.post('/', async (c) => {
  const account = c.get('account')
  const { toAccountId, teamName, teamId: reqTeamId } = await c.req.json<{ toAccountId?: string; teamName?: string; teamId?: string }>()
  if (!toAccountId || !teamName) return c.json({ ok: false, error: 'missing_fields' }, 400)

  // check target exists
  const target = await c.env.DB
    .prepare('SELECT id FROM accounts WHERE id = ?')
    .bind(toAccountId)
    .first<{ id: string }>()
  if (!target) return c.json({ ok: false, error: 'user_not_found' }, 404)

  let teamId: string

  if (reqTeamId) {
    // verify inviter is a member of this team
    const member = await c.env.DB
      .prepare('SELECT account_id FROM team_members WHERE team_id = ? AND account_id = ?')
      .bind(reqTeamId, account.id)
      .first<{ account_id: string }>()
    if (!member) return c.json({ ok: false, error: 'not_team_member' }, 403)

    teamId = reqTeamId

    // check target not already on this team
    const existingOnTeam = await c.env.DB
      .prepare('SELECT account_id FROM team_members WHERE team_id = ? AND account_id = ?')
      .bind(teamId, toAccountId)
      .first<{ account_id: string }>()
    if (existingOnTeam) return c.json({ ok: false, error: 'already_on_team' }, 409)
  } else {
    // legacy path: find or create team by created_by + name
    const existing = await c.env.DB
      .prepare(
        `SELECT tm.status FROM team_members tm JOIN teams t ON tm.team_id = t.id
         WHERE tm.account_id = ? AND t.created_by = ? AND tm.status = 'accepted'`,
      )
      .bind(toAccountId, account.id)
      .first<{ status: string }>()
    if (existing) return c.json({ ok: false, error: 'already_on_team' }, 409)

    let team = await c.env.DB
      .prepare('SELECT id, name, created_by FROM teams WHERE created_by = ? AND name = ?')
      .bind(account.id, teamName)
      .first<TeamRow>()

    if (!team) {
      teamId = crypto.randomUUID()
      const now = new Date().toISOString()
      await c.env.DB
        .prepare('INSERT INTO teams (id, name, created_by, created_at) VALUES (?, ?, ?, ?)')
        .bind(teamId, teamName, account.id, now)
        .run()
      await c.env.DB
        .prepare('INSERT OR IGNORE INTO team_members (team_id, account_id, status) VALUES (?, ?, ?)')
        .bind(teamId, account.id, 'accepted')
        .run()
    } else {
      teamId = team.id
    }
  }

  // check member limit (max 30)
  const countResult = await c.env.DB
    .prepare('SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = ?')
    .bind(teamId)
    .first<{ cnt: number }>()
  if (countResult && countResult.cnt >= 30) {
    return c.json({ ok: false, error: 'team_full' }, 409)
  }

  // add target as pending member
  await c.env.DB
    .prepare('INSERT OR IGNORE INTO team_members (team_id, account_id, status) VALUES (?, ?, ?)')
    .bind(teamId, toAccountId, 'pending')
    .run()

  // create invite
  const inviteId = crypto.randomUUID()
  const now = new Date().toISOString()
  await c.env.DB
    .prepare('INSERT INTO invites (id, from_account_id, to_account_id, team_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(inviteId, account.id, toAccountId, teamId, 'pending', now)
    .run()

  return c.json({ ok: true, invite: { id: inviteId, teamId } })
})

// POST /api/invites/:id/accept
invitesRoutes.post('/:id/accept', async (c) => {
  const account = c.get('account')
  const inviteId = c.req.param('id')

  const invite = await c.env.DB
    .prepare('SELECT id, team_id FROM invites WHERE id = ? AND to_account_id = ? AND status = ?')
    .bind(inviteId, account.id, 'pending')
    .first<{ id: string; team_id: string }>()

  if (!invite) return c.json({ ok: false, error: 'invite_not_found' }, 404)

  // D1 batch: update invite + team_member atomically
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE invites SET status = ? WHERE id = ?').bind('accepted', inviteId),
    c.env.DB
      .prepare('UPDATE team_members SET status = ? WHERE team_id = ? AND account_id = ?')
      .bind('accepted', invite.team_id, account.id),
  ])

  // get full team data
  const team = await c.env.DB
    .prepare('SELECT id, name, created_by FROM teams WHERE id = ?')
    .bind(invite.team_id)
    .first<TeamRow>()
  if (!team) return c.json({ ok: false, error: 'team_not_found' }, 404)

  const membersResult = await c.env.DB
    .prepare(
      `SELECT tm.account_id, tm.status, tm.weekly_dist, tm.avg_pace, a.display_name
       FROM team_members tm JOIN accounts a ON tm.account_id = a.id
       WHERE tm.team_id = ?`,
    )
    .bind(invite.team_id)
    .all<TeamMemberRow>()

  return c.json({
    ok: true,
    team: {
      id: team.id,
      name: team.name,
      createdBy: team.created_by,
      members: membersResult.results.map((m) => ({
        name: m.display_name,
        userId: m.account_id,
        status: m.status,
        weeklyDist: m.weekly_dist,
        avgPace: m.avg_pace,
      })),
    },
  })
})

// POST /api/invites/:id/decline
invitesRoutes.post('/:id/decline', async (c) => {
  const account = c.get('account')
  const inviteId = c.req.param('id')

  const invite = await c.env.DB
    .prepare('SELECT id, team_id FROM invites WHERE id = ? AND to_account_id = ? AND status = ?')
    .bind(inviteId, account.id, 'pending')
    .first<{ id: string; team_id: string }>()

  if (!invite) return c.json({ ok: false, error: 'invite_not_found' }, 404)

  // D1 batch: decline invite + remove member + check remaining count
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE invites SET status = ? WHERE id = ?').bind('declined', inviteId),
    c.env.DB
      .prepare('DELETE FROM team_members WHERE team_id = ? AND account_id = ?')
      .bind(invite.team_id, account.id),
  ])

  // if no more pending/accepted members besides creator, delete team
  const remaining = await c.env.DB
    .prepare('SELECT COUNT(*) AS cnt FROM team_members WHERE team_id = ?')
    .bind(invite.team_id)
    .first<{ cnt: number }>()
  if (remaining && remaining.cnt <= 1) {
    await c.env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(invite.team_id).run()
  }

  return c.json({ ok: true })
})