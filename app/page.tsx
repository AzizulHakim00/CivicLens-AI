"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Boxes,
  Building2,
  CalendarClock,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CloudRain,
  Clock3,
  Construction,
  Cpu,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  FlaskConical,
  Gauge,
  GitBranch,
  HardHat,
  Layers3,
  ListChecks,
  LocateFixed,
  Map,
  MapPin,
  MapPinned,
  Menu,
  Milestone,
  Navigation,
  Pause,
  Play,
  Plus,
  Radio,
  Recycle,
  Route,
  ScanSearch,
  Search,
  Send,
  Server,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Target,
  Timer,
  TrafficCone,
  TrendingUp,
  UploadCloud,
  UserCheck,
  Users,
  Waves,
  Workflow,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type HazardType =
  | "Pothole"
  | "Plastic waste"
  | "Waterlogging"
  | "Open manhole"
  | "Broken road"
  | "Illegal dumping"
  | "Traffic obstruction"
  | "Damaged streetlight";
type Severity = "Critical" | "High" | "Medium" | "Low";
type ReportStatus = "Reported" | "Investigating" | "Resolved";
type View = "overview" | "reports" | "analytics" | "roads" | "model" | "authority";

const hazardTypes: HazardType[] = [
  "Pothole",
  "Plastic waste",
  "Waterlogging",
  "Open manhole",
  "Broken road",
  "Illegal dumping",
  "Traffic obstruction",
  "Damaged streetlight",
];

type HazardReport = {
  id: string;
  type: HazardType;
  severity: Severity;
  confidence: number;
  location: string;
  area: string;
  time: string;
  status: ReportStatus;
  x: number;
  y: number;
  reports: number;
  coverage: number;
  assignedTeam: string;
  slaMinutes: number;
  source: "Citizen" | "Dashcam" | "CCTV" | "Drone";
};

const seedReports: HazardReport[] = [
  {
    id: "CL-2841",
    type: "Pothole",
    severity: "Critical",
    confidence: 97,
    location: "Mirpur Road, near Science Lab",
    area: "Dhanmondi",
    time: "8 min ago",
    status: "Reported",
    x: 48,
    y: 45,
    reports: 7,
    coverage: 34,
    assignedTeam: "Road Alpha",
    slaMinutes: 42,
    source: "Dashcam",
  },
  {
    id: "CL-2839",
    type: "Waterlogging",
    severity: "High",
    confidence: 94,
    location: "Kazi Nazrul Islam Avenue",
    area: "Karwan Bazar",
    time: "19 min ago",
    status: "Investigating",
    x: 65,
    y: 25,
    reports: 4,
    coverage: 28,
    assignedTeam: "Drainage 2",
    slaMinutes: 118,
    source: "CCTV",
  },
  {
    id: "CL-2836",
    type: "Plastic waste",
    severity: "Medium",
    confidence: 91,
    location: "Road 27, Banani",
    area: "Banani",
    time: "32 min ago",
    status: "Reported",
    x: 76,
    y: 52,
    reports: 3,
    coverage: 18,
    assignedTeam: "Clean City 4",
    slaMinutes: 204,
    source: "Citizen",
  },
  {
    id: "CL-2831",
    type: "Open manhole",
    severity: "High",
    confidence: 96,
    location: "Satmasjid Road",
    area: "Mohammadpur",
    time: "1 hr ago",
    status: "Investigating",
    x: 30,
    y: 67,
    reports: 5,
    coverage: 22,
    assignedTeam: "Rapid Works",
    slaMinutes: 61,
    source: "Citizen",
  },
  {
    id: "CL-2827",
    type: "Pothole",
    severity: "Low",
    confidence: 88,
    location: "Gulshan Avenue",
    area: "Gulshan",
    time: "2 hr ago",
    status: "Resolved",
    x: 69,
    y: 73,
    reports: 2,
    coverage: 9,
    assignedTeam: "Road Beta",
    slaMinutes: 0,
    source: "Drone",
  },
  {
    id: "CL-2824",
    type: "Damaged streetlight",
    severity: "Medium",
    confidence: 90,
    location: "Airport Road, Nikunja",
    area: "Khilkhet",
    time: "3 hr ago",
    status: "Reported",
    x: 84,
    y: 34,
    reports: 2,
    coverage: 12,
    assignedTeam: "Electrical 1",
    slaMinutes: 236,
    source: "CCTV",
  },
  {
    id: "CL-2818",
    type: "Illegal dumping",
    severity: "High",
    confidence: 93,
    location: "Beribadh Road",
    area: "Gabtoli",
    time: "4 hr ago",
    status: "Investigating",
    x: 20,
    y: 31,
    reports: 6,
    coverage: 31,
    assignedTeam: "Clean City 2",
    slaMinutes: 97,
    source: "Drone",
  },
];

const riskAreas = [
  { name: "Dhanmondi", score: 86, incidents: 43, trend: "+12%", color: "#f24e64" },
  { name: "Mohammadpur", score: 72, incidents: 35, trend: "+8%", color: "#ff9f43" },
  { name: "Karwan Bazar", score: 61, incidents: 28, trend: "-4%", color: "#ffc857" },
  { name: "Banani", score: 44, incidents: 19, trend: "-11%", color: "#24cfa3" },
];

function TypeIcon({ type, size = 16 }: { type: HazardType; size?: number }) {
  if (type === "Pothole") return <CircleDot size={size} />;
  if (type === "Plastic waste") return <Recycle size={size} />;
  if (type === "Waterlogging") return <Waves size={size} />;
  if (type === "Open manhole") return <AlertTriangle size={size} />;
  if (type === "Broken road") return <Construction size={size} />;
  if (type === "Illegal dumping") return <Boxes size={size} />;
  if (type === "Traffic obstruction") return <TrafficCone size={size} />;
  return <Zap size={size} />;
}

function SeverityPill({ severity }: { severity: Severity }) {
  return <span className={`severity severity-${severity.toLowerCase()}`}>{severity}</span>;
}

