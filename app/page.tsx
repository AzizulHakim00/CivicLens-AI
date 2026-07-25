"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  Gauge,
  Layers3,
  LocateFixed,
  Map,
  MapPin,
  Menu,
  Navigation,
  Plus,
  Recycle,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

type HazardType = "Pothole" | "Plastic waste" | "Waterlogging" | "Open manhole";
type Severity = "Critical" | "High" | "Medium" | "Low";
type ReportStatus = "Reported" | "Investigating" | "Resolved";
type View = "overview" | "reports" | "analytics";

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
  return <AlertTriangle size={size} />;
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
  const [toast, setToast] = useState("");

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
    notify(`${id} moved to ${next}`);
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
          <button className="icon-button" aria-label="Notifications">
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
        <button>
          <Route size={18} />
          Road intelligence
        </button>
        <div className="side-label spaced">System</div>
        <button>
          <Bot size={18} />
          AI model
          <span className="live-dot" />
        </button>
        <button>
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
            <strong>CivicLens v1.4</strong>
            <small>ONNX adapter ready</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <div className="page-head">
          <div>
            <p className="eyebrow">
              <span /> LIVE CITY PULSE · DHAKA
            </p>
            <h1>{view === "overview" ? "Urban hazard intelligence" : view === "reports" ? "Hazard report center" : "City risk analytics"}</h1>
            <p>
              {view === "overview"
                ? "Monitor, verify and resolve road risks with explainable AI."
                : view === "reports"
                  ? `${reports.length} verified signals across the city network.`
                  : "Decision-ready patterns from field reports and model detections."}
            </p>
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
              <option>Pothole</option>
              <option>Plastic waste</option>
              <option>Waterlogging</option>
              <option>Open manhole</option>
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
    const types: HazardType[] = ["Pothole", "Plastic waste", "Waterlogging", "Open manhole"];
    const nextType = types[hash % types.length];
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
                    <option>Pothole</option>
                    <option>Plastic waste</option>
                    <option>Waterlogging</option>
                    <option>Open manhole</option>
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
