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
  Smartphone,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type HealthState = "checking" | "healthy" | "degraded" | "offline";

type HealthPayload = {
  status?: string;
  database?: {
    status?: string;
    latencyMs?: number | null;
  };
  inference?: {
    mode?: string;
  };
  timestamp?: string;
  version?: string;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type CommandAction = {
  id: string;
  label: string;
  description: string;
  shortcut?: string;
  icon: typeof Map;
  run: () => void;
};

function clickButton(label: string) {
  const match = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    button.textContent?.replace(/\s+/g, " ").trim().toLowerCase().startsWith(label.toLowerCase()),
  );
  match?.click();
  match?.focus();
}

export default function OperationsEnhancer() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<HealthState>("checking");
  const [healthPayload, setHealthPayload] = useState<HealthPayload | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

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
      const payload = (await response.json()) as HealthPayload;
      setHealthPayload(payload);
      setHealth(response.ok && payload.status === "ok" ? "healthy" : "degraded");
    } catch {
      setHealth("offline");
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";

    const onOnline = () => void checkHealth();
    const onOffline = () => setHealth("offline");
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    void checkHealth();

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const interval = window.setInterval(() => void checkHealth(), 60_000);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
    };
  }, [checkHealth]);

  const runAndClose = useCallback((action: () => void) => {
    action();
    setOpen(false);
    setQuery("");
  }, []);

  const actions = useMemo<CommandAction[]>(
    () => [
      {
        id: "overview",
        label: "Open live overview",
        description: "Return to the city-wide hazard map and active signals.",
        shortcut: "Alt+1",
        icon: Map,
        run: () => clickButton("Live overview"),
      },
      {
        id: "reports",
        label: "Open hazard reports",
        description: "Review, filter and update tracked reports.",
        shortcut: "Alt+2",
        icon: FileText,
        run: () => clickButton("Hazard reports"),
      },
      {
        id: "analytics",
        label: "Open city analytics",
        description: "Inspect trends, distributions and response performance.",
        shortcut: "Alt+3",
        icon: BarChart3,
        run: () => clickButton("City analytics"),
      },
      {
        id: "roads",
        label: "Open road intelligence",
        description: "Explore corridor risk and predictive maintenance.",
        shortcut: "Alt+4",
        icon: Route,
        run: () => clickButton("Road intelligence"),
      },
      {
        id: "model",
        label: "Open AI model operations",
        description: "Check thresholds, data health and deployment readiness.",
        shortcut: "Alt+5",
        icon: Bot,
        run: () => clickButton("AI model"),
      },
      {
        id: "authority",
        label: "Open authority console",
        description: "Coordinate teams, SLA risk and field resolution.",
        shortcut: "Alt+6",
        icon: ShieldCheck,
        run: () => clickButton("Authority console"),
      },
      {
        id: "report",
        label: "Report a new hazard",
        description: "Open the citizen evidence and verification workflow.",
        shortcut: "Alt+R",
        icon: Plus,
        run: () => clickButton("Report a hazard"),
      },
      {
        id: "export",
        label: "Export hazard report",
        description: "Download the current operational dataset as CSV.",
        icon: Download,
        run: () => clickButton("Export report"),
      },
      {
        id: "refresh",
        label: "Refresh system health",
        description: "Recheck Worker, API and D1 availability.",
        icon: RefreshCw,
        run: () => void checkHealth(),
      },
      {
        id: "api",
        label: "Open report API",
        description: "Inspect the live JSON report endpoint in a new tab.",
        icon: ExternalLink,
        run: () => window.open("/api/reports", "_blank", "noopener,noreferrer"),
      },
    ],
    [checkHealth],
  );

  const filteredActions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return actions;
    return actions.filter((action) =>
      `${action.label} ${action.description}`.toLowerCase().includes(needle),
    );
  }, [actions, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.altKey) {
        const shortcutMap: Record<string, string> = {
          "1": "overview",
          "2": "reports",
          "3": "analytics",
          "4": "roads",
          "5": "model",
          "6": "authority",
          r: "report",
        };
        const actionId = shortcutMap[event.key.toLowerCase()];
        const action = actions.find((item) => item.id === actionId);
        if (action) {
          event.preventDefault();
          runAndClose(action.run);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions, runAndClose]);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

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
      <a className="ops-skip-link" href="#main-content">
        Skip to main content
      </a>

      {health === "offline" && (
        <div className="ops-offline-banner" role="status">
          <WifiOff size={15} /> You are offline. Cached interface data may still be available.
        </div>
      )}

      <div className="ops-dock" aria-label="CivicLens quick operations">
        <button
          className={`ops-health-pill ops-health-${health}`}
          onClick={() => void checkHealth()}
          title="Refresh system health"
        >
          {health === "offline" ? <WifiOff size={14} /> : <Wifi size={14} />}
          <span>{healthLabel}</span>
          <RefreshCw className={health === "checking" ? "ops-spin" : ""} size={13} />
        </button>
        <button className="ops-command-button" onClick={() => setOpen(true)} aria-label="Open command center">
          <Command size={17} />
          <span>Command center</span>
          <kbd>Ctrl K</kbd>
        </button>
      </div>

      {open && (
        <div className="ops-command-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="ops-command-panel"
            role="dialog"
            aria-modal="true"
            aria-label="CivicLens command center"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="ops-command-head">
              <div>
                <span className="ops-command-icon"><Command size={18} /></span>
                <div>
                  <strong>CivicLens command center</strong>
                  <small>Navigate, verify services and launch common actions</small>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close command center"><X size={17} /></button>
            </header>

            <label className="ops-command-search">
              <Search size={17} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search actions, workspaces or system tools…"
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
                  <strong>{healthPayload?.database?.latencyMs ?? "—"}{healthPayload?.database?.latencyMs != null ? " ms" : ""}</strong>
                </div>
              </article>
              <article>
                <span className="ops-health-orb"><Bot size={17} /></span>
                <div><small>Inference</small><strong>{healthPayload?.inference?.mode ?? "Demo adapter"}</strong></div>
              </article>
            </div>

            <div className="ops-action-list" role="listbox" aria-label="Available commands">
              {filteredActions.length ? filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.id} onClick={() => runAndClose(action.run)}>
                    <span><Icon size={17} /></span>
                    <div><strong>{action.label}</strong><small>{action.description}</small></div>
                    {action.shortcut && <kbd>{action.shortcut}</kbd>}
                  </button>
                );
              }) : (
                <div className="ops-empty-command">No command matches “{query}”.</div>
              )}
            </div>

            <footer className="ops-command-foot">
              <span><Keyboard size={14} /> Use arrow keys or shortcuts for faster operations.</span>
              <div>
                {installPrompt && (
                  <button onClick={() => void installApp()}><Smartphone size={14} /> Install app</button>
                )}
                <small>{lastChecked ? `Checked ${lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Not checked yet"}</small>
              </div>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
