import { cleanText, getCurrentUser, rawD1, recordAudit, sameOrigin } from "../../../../lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ user: null }, { status: 401 });
    const db = await rawD1();
    const stats = await db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM report_ownership WHERE user_id = ?) AS ownedReports,
          (SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL) AS unreadNotifications,
          (SELECT COUNT(*) FROM team_members WHERE user_id = ?) AS teamCount`,
      )
      .bind(user.id, user.id, user.id)
      .first<{ ownedReports: number; unreadNotifications: number; teamCount: number }>();
    return Response.json({
      user,
      capabilities: {
        createReports: true,
        manageWorkflow: user.role === "operator" || user.role === "admin",
        manageUsers: user.role === "admin",
        manageTeams: user.role === "admin",
      },
      stats: {
        ownedReports: Number(stats?.ownedReports ?? 0),
        unreadNotifications: Number(stats?.unreadNotifications ?? 0),
        teamCount: Number(stats?.teamCount ?? 0),
      },
    });
  } catch {
    return Response.json({ error: "Session validation failed." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    const body = (await request.json()) as Record<string, unknown>;
    const name = cleanText(body.name, 90);
    const organization = cleanText(body.organization, 120);
    if (name.length < 2) return Response.json({ error: "A valid name is required." }, { status: 400 });
    const db = await rawD1();
    await db.prepare("UPDATE users SET name = ?, organization = ?, updated_at = ? WHERE id = ?").bind(name, organization, Date.now(), user.id).run();
    await recordAudit(user.id, "profile.updated", "user", user.id, { organization });
    return Response.json({ user: { ...user, name, organization } });
  } catch {
    return Response.json({ error: "Profile update failed." }, { status: 503 });
  }
}
