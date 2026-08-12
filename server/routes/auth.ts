import { Hono } from 'hono'
import { getDb } from '../db'
import crypto from 'crypto'

export const authRoutes = new Hono()

// POST /api/auth/signup
authRoutes.post('/signup', async (c) => {
  const { email, password, displayName } = await c.req.json()
  if (!email || !password || !displayName) {
    return c.json({ ok: false, error: 'missing_fields' }, 400)
  }
  // validate
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
    return c.json({ ok: false, error: 'invalid_email' }, 400)
  }
  if (password.length < 6) {
    return c.json({ ok: false, error: 'invalid_password' }, 400)
  }
  const trimmedName = displayName.trim()
  if (trimmedName.length < 1 || trimmedName.length > 20) {
    return c.json({ ok: false, error: 'invalid_display_name' }, 400)
  }

  const db = getDb()
  const normalizedEmail = email.trim().toLowerCase()

  // check duplicate email
  const existingEmail = db.prepare('SELECT id FROM accounts WHERE email = ?').get(normalizedEmail)
  if (existingEmail) return c.json({ ok: false, error: 'email_taken' }, 409)

  // check duplicate display name
  const existingName = db.prepare('SELECT id FROM accounts WHERE display_name = ?').get(trimmedName)
  if (existingName) return c.json({ ok: false, error: 'display_name_taken' }, 409)

  const id = crypto.randomUUID()
  const hash = crypto.createHash('sha256').update(password).digest('hex')
  const createdAt = new Date().toISOString()

  db.prepare('INSERT INTO accounts (id, email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(id, normalizedEmail, trimmedName, hash, createdAt)

  const token = crypto.randomUUID()
  db.prepare('INSERT INTO sessions (token, account_id, created_at) VALUES (?, ?, ?)').run(token, id, createdAt)

  return c.json({
    ok: true,
    sessionToken: token,
    account: { id, email: normalizedEmail, displayName: trimmedName, createdAt },
  })
})

// POST /api/auth/signin
authRoutes.post('/signin', async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password) {
    return c.json({ ok: false, error: 'missing_fields' }, 400)
  }

  const db = getDb()
  const normalizedEmail = email.trim().toLowerCase()
  const account = db.prepare('SELECT * FROM accounts WHERE email = ?').get(normalizedEmail) as any
  if (!account) return c.json({ ok: false, error: 'invalid_credentials' }, 401)

  const hash = crypto.createHash('sha256').update(password).digest('hex')
  if (account.password_hash !== hash) return c.json({ ok: false, error: 'invalid_credentials' }, 401)

  const token = crypto.randomUUID()
  db.prepare('INSERT INTO sessions (token, account_id, created_at) VALUES (?, ?, ?)').run(token, account.id, new Date().toISOString())

  return c.json({
    ok: true,
    sessionToken: token,
    account: { id: account.id, email: account.email, displayName: account.display_name, createdAt: account.created_at },
  })
})

// Utility: get account from session token
export function getAccountFromToken(token: string): any {
  if (!token) return null
  const db = getDb()
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any
  if (!session) return null
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(session.account_id) as any
  return account ? { id: account.id, email: account.email, displayName: account.display_name } : null
}