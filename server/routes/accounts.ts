import { Hono } from 'hono'
import { getDb } from '../db'
import { getAccountFromToken } from './auth'

export const accountRoutes = new Hono()

// GET /api/accounts/search?q=xxx
accountRoutes.get('/search', (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const current = getAccountFromToken(token || '')
  if (!current) return c.json({ ok: false, error: 'unauthorized' }, 401)

  const q = c.req.query('q')?.trim() || ''
  if (!q) return c.json({ ok: true, accounts: [] })

  const db = getDb()
  const accounts = db.prepare(
    'SELECT id, email, display_name, created_at FROM accounts WHERE display_name LIKE ? AND id != ? LIMIT 20'
  ).all(`%${q}%`, current.id) as any[]

  return c.json({
    ok: true,
    accounts: accounts.map((a: any) => ({ id: a.id, email: a.email, displayName: a.display_name, createdAt: a.created_at })),
  })
})

// GET /api/accounts — list all (for invite checkboxes)
accountRoutes.get('/', (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const current = getAccountFromToken(token || '')
  if (!current) return c.json({ ok: false, error: 'unauthorized' }, 401)

  const db = getDb()
  const accounts = db.prepare('SELECT id, email, display_name, created_at FROM accounts WHERE id != ? ORDER BY display_name').all(current.id) as any[]

  return c.json({
    ok: true,
    accounts: accounts.map((a: any) => ({ id: a.id, email: a.email, displayName: a.display_name, createdAt: a.created_at })),
  })
})