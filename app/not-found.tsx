import { Home, MapPinned } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ops-state-page">
      <section className="ops-state-card">
        <span><MapPinned size={24} /></span>
        <h1>Workspace not found</h1>
        <p>The requested CivicLens route does not exist or may have moved. Return to the live urban hazard dashboard.</p>
        <div className="ops-state-actions">
          <Link href="/"><Home size={14} /> Open dashboard</Link>
        </div>
      </section>
    </main>
  );
}
