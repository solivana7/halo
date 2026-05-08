import Link from "next/link";
import { listProfiles, listScans } from "@/lib/storage";
import Header from "../_components/Header";
import Footer from "../_components/Footer";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const [profiles, allScans] = await Promise.all([listProfiles(), listScans()]);

  return (
    <>
      <Header />
      <main id="main">
        <section className="hero" style={{ paddingBottom: "var(--space-3)" }}>
          <span className="eyebrow">Dashboard</span>
          <h1 className="display">Your tracked <em>brands.</em></h1>
        </section>

        <section className="container" style={{ maxWidth: 880 }}>
          {profiles.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-5)" }}>
              <span className="card-eye">Empty</span>
              <h3>No brands tracked yet</h3>
              <p style={{ marginBottom: "var(--space-3)" }}>
                Add a brand to start watching how AI surfaces cite — or skip — your business.
              </p>
              <Link href="/onboarding" className="btn">Add Your First Brand</Link>
            </div>
          ) : (
            <>
              {profiles.map((p) => {
                const brandScans = allScans.filter((s) => s.profileId === p.id);
                const latest = brandScans[0];
                const cited = latest?.results.filter((r) => r.cited).length ?? 0;
                const total = latest?.results.length ?? 0;
                const pct = total ? Math.round((cited / total) * 100) : 0;

                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/${p.id}`}
                    className="card"
                    style={{ display: "block", textDecoration: "none", color: "inherit" }}
                  >
                    <span className="card-eye">{p.city} · {p.region}</span>
                    <h3>{p.brand}</h3>
                    <p>
                      {p.serviceIds.length} services tracked
                      {latest ? (
                        <> · last scan {new Date(latest.ranAt).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" })} · <strong style={{ color: "var(--orange)" }}>{pct}% citation rate</strong></>
                      ) : (
                        <> · no scans yet</>
                      )}
                    </p>
                  </Link>
                );
              })}
              <div style={{ marginTop: "var(--space-3)" }}>
                <Link href="/onboarding" className="btn btn-secondary">+ Add Another Brand</Link>
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
