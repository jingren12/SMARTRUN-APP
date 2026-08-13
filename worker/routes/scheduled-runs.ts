import { Hono } from 'hono'
import { initSchema } from '../db'
import type { Bindings } from '../index'
import { requireAuth } from '../middleware'

async function ensureSchema(c: { env: { DB: D1Database } }): Promise<void> {
  try { await initSchema(c.env.DB) } catch { /* init already done */ }
}

export const scheduledRunsRoutes = new Hono<{
  Bindings: Bindings
  Variables: { account: { id: string; email: string; displayName: string } }
}>()

scheduledRunsRoutes.use('/*', requireAuth)

// Helper: verify account is accepted member of the team
async function requireTeamMember(
  c: { env: { DB: D1Database }; get: (name: string) => unknown },
  teamId: string,
  accountId: string,
): Promise<boolean> {
  const member = await (c.env as { DB: D1Database }).DB
    .prepare('SELECT account_id FROM team_members WHERE team_id = ? AND account_id = ? AND status = ?')
    .bind(teamId, accountId, 'accepted')
    .first<{ account_id: string }>()
  return !!member
}

interface RunRow {
  id: string
  team_id: string
  date: string
  time: string
  location: string
  created_by: string
  created_at: string
  display_name: string
}

interface RsvpRow {
  account_id: string
  display_name: string
  status: string
}

