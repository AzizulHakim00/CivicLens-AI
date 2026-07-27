import { cleanText, getCurrentUser, rawD1, recordAudit, sameOrigin } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    const db = await rawD1();
    const query =
      user.role === "admin"
        ? `SELECT t.id, t.name, t.description, t.status, t.created_at AS createdAt,
                  COUNT(tm.user_id) AS memberCount
           FROM teams t LEFT JOIN team_members tm ON tm.team_id = t.id
           GROUP BY t.id ORDER BY t.name ASC`
        : `SELECT t.id, t.name, t.description, t.status, t.created_at AS createdAt,
                  COUNT(all_members.user_id) AS memberCount
           FROM teams t
           JOIN team_members mine ON mine.team_id = t.id AND mine.user_id = ?
           LEFT JOIN team_members all_members ON all_members.team_id = t.id
           GROUP BY t.id ORDER BY t.name ASC`;
    const statement = db.prepare(query);
    const result = user.role === "admin" ? await statement.all<Record<string, unknown>>() : await statement.bind(user.id).all<Record<string, unknown>>();
    return Response.json({ teams: result.results ?? [] });
  } catch {
    return Response.json({ error: "Team directory is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Administrator access required." }, { status: 403 });
    const body = (await request.json()) as Record<string, unknown>;
    const name = cleanText(body.name, 80);
    const description = cleanText(body.description, 240);
    if (name.length < 2) return Response.json({ error: "A valid team name is required." }, { status: 400 });
    const db = await rawD1();
    const id = crypto.randomUUID();
    const now = Date.now();
    await db
      .prepare("INSERT INTO teams (id, name, description, status, created_by, created_at) VALUES (?, ?, ?, 'active', ?, ?)")
      .bind(id, name, description, user.id, now)
      .run();
    await db
      .prepare("INSERT OR IGNORE INTO team_members (team_id, user_id, membership_role, created_at) VALUES (?, ?, 'lead', ?)")
      .bind(id, user.id, now)
      .run();
    await recordAudit(user.id, "team.created", "team", id, { name });
    return Response.json({ team: { id, name, description, status: "active", createdAt: now, memberCount: 1 } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE") || message.includes("unique")) return Response.json({ error: "A team with this name already exists." }, { status: 409 });
    return Response.json({ error: "Team creation failed." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Administrator access required." }, { status: 403 });
    const body = (await request.json()) as Record<string, unknown>;
    const teamId = cleanText(body.teamId, 80);
    const userId = cleanText(body.userId, 80);
    const action = cleanText(body.action, 30);
    if (!teamId || !userId || !["add", "remove"].includes(action)) {
      return Response.json({ error: "A valid team membership update is required." }, { status: 400 });
    }
    const db = await rawD1();
    const team = await db.prepare("SELECT id FROM teams WHERE id = ? LIMIT 1").bind(teamId).first<{ id: string }>();
    const member = await db.prepare("SELECT id FROM users WHERE id = ? AND status = 'active' LIMIT 1").bind(userId).first<{ id: string }>();
    if (!team || !member) return Response.json({ error: "Team or user not found." }, { status: 404 });
    if (action === "add") {
      await db
        .prepare("INSERT OR IGNORE INTO team_members (team_id, user_id, membership_role, created_at) VALUES (?, ?, 'member', ?)")
        .bind(teamId, userId, Date.now())
        .run();
    } else {
      await db.prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ?").bind(teamId, userId).run();
    }
    await recordAudit(user.id, `team.member.${action}`, "team", teamId, { memberUserId: userId });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Team membership update failed." }, { status: 503 });
  }
}
