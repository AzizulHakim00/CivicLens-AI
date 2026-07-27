import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { hazardReports, statusHistory } from "../../../db/schema";
import {
  canOperate,
  cleanText,
  createNotification,
  getCurrentUser,
  rawD1,
  recordAudit,
  sameOrigin,
} from "../../../lib/auth";

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
    return "Database migration is pending. Multi-user tables will be initialized automatically on the next authenticated request.";
  }
  return "Report storage is temporarily unavailable.";
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    if (user.role === "citizen") {
      const db = await rawD1();
      const result = await db
        .prepare(
          `SELECT h.id, h.type, h.severity, h.confidence, h.location, h.area, h.status,
                  h.latitude, h.longitude, h.coverage, h.nearby_reports AS nearbyReports,
                  h.assigned_team AS assignedTeam, h.source, h.sla_minutes AS slaMinutes,
                  h.priority_score AS priorityScore, h.created_at AS createdAt, h.updated_at AS updatedAt
           FROM hazard_reports h
           JOIN report_ownership o ON o.report_id = h.id
           WHERE o.user_id = ?
           ORDER BY h.created_at DESC LIMIT 100`,
        )
        .bind(user.id)
        .all<Record<string, unknown>>();
      return Response.json({ reports: result.results ?? [], scope: "owned" });
    }
    const db = await getDb();
    const reports = await db.select().from(hazardReports).orderBy(desc(hazardReports.createdAt)).limit(250);
    return Response.json({ reports, scope: "authority" });
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

    if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });

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

    const raw = await rawD1();
    await raw
      .prepare("INSERT INTO report_ownership (report_id, user_id, visibility, created_at) VALUES (?, ?, 'authority', ?)")
      .bind(id, user.id, Date.now())
      .run();
    await recordAudit(user.id, "report.created", "hazard_report", id, { type, severity, area, source });
    await createNotification(user.id, "Report submitted", `${id} was securely stored and sent to the authority workflow.`, "success");

    return Response.json({ report, owner: { id: user.id, name: user.name } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 16_384) {
      return Response.json({ error: "Payload is too large." }, { status: 413 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const id = clean(body.id, 24);
    if (!/^CL-\d{4,8}$/.test(id)) {
      return Response.json({ error: "A valid report ID is required." }, { status: 400 });
    }

    if (!sameOrigin(request)) return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
    const user = await getCurrentUser(request);
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
    if (!canOperate(user)) return Response.json({ error: "Operator or administrator access required." }, { status: 403 });

    const db = await getDb();
    const [existing] = await db.select().from(hazardReports).where(eq(hazardReports.id, id)).limit(1);
    if (!existing) {
      return Response.json({ error: "Hazard report not found." }, { status: 404 });
    }

    const nextStatus = body.status === undefined ? existing.status : clean(body.status, 24);
    const nextTeam = body.assignedTeam === undefined ? existing.assignedTeam : clean(body.assignedTeam, 80);
    const nextSla = body.slaMinutes === undefined ? existing.slaMinutes : Math.round(Number(body.slaMinutes));

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
        actor: cleanText(user.name, 80) || "City operator",
        note: clean(body.note, 180) || "Workflow updated from the authority console",
      });
    }

    await recordAudit(user.id, "report.workflow.updated", "hazard_report", id, {
      fromStatus: existing.status,
      toStatus: nextStatus,
      fromTeam: existing.assignedTeam,
      toTeam: nextTeam,
      slaMinutes: nextSla,
    });

    const raw = await rawD1();
    const owner = await raw
      .prepare("SELECT user_id AS userId FROM report_ownership WHERE report_id = ? LIMIT 1")
      .bind(id)
      .first<{ userId: string }>();
    if (owner?.userId) {
      await createNotification(
        owner.userId,
        nextStatus !== existing.status ? `Report moved to ${nextStatus}` : "Report assignment updated",
        `${id} is assigned to ${nextTeam}.`,
        nextStatus === "Resolved" ? "success" : "workflow",
      );
    }

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: databaseError(error) }, { status: 503 });
  }
}
