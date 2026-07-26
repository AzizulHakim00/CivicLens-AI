import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { hazardReports, statusHistory } from "../../../db/schema";

const allowedTypes = new Set([
  "Pothole",
  "Plastic waste",
  "Waterlogging",
  "Open manhole",
  "Broken road",
  "Illegal dumping",
  "Traffic obstruction",
  "Damaged streetlight",
]);
const allowedSeverity = new Set(["Critical", "High", "Medium", "Low"]);
const allowedStatus = new Set(["Reported", "Investigating", "Resolved"]);
const allowedSources = new Set(["Citizen", "Dashcam", "CCTV", "Drone"]);

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected database error";
  if (message.includes("no such table")) {
    return "Database migration is pending. Deploy the generated migration with the site.";
  }
  return "Report storage is temporarily unavailable.";
}

export async function GET() {
  try {
    const db = await getDb();
    const reports = await db.select().from(hazardReports).orderBy(desc(hazardReports.createdAt)).limit(100);
    return Response.json({ reports });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 16_384) {
      return Response.json({ error: "Payload is too large." }, { status: 413 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const id = clean(body.id, 24);
    const type = clean(body.type, 32);
    const severity = clean(body.severity, 16);
    const location = clean(body.location, 160);
    const area = clean(body.area, 80);
    const status = clean(body.status, 24) || "Reported";
    const confidence = Math.round(Number(body.confidence));
    const coverage = Math.round(Number(body.coverage ?? 0));
    const nearbyReports = Math.round(Number(body.reports ?? 1));
    const assignedTeam = clean(body.assignedTeam, 80) || "Unassigned";
    const source = clean(body.source, 24) || "Citizen";
    const slaMinutes = Math.round(Number(body.slaMinutes ?? 240));
    const priorityScore = Math.round(Number(body.priorityScore ?? (severity === "Critical" ? 95 : severity === "High" ? 78 : 55)));

    if (
      !/^CL-\d{4,8}$/.test(id) ||
      !allowedTypes.has(type) ||
      !allowedSeverity.has(severity) ||
      !allowedStatus.has(status) ||
      !allowedSources.has(source) ||
      !location ||
      !area ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 100 ||
      !Number.isFinite(slaMinutes) ||
      !Number.isFinite(priorityScore)
    ) {
      return Response.json({ error: "Invalid hazard report." }, { status: 400 });
    }

    const db = await getDb();
    const [report] = await db
      .insert(hazardReports)
      .values({
        id,
        type,
        severity,
        confidence,
        location,
        area,
        status,
        coverage: Math.min(100, Math.max(0, coverage)),
        nearbyReports: Math.min(999, Math.max(1, nearbyReports)),
        assignedTeam,
        source,
        slaMinutes: Math.min(10_080, Math.max(0, slaMinutes)),
        priorityScore: Math.min(100, Math.max(0, priorityScore)),
      })
      .onConflictDoNothing()
      .returning();

    if (!report) {
      return Response.json({ error: "A report with this ID already exists." }, { status: 409 });
    }

    return Response.json({ report }, { status: 201 });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = clean(body.id, 24);
    if (!/^CL-\d{4,8}$/.test(id)) {
      return Response.json({ error: "A valid report ID is required." }, { status: 400 });
    }

    const db = await getDb();
    const [existing] = await db.select().from(hazardReports).where(eq(hazardReports.id, id)).limit(1);
    if (!existing) {
      return Response.json({ error: "Hazard report not found." }, { status: 404 });
    }

    const nextStatus = body.status === undefined ? existing.status : clean(body.status, 24);
    const nextTeam = body.assignedTeam === undefined ? existing.assignedTeam : clean(body.assignedTeam, 80);
    const nextSla =
      body.slaMinutes === undefined ? existing.slaMinutes : Math.round(Number(body.slaMinutes));

    if (
      !allowedStatus.has(nextStatus) ||
      !nextTeam ||
      !Number.isFinite(nextSla) ||
      nextSla < 0 ||
      nextSla > 10_080
    ) {
      return Response.json({ error: "Invalid workflow update." }, { status: 400 });
    }

    const [report] = await db
      .update(hazardReports)
      .set({
        status: nextStatus,
        assignedTeam: nextTeam,
        slaMinutes: nextSla,
        updatedAt: new Date(),
      })
      .where(eq(hazardReports.id, id))
      .returning();

    if (nextStatus !== existing.status) {
      await db.insert(statusHistory).values({
        reportId: id,
        fromStatus: existing.status,
        toStatus: nextStatus,
        actor: clean(body.actor, 80) || "City operator",
        note: clean(body.note, 180) || "Workflow updated from the authority console",
      });
    }

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 503 });
  }
}
