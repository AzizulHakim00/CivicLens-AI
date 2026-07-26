"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="ops-state-page">
      <section className="ops-state-card" role="alert">
        <span><AlertTriangle size={24} /></span>
        <h1>CivicLens could not load this workspace</h1>
        <p>The live dashboard encountered a temporary runtime problem. Your stored D1 reports are not deleted. Retry the workspace or return to the main dashboard.</p>
        <div className="ops-state-actions">
          <button onClick={reset}><RefreshCw size={14} /> Retry</button>
          <a className="secondary" href="/"><Home size={14} /> Dashboard</a>
        </div>
      </section>
    </main>
  );
}
