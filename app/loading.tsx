import { Activity } from "lucide-react";

export default function Loading() {
  return (
    <main className="ops-state-page" aria-busy="true" aria-live="polite">
      <section className="ops-state-card">
        <span><Activity size={24} /></span>
        <h1>Loading city intelligence</h1>
        <p>CivicLens is connecting the dashboard, Worker API and operational data.</p>
        <div className="ops-loading-grid" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
      </section>
    </main>
  );
}