// POST /api/scheduled-runs — create a scheduled run
scheduledRunsRoutes.post('/', async (c) => {
  await ensureSchema(c)
  const account = c.get('account')
  const { teamId, date, time, location } = await c.req.json<{
    teamId?: string; date?: string; time?: string; location?: string
  }>()
  if (!teamId || !date || !time || !location) {
    return c.json({ ok: false, error: 'missing_fields' }, 400)
  }

  if (!await requireTeamMember(c as never, teamId, account.id)) {
    return c.json({ ok: false, error: 'not_team_member' }, 403)
  }

  const runId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Insert run + creator going RSVP atomically
  await c.env.DB.batch([
    c.env.DB
      .prepare('INSERT INTO scheduled_runs (id, team_id, date, time, location, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(runId, teamId, date, time, location, account.id, now),
    c.env.DB
      .prepare('INSERT OR IGNORE INTO run_rsvps (run_id, account_id, status) VALUES (?, ?, ?)')
      .bind(runId, account.id, 'going'),
  ])

  // Fetch created run with creator name + rsvps
  const run = await c.env.DB
    .prepare(
      `SELECT sr.*, a.display_name
       FROM scheduled_runs sr JOIN accounts a ON sr.created_by = a.id
       WHERE sr.id = ?`,
    )
    .bind(runId)
    .first<RunRow>()

  const rsvpsResult = await c.env.DB
    .prepare(
      `SELECT rr.account_id, rr.status, a.display_name
       FROM run_rsvps rr JOIN accounts a ON rr.account_id = a.id
       WHERE rr.run_id = ?`,
    )
    .bind(runId)
    .all<RsvpRow>()

  const rsvps = rsvpsResult.results.map(r => ({
    accountId: r.account_id,
    displayName: r.display_name,
    status: r.status,
  }))

  return c.json({
    ok: true,
    run: {
      id: run!.id,
      teamId: run!.team_id,
      date: run!.date,
      time: run!.time,
      location: run!.location,
      createdBy: run!.created_by,
      createdByName: run!.display_name,
      createdAt: run!.created_at,
      rsvps,
      goingCount: rsvps.filter(r => r.status === 'going').length,
      notGoingCount: rsvps.filter(r => r.status === 'not_going').length,
    },
  })
})

// GET /api/scheduled-runs?teamId=X — list upcoming runs for team
scheduledRunsRoutes.get('/', async (c) => {
  await ensureSchema(c)
  const account = c.get('account')
  const teamId = c.req.query('teamId')
  if (!teamId) return c.json({ ok: false, error: 'missing_fields' }, 400)

  if (!await requireTeamMember(c as never, teamId, account.id)) {
    return c.json({ ok: false, error: 'not_team_member' }, 403)
  }

  // Clean up past runs (by local date/time strings)
  const now = new Date()
  const today = now.toISOString().slice(0, 10) // YYYY-MM-DD
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM
  await c.env.DB
    .prepare('DELETE FROM scheduled_runs WHERE team_id = ? AND (date < ? OR (date = ? AND time < ?))')
    .bind(teamId, today, today, currentTime)
    .run()

  // Fetch remaining upcoming runs
  const runsResult = await c.env.DB
    .prepare(
      `SELECT sr.*, a.display_name
       FROM scheduled_runs sr JOIN accounts a ON sr.created_by = a.id
       WHERE sr.team_id = ?
       ORDER BY sr.date ASC, sr.time ASC`,
    )
    .bind(teamId)
    .all<RunRow>()

  const runs = await Promise.all(runsResult.results.map(async (r) => {
    const rsvpsResult = await c.env.DB
      .prepare(
        `SELECT rr.account_id, rr.status, a.display_name
         FROM run_rsvps rr JOIN accounts a ON rr.account_id = a.id
         WHERE rr.run_id = ?`,
      )
      .bind(r.id)
      .all<RsvpRow>()
    const rsvps = rsvpsResult.results.map(rr => ({
      accountId: rr.account_id,
      displayName: rr.display_name,
      status: rr.status,
    }))
    return {
      id: r.id,
      teamId: r.team_id,
      date: r.date,
      time: r.time,
      location: r.location,
      createdBy: r.created_by,
      createdByName: r.display_name,
      createdAt: r.created_at,
      rsvps,
      goingCount: rsvps.filter(rr => rr.status === 'going').length,
      notGoingCount: rsvps.filter(rr => rr.status === 'not_going').length,
    }
  }))

  return c.json({ ok: true, runs })
})

// POST /api/scheduled-runs/:id/rsvp — set going/not_going
scheduledRunsRoutes.post('/:id/rsvp', async (c) => {
  await ensureSchema(c)
  const account = c.get('account')
  const runId = c.req.param('id')
  const { status } = await c.req.json<{ status?: string }>()

  if (!status || !['going', 'not_going'].includes(status)) {
    return c.json({ ok: false, error: 'invalid_status' }, 400)
  }

  // Verify run exists and user is team member
  const run = await c.env.DB
    .prepare('SELECT id, team_id FROM scheduled_runs WHERE id = ?')
    .bind(runId)
    .first<{ id: string; team_id: string }>()
  if (!run) return c.json({ ok: false, error: 'not_found' }, 404)

  if (!await requireTeamMember(c as never, run.team_id, account.id)) {
    return c.json({ ok: false, error: 'not_team_member' }, 403)
  }

  // Upsert RSVP
  await c.env.DB
    .prepare('INSERT INTO run_rsvps (run_id, account_id, status) VALUES (?, ?, ?) ON CONFLICT(run_id, account_id) DO UPDATE SET status = excluded.status')
    .bind(runId, account.id, status)
    .run()

  return c.json({ ok: true })
})

// DELETE /api/scheduled-runs/:id — cancel (creator only)
scheduledRunsRoutes.delete('/:id', async (c) => {
  await ensureSchema(c)
  const account = c.get('account')
  const runId = c.req.param('id')

  const run = await c.env.DB
    .prepare('SELECT id, created_by FROM scheduled_runs WHERE id = ?')
    .bind(runId)
    .first<{ id: string; created_by: string }>()
  if (!run) return c.json({ ok: false, error: 'not_found' }, 404)

  if (run.created_by !== account.id) {
    return c.json({ ok: false, error: 'not_creator' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM scheduled_runs WHERE id = ?').bind(runId).run()

  return c.json({ ok: true })
})