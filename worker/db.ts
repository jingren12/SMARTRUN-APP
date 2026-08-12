// Schema initialization for D1.
// D1's db.exec() supports multiple statements in one call, so we can run
// the full idempotent schema (IF NOT EXISTS) on every cold start.

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted')),
  weekly_dist REAL NOT NULL DEFAULT 0,
  avg_pace TEXT NOT NULL DEFAULT '0:00',
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  PRIMARY KEY (team_id, account_id)
);

CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  from_account_id TEXT NOT NULL,
  to_account_id TEXT NOT NULL,
  team_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_team_members_account ON team_members(account_id);
CREATE INDEX IF NOT EXISTS idx_invites_to ON invites(to_account_id);
CREATE INDEX IF NOT EXISTS idx_invites_from ON invites(from_account_id);
`

export async function initSchema(db: D1Database): Promise<void> {
  await db.exec(SCHEMA)
}