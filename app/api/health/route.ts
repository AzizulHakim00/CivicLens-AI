import { getDb } from "../../../db";
import { hazardReports } from "../../../db/schema";

const headers = {
  "cache-control": "no-store, max-age=0",
  "content-type": "application/json; charset=utf-8",
};

export async function GET() {
  const startedAt = Date.now();

  try {
    const db = await getDb();
    await db.select({ id: hazardReports.id }).from(hazardReports).limit(1);

    return Response.json(
      {
        status: "ok",
        service: "civiclens-ai",
        version: "3.0",
        runtime: "cloudflare-workers",
        database: {
          status: "connected",
          latencyMs: Date.now() - startedAt,
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
        version: "3.0",
        runtime: "cloudflare-workers",
        database: {
          status: "unavailable",
          latencyMs: Date.now() - startedAt,
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
