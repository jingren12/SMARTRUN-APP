import { Hono } from 'hono'
import type { Bindings } from '../index'

export const authRoutes = new Hono<{ Bindings: Bindings }>()

// SHA-256 hex digest via Web Crypto API (available in Workers runtime).
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// POST /api/auth/signup
authRoutes.post('/signup', async (c) => {
  const { email, password, displayName } = await c.req.json<{
    email?: string
    password?: string
    displayName?: string
  }>()

  if (!email || !password || !displayName) {
    return c.json({ ok: false, error: 'missing_fields' }, 400)
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return c.json({ ok: false, error: 'invalid_email' }, 400)
  }
  if (password.length < 6) {
    return c.json({ ok: false, error: 'invalid_password' }, 400)
  }
  const trimmedName = displayName.trim()
  if (trimmedName.length < 1 || trimmedName.length > 20) {
    return c.json({ ok: false, error: 'invalid_display_name' }, 400)
  }

  // check duplicate email
  const existingEmail = await c.env.DB
    .prepare('SELECT id FROM accounts WHERE email = ?')
    .bind(normalizedEmail)
    .first<{ id: string }>()
  if (existingEmail) return c.json({ ok: false, error: 'email_taken' }, 409)

  // check duplicate display name
  const existingName = await c.env.DB
    .prepare('SELECT id FROM accounts WHERE display_name = ?')
    .bind(trimmedName)
    .first<{ id: string }>()
  if (existingName) return c.json({ ok: false, error: 'display_name_taken' }, 409)

  const id = crypto.randomUUID()
  const hash = await sha256Hex(password)
  const createdAt = new Date().toISOString()
  const token = crypto.randomUUID()

  await c.env.DB
    .prepare('INSERT INTO accounts (id, email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, normalizedEmail, trimmedName, hash, createdAt)
    .run()
  await c.env.DB
    .prepare('INSERT INTO sessions (token, account_id, created_at) VALUES (?, ?, ?)')
    .bind(token, id, createdAt)
    .run()

  return c.json({
    ok: true,
    sessionToken: token,
    account: { id, email: normalizedEmail, displayName: trimmedName, createdAt },
  })
})

// POST /api/auth/signin
authRoutes.post('/signin', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>()

  if (!email || !password) {
    return c.json({ ok: false, error: 'missing_fields' }, 400)
  }

  const normalizedEmail = email.trim().toLowerCase()
  const hash = await sha256Hex(password)

  const account = await c.env.DB
    .prepare('SELECT id, email, display_name, password_hash, created_at FROM accounts WHERE email = ? AND password_hash = ?')
    .bind(normalizedEmail, hash)
    .first<{ id: string; email: string; display_name: string; created_at: string }>()

  if (!account) return c.json({ ok: false, error: 'invalid_credentials' }, 401)

  const token = crypto.randomUUID()
  await c.env.DB
    .prepare('INSERT INTO sessions (token, account_id, created_at) VALUES (?, ?, ?)')
    .bind(token, account.id, new Date().toISOString())
    .run()

  return c.json({
    ok: true,
    sessionToken: token,
    account: {
      id: account.id,
      email: account.email,
      displayName: account.display_name,
      createdAt: account.created_at,
    },
  })
})