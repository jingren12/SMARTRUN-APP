import { Hono } from 'hono'
import { getDb } from '../db'
import { getAccountFromToken } from './auth'
import crypto from 'crypto'

export const inviteRoutes = new Hono()

// Middleware: require auth
async function requireAuth(c: any, next: any) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const account = getAccountFromToken(token || '')
  if (!account) return c.json({ ok: false, error: 'unauthorized' }, 401)
  c.set('account', account)
  await next()
}

inviteRoutes.use('/*', requireAuth)

// GET /api/invites — pending invites for current user
inviteRoutes.get('/', (c) => {
  const account = c.get('account') as any
  const db = getDb()
  const invites = db.prepare(`
    SELECT i.*, a.display_name as from_name, t.name as team_name
    FROM invites i
    JOIN accounts a ON i.from_account_id = a.id
    JOIN teams t ON i.team_id = t.id
    WHERE i.to_account_id = ? AND i.status = 'pending'
    ORDER BY i.created_at DESC
  `).all(account.id) as any[]

  return c.json({
    ok: true,
    invites: invites.map((i: any) => ({
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
inviteRoutes.post('/', async (c) => {
  const account = c.get('account') as any
  const { toAccountId, teamName } = await c.req.json()
  if (!toAccountId || !teamName) return c.json({ ok: false, error: 'missing_fields' }, 400)

  const db = getDb()

  // check target exists
  const target = db.prepare('SELECT id FROM accounts WHERE id = ?').get(toAccountId) as any
  if (!target) return c.json({ ok: false, error: 'user_not_found' }, 404)

  // check not already on same team (accepted)
  const existing = db.prepare(`
    SELECT tm.status FROM team_members tm JOIN teams t ON tm.team_id = t.id
    WHERE tm.account_id = ? AND t.creator_id = ? AND tm.status = 'accepted'
  `).get(toAccountId, account.id) as any
  if (existing) return c.json({ ok: false, error: 'already_on_team' }, 409)

  // find or create team
  let team = db.prepare('SELECT * FROM teams WHERE creator_id = ? AND name = ?').get(account.id, teamName) as any
  if (!team) {
    const teamId = crypto.randomUUID()
    db.prepare('INSERT INTO teams (id, name, creator_id, created_at) VALUES (?, ?, ?, ?)').run(teamId, teamName, account.id, new Date().toISOString())
    // add creator as accepted member
    db.prepare('INSERT OR IGNORE INTO team_members (team_id, account_id, status) VALUES (?, ?, ?)').run(teamId, account.id, 'accepted')
    team = { id: teamId, name: teamName, creator_id: account.id }
  }

  // add target as pending member
  db.prepare('INSERT OR IGNORE INTO team_members (team_id, account_id, status) VALUES (?, ?, ?)').run(team.id, toAccountId, 'pending')

  // create invite
  const inviteId = crypto.randomUUID()
  db.prepare('INSERT INTO invites (id, from_account_id, to_account_id, team_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(inviteId, account.id, toAccountId, team.id, 'pending', new Date().toISOString())

  return c.json({ ok: true, invite: { id: inviteId, teamId: team.id } })
})

// POST /api/invites/:id/accept
inviteRoutes.post('/:id/accept', (c) => {
  const account = c.get('account') as any
  const inviteId = c.req.param('id')
  const db = getDb()

  const invite = db.prepare('SELECT * FROM invites WHERE id = ? AND to_account_id = ? AND status = ?').get(inviteId, account.id, 'pending') as any
  if (!invite) return c.json({ ok: false, error: 'invite_not_found' }, 404)

  db.transaction(() => {
    db.prepare('UPDATE invites SET status = ? WHERE id = ?').run('accepted', inviteId)
    db.prepare('UPDATE team_members SET status = ? WHERE team_id = ? AND account_id = ?').run('accepted', invite.team_id, account.id)
  })()

  // get full team data
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(invite.team_id) as any
  const members = db.prepare(`
    SELECT tm.*, a.display_name FROM team_members tm JOIN accounts a ON tm.account_id = a.id
    WHERE tm.team_id = ?
  `).all(invite.team_id) as any[]

  return c.json({
    ok: true,
    team: {
      name: team.name,
      members: members.map((m: any) => ({
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
inviteRoutes.post('/:id/decline', (c) => {
  const account = c.get('account') as any
  const inviteId = c.req.param('id')
  const db = getDb()

  const invite = db.prepare('SELECT * FROM invites WHERE id = ? AND to_account_id = ? AND status = ?').get(inviteId, account.id, 'pending') as any
  if (!invite) return c.json({ ok: false, error: 'invite_not_found' }, 404)

  db.transaction(() => {
    db.prepare('UPDATE invites SET status = ? WHERE id = ?').run('declined', inviteId)
    db.prepare('DELETE FROM team_members WHERE team_id = ? AND account_id = ?').run(invite.team_id, account.id)
    // if no more pending/accepted members besides creator, delete team
    const remaining = db.prepare('SELECT COUNT(*) as cnt FROM team_members WHERE team_id = ?').get(invite.team_id) as any
    if (remaining.cnt <= 1) {
      db.prepare('DELETE FROM teams WHERE id = ?').run(invite.team_id)
    }
  })()

  return c.json({ ok: true })
})