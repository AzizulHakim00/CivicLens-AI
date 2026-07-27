import {
  authBlocked,
  authFingerprint,
  clearAuthFailures,
  cleanText,
  createSession,
  normalizeEmail,
  rawD1,
  recordAudit,
  recordAuthFailure,
  sameOrigin,
  sessionCookie,
  verifyPassword,
} from "../../../../lib/auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 16_384) return Response.json({ error: "Payload is too large." }, { status: 413 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return Response.json({ error: "Email and password are required." }, { status: 400 });

    const fingerprint = await authFingerprint(request, email);
    const blockedUntil = await authBlocked(fingerprint);
    if (blockedUntil) {
      const retryAfter = Math.max(1, Math.ceil((blockedUntil - Date.now()) / 1000));
      return Response.json(
        { error: "Too many sign-in attempts. Try again later." },
        { status: 429, headers: { "retry-after": String(retryAfter) } },
      );
    }

    const db = await rawD1();
    const user = await db
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

    const valid = user ? await verifyPassword(password, user.passwordHash, user.passwordSalt) : false;
    if (!valid || !user || user.status !== "active") {
      await recordAuthFailure(fingerprint);
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await clearAuthFailures(fingerprint);
    const now = Date.now();
    await db.prepare("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?").bind(now, now, user.id).run();
    const session = await createSession(user.id, request);
    await recordAudit(user.id, "account.login", "session", "", { userAgent: cleanText(request.headers.get("user-agent"), 120) });

    return Response.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organization: user.organization,
          role: user.role,
          status: user.status,
          createdAt: Number(user.createdAt),
          lastLoginAt: now,
        },
      },
      { headers: { "set-cookie": sessionCookie(session.token, session.expiresAt) } },
    );
  } catch {
    return Response.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
