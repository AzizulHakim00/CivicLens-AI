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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
