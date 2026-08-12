import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { initDb } from './db'
import { authRoutes } from './routes/auth'
import { accountRoutes } from './routes/accounts'
import { inviteRoutes } from './routes/invites'
import { teamRoutes } from './routes/teams'

initDb()

const app = new Hono()

app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://smartrun-app.vercel.app'],
  credentials: true,
}))

app.route('/api/auth', authRoutes)
app.route('/api/accounts', accountRoutes)
app.route('/api/invites', inviteRoutes)
app.route('/api/teams', teamRoutes)

app.get('/api/health', (c) => c.json({ ok: true }))

const PORT = parseInt(process.env.PORT || '3001', 10)
serve({ fetch: app.fetch, port: PORT })
console.log(`Server running on http://localhost:${PORT}`)