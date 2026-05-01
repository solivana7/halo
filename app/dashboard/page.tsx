import Link from "next/link";
import { listProfiles } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const profiles = await listProfiles();
  return (
    <main>
      <h1>Dashboard</h1>
      <p className="subtitle">Your tracked brands.</p>

      {profiles.length === 0 ? (
        <p>
          No brands yet. <Link href="/onboarding">Set one up →</Link>
        </p>
      ) : (
        <div>
          {profiles.map((p) => (
            <div key={p.id} className="card">
              <h3>
                <Link href={`/dashboard/${p.id}`}>{p.brand}</Link>
              </h3>
              <p className="hint">
                {p.city} · {p.region} · {p.serviceIds.length} services
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