function StatusPill({ status }: { status: ReportStatus }) {
  return (
    <span className={`status-pill status-${status.toLowerCase()}`}>
      <span />
      {status}
    </span>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [reports, setReports] = useState(seedReports);
  const [selected, setSelected] = useState<HazardReport>(seedReports[0]);
  const [typeFilter, setTypeFilter] = useState<"All" | HazardType>("All");
  const [severityFilter, setSeverityFilter] = useState<"All" | Severity>("All");
  const [search, setSearch] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState("");

  const viewMeta: Record<View, { title: string; description: string }> = {
    overview: {
      title: "Urban hazard intelligence",
      description: "Monitor, verify and resolve road risks with explainable AI.",
    },
    reports: {
      title: "Hazard report center",
      description: `${reports.length} verified signals across the city network.`,
    },
    analytics: {
      title: "City risk analytics",
      description: "Decision-ready patterns from field reports and model detections.",
    },
    roads: {
      title: "Road intelligence",
      description: "Predict corridor risk, plan maintenance and protect mobility.",
    },
    model: {
      title: "AI model operations",
      description: "Inspect data quality, drift, thresholds and deployment readiness.",
    },
    authority: {
      title: "Authority command center",
      description: "Assign teams, manage SLA risk and coordinate field resolution.",
    },
  };

  const filteredReports = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reports.filter(
      (report) =>
        (typeFilter === "All" || report.type === typeFilter) &&
        (severityFilter === "All" || report.severity === severityFilter) &&
        (!needle ||
          report.location.toLowerCase().includes(needle) ||
          report.area.toLowerCase().includes(needle) ||
          report.id.toLowerCase().includes(needle)),
    );
  }, [reports, search, severityFilter, typeFilter]);

  useEffect(() => {
    let active = true;
    fetch("/api/reports")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: { reports?: Array<Record<string, unknown>> }) => {
        if (!active || !payload.reports?.length) return;
        const stored = payload.reports.map((row, index): HazardReport => {
          const id = String(row.id ?? `CL-${2900 + index}`);
          const hash = id.split("").reduce((sum, value) => sum + value.charCodeAt(0), 0);
          return {
            id,
            type: String(row.type ?? "Pothole") as HazardType,
            severity: String(row.severity ?? "Medium") as Severity,
            confidence: Number(row.confidence ?? 90),
            location: String(row.location ?? "Dhaka"),
            area: String(row.area ?? "Dhaka"),
            time: "Stored report",
            status: String(row.status ?? "Reported") as ReportStatus,
            x: 18 + (hash % 68),
            y: 18 + ((hash * 7) % 62),
            reports: Number(row.nearbyReports ?? 1),
            coverage: Number(row.coverage ?? 10),
            assignedTeam: String(row.assignedTeam ?? "Unassigned"),
            slaMinutes: Number(row.slaMinutes ?? 240),
            source: String(row.source ?? "Citizen") as HazardReport["source"],
          };
        });
        setReports((current) => {
          const storedIds = new Set(stored.map((report) => report.id));
          return [...stored, ...current.filter((report) => !storedIds.has(report.id))];
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const updateStatus = (id: string) => {
    const current = reports.find((report) => report.id === id);
    if (!current) return;
    const next: ReportStatus =
      current.status === "Reported"
        ? "Investigating"
        : current.status === "Investigating"
          ? "Resolved"
          : "Reported";
    setReports((items) => items.map((item) => (item.id === id ? { ...item, status: next } : item)));
    setSelected({ ...current, status: next });
    fetch("/api/reports", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    }).catch(() => undefined);
    notify(`${id} moved to ${next}`);
  };

  const assignTeam = (id: string, assignedTeam: string) => {
    setReports((items) => items.map((item) => (item.id === id ? { ...item, assignedTeam } : item)));
    if (selected.id === id) setSelected((current) => ({ ...current, assignedTeam }));
    fetch("/api/reports", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, assignedTeam }),
    }).catch(() => undefined);
    notify(`${assignedTeam} assigned to ${id}`);
  };

  const exportCsv = () => {
    const rows = [
      ["ID", "Type", "Severity", "Confidence", "Location", "Area", "Status"],
      ...reports.map((report) => [
        report.id,
        report.type,
        report.severity,
        `${report.confidence}%`,
        report.location,
        report.area,
        report.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "civiclens-hazard-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    notify("CSV report downloaded");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setShowMobileNav((open) => !open)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <a className="brand" href="#" aria-label="CivicLens AI home">
          <span className="brand-mark">
            <Eye size={20} />
            <i />
          </span>
          <span>
            CivicLens <b>AI</b>
            <small>Urban Intelligence</small>
          </span>
        </a>
        <nav className={`main-nav ${showMobileNav ? "mobile-open" : ""}`} aria-label="Primary navigation">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>
            Overview
          </button>
          <button className={view === "reports" ? "active" : ""} onClick={() => setView("reports")}>
            Reports
          </button>
          <button className={view === "analytics" ? "active" : ""} onClick={() => setView("analytics")}>
            Analytics
          </button>
        </nav>
        <div className="top-actions">
          <div className="system-live">
            <span />
            AI systems operational
          </div>
          <button
            className="icon-button"
            aria-label="Notifications"
            aria-expanded={showNotifications}
            onClick={() => setShowNotifications((open) => !open)}
          >
            <Bell size={18} />
            <i>3</i>
          </button>
          <div className="profile">
            <span>AH</span>
            <div>
              <strong>Azizul Hakim</strong>
              <small>City operator</small>
            </div>
            <ChevronDown size={14} />
          </div>
        </div>
        {showNotifications && (
          <div className="notification-popover">
            <div>
              <strong>Operations alerts</strong>
              <button onClick={() => setShowNotifications(false)} aria-label="Close notifications">
                <X size={15} />
              </button>
            </div>
            <button onClick={() => { setView("authority"); setShowNotifications(false); }}>
              <span className="alert-icon critical"><Siren size={15} /></span>
              <span><strong>Critical SLA risk</strong><small>CL-2841 has 42 minutes remaining</small></span>
            </button>
            <button onClick={() => { setView("roads"); setShowNotifications(false); }}>
              <span className="alert-icon high"><CloudRain size={15} /></span>
              <span><strong>Flood-risk corridor</strong><small>Kazi Nazrul Avenue risk increased 18%</small></span>
            </button>
            <button onClick={() => { setView("model"); setShowNotifications(false); }}>
              <span className="alert-icon medium"><Cpu size={15} /></span>
              <span><strong>Model drift watch</strong><small>Night-scene confidence is below target</small></span>
            </button>
          </div>
        )}
      </header>

      <aside className="sidebar">
        <div className="side-label">Workspace</div>
        <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>
          <Map size={18} />
          Live overview
        </button>
        <button className={view === "reports" ? "active" : ""} onClick={() => setView("reports")}>
          <FileText size={18} />
          Hazard reports
          <em>{reports.filter((report) => report.status === "Reported").length}</em>
        </button>
        <button className={view === "analytics" ? "active" : ""} onClick={() => setView("analytics")}>
          <BarChart3 size={18} />
          City analytics
        </button>
        <button className={view === "roads" ? "active" : ""} onClick={() => setView("roads")}>
          <Route size={18} />
          Road intelligence
        </button>
        <div className="side-label spaced">System</div>
        <button className={view === "model" ? "active" : ""} onClick={() => setView("model")}>
          <Bot size={18} />
          AI model
          <span className="live-dot" />
        </button>
        <button className={view === "authority" ? "active" : ""} onClick={() => setView("authority")}>
          <ShieldCheck size={18} />
          Authority console
        </button>
        <div className="sidebar-card">
          <span className="spark-icon">
            <Sparkles size={16} />
          </span>
          <strong>Civic impact</strong>
          <p>328 hazards resolved this month</p>
          <div>
            <span style={{ width: "78%" }} />
          </div>
          <small>78% monthly target</small>
        </div>
        <div className="sidebar-foot">
          <span>CL</span>
          <div>
            <strong>CivicLens v2.0</strong>
            <small>8-class platform</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <span /> LIVE CITY PULSE · DHAKA
            </p>
            <h1>{viewMeta[view].title}</h1>
            <p>{viewMeta[view].description}</p>
          </div>
          <div className="head-actions">
            <button className="secondary-button" onClick={exportCsv}>
              <Download size={16} /> Export report
            </button>
            <button className="primary-button" onClick={() => setShowReport(true)}>
              <Plus size={17} /> Report a hazard
            </button>
          </div>
        </div>

        {view === "overview" && (
          <>
            <section className="stat-grid">
              <article>
                <div className="stat-top">
                  <span className="stat-icon coral">
                    <AlertTriangle size={19} />
                  </span>
                  <span className="trend up">
                    <ArrowUpRight size={13} /> 8.2%
                  </span>
                </div>
                <small>Active hazards</small>
                <strong>128</strong>
                <p>12 critical need attention</p>
              </article>
              <article>
                <div className="stat-top">
                  <span className="stat-icon cyan">
                    <Zap size={19} />
                  </span>
                  <span className="trend down">
                    <ArrowDownRight size={13} /> 14.5%
                  </span>
                </div>
                <small>Detected today</small>
                <strong>47</strong>
                <p>From 1,842 frames analyzed</p>
              </article>
              <article>
                <div className="stat-top">
                  <span className="stat-icon violet">
                    <Gauge size={19} />
                  </span>
                  <span className="trend up">
                    <ArrowUpRight size={13} /> 2.1%
                  </span>
                </div>
                <small>Detection target</small>
                <strong>94.8%</strong>
                <p>mAP@50 · target benchmark</p>
              </article>
              <article>
                <div className="stat-top">
                  <span className="stat-icon green">
                    <CheckCircle2 size={19} />
                  </span>
                  <span className="trend down">
                    <ArrowDownRight size={13} /> 18 min
                  </span>
                </div>
                <small>Resolved this week</small>
                <strong>86</strong>
                <p>Average response: 3.4 hours</p>
              </article>
            </section>

            <section className="overview-grid">
              <article className="panel map-panel">
                <div className="panel-head">
                  <div>
                    <h2>Live hazard map</h2>
                    <p>AI detections and citizen reports across Dhaka</p>
                  </div>
                  <div className="map-tools">
                    <label>
                      <Search size={15} />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search area"
                      />
                    </label>
                    <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as typeof severityFilter)}>
                      <option>All</option>
                      <option>Critical</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
                <div className="city-map" aria-label="Stylized live map of Dhaka hazards">
                  <div className="map-grid" />
                  <div className="river river-one" />
                  <div className="river river-two" />
                  <div className="road road-one" />
                  <div className="road road-two" />
                  <div className="road road-three" />
                  <div className="road road-four" />
                  <div className="road road-five" />
                  <span className="area-name area-one">DHANMONDI</span>
                  <span className="area-name area-two">BANANI</span>
                  <span className="area-name area-three">GULSHAN</span>
                  <span className="area-name area-four">MOHAMMADPUR</span>
                  {filteredReports.map((report) => (
                    <button
                      key={report.id}
                      className={`map-marker marker-${report.severity.toLowerCase()} ${selected.id === report.id ? "selected" : ""}`}
                      style={{ left: `${report.x}%`, top: `${report.y}%` }}
                      onClick={() => setSelected(report)}
                      aria-label={`${report.severity} ${report.type} at ${report.location}`}
                    >
                      <TypeIcon type={report.type} size={14} />
                      <span className="marker-pulse" />
                    </button>
                  ))}
                  <div className="map-controls">
                    <button aria-label="Zoom in">+</button>
                    <button aria-label="Zoom out">−</button>
                    <button aria-label="Locate me">
                      <LocateFixed size={15} />
                    </button>
                  </div>
                  <div className="map-legend">
                    <span>
                      <i className="critical" /> Critical
                    </span>
                    <span>
                      <i className="high" /> High
                    </span>
                    <span>
                      <i className="medium" /> Medium
                    </span>
                    <span>
                      <i className="low" /> Low
                    </span>
                  </div>
                  <div className="map-scan">
                    <Activity size={14} />
                    LIVE SCAN
                    <span>08:42:17</span>
                  </div>
                </div>
                <div className="selected-strip">
                  <div className={`report-type type-${selected.severity.toLowerCase()}`}>
                    <TypeIcon type={selected.type} size={20} />
                  </div>
                  <div className="selected-copy">
                    <span>
                      <SeverityPill severity={selected.severity} /> {selected.id}
                    </span>
                    <strong>{selected.type} detected</strong>
                    <p>
                      <MapPin size={13} /> {selected.location}
                    </p>
                  </div>
                  <div className="confidence-ring" style={{ "--score": `${selected.confidence * 3.6}deg` } as React.CSSProperties}>
                    <div>
                      <strong>{selected.confidence}%</strong>
                      <small>confidence</small>
                    </div>
                  </div>
                  <div className="selected-meta">
                    <span>Road coverage</span>
                    <strong>{selected.coverage}%</strong>
                    <span>{selected.reports} nearby reports</span>
                  </div>
                  <button className="review-button" onClick={() => updateStatus(selected.id)}>
                    Update status <ChevronRight size={15} />
                  </button>
                </div>
              </article>

              <article className="panel activity-panel">
                <div className="panel-head">
                  <div>
                    <h2>Recent signals</h2>
                    <p>Prioritized by risk score</p>
                  </div>
                  <button className="text-button" onClick={() => setView("reports")}>
                    View all <ChevronRight size={14} />
                  </button>
                </div>
                <div className="signal-list">
                  {reports.slice(0, 5).map((report) => (
                    <button
                      key={report.id}
                      className={selected.id === report.id ? "active" : ""}
                      onClick={() => setSelected(report)}
                    >
                      <span className={`signal-icon signal-${report.severity.toLowerCase()}`}>
                        <TypeIcon type={report.type} />
                      </span>
                      <span className="signal-copy">
                        <strong>{report.type}</strong>
                        <small>{report.area}</small>
                        <em>
                          <Clock3 size={11} /> {report.time}
                        </em>
                      </span>
                      <span className="signal-right">
                        <b>{report.confidence}%</b>
                        <SeverityPill severity={report.severity} />
                      </span>
                    </button>
                  ))}
                </div>
                <div className="ai-note">
                  <span>
                    <Bot size={17} />
                  </span>
                  <div>
                    <strong>AI insight</strong>
                    <p>Pothole reports on Mirpur Road are 2.4× above the 30-day baseline.</p>
                  </div>
                </div>
              </article>
            </section>

            <section className="bottom-grid">
              <article className="panel risk-panel">
                <div className="panel-head">
                  <div>
                    <h2>Area risk index</h2>
                    <p>Combined hazard frequency and severity</p>
                  </div>
                  <button className="mini-select">
                    Last 30 days <ChevronDown size={13} />
                  </button>
                </div>
                <div className="risk-list">
                  {riskAreas.map((area, index) => (
                    <div className="risk-row" key={area.name}>
                      <span className="rank">0{index + 1}</span>
                      <div className="risk-copy">
                        <span>
                          <strong>{area.name}</strong>
                          <small>{area.incidents} incidents</small>
                        </span>
                        <div className="risk-track">
                          <span style={{ width: `${area.score}%`, background: area.color }} />
                        </div>
                      </div>
                      <strong className="risk-score">{area.score}</strong>
                      <span className={area.trend.startsWith("+") ? "area-trend up" : "area-trend down"}>{area.trend}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="panel model-panel">
                <div className="model-orbit">
                  <div>
                    <Bot size={28} />
                  </div>
                  <span className="orbit-dot one" />
                  <span className="orbit-dot two" />
                </div>
                <div className="model-copy">
                  <span className="model-badge">
                    <span /> DEMO ADAPTER READY
                  </span>
                  <h2>CivicLens Vision v1.4</h2>
                  <p>Edge-optimized detection pipeline with explainable bounding boxes and severity scoring.</p>
                  <div className="model-metrics">
                    <span>
                      <small>Inference</small>
                      <strong>38 ms</strong>
                    </span>
                    <span>
                      <small>Target mAP@50</small>
                      <strong>94.8%</strong>
                    </span>
                    <span>
                      <small>Frames today</small>
                      <strong>1.8K</strong>
                    </span>
                  </div>
                </div>
                <button className="model-button" onClick={() => setShowReport(true)}>
                  <Camera size={16} /> Run demo scan
                </button>
              </article>
            </section>
          </>
        )}

        {view === "reports" && (
          <ReportsView
            reports={filteredReports}
            selected={selected}
            setSelected={setSelected}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            search={search}
            setSearch={setSearch}
            updateStatus={updateStatus}
          />
        )}

        {view === "analytics" && <AnalyticsView />}
        {view === "roads" && <RoadIntelligenceView notify={notify} />}
        {view === "model" && <ModelOperationsView notify={notify} />}
        {view === "authority" && (
          <AuthorityConsoleView
            reports={reports}
            updateStatus={updateStatus}
            assignTeam={assignTeam}
            notify={notify}
          />
        )}
      </section>

      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          onCreated={(report) => {
            setReports((items) => [report, ...items]);
            setSelected(report);
            setShowReport(false);
            notify(`${report.id} created · AI verification complete`);
          }}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <Check size={16} /> {toast}
        </div>
      )}
    </main>
  );
}

function ReportsView({
  reports,
  selected,
  setSelected,
  typeFilter,
  setTypeFilter,
  search,
  setSearch,
  updateStatus,
}: {
  reports: HazardReport[];
  selected: HazardReport;
  setSelected: (report: HazardReport) => void;
  typeFilter: "All" | HazardType;
  setTypeFilter: (value: "All" | HazardType) => void;
  search: string;
  setSearch: (value: string) => void;
  updateStatus: (id: string) => void;
}) {
  return (
    <section className="reports-layout">
      <article className="panel reports-table-panel">
        <div className="report-toolbar">
          <label className="search-box">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, road or area" />
          </label>
          <label className="select-box">
            <Filter size={15} />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
              <option>All</option>
              {hazardTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="report-table">
          <div className="table-row table-header">
            <span>Signal</span>
            <span>Location</span>
            <span>AI confidence</span>
            <span>Status</span>
          </div>
          {reports.map((report) => (
            <button
              key={report.id}
              className={`table-row ${selected.id === report.id ? "selected" : ""}`}
              onClick={() => setSelected(report)}
            >
              <span className="table-signal">
                <i className={`signal-icon signal-${report.severity.toLowerCase()}`}>
                  <TypeIcon type={report.type} />
                </i>
                <span>
                  <strong>{report.type}</strong>
                  <small>
                    {report.id} · {report.time}
                  </small>
                </span>
              </span>
              <span>
                <strong>{report.area}</strong>
                <small>{report.location}</small>
              </span>
              <span className="confidence-cell">
                <span>
                  <i style={{ width: `${report.confidence}%` }} />
                </span>
                <strong>{report.confidence}%</strong>
              </span>
              <span>
                <StatusPill status={report.status} />
              </span>
            </button>
          ))}
        </div>
      </article>
      <article className="panel detail-panel">
        <div className="detail-visual">
          <div className="scan-lines" />
          <span className="detection-box">
            <i>{selected.type} · {selected.confidence}%</i>
          </span>
          <div className="road-scene">
            <span />
            <span />
            <span />
          </div>
          <em>EXPLAINABLE AI VIEW</em>
        </div>
        <div className="detail-body">
          <div className="detail-title">
            <div>
              <span>
                <SeverityPill severity={selected.severity} /> {selected.id}
              </span>
              <h2>{selected.type}</h2>
            </div>
            <StatusPill status={selected.status} />
          </div>
          <p className="detail-location">
            <MapPin size={15} /> {selected.location}, {selected.area}
          </p>
          <div className="detail-grid">
            <span>
              <small>Confidence</small>
              <strong>{selected.confidence}%</strong>
            </span>
            <span>
              <small>Road coverage</small>
              <strong>{selected.coverage}%</strong>
            </span>
            <span>
              <small>Nearby reports</small>
              <strong>{selected.reports}</strong>
            </span>
            <span>
              <small>Duplicate score</small>
              <strong>{Math.min(98, selected.reports * 13)}%</strong>
            </span>
          </div>
          <div className="explanation">
            <Sparkles size={16} />
            <div>
              <strong>Why the model flagged this</strong>
              <p>Surface discontinuity and affected-road ratio exceeded the alert threshold. Bounding region contributed 82% of the decision.</p>
            </div>
          </div>
          <button className="primary-button full" onClick={() => updateStatus(selected.id)}>
            Advance workflow status <ChevronRight size={16} />
          </button>
        </div>
      </article>
    </section>
  );
}

function AnalyticsView() {
  const months = [
    { name: "Feb", detected: 42, resolved: 28 },
    { name: "Mar", detected: 55, resolved: 38 },
    { name: "Apr", detected: 49, resolved: 44 },
    { name: "May", detected: 72, resolved: 54 },
    { name: "Jun", detected: 64, resolved: 60 },
    { name: "Jul", detected: 88, resolved: 71 },
  ];
  return (
    <section className="analytics-grid">
      <article className="panel wide-chart">
        <div className="panel-head">
          <div>
            <h2>Detection vs resolution</h2>
            <p>Monthly operational throughput</p>
          </div>
          <span className="analytics-change">
            <TrendingUp size={14} /> 18.4% better resolution rate
          </span>
        </div>
        <div className="bar-chart">
          <div className="y-axis">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>
          {months.map((month) => (
            <div className="bar-group" key={month.name}>
              <div>
                <span className="detected-bar" style={{ height: `${month.detected}%` }} />
                <span className="resolved-bar" style={{ height: `${month.resolved}%` }} />
              </div>
              <small>{month.name}</small>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span>
            <i className="detected" /> Detected
          </span>
          <span>
            <i className="resolved" /> Resolved
          </span>
        </div>
      </article>
      <article className="panel distribution-panel">
        <div className="panel-head">
          <div>
            <h2>Hazard distribution</h2>
            <p>Last 30 days</p>
          </div>
        </div>
        <div className="donut-wrap">
          <div className="donut">
            <span>
              <strong>342</strong>
              <small>signals</small>
            </span>
          </div>
          <div className="donut-legend">
            <span>
              <i style={{ background: "#f24e64" }} /> Pothole <b>41%</b>
            </span>
            <span>
              <i style={{ background: "#1ec8a5" }} /> Waste <b>27%</b>
            </span>
            <span>
              <i style={{ background: "#6f8df8" }} /> Waterlogging <b>21%</b>
            </span>
            <span>
              <i style={{ background: "#ffc857" }} /> Manhole <b>11%</b>
            </span>
          </div>
        </div>
      </article>
      <article className="panel analytics-card">
        <span className="stat-icon green">
          <Navigation size={19} />
        </span>
        <small>Network coverage</small>
        <strong>147.8 km</strong>
        <p>12 priority corridors actively monitored</p>
      </article>
      <article className="panel analytics-card">
        <span className="stat-icon violet">
          <Clock3 size={19} />
        </span>
        <small>Median verification time</small>
        <strong>6m 42s</strong>
        <p>24% faster than last month</p>
      </article>
      <article className="panel analytics-card">
        <span className="stat-icon cyan">
          <Layers3 size={19} />
        </span>
        <small>Duplicates prevented</small>
        <strong>118</strong>
        <p>Image embedding + GPS similarity</p>
      </article>
    </section>
  );
}

function RoadIntelligenceView({ notify }: { notify: (message: string) => void }) {
  const [scenario, setScenario] = useState("Heavy rain");
  const [simulating, setSimulating] = useState(false);
  const corridors = [
    {
      name: "Mirpur Road",
      segment: "Science Lab → Technical",
      risk: 86,
      condition: "Critical",
      hazards: 18,
      traffic: "Heavy",
      due: "12 days",
      icon: Construction,
      color: "#f24e64",
    },
    {
      name: "Kazi Nazrul Avenue",
      segment: "Farmgate → Shahbag",
      risk: 74,
      condition: "Watch",
      hazards: 11,
      traffic: "Moderate",
      due: "26 days",
      icon: CloudRain,
      color: "#ff9f43",
    },
    {
      name: "Airport Road",
      segment: "Banani → Khilkhet",
      risk: 52,
      condition: "Stable",
      hazards: 7,
      traffic: "Heavy",
      due: "48 days",
      icon: Car,
      color: "#ffc857",
    },
    {
      name: "Gulshan Avenue",
      segment: "Circle 1 → Circle 2",
      risk: 31,
      condition: "Healthy",
      hazards: 3,
      traffic: "Light",
      due: "82 days",
      icon: Route,
      color: "#23d2ac",
    },
  ];

  const runSimulation = () => {
    setSimulating(true);
    window.setTimeout(() => {
      setSimulating(false);
      notify(`${scenario} scenario complete · 2 corridors reprioritized`);
    }, 1250);
  };

  return (
    <section className="roads-workspace">
      <div className="road-kpis">
        <article className="panel road-kpi">
          <span className="stat-icon coral"><MapPinned size={19} /></span>
          <div><small>Monitored network</small><strong>147.8 km</strong><p>12 priority corridors</p></div>
        </article>
        <article className="panel road-kpi">
          <span className="stat-icon violet"><Gauge size={19} /></span>
          <div><small>Network health</small><strong>72 / 100</strong><p>4 points below target</p></div>
        </article>
        <article className="panel road-kpi">
          <span className="stat-icon cyan"><Radio size={19} /></span>
          <div><small>Edge sensors</small><strong>38 / 42</strong><p>90.5% online</p></div>
        </article>
        <article className="panel road-kpi">
          <span className="stat-icon green"><Wrench size={19} /></span>
          <div><small>Prevented repairs</small><strong>৳1.28M</strong><p>Estimated this quarter</p></div>
        </article>
      </div>

      <div className="roads-main-grid">
        <article className="panel corridor-panel">
          <div className="panel-head">
            <div>
              <h2>Corridor condition index</h2>
              <p>Predicted risk from hazards, weather and traffic pressure</p>
            </div>
            <button className="mini-select"><SlidersHorizontal size={14} /> Risk weighted</button>
          </div>
          <div className="corridor-list">
            {corridors.map((corridor) => {
              const CorridorIcon = corridor.icon;
              return (
                <div className="corridor-row" key={corridor.name}>
                  <span className="corridor-icon" style={{ color: corridor.color }}>
                    <CorridorIcon size={18} />
                  </span>
                  <div className="corridor-copy">
                    <span><strong>{corridor.name}</strong><small>{corridor.segment}</small></span>
                    <div className="condition-track"><i style={{ width: `${corridor.risk}%`, background: corridor.color }} /></div>
                  </div>
                  <div className="corridor-number"><strong>{corridor.risk}</strong><small>risk</small></div>
                  <div className="corridor-meta"><span>{corridor.hazards} hazards</span><span>{corridor.traffic} traffic</span></div>
                  <div className="corridor-due"><CalendarClock size={14} /><span><small>Maintenance</small><strong>{corridor.due}</strong></span></div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel scenario-panel">
          <div className="panel-head">
            <div><h2>Mobility scenario lab</h2><p>Test operational conditions before dispatch</p></div>
            <FlaskConical size={20} />
          </div>
          <div className="scenario-visual">
            <span className="route-line one" />
            <span className="route-line two" />
            <span className="route-node a"><Building2 size={15} /></span>
            <span className="route-node b"><TrafficCone size={15} /></span>
            <span className="route-node c"><MapPin size={15} /></span>
            <div>
              <CloudRain size={26} />
              <strong>{scenario}</strong>
              <small>Projected network pressure +18%</small>
            </div>
          </div>
          <label className="scenario-select">
            <span>Simulation condition</span>
            <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
              <option>Heavy rain</option>
              <option>Clear weekday</option>
              <option>Event traffic</option>
              <option>Drainage outage</option>
            </select>
          </label>
          <div className="scenario-result">
            <span><strong>2</strong><small>routes at risk</small></span>
            <span><strong>+14m</strong><small>response delay</small></span>
            <span><strong>3</strong><small>teams suggested</small></span>
          </div>
          <button className="primary-button full" onClick={runSimulation} disabled={simulating}>
            {simulating ? <Pause size={16} /> : <Play size={16} />}
            {simulating ? "Running simulation…" : "Run route simulation"}
          </button>
        </article>
      </div>

      <div className="road-bottom-grid">
        <article className="panel maintenance-panel">
          <div className="panel-head">
            <div><h2>Predictive maintenance queue</h2><p>Recommended work before condition failure</p></div>
            <Milestone size={19} />
          </div>
          {[
            ["Mirpur Road · Zone 4", "Pothole cluster resurfacing", "92", "Within 12 days"],
            ["Satmasjid Road · Zone 2", "Manhole cover reinforcement", "84", "Within 18 days"],
            ["Airport Road · Zone 7", "Streetlight circuit inspection", "71", "Within 31 days"],
          ].map(([road, task, score, due]) => (
            <div className="maintenance-row" key={road}>
              <span className="maintenance-score">{score}</span>
              <div><strong>{road}</strong><p>{task}</p></div>
              <span><Timer size={13} /> {due}</span>
              <button onClick={() => notify(`${task} added to the maintenance plan`)}>Plan work</button>
            </div>
          ))}
        </article>
        <article className="panel sensor-panel">
          <div className="panel-head"><div><h2>Sensor network</h2><p>Live ingestion health</p></div><Radio size={18} /></div>
          <div className="sensor-ring"><span><strong>90.5%</strong><small>online</small></span></div>
          <div className="sensor-sources">
            <span><Camera size={14} /> Dashcams <b>18</b></span>
            <span><ScanSearch size={14} /> CCTV feeds <b>12</b></span>
            <span><Navigation size={14} /> Drone routes <b>8</b></span>
          </div>
        </article>
      </div>
    </section>
  );
}

function ModelOperationsView({ notify }: { notify: (message: string) => void }) {
  const [threshold, setThreshold] = useState(62);
  const [running, setRunning] = useState(false);
  const classQuality = [
    ["Pothole", 93],
    ["Plastic waste", 88],
    ["Waterlogging", 91],
    ["Open manhole", 86],
    ["Broken road", 84],
    ["Illegal dumping", 82],
    ["Traffic obstruction", 80],
    ["Damaged streetlight", 78],
  ] as const;

  const runContractTest = () => {
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      notify("ONNX contract test passed · model weights still required for measured accuracy");
    }, 1400);
  };

  return (
    <section className="model-ops">
      <div className="model-status-banner">
        <div className="model-status-orb"><Cpu size={28} /><span /></div>
        <div>
          <span className="model-badge"><span /> ADAPTER HEALTHY</span>
          <h2>CivicLens Vision · production contract</h2>
          <p>Eight-class ONNX pipeline, deterministic demo fallback and edge export workflow.</p>
        </div>
        <div className="model-banner-meta">
          <span><small>Mode</small><strong>Demo adapter</strong></span>
          <span><small>Runtime target</small><strong>ONNX CPU / Edge</strong></span>
          <button onClick={runContractTest} disabled={running}>
            {running ? <Pause size={15} /> : <Play size={15} />}
            {running ? "Testing…" : "Run contract test"}
          </button>
        </div>
      </div>

      <div className="model-top-grid">
        <article className="panel registry-panel">
          <div className="panel-head"><div><h2>Model registry</h2><p>Promotion state and serving readiness</p></div><GitBranch size={18} /></div>
          {[
            { name: "Vision v1.4", state: "Production contract", target: "ONNX · 640px", color: "green", icon: Server },
            { name: "Vision v1.5-rc", state: "Candidate", target: "RT-DETR · research", color: "violet", icon: FlaskConical },
            { name: "Edge v0.9", state: "Export ready", target: "INT8 · mobile", color: "cyan", icon: Cpu },
          ].map((model) => {
            const ModelIcon = model.icon;
            return (
              <div className="registry-row" key={model.name}>
                <span className={`registry-icon ${model.color}`}><ModelIcon size={17} /></span>
                <div><strong>{model.name}</strong><small>{model.target}</small></div>
                <span className={`registry-state ${model.color}`}>{model.state}</span>
                <button aria-label={`Open ${model.name}`}><ChevronRight size={15} /></button>
              </div>
            );
          })}
        </article>
        <article className="panel threshold-panel">
          <div className="panel-head"><div><h2>Decision threshold</h2><p>Operator alert sensitivity</p></div><Settings2 size={18} /></div>
          <div className="threshold-score"><strong>{threshold}%</strong><span>confidence floor</span></div>
          <input
            aria-label="Confidence threshold"
            type="range"
            min="35"
            max="90"
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
          />
          <div className="threshold-labels"><span>More recall</span><span>More precision</span></div>
          <div className="threshold-impact">
            <span><Target size={15} /><small>Estimated review load</small><strong>{Math.max(18, 91 - threshold)} / day</strong></span>
            <span><ShieldAlert size={15} /><small>Critical guardrail</small><strong>Always escalated</strong></span>
          </div>
        </article>
      </div>

      <div className="model-main-grid">
        <article className="panel quality-panel">
          <div className="panel-head">
            <div><h2>Per-class quality targets</h2><p>Planning benchmarks until trained weights and held-out evaluation are connected</p></div>
            <span className="target-label">TARGETS · NOT MEASURED</span>
          </div>
          <div className="quality-list">
            {classQuality.map(([name, score]) => (
              <div key={name}>
                <span><TypeIcon type={name} /><strong>{name}</strong></span>
                <div><i style={{ width: `${score}%` }} /></div>
                <b>{score}%</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel data-health-panel">
          <div className="panel-head"><div><h2>Data health</h2><p>Readiness checks for the training set</p></div><Database size={18} /></div>
          <div className="data-score"><span><strong>6</strong><small>checks ready</small></span><CheckCircle2 size={25} /></div>
          {[
            ["Schema validation", "Ready", true],
            ["YOLO label bounds", "Ready", true],
            ["Train/val/test isolation", "Scripted", true],
            ["Class balance", "Dataset needed", false],
            ["Night-scene slice", "Dataset needed", false],
            ["GPS privacy scrub", "Policy ready", true],
          ].map(([label, value, ready]) => (
            <div className="health-row" key={String(label)}>
              <span className={ready ? "ready" : "waiting"}>{ready ? <Check size={12} /> : <Clock3 size={12} />}</span>
              <strong>{label}</strong>
              <small>{value}</small>
            </div>
          ))}
        </article>
      </div>

      <article className="panel pipeline-panel">
        <div className="panel-head"><div><h2>Production ML lifecycle</h2><p>Implemented repository path from raw evidence to monitored release</p></div><Workflow size={19} /></div>
        <div className="pipeline-flow">
          {[
            [UploadCloud, "Dataset", "Validate YOLO labels"],
            [FlaskConical, "Train", "Reproducible config"],
            [ListChecks, "Evaluate", "mAP + error slices"],
            [Cpu, "Export", "ONNX runtime"],
            [Server, "Serve", "FastAPI contract"],
            [Activity, "Monitor", "Drift + feedback"],
          ].map(([Icon, title, note], index) => {
            const StepIcon = Icon as typeof UploadCloud;
            return (
              <div className="pipeline-step" key={String(title)}>
                <span><StepIcon size={17} /></span>
                <div><strong>{title as string}</strong><small>{note as string}</small></div>
                {index < 5 && <ChevronRight size={14} />}
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}

function AuthorityConsoleView({
  reports,
  updateStatus,
  assignTeam,
  notify,
}: {
  reports: HazardReport[];
  updateStatus: (id: string) => void;
  assignTeam: (id: string, team: string) => void;
  notify: (message: string) => void;
}) {
  const teams = ["Unassigned", "Road Alpha", "Road Beta", "Drainage 2", "Clean City 4", "Rapid Works", "Electrical 1"];
  const statuses: ReportStatus[] = ["Reported", "Investigating", "Resolved"];
  const openCount = reports.filter((report) => report.status !== "Resolved").length;
  const slaRisk = reports.filter((report) => report.status !== "Resolved" && report.slaMinutes < 90).length;

  return (
    <section className="authority-workspace">
      <div className="authority-kpis">
        <article className="panel"><span className="stat-icon coral"><Siren size={19} /></span><div><small>Open incidents</small><strong>{openCount}</strong><p>{slaRisk} need rapid response</p></div></article>
        <article className="panel"><span className="stat-icon cyan"><HardHat size={19} /></span><div><small>Teams deployed</small><strong>11 / 15</strong><p>73% field utilization</p></div></article>
        <article className="panel"><span className="stat-icon violet"><Timer size={19} /></span><div><small>Median response</small><strong>3h 24m</strong><p>18 minutes faster today</p></div></article>
        <article className="panel"><span className="stat-icon green"><UserCheck size={19} /></span><div><small>Citizen updates</small><strong>96%</strong><p>Delivered successfully</p></div></article>
      </div>

      <div className="command-grid">
        <article className="panel dispatch-board">
          <div className="panel-head">
            <div><h2>Live response board</h2><p>Assign ownership and advance verified incidents</p></div>
            <button className="mini-select" onClick={() => notify("Dispatch plan synchronized")}><Send size={14} /> Sync dispatch</button>
          </div>
          <div className="kanban-board">
            {statuses.map((status) => (
              <div className="kanban-column" key={status}>
                <div className="kanban-head">
                  <span className={`kanban-dot ${status.toLowerCase()}`} />
                  <strong>{status}</strong>
                  <small>{reports.filter((report) => report.status === status).length}</small>
                </div>
                <div className="kanban-list">
                  {reports.filter((report) => report.status === status).map((report) => (
                    <article className={`dispatch-card severity-edge-${report.severity.toLowerCase()}`} key={report.id}>
                      <div className="dispatch-title">
                        <span className={`signal-icon signal-${report.severity.toLowerCase()}`}><TypeIcon type={report.type} /></span>
                        <div><strong>{report.type}</strong><small>{report.id} · {report.source}</small></div>
                        <SeverityPill severity={report.severity} />
                      </div>
                      <p><MapPin size={13} /> {report.area} · {report.location}</p>
                      <div className="dispatch-meta">
                        <span className={report.slaMinutes < 90 && report.status !== "Resolved" ? "sla-risk" : ""}>
                          <Timer size={12} /> {report.status === "Resolved" ? "SLA met" : `${report.slaMinutes}m left`}
                        </span>
                        <span><Users size={12} /> {report.assignedTeam}</span>
                      </div>
                      <div className="dispatch-actions">
                        <select
                          aria-label={`Assign team to ${report.id}`}
                          value={report.assignedTeam}
                          onChange={(event) => assignTeam(report.id, event.target.value)}
                        >
                          {!teams.includes(report.assignedTeam) && <option>{report.assignedTeam}</option>}
                          {teams.map((team) => <option key={team}>{team}</option>)}
                        </select>
                        <button onClick={() => updateStatus(report.id)}>
                          {status === "Resolved" ? "Reopen" : "Advance"} <ChevronRight size={13} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="command-side">
          <article className="panel field-teams">
            <div className="panel-head"><div><h2>Field capacity</h2><p>Live team availability</p></div><HardHat size={18} /></div>
            {[
              ["Road engineering", 4, 5, "#f24e64"],
              ["Drainage response", 2, 3, "#6f8df8"],
              ["Clean city", 3, 4, "#23d2ac"],
              ["Electrical", 2, 3, "#ffc857"],
            ].map(([name, active, total, color]) => (
              <div className="team-capacity" key={String(name)}>
                <span><strong>{name}</strong><small>{active} of {total} deployed</small></span>
                <div><i style={{ width: `${(Number(active) / Number(total)) * 100}%`, background: String(color) }} /></div>
              </div>
            ))}
          </article>
          <article className="panel escalation-panel">
            <div className="panel-head"><div><h2>Escalation watch</h2><p>Action required next</p></div><ShieldAlert size={18} /></div>
            {reports.filter((report) => report.status !== "Resolved").sort((a, b) => a.slaMinutes - b.slaMinutes).slice(0, 3).map((report) => (
              <button key={report.id} onClick={() => notify(`${report.id} escalation acknowledged`)}>
                <span className="alert-icon critical"><Siren size={14} /></span>
                <span><strong>{report.id} · {report.area}</strong><small>{report.slaMinutes}m remaining · {report.assignedTeam}</small></span>
                <ChevronRight size={14} />
              </button>
            ))}
          </article>
        </aside>
      </div>
    </section>
  );
}

function ReportModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (report: HazardReport) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "scanning" | "review">("upload");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [location, setLocation] = useState("Dhanmondi Road 8, Dhaka");
  const [detectedType, setDetectedType] = useState<HazardType>("Pothole");
  const [severity, setSeverity] = useState<Severity>("High");
  const [confidence, setConfidence] = useState(94);
  const [duplicate, setDuplicate] = useState(false);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Please choose an image smaller than 8 MB.");
      return;
    }
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  };

  const useLocation = () => {
    if (!navigator.geolocation) return;
    setLocation("Locating…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`),
      () => setLocation("Dhanmondi Road 8, Dhaka"),
    );
  };

  const runScan = () => {
    if (!preview) {
      fileInput.current?.click();
      return;
    }
    setStep("scanning");
    const hash = fileName.split("").reduce((total, letter) => total + letter.charCodeAt(0), 0);
    const nextType = hazardTypes[hash % hazardTypes.length];
    const nextConfidence = 89 + (hash % 9);
    const nextSeverity: Severity = nextConfidence > 95 ? "Critical" : nextConfidence > 91 ? "High" : "Medium";
    window.setTimeout(() => {
      setDetectedType(nextType);
      setConfidence(nextConfidence);
      setSeverity(nextSeverity);
      setDuplicate(hash % 5 === 0);
      setStep("review");
    }, 1550);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const report: HazardReport = {
      id: `CL-${2850 + Math.floor(Math.random() * 120)}`,
      type: detectedType,
      severity,
      confidence,
      location,
      area: location.includes(",") ? location.split(",")[0] : "Dhaka",
      time: "Just now",
      status: "Reported",
      x: 42 + Math.floor(Math.random() * 25),
      y: 32 + Math.floor(Math.random() * 28),
      reports: duplicate ? 2 : 1,
      coverage: Math.max(12, confidence - 67),
      assignedTeam: "Unassigned",
      slaMinutes: severity === "Critical" ? 60 : severity === "High" ? 180 : 360,
      source: "Citizen",
    };
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(report),
      });
    } catch {
      // The interactive demo remains usable when a local preview has no D1 binding.
    }
    onCreated(report);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className="modal-head">
          <div>
            <span className="modal-icon">
              <Camera size={19} />
            </span>
            <div>
              <h2 id="report-title">Report a road hazard</h2>
              <p>AI verifies the issue, severity and possible duplicates.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close report form">
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="stepper">
            <span className={step === "upload" ? "active" : "complete"}>
              <i>{step === "upload" ? "1" : <Check size={12} />}</i> Evidence
            </span>
            <b />
            <span className={step === "scanning" ? "active" : step === "review" ? "complete" : ""}>
              <i>2</i> AI scan
            </span>
            <b />
            <span className={step === "review" ? "active" : ""}>
              <i>3</i> Review
            </span>
          </div>

          {step === "upload" && (
            <div className="upload-step">
              <button type="button" className={`drop-zone ${preview ? "has-preview" : ""}`} onClick={() => fileInput.current?.click()}>
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Road evidence preview" />
                ) : (
                  <>
                    <span>
                      <UploadCloud size={24} />
                    </span>
                    <strong>Upload a road image</strong>
                    <p>Drag and drop or choose a JPG, PNG or WEBP</p>
                    <small>Maximum 8 MB</small>
                  </>
                )}
              </button>
              <input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} />
              <label className="form-field">
                <span>Location</span>
                <div>
                  <MapPin size={16} />
                  <input value={location} onChange={(event) => setLocation(event.target.value)} />
                  <button type="button" onClick={useLocation} aria-label="Use current location">
                    <LocateFixed size={16} />
                  </button>
                </div>
              </label>
              <button type="button" className="primary-button full" onClick={runScan}>
                <Sparkles size={16} /> Analyze with CivicLens AI
              </button>
              <p className="demo-disclosure">
                Demo inference uses a deterministic simulator. Connect an ONNX model through the included adapter contract for trained detection.
              </p>
            </div>
          )}

          {step === "scanning" && (
            <div className="scanning-step">
              <div className="scan-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="AI scanning road evidence" />
                <span className="scan-beam" />
                <div className="scan-corners" />
              </div>
              <span className="loading-orb">
                <Bot size={22} />
              </span>
              <h3>Analyzing road evidence</h3>
              <p>Detecting hazards · estimating severity · checking duplicates</p>
              <div className="loading-track">
                <span />
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="review-step">
              <div className="review-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Analyzed road evidence" />
                <span className="result-box">
                  <i>
                    {detectedType} · {confidence}%
                  </i>
                </span>
              </div>
              <div className="result-banner">
                <span>
                  <Sparkles size={17} />
                </span>
                <div>
                  <small>AI DETECTION COMPLETE</small>
                  <strong>{detectedType}</strong>
                </div>
                <div className="result-confidence">
                  <strong>{confidence}%</strong>
                  <small>confidence</small>
                </div>
              </div>
              {duplicate && (
                <div className="duplicate-alert">
                  <AlertTriangle size={16} />
                  A similar report exists within 120 m. It will be linked to prevent duplication.
                </div>
              )}
              <div className="review-fields">
                <label>
                  <span>Hazard type</span>
                  <select value={detectedType} onChange={(event) => setDetectedType(event.target.value as HazardType)}>
                    {hazardTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Severity</span>
                  <select value={severity} onChange={(event) => setSeverity(event.target.value as Severity)}>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
              </div>
              <button type="submit" className="primary-button full">
                <CheckCircle2 size={16} /> Submit verified report
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
