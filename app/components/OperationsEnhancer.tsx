"use client";

import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  Command,
  Download,
  ExternalLink,
  FileText,
  Keyboard,
  Map,
  Plus,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type HealthState = "checking" | "healthy" | "degraded" | "offline";

type HealthPayload = {
  status?: string;
  database?: { latencyMs?: number | null };
  inference?: { mode?: string };
};

type NavigationCommand = {
  id: string;
  label: string;
  description: string;
  target: string;
  shortcut: string;
  icon: typeof Map;
};

const navigationCommands: NavigationCommand[] = [
  {
    id: "overview",
    label: "Open live overview",
    description: "Return to the city-wide hazard map and active signals.",
    target: "Live overview",
    shortcut: "Alt+1",
    icon: Map,
  },
  {
    id: "reports",
    label: "Open hazard reports",
    description: "Review, filter and update tracked reports.",
    target: "Hazard reports",
    shortcut: "Alt+2",
    icon: FileText,
  },
  {
    id: "analytics",
    label: "Open city analytics",
    description: "Inspect trends, distributions and response performance.",
    target: "City analytics",
    shortcut: "Alt+3",
    icon: BarChart3,
  },
  {
    id: "roads",
    label: "Open road intelligence",
    description: "Explore corridor risk and predictive maintenance.",
    target: "Road intelligence",
    shortcut: "Alt+4",
    icon: Route,
  },
  {
    id: "model",
    label: "Open AI model operations",
    description: "Check thresholds, data health and deployment readiness.",
    target: "AI model",
    shortcut: "Alt+5",
    icon: Bot,
  },
  {
    id: "authority",
    label: "Open authority console",
    description: "Coordinate teams, SLA risk and field resolution.",
    target: "Authority console",
    shortcut: "Alt+6",
    icon: ShieldCheck,
  },
];

function activateButton(label: string) {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((candidate) =>
    candidate.textContent?.replace(/\s+/g, " ").trim().toLowerCase().startsWith(label.toLowerCase()),
  );
  button?.click();
  button?.focus();
}

