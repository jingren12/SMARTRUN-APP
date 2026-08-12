import { Hono } from 'hono'
import type { Bindings } from '../index'
import { requireAuth } from '../middleware'

export const accountsRoutes = new Hono<{
  Bindings: Bindings
  Variables: { account: { id: string; email: string; displayName: string } }
}>()

interface AccountRow {
  id: string
  email: string
  display_name: string
  created_at: string
}

// GET /api/accounts — list all accounts (auth-gated), excluding current user
accountsRoutes.get('/', requireAuth, async (c) => {
  const account = c.get('account')
  const result = await c.env.DB
    .prepare('SELECT id, email, display_name, created_at FROM accounts WHERE id != ? ORDER BY display_name')
    .bind(account.id)
    .all<AccountRow>()

  return c.json({
    ok: true,
    accounts: result.results.map((a) => ({
      id: a.id,
      email: a.email,
      displayName: a.display_name,
      createdAt: a.created_at,
    })),
  })
})

// GET /api/accounts/search?q=xxx — search by display_name, excluding current user
accountsRoutes.get('/search', requireAuth, async (c) => {
  const account = c.get('account')
  const q = c.req.query('q')?.trim() || ''
  if (!q) return c.json({ ok: true, accounts: [] })

  const result = await c.env.DB
    .prepare('SELECT id, email, display_name, created_at FROM accounts WHERE display_name LIKE ? AND id != ? LIMIT 20')
    .bind(`%${q}%`, account.id)
    .all<AccountRow>()

  return c.json({
    ok: true,
    accounts: result.results.map((a) => ({
      id: a.id,
      email: a.email,
      displayName: a.display_name,
      createdAt: a.created_at,
    })),
  })
})