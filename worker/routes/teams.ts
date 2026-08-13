import { Hono } from 'hono'
import { initSchema } from '../db'
import type { Bindings } from '../index'
import { requireAuth } from '../middleware'

async function ensureSchema(c: { env: { DB: D1Database } }): Promise<void> {
  try { await initSchema(c.env.DB) } catch { /* init already done */ }
}

export const teamsRoutes = new Hono<{
  Bindings: Bindings
  Variables: { account: { id: string; email: string; displayName: string } }
}>()

teamsRoutes.use('/*', requireAuth)

interface TeamRow {
  id: string
  name: string
  created_by: string
}

interface TeamMemberRow {
  account_id: string
  display_name: string
  status: string
  weekly_dist: number
  avg_pace: string
  stats_shared: number
}

// GET /api/teams — get current user's team
teamsRoutes.get('/', async (c) => {
  await ensureSchema(c)
  const account = c.get('account')

  const team = await c.env.DB
    .prepare(
      `SELECT t.id, t.name, t.created_by FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.account_id = ? AND tm.status = 'accepted'
       LIMIT 1`,
    )
    .bind(account.id)
    .first<TeamRow>()

  if (!team) return c.json({ ok: true, team: null })

  const membersResult = await c.env.DB
    .prepare(
      `SELECT tm.account_id, tm.status, tm.weekly_dist, tm.avg_pace, tm.stats_shared, a.display_name
       FROM team_members tm JOIN accounts a ON tm.account_id = a.id
       WHERE tm.team_id = ?`,
    )
    .bind(team.id)
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
        statsShared: m.stats_shared === 1,
      })),
    },
  })
})

teamsRoutes.post('/leave', async (c) => {
  const account = c.get('account')

  const team = await c.env.DB
    .prepare(
      `SELECT t.id, t.name, t.created_by FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.account_id = ? AND tm.status = 'accepted'
       LIMIT 1`,
    )
    .bind(account.id)
    .first<TeamRow>()

  if (!team) return c.json({ ok: false, error: 'no_team' }, 404)
  if (team.created_by === account.id) return c.json({ ok: false, error: 'creator_cannot_leave' }, 400)

  await c.env.DB
    .prepare('DELETE FROM team_members WHERE team_id = ? AND account_id = ?')
    .bind(team.id, account.id)
    .run()

  // Auto-cancel scheduled runs created by this user
  await c.env.DB
    .prepare('DELETE FROM run_rsvps WHERE run_id IN (SELECT id FROM scheduled_runs WHERE created_by = ? AND team_id = ?)')
    .bind(account.id, team.id)
    .run()
  await c.env.DB
    .prepare('DELETE FROM scheduled_runs WHERE created_by = ? AND team_id = ?')
    .bind(account.id, team.id)
    .run()

  const remaining = await c.env.DB
    .prepare('SELECT COUNT(*) as cnt FROM team_members WHERE team_id = ?')
    .bind(team.id)
    .first<{ cnt: number }>()

  if (remaining && remaining.cnt === 0) {
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM run_rsvps WHERE run_id IN (SELECT id FROM scheduled_runs WHERE team_id = ?)').bind(team.id),
      c.env.DB.prepare('DELETE FROM scheduled_runs WHERE team_id = ?').bind(team.id),
      c.env.DB.prepare('DELETE FROM invites WHERE team_id = ?').bind(team.id),
      c.env.DB.prepare('DELETE FROM team_members WHERE team_id = ?').bind(team.id),
      c.env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(team.id),
    ])
  }

  return c.json({ ok: true })
})

// POST /api/teams/stats-toggle — toggle stats visibility for current user
teamsRoutes.post('/stats-toggle', async (c) => {
  const account = c.get('account')

  const team = await c.env.DB
    .prepare(
      `SELECT t.id FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.account_id = ? AND tm.status = 'accepted'
       LIMIT 1`,
    )
    .bind(account.id)
    .first<{ id: string }>()

  if (!team) return c.json({ ok: false, error: 'no_team' }, 404)

  await c.env.DB
    .prepare('UPDATE team_members SET stats_shared = CASE WHEN stats_shared = 0 THEN 1 ELSE 0 END WHERE team_id = ? AND account_id = ?')
    .bind(team.id, account.id)
    .run()

  const updated = await c.env.DB
    .prepare('SELECT stats_shared FROM team_members WHERE team_id = ? AND account_id = ?')
    .bind(team.id, account.id)
    .first<{ stats_shared: number }>()

  return c.json({ ok: true, statsShared: updated!.stats_shared === 1 })
})

// DELETE /api/teams — disband (only creator)
teamsRoutes.delete('/', async (c) => {
  const account = c.get('account')

  const team = await c.env.DB
    .prepare('SELECT id, name, created_by FROM teams WHERE created_by = ?')
    .bind(account.id)
    .first<TeamRow>()

  if (!team) return c.json({ ok: false, error: 'no_team' }, 404)

  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM run_rsvps WHERE run_id IN (SELECT id FROM scheduled_runs WHERE team_id = ?)').bind(team.id),
    c.env.DB.prepare('DELETE FROM scheduled_runs WHERE team_id = ?').bind(team.id),
    c.env.DB.prepare('DELETE FROM invites WHERE team_id = ?').bind(team.id),
    c.env.DB.prepare('DELETE FROM team_members WHERE team_id = ?').bind(team.id),
    c.env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(team.id),
  ])

  return c.json({ ok: true })
})