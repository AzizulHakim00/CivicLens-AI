import {
  claimBootstrapOwner,
  cleanText,
  createPasswordHash,
  createSession,
  ensureMultiUserSchema,
  normalizeEmail,
  rawD1,
  recordAudit,
  sameOrigin,
  sessionCookie,
  validEmail,
  validPassword,
} from "../../../../lib/auth";

export async function POST(request: Request) {
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
        { status: 400 },
      );
    }

    await ensureMultiUserSchema();
    const db = await rawD1();
    const existing = await db.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").bind(email).first<{ id: string }>();
    if (existing) return Response.json({ error: "An account with this email already exists." }, { status: 409 });

    const userId = crypto.randomUUID();
    const now = Date.now();
    const passwordHash = await createPasswordHash(password);
    await db
      .prepare(
        `INSERT INTO users (id, email, name, organization, password_hash, password_salt, role, status, created_at, updated_at, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, 'citizen', 'active', ?, ?, ?)`,
      )
      .bind(userId, email, name, organization, passwordHash.hash, passwordHash.salt, now, now, now)
      .run();

    const ownerClaimed = await claimBootstrapOwner(userId);
    const role = ownerClaimed ? "admin" : "citizen";
    const session = await createSession(userId, request);
    await recordAudit(userId, "account.registered", "user", userId, { role, organization });

    return Response.json(
      {
        user: { id: userId, email, name, organization, role, status: "active", createdAt: now, lastLoginAt: now },
        ownerClaimed,
      },
      { status: 201, headers: { "set-cookie": sessionCookie(session.token, session.expiresAt) } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    if (message.includes("UNIQUE") || message.includes("unique")) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return Response.json({ error: "Account registration is temporarily unavailable." }, { status: 503 });
  }
}