export default function OperationsEnhancer() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<HealthState>("checking");
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    if (!navigator.onLine) {
      setHealth("offline");
      setLastChecked(new Date());
      return;
    }

    setHealth("checking");
    try {
      const response = await fetch("/api/health", {
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      const data = (await response.json()) as HealthPayload;
      setPayload(data);
      setHealth(response.ok && data.status === "ok" ? "healthy" : "degraded");
    } catch {
      setHealth("offline");
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  const closeCommandCenter = () => {
    setOpen(false);
    setQuery("");
  };

  const runNavigation = (target: string) => {
    activateButton(target);
    closeCommandCenter();
  };

  useEffect(() => {
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";

    const firstCheck = window.setTimeout(() => void checkHealth(), 0);
    const interval = window.setInterval(() => void checkHealth(), 60_000);
    const handleOnline = () => void checkHealth();
    const handleOffline = () => setHealth("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.clearTimeout(firstCheck);
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkHealth]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        closeCommandCenter();
        return;
      }

      if (!event.altKey) return;

      const shortcutTargets: Record<string, string> = {
        "1": "Live overview",
        "2": "Hazard reports",
        "3": "City analytics",
        "4": "Road intelligence",
        "5": "AI model",
        "6": "Authority console",
        r: "Report a hazard",
      };
      const target = shortcutTargets[event.key.toLowerCase()];
      if (target) {
        event.preventDefault();
        activateButton(target);
        closeCommandCenter();
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  const needle = query.trim().toLowerCase();
  const filteredCommands = navigationCommands.filter((command) =>
    `${command.label} ${command.description}`.toLowerCase().includes(needle),
  );

  const healthLabel =
    health === "healthy"
      ? "Systems healthy"
      : health === "degraded"
        ? "Service degraded"
        : health === "offline"
          ? "Offline"
          : "Checking systems";

  return (
    <>
      <a className="ops-skip-link" href="#main-content">Skip to main content</a>

      {health === "offline" && (
        <div className="ops-offline-banner" role="status">
          <WifiOff size={15} /> You are offline. Cached interface data may still be available.
        </div>
      )}

      <div className="ops-dock" aria-label="CivicLens quick operations">
        <button
          type="button"
          className={`ops-health-pill ops-health-${health}`}
          onClick={() => void checkHealth()}
          title="Refresh system health"
        >
          {health === "offline" ? <WifiOff size={14} /> : <Wifi size={14} />}
          <span>{healthLabel}</span>
          <RefreshCw className={health === "checking" ? "ops-spin" : ""} size={13} />
        </button>
        <button type="button" className="ops-command-button" onClick={() => setOpen(true)}>
          <Command size={17} />
          <span>Command center</span>
          <kbd>Ctrl K</kbd>
        </button>
      </div>

      {open && (
        <div className="ops-command-backdrop">
          <section className="ops-command-panel" role="dialog" aria-modal="true" aria-label="CivicLens command center">
            <header className="ops-command-head">
              <div>
                <span className="ops-command-icon"><Command size={18} /></span>
                <div>
                  <strong>CivicLens command center</strong>
                  <small>Navigate, verify services and launch common actions</small>
                </div>
              </div>
              <button type="button" onClick={closeCommandCenter} aria-label="Close command center"><X size={17} /></button>
            </header>

            <label className="ops-command-search">
              <Search size={17} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search actions or workspaces…"
              />
              <kbd>ESC</kbd>
            </label>

            <div className="ops-health-grid">
              <article>
                <span className={`ops-health-orb ops-health-${health}`}>
                  {health === "healthy" ? <CheckCircle2 size={17} /> : <Activity size={17} />}
                </span>
                <div><small>Platform status</small><strong>{healthLabel}</strong></div>
              </article>
              <article>
                <span className="ops-health-orb"><Activity size={17} /></span>
                <div>
                  <small>D1 latency</small>
                  <strong>{payload?.database?.latencyMs ?? "—"}{payload?.database?.latencyMs != null ? " ms" : ""}</strong>
                </div>
              </article>
              <article>
                <span className="ops-health-orb"><Bot size={17} /></span>
                <div><small>Inference</small><strong>{payload?.inference?.mode ?? "Demo adapter"}</strong></div>
              </article>
            </div>

            <div className="ops-action-list">
              {filteredCommands.length ? filteredCommands.map((command) => {
                const Icon = command.icon;
                return (
                  <button type="button" key={command.id} onClick={() => runNavigation(command.target)}>
                    <span><Icon size={17} /></span>
                    <div><strong>{command.label}</strong><small>{command.description}</small></div>
                    <kbd>{command.shortcut}</kbd>
                  </button>
                );
              }) : <div className="ops-empty-command">No command matches “{query}”.</div>}

              <button type="button" onClick={() => runNavigation("Report a hazard")}>
                <span><Plus size={17} /></span>
                <div><strong>Report a new hazard</strong><small>Open the citizen evidence and verification workflow.</small></div>
                <kbd>Alt+R</kbd>
              </button>
              <button type="button" onClick={() => runNavigation("Export report")}>
                <span><Download size={17} /></span>
                <div><strong>Export hazard report</strong><small>Download the current operational dataset as CSV.</small></div>
              </button>
              <button type="button" onClick={() => window.open("/api/reports", "_blank", "noopener,noreferrer")}>
                <span><ExternalLink size={17} /></span>
                <div><strong>Open report API</strong><small>Inspect the live JSON report endpoint.</small></div>
              </button>
            </div>

            <footer className="ops-command-foot">
              <span><Keyboard size={14} /> Use Ctrl+K or Alt+1…6 for faster operations.</span>
              <div>
                <button type="button" onClick={() => void checkHealth()}><RefreshCw size={14} /> Recheck</button>
                <small>{lastChecked ? `Checked ${lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Not checked yet"}</small>
              </div>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
