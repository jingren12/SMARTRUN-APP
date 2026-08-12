import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { accountsRoutes } from './routes/accounts'
import { invitesRoutes } from './routes/invites'
import { teamsRoutes } from './routes/teams'
import { initSchema } from './db'

export type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

app.route('/api/auth', authRoutes)
app.route('/api/accounts', accountsRoutes)
app.route('/api/invites', invitesRoutes)
app.route('/api/teams', teamsRoutes)

app.get('/api/health', (c) => c.json({ ok: true }))

// Initialize schema on first request (idempotent — uses IF NOT EXISTS)
app.use('*', async (c, next) => {
  await initSchema(c.env.DB)
  await next()
})

export default app