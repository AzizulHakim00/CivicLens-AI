import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const hazardReports = sqliteTable("hazard_reports", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  confidence: integer("confidence").notNull(),
  location: text("location").notNull(),
  area: text("area").notNull(),
  status: text("status").notNull().default("Reported"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  coverage: integer("coverage").notNull().default(0),
  nearbyReports: integer("nearby_reports").notNull().default(1),
  assignedTeam: text("assigned_team").notNull().default("Unassigned"),
  source: text("source").notNull().default("Citizen"),
  slaMinutes: integer("sla_minutes").notNull().default(240),
  priorityScore: integer("priority_score").notNull().default(50),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`0`)
    .$defaultFn(() => new Date()),
});

export const statusHistory = sqliteTable("status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reportId: text("report_id")
    .notNull()
    .references(() => hazardReports.id),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  actor: text("actor").notNull().default("City operator"),
  note: text("note").notNull().default("Workflow updated"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
