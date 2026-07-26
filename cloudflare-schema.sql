PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS hazard_reports (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  location TEXT NOT NULL,
  area TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Reported',
  latitude REAL,
  longitude REAL,
  coverage INTEGER NOT NULL DEFAULT 0,
  nearby_reports INTEGER NOT NULL DEFAULT 1,
  assigned_team TEXT NOT NULL DEFAULT 'Unassigned',
  source TEXT NOT NULL DEFAULT 'Citizen',
  sla_minutes INTEGER NOT NULL DEFAULT 240,
  priority_score INTEGER NOT NULL DEFAULT 50,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  report_id TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'City operator',
  note TEXT NOT NULL DEFAULT 'Workflow updated',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (report_id) REFERENCES hazard_reports(id)
);

CREATE INDEX IF NOT EXISTS idx_hazard_reports_created_at
  ON hazard_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_hazard_reports_status
  ON hazard_reports(status);

CREATE INDEX IF NOT EXISTS idx_status_history_report_id
  ON status_history(report_id);
