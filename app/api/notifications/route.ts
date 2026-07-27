import { getCurrentUser, rawD1, sameOrigin } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    const db = await rawD1();
    const result = await db
      .prepare(
        `SELECT id, title, message, kind, read_at AS readAt, created_at AS createdAt
         FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 40`,
      )
      .bind(user.id)
      .all<Record<string, unknown>>();
    return Response.json({ notifications: result.results ?? [] });
  } catch {
    return Response.json({ error: "Notifications are temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim().slice(0, 80) : "all";
    const db = await rawD1();
    const now = Date.now();
    if (id === "all") {
      await db.prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL").bind(now, user.id).run();
    } else {
      await db.prepare("UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?").bind(now, id, user.id).run();
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Notification update failed." }, { status: 503 });
  }
}
