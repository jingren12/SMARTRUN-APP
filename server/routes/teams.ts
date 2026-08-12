import { Hono } from 'hono'
import { getDb } from '../db'
import { getAccountFromToken } from './auth'

export const teamRoutes = new Hono()

async function requireAuth(c: any, next: any) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const account = getAccountFromToken(token || '')
  if (!account) return c.json({ ok: false, error: 'unauthorized' }, 401)
  c.set('account', account)
  await next()
}

teamRoutes.use('/*', requireAuth)

// GET /api/teams — get current user's team
teamRoutes.get('/', (c) => {
  const account = c.get('account') as any
  const db = getDb()

  const team = db.prepare(`
    SELECT t.* FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.account_id = ? AND tm.status = 'accepted'
    LIMIT 1
  `).get(account.id) as any

  if (!team) return c.json({ ok: true, team: null })

  const members = db.prepare(`
    SELECT tm.*, a.display_name FROM team_members tm JOIN accounts a ON tm.account_id = a.id
    WHERE tm.team_id = ?
  `).all(team.id) as any[]

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

// DELETE /api/teams — disband (only creator)
teamRoutes.delete('/', (c) => {
  const account = c.get('account') as any
  const db = getDb()

  const team = db.prepare('SELECT * FROM teams WHERE creator_id = ?').get(account.id) as any
  if (!team) return c.json({ ok: false, error: 'no_team' }, 404)

  db.transaction(() => {
    db.prepare('DELETE FROM invites WHERE team_id = ?').run(team.id)
    db.prepare('DELETE FROM team_members WHERE team_id = ?').run(team.id)
    db.prepare('DELETE FROM teams WHERE id = ?').run(team.id)
  })()

  return c.json({ ok: true })
})