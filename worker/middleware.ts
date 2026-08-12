import type { Context, MiddlewareHandler } from 'hono'
import type { Bindings } from './index'

// Shape of the account object attached to the Hono context variable `account`.
export interface AuthAccount {
  id: string
  email: string
  displayName: string
}

// Shared auth middleware: validates Bearer token against the sessions table
// and stashes the authenticated account on the context as `account`.
export const requireAuth: MiddlewareHandler<{
  Bindings: Bindings
  Variables: { account: AuthAccount }
}> = async (c, next) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ ok: false, error: 'unauthorized' }, 401)
  }
  const token = auth.slice(7)
  const session = await c.env.DB
    .prepare('SELECT account_id FROM sessions WHERE token = ?')
    .bind(token)
    .first<{ account_id: string }>()
  if (!session) {
    return c.json({ ok: false, error: 'unauthorized' }, 401)
  }
  const account = await c.env.DB
    .prepare('SELECT id, email, display_name FROM accounts WHERE id = ?')
    .bind(session.account_id)
    .first<AuthAccount>()
  if (!account) {
    return c.json({ ok: false, error: 'unauthorized' }, 401)
  }
  c.set('account', account)
  await next()
}

// Helper type for handlers that run after requireAuth.
export type AuthContext = Context<{
  Bindings: Bindings
  Variables: { account: AuthAccount }
}>