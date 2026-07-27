export type UserRole = "citizen" | "operator" | "admin";
export type UserStatus = "active" | "suspended";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  lastLoginAt: number | null;
};

type D1RunResult = {
  success?: boolean;
  meta?: { changes?: number };
};

type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  run: () => Promise<D1RunResult>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
};

type D1DatabaseLike = {
  prepare: (query: string) => D1Statement;
  batch: (statements: D1Statement[]) => Promise<unknown[]>;
};

const SESSION_COOKIE = "civiclens_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const PASSWORD_ITERATIONS = 120_000;
const encoder = new TextEncoder();
let schemaPromise: Promise<void> | null = null;

async function getD1(): Promise<D1DatabaseLike> {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  return env.DB as unknown as D1DatabaseLike;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 190) : "";
}

export function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validPassword(password: string) {
  return password.length >= 10 && password.length <= 128 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export async function hashText(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toBase64Url(new Uint8Array(digest));
}

export async function createPasswordHash(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    material,
    256,
  );
  return { hash: toBase64Url(new Uint8Array(bits)), salt: toBase64Url(salt) };
}

export async function verifyPassword(password: string, storedHash: string, storedSalt: string) {
  try {
    const salt = fromBase64Url(storedSalt);
    const candidate = await createPasswordHash(password, salt);
    return constantTimeEqual(fromBase64Url(candidate.hash), fromBase64Url(storedHash));
  } catch {
    return false;
  }
}

export async function ensureMultiUserSchema() {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    const db = await getD1();
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        organization TEXT NOT NULL DEFAULT '',
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'citizen',
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_login_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        user_agent TEXT NOT NULL DEFAULT '',
        ip_hash TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS team_members (
        team_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        membership_role TEXT NOT NULL DEFAULT 'member',
        created_at INTEGER NOT NULL,
        PRIMARY KEY (team_id, user_id),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS report_ownership (
        report_id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        visibility TEXT NOT NULL DEFAULT 'authority',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (report_id) REFERENCES hazard_reports(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'info',
        read_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL DEFAULT '',
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS auth_attempts (
        fingerprint TEXT PRIMARY KEY NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        blocked_until INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,
      `CREATE INDEX IF NOT EXISTS idx_report_ownership_user_id ON report_ownership(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC)`,
    ];
    await db.batch(statements.map((statement) => db.prepare(statement)));
    const now = Date.now();
    await db
      .prepare("INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('bootstrap_owner', 'open', ?)")
      .bind(now)
      .run();
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}

function readCookie(request: Request, name: string) {
  const source = request.headers.get("cookie") ?? "";
  for (const pair of source.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function sessionCookie(token: string, expiresAt: number) {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function createSession(userId: string, request: Request) {
  await ensureMultiUserSchema();
  const db = await getD1();
  const rawToken = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await hashText(rawToken);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const ipHash = await hashText(ip.split(",")[0].trim());
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at, user_agent, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      now,
      now,
      cleanText(request.headers.get("user-agent"), 240),
      ipHash,
    )
    .run();
  return { token: rawToken, expiresAt };
}

export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  await ensureMultiUserSchema();
  const db = await getD1();
  const tokenHash = await hashText(token);
  const now = Date.now();
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.organization, u.role, u.status,
              u.created_at AS createdAt, u.last_login_at AS lastLoginAt,
              s.id AS sessionId, s.last_seen_at AS lastSeenAt
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'
       LIMIT 1`,
    )
    .bind(tokenHash, now)
    .first<AuthUser & { sessionId: string; lastSeenAt: number }>();
  if (!row) return null;
  if (now - Number(row.lastSeenAt) > 60_000) {
    await db.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").bind(now, row.sessionId).run();
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    organization: row.organization,
    role: row.role,
    status: row.status,
    createdAt: Number(row.createdAt),
    lastLoginAt: row.lastLoginAt == null ? null : Number(row.lastLoginAt),
  };
}

export async function destroyCurrentSession(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  await ensureMultiUserSchema();
  const db = await getD1();
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await hashText(token)).run();
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function canOperate(user: AuthUser | null) {
  return user?.role === "operator" || user?.role === "admin";
}

export async function claimBootstrapOwner(userId: string) {
  await ensureMultiUserSchema();
  const db = await getD1();
  const now = Date.now();
  const result = await db
    .prepare("UPDATE app_settings SET value = ?, updated_at = ? WHERE key = 'bootstrap_owner' AND value = 'open'")
    .bind(userId, now)
    .run();
  const claimed = Number(result.meta?.changes ?? 0) === 1;
  if (claimed) await db.prepare("UPDATE users SET role = 'admin', updated_at = ? WHERE id = ?").bind(now, userId).run();
  return claimed;
}

export async function recordAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId = "",
  metadata: Record<string, unknown> = {},
) {
  await ensureMultiUserSchema();
  const db = await getD1();
  await db
    .prepare(
      `INSERT INTO audit_events (id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), userId, action.slice(0, 80), entityType.slice(0, 80), entityId.slice(0, 120), JSON.stringify(metadata).slice(0, 2000), Date.now())
    .run();
}

export async function createNotification(userId: string, title: string, message: string, kind = "info") {
  await ensureMultiUserSchema();
  const db = await getD1();
  await db
    .prepare(
      `INSERT INTO notifications (id, user_id, title, message, kind, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), userId, title.slice(0, 100), message.slice(0, 300), kind.slice(0, 24), Date.now())
    .run();
}

export async function authFingerprint(request: Request, email: string) {
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  return hashText(`${email}|${ip.split(",")[0].trim()}`);
}

export async function authBlocked(fingerprint: string) {
  await ensureMultiUserSchema();
  const db = await getD1();
  const row = await db
    .prepare("SELECT attempts, blocked_until AS blockedUntil FROM auth_attempts WHERE fingerprint = ?")
    .bind(fingerprint)
    .first<{ attempts: number; blockedUntil: number }>();
  return row && Number(row.blockedUntil) > Date.now() ? Number(row.blockedUntil) : 0;
}

export async function recordAuthFailure(fingerprint: string) {
  await ensureMultiUserSchema();
  const db = await getD1();
  const now = Date.now();
  const row = await db.prepare("SELECT attempts FROM auth_attempts WHERE fingerprint = ?").bind(fingerprint).first<{ attempts: number }>();
  const attempts = Number(row?.attempts ?? 0) + 1;
  const blockedUntil = attempts >= 5 ? now + 15 * 60 * 1000 : 0;
  await db
    .prepare(
      `INSERT INTO auth_attempts (fingerprint, attempts, blocked_until, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(fingerprint) DO UPDATE SET attempts = excluded.attempts, blocked_until = excluded.blocked_until, updated_at = excluded.updated_at`,
    )
    .bind(fingerprint, attempts, blockedUntil, now)
    .run();
}

export async function clearAuthFailures(fingerprint: string) {
  await ensureMultiUserSchema();
  const db = await getD1();
  await db.prepare("DELETE FROM auth_attempts WHERE fingerprint = ?").bind(fingerprint).run();
}

export async function rawD1() {
  await ensureMultiUserSchema();
  return getD1();
}
