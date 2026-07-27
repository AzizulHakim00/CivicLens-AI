import { getDb } from "../../../db";
import { hazardReports } from "../../../db/schema";
import { ensureMultiUserSchema, rawD1 } from "../../../lib/auth";

const headers = {
  "cache-control": "no-store, max-age=0",
  "content-type": "application/json; charset=utf-8",
};

export async function GET() {
  const startedAt = Date.now();

  try {
    await ensureMultiUserSchema();
    const db = await getDb();
    await db.select({ id: hazardReports.id }).from(hazardReports).limit(1);
    const raw = await rawD1();
    const userCount = await raw.prepare("SELECT COUNT(*) AS total FROM users WHERE status = 'active'").first<{ total: number }>();
    const sessionCount = await raw.prepare("SELECT COUNT(*) AS total FROM sessions WHERE expires_at > ?").bind(Date.now()).first<{ total: number }>();

    return Response.json(
      {
        status: "ok",
        service: "civiclens-ai",
        version: "6.0",
        runtime: "cloudflare-workers",
        database: {
          status: "connected",
          latencyMs: Date.now() - startedAt,
        },
        multiuser: {
          status: "ready",
          activeUsers: Number(userCount?.total ?? 0),
          activeSessions: Number(sessionCount?.total ?? 0),
          roles: ["citizen", "operator", "admin"],
        },
        inference: {
          mode: "demo-adapter",
          productionWeightsConnected: false,
        },
        timestamp: new Date().toISOString(),
      },
      { headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health check failed";
    return Response.json(
      {
        status: "degraded",
        service: "civiclens-ai",
        version: "6.0",
        runtime: "cloudflare-workers",
        database: {
          status: "unavailable",
          latencyMs: Date.now() - startedAt,
        },
        multiuser: {
          status: "unavailable",
        },
        inference: {
          mode: "demo-adapter",
          productionWeightsConnected: false,
        },
        error: message.includes("no such table") ? "Database migration is pending." : "Database check failed.",
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers },
    );
  }
}
