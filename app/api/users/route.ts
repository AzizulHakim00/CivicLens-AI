import { getCurrentUser, rawD1, recordAudit, sameOrigin } from "../../../lib/auth";

const allowedRoles = new Set(["citizen", "operator", "admin"]);
const allowedStatuses = new Set(["active", "suspended"]);

export async function GET(request: Request) {
  try {
    const current = await getCurrentUser(request);
    if (!current) return Response.json({ error: "Authentication required." }, { status: 401 });
    if (current.role !== "admin") return Response.json({ error: "Administrator access required." }, { status: 403 });
    const db = await rawD1();
    const result = await db
      .prepare(
        `SELECT u.id, u.email, u.name, u.organization, u.role, u.status,
                u.created_at AS createdAt, u.last_login_at AS lastLoginAt,
                COUNT(DISTINCT ro.report_id) AS reportCount,
                COUNT(DISTINCT tm.team_id) AS teamCount
         FROM users u
         LEFT JOIN report_ownership ro ON ro.user_id = u.id
         LEFT JOIN team_members tm ON tm.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT 250`,
      )
      .all<Record<string, unknown>>();
    return Response.json({ users: result.results ?? [] });
  } catch {
    return Response.json({ error: "User directory is temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
  try {
    const current = await getCurrentUser(request);
    if (!current) return Response.json({ error: "Authentication required." }, { status: 401 });
    if (current.role !== "admin") return Response.json({ error: "Administrator access required." }, { status: 403 });
    const body = (await request.json()) as Record<string, unknown>;
    const userId = typeof body.userId === "string" ? body.userId.trim().slice(0, 80) : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";
    if (!userId || !allowedRoles.has(role) || !allowedStatuses.has(status)) {
      return Response.json({ error: "A valid user, role, and status are required." }, { status: 400 });
    }
    if (userId === current.id && (role !== "admin" || status !== "active")) {
      return Response.json({ error: "You cannot remove your own active administrator access." }, { status: 409 });
    }

    const db = await rawD1();
    const existing = await db
      .prepare("SELECT id, role, status FROM users WHERE id = ? LIMIT 1")
      .bind(userId)
      .first<{ id: string; role: string; status: string }>();
    if (!existing) return Response.json({ error: "User not found." }, { status: 404 });

    if (existing.role === "admin" && existing.status === "active" && (role !== "admin" || status !== "active")) {
      const count = await db
        .prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND status = 'active'")
        .first<{ total: number }>();
      if (Number(count?.total ?? 0) <= 1) {
        return Response.json({ error: "At least one active administrator must remain." }, { status: 409 });
      }
    }

    const now = Date.now();
    await db.prepare("UPDATE users SET role = ?, status = ?, updated_at = ? WHERE id = ?").bind(role, status, now, userId).run();
    if (status === "suspended") await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
    await recordAudit(current.id, "user.access.updated", "user", userId, {
      fromRole: existing.role,
      toRole: role,
      fromStatus: existing.status,
      toStatus: status,
    });
    return Response.json({ user: { id: userId, role, status } });
  } catch {
    return Response.json({ error: "User access update failed." }, { status: 503 });
  }
}
