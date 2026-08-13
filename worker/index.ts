import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { accountsRoutes } from './routes/accounts'
import { invitesRoutes } from './routes/invites'
import { teamsRoutes } from './routes/teams'
import { scheduledRunsRoutes } from './routes/scheduled-runs'
import { aiRoutes } from './routes/ai'
import { amapRoutes } from './routes/amap'
import { initSchema } from './db'

export type Bindings = {
  DB: D1Database
  DEEPSEEK_API_KEY?: string
  AMAP_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// Init schema at boot, then before every route handler
app.use('*', async (c, next) => {
  try {
    await initSchema(c.env.DB)
  } catch (e) {
    console.error('initSchema failed', e)
  }
  await next()
})

app.route('/api/auth', authRoutes)
app.route('/api/accounts', accountsRoutes)
app.route('/api/invites', invitesRoutes)
app.route('/api/teams', teamsRoutes)
app.route('/api/scheduled-runs', scheduledRunsRoutes)
app.route('/api/ai', aiRoutes)
app.route('/api/amap', amapRoutes)

app.get('/api/health', (c) => c.json({ ok: true }))

// Global error handler to surface real errors instead of generic 500
app.onError((err, c) => {
  console.error('Unhandled error', err)
  return c.json({ ok: false, error: err.message || 'internal_error' }, 500)
})

export default app