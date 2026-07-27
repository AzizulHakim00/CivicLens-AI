import {
  cleanText,
  createPasswordHash,
  createSession,
  ensureMultiUserSchema,
  hashText,
  normalizeEmail,
  rawD1,
  recordAudit,
  sameOrigin,
  sessionCookie,
  validEmail,
  validPassword,
  verifyPassword,
} from "../../../../lib/auth";

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timing(startedAt: number) {
  return { "server-timing": `registration;dur=${Math.max(0, Date.now() - startedAt)}` };
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 16_384) return Response.json({ error: "Payload is too large." }, { status: 413 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const name = cleanText(body.name, 90);
    const organization = cleanText(body.organization, 120);
    const password = typeof body.password === "string" ? body.password : "";

    if (!validEmail(email) || name.length < 2 || !validPassword(password)) {
      return Response.json(
        { error: "Use a valid email, a name, and a 10+ character password containing letters and numbers." },
        { status: 400, headers: timing(startedAt) },
      );
    }

    await ensureMultiUserSchema();
    const db = await rawD1();
    const existing = await db
      .prepare(
        `SELECT id, email, name, organization, password_hash AS passwordHash, password_salt AS passwordSalt,
                role, status, created_at AS createdAt, last_login_at AS lastLoginAt
         FROM users WHERE email = ? LIMIT 1`,
      )
      .bind(email)
      .first<{
        id: string;
        email: string;
        name: string;
        organization: string;
        passwordHash: string;
        passwordSalt: string;
        role: "citizen" | "operator" | "admin";
        status: "active" | "suspended";
        createdAt: number;
        lastLoginAt: number | null;
      }>();

    // A previous deployment could create the user before failing to create the
    // session. Re-submitting the same credentials safely resumes that account.
    if (existing) {
      const valid = await verifyPassword(password, existing.passwordHash, existing.passwordSalt);
      if (!valid) {
        return Response.json(
          { error: "An account with this email already exists. Use Sign in or enter the original password." },
          { status: 409, headers: timing(startedAt) },
        );
      }
      if (existing.status !== "active") {
        return Response.json({ error: "This account is suspended." }, { status: 403, headers: timing(startedAt) });
      }

      const session = await createSession(existing.id, request);
      await recordAudit(existing.id, "account.registration_resumed", "session", "", {});
      return Response.json(
        {
          user: {
            id: existing.id,
            email: existing.email,
            name: existing.name,
            organization: existing.organization,
            role: existing.role,
            status: existing.status,
            createdAt: Number(existing.createdAt),
            lastLoginAt: existing.lastLoginAt == null ? null : Number(existing.lastLoginAt),
          },
          ownerClaimed: existing.role === "admin",
          resumed: true,
        },
        {
          status: 200,
          headers: { ...timing(startedAt), "set-cookie": sessionCookie(session.token, session.expiresAt) },
        },
      );
    }

    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const auditId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + SESSION_TTL_MS;
    const rawToken = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    const tokenHash = await hashText(rawToken);
    const passwordHash = await createPasswordHash(password);
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const ipHash = await hashText(ip.split(",")[0].trim());
    const userAgent = cleanText(request.headers.get("user-agent"), 240);

    // D1 batch executes the registration writes as one transaction. This
    // prevents half-created accounts when session or audit storage fails.
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO users (id, email, name, organization, password_hash, password_salt, role, status, created_at, updated_at, last_login_at)
           VALUES (?, ?, ?, ?, ?, ?, 'citizen', 'active', ?, ?, ?)`,
        )
        .bind(userId, email, name, organization, passwordHash.hash, passwordHash.salt, now, now, now),
      db
        .prepare(
          `UPDATE users SET role = 'admin', updated_at = ?
           WHERE id = ? AND EXISTS (
             SELECT 1 FROM app_settings WHERE key = 'bootstrap_owner' AND value = 'open'
           )`,
        )
        .bind(now, userId),
      db
        .prepare(
          `UPDATE app_settings SET value = ?, updated_at = ?
           WHERE key = 'bootstrap_owner' AND value = 'open'`,
        )
        .bind(userId, now),
      db
        .prepare(
          `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at, user_agent, ip_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(sessionId, userId, tokenHash, expiresAt, now, now, userAgent, ipHash),
      db
        .prepare(
          `INSERT INTO audit_events (id, user_id, action, entity_type, entity_id, metadata, created_at)
           VALUES (?, ?, 'account.registered', 'user', ?, ?, ?)`,
        )
        .bind(auditId, userId, userId, JSON.stringify({ organization }).slice(0, 2000), now),
    ]);

    const ownerResult = results[1] as { meta?: { changes?: number } } | undefined;
    const ownerClaimed = Number(ownerResult?.meta?.changes ?? 0) === 1;
    const role = ownerClaimed ? "admin" : "citizen";

    return Response.json(
      {
        user: { id: userId, email, name, organization, role, status: "active", createdAt: now, lastLoginAt: now },
        ownerClaimed,
      },
      {
        status: 201,
        headers: { ...timing(startedAt), "set-cookie": sessionCookie(rawToken, expiresAt) },
      },
    );
  } catch (error) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const message = error instanceof Error ? error.message : "Registration failed";
    console.error("CivicLens registration failed", { requestId, message });
    if (message.includes("UNIQUE") || message.includes("unique")) {
      return Response.json(
        { error: "An account with this email already exists. Open Sign in and use the same password." },
        { status: 409, headers: timing(startedAt) },
      );
    }
    return Response.json(
      { error: `Account creation could not finish. Try again once. Reference: ${requestId}` },
      { status: 503, headers: timing(startedAt) },
    );
  }
}
