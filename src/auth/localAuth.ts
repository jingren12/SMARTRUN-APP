// Pure TypeScript, localStorage-backed mock auth for the SmartRun SPA.
// No React, no backend, no third-party deps. Synchronous storage with a
// small injectable `AuthStorage` so callers can substitute an in-memory fake
// for pure tests / future verification. All write paths return
// `storage_unavailable` on failure instead of throwing into the UI.

import type {
  AuthAccount,
  AuthErrorCode,
  AuthResult,
  AuthSession,
  AuthStoreV1,
} from '../data/types';

export const STORAGE_KEY = 'smartrun-auth-v1';

/** Minimal synchronous storage surface (a subset of the DOM `Storage`). */
export interface AuthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyStore(): AuthStoreV1 {
  return { version: 1, accounts: [], session: null };
}

/** Resolve the default storage, tolerating environments where `localStorage` is blocked. */
function defaultStorage(): AuthStorage {
  try {
    return localStorage;
  } catch {
    return {
      getItem: () => null,
      setItem: () => {
        throw new Error('storage unavailable');
      },
    };
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function normalizeAccount(v: unknown): AuthAccount | null {
  if (!isObject(v)) return null;
  const { id, email, displayName, passwordHash, createdAt } = v;
  if (
    typeof id !== 'string' ||
    typeof email !== 'string' ||
    typeof displayName !== 'string' ||
    typeof passwordHash !== 'string' ||
    typeof createdAt !== 'string'
  ) {
    return null;
  }
  return { id, email, displayName, passwordHash, createdAt };
}

function normalizeSession(v: unknown): AuthSession | null {
  if (v === null) return null;
  if (!isObject(v)) return null;
  const { userId, email, displayName, signedInAt } = v;
  if (
    typeof userId !== 'string' ||
    typeof email !== 'string' ||
    typeof displayName !== 'string' ||
    typeof signedInAt !== 'string'
  ) {
    return null;
  }
  return { userId, email, displayName, signedInAt };
}

/** Coerce arbitrary parsed JSON into a valid v1 store, or reset to empty. */
function normalizeStore(parsed: unknown): AuthStoreV1 {
  if (!isObject(parsed) || parsed.version !== 1) return emptyStore();
  if (!Array.isArray(parsed.accounts)) return emptyStore();
  const accounts: AuthAccount[] = [];
  for (const raw of parsed.accounts) {
    const acc = normalizeAccount(raw);
    if (acc === null) return emptyStore();
    accounts.push(acc);
  }
  const session = normalizeSession(parsed.session);
  if (session === null && parsed.session !== null) return emptyStore();
  return { version: 1, accounts, session };
}

function createId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Load and validate the store. Corrupt/missing JSON becomes an empty v1 store. */
export function loadStore(storage: AuthStorage = defaultStorage()): AuthStoreV1 {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return emptyStore();
  }
  if (raw === null) return emptyStore();
  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
}

/** Persist the store. Returns `storage_unavailable` on failure instead of throwing. */
export function saveStore(
  store: AuthStoreV1,
  storage: AuthStorage = defaultStorage(),
): AuthResult<AuthStoreV1> {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
    return { ok: true, value: store };
  } catch {
    return { ok: false, error: 'storage_unavailable' };
  }
}

/** Current session, or `null` when signed out / no store. */
export function getSession(storage: AuthStorage = defaultStorage()): AuthSession | null {
  return loadStore(storage).session;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): AuthErrorCode | null {
  if (!EMAIL_RE.test(normalizeEmail(email))) return 'invalid_email';
  return null;
}

export function validatePassword(password: string): AuthErrorCode | null {
  if (password.length < 6) return 'invalid_password';
  return null;
}

export function validateDisplayName(name: string): AuthErrorCode | null {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 20) return 'invalid_display_name';
  return null;
}

// MOCK ONLY — not production security. This is a deterministic non-cryptographic
// hash (FNV-1a 32-bit) used solely to avoid storing plaintext passwords in
// localStorage for this front-end-only demo. It is trivially reversible by any
// attacker with store access and must NEVER be used to protect real credentials.
export function hashPassword(password: string): string {
  let h = 0x811c9dc5; // FNV-1a 32-bit offset basis
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function signUp(
  email: string,
  password: string,
  displayName: string,
  storage: AuthStorage = defaultStorage(),
): AuthResult<AuthSession> {
  const emailErr = validateEmail(email);
  if (emailErr !== null) return { ok: false, error: emailErr };
  const passwordErr = validatePassword(password);
  if (passwordErr !== null) return { ok: false, error: passwordErr };
  const nameErr = validateDisplayName(displayName);
  if (nameErr !== null) return { ok: false, error: nameErr };

  const normalizedEmail = normalizeEmail(email);
  const trimmedName = displayName.trim();
  const store = loadStore(storage);
  if (store.accounts.some((a) => a.email === normalizedEmail)) {
    return { ok: false, error: 'email_taken' };
  }

  const createdAt = nowIso();
  const account: AuthAccount = {
    id: createId(),
    email: normalizedEmail,
    displayName: trimmedName,
    passwordHash: hashPassword(password),
    createdAt,
  };
  const session: AuthSession = {
    userId: account.id,
    email: account.email,
    displayName: account.displayName,
    signedInAt: createdAt,
  };
  const nextStore: AuthStoreV1 = {
    version: 1,
    accounts: [...store.accounts, account],
    session,
  };
  const saved = saveStore(nextStore, storage);
  if (!saved.ok) return { ok: false, error: saved.error };
  return { ok: true, value: session };
}

export function signIn(
  email: string,
  password: string,
  storage: AuthStorage = defaultStorage(),
): AuthResult<AuthSession> {
  // Do not reveal which field is wrong: an unknown email and a wrong password
  // both surface as `invalid_credentials`.
  const normalizedEmail = normalizeEmail(email);
  const store = loadStore(storage);
  const account = store.accounts.find((a) => a.email === normalizedEmail);
  if (account === undefined) return { ok: false, error: 'invalid_credentials' };
  if (account.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'invalid_credentials' };
  }

  const session: AuthSession = {
    userId: account.id,
    email: account.email,
    displayName: account.displayName,
    signedInAt: nowIso(),
  };
  const nextStore: AuthStoreV1 = { ...store, session };
  const saved = saveStore(nextStore, storage);
  if (!saved.ok) return { ok: false, error: saved.error };
  return { ok: true, value: session };
}

/** Clear only the session; accounts are preserved. */
export function signOut(storage: AuthStorage = defaultStorage()): AuthResult<AuthStoreV1> {
  const store = loadStore(storage);
  if (store.session === null) return { ok: true, value: store };
  const nextStore: AuthStoreV1 = { ...store, session: null };
  const saved = saveStore(nextStore, storage);
  if (!saved.ok) return { ok: false, error: saved.error };
  return { ok: true, value: nextStore };
}