import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile, listScans } from "@/lib/storage";
import { buildOutreachTargets } from "@/lib/outreach";
import { SURFACE_LABELS } from "@/lib/queriers";
import Header from "../../../_components/Header";
import Footer from "../../../_components/Footer";
import DraftButton from "./DraftButton";

export const dynamic = "force-dynamic";

export default async function OutreachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const allScans = await listScans();
  const latest = allScans.filter((s) => s.profileId === id)[0];

  return (
    <>
      <Header />
      <main id="main">
        <section className="hero" style={{ paddingBottom: "var(--space-3)" }}>
          <span className="eyebrow">Outreach · {profile.brand}</span>
          <h1 className="display">
            Who's <em>cited where you aren't.</em>
          </h1>
          <p className="subtitle">
            These are the publishers AI is already trusting on the queries you're missing. Pitch each one for inclusion — we draft the email in your voice.
          </p>
        </section>

        <section className="container" style={{ maxWidth: 880 }}>
          {!latest ? (
            <div className="card">
              <span className="card-eye">No scan yet</span>
              <h3>Run a scan first</h3>
              <p>
                Outreach targets are built from your latest scan results. Head back to the dashboard and click Run Scan.
              </p>
              <div style={{ marginTop: 16 }}>
                <Link href={`/dashboard/${id}`} className="btn">← Back to Dashboard</Link>
              </div>
            </div>
          ) : (
            (() => {
              const targets = buildOutreachTargets(latest, profile.domain);
              if (targets.length === 0) {
                return (
                  <div className="card">
                    <span className="card-eye">No targets</span>
                    <h3>You're either fully cited or no useful publishers were named</h3>
                    <p>
                      Either every query surfaced you (clean sweep) or the AIs cited only domains we filter out (Wikipedia, social, etc.). Re-scan in a week.
                    </p>
                  </div>
                );
              }

              const top = targets.slice(0, 12);

              return (
                <>
                  <div className="stat-band">
                    <div className="stat">
                      <div className="stat-num">{top.length}</div>
                      <div className="stat-label">Top Publishers</div>
                    </div>
                    <div className="stat">
                      <div className="stat-num">{targets.reduce((n, t) => n + t.hits.length, 0)}</div>
                      <div className="stat-label">Citations Mined</div>
                    </div>
                    <div className="stat">
                      <div className="stat-num">{targets[0]?.hits.length ?? 0}</div>
                      <div className="stat-label">Top Hit Count</div>
                    </div>
                  </div>

                  <div className="notice" style={{ marginBottom: "var(--space-3)" }}>
                    <strong>How to use this.</strong> Click <em>Draft Pitch</em> on any publisher to generate a personalized inclusion email in your founder voice. Copy, send, and re-scan in two weeks to confirm the citation lift.
                  </div>

                  {top.map((t) => (
                    <div key={t.domain} className="card">
                      <span className="card-eye">{t.surfaces.map((s) => SURFACE_LABELS[s] ?? s).join(" · ")}</span>
                      <h3>{t.domain}</h3>
                      <p>
                        Cited <strong style={{ color: "var(--orange)" }}>{t.hits.length} {t.hits.length === 1 ? "time" : "times"}</strong> across {t.topQueries.length} {t.topQueries.length === 1 ? "query" : "queries"} where {profile.brand} was not.
                      </p>

                      <div style={{ marginTop: 12, marginBottom: 12 }}>
                        {t.topQueries.slice(0, 4).map((q, i) => (
                          <div key={i} style={{ fontSize: 13, color: "var(--mid)", padding: "4px 0" }}>
                            <span className="tag">{q}</span>
                          </div>
                        ))}
                        {t.topQueries.length > 4 && (
                          <div style={{ fontSize: 12, color: "var(--warm-gray)", marginTop: 6 }}>
                            +{t.topQueries.length - 4} more
                          </div>
                        )}
                      </div>

                      <details style={{ fontSize: 13, color: "var(--mid)", marginBottom: 12 }}>
                        <summary style={{ cursor: "pointer", color: "var(--brown)" }}>
                          Show the {t.hits.length} cited URL{t.hits.length === 1 ? "" : "s"}
                        </summary>
                        <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                          {t.hits.slice(0, 8).map((h, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>
                              <a href={h.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--orange)" }}>
                                {h.title || h.url}
                              </a>
                            </li>
                          ))}
                          {t.hits.length > 8 && <li>+{t.hits.length - 8} more</li>}
                        </ul>
                      </details>

                      <DraftButton profileId={id} domain={t.domain} />
                    </div>
                  ))}
                </>
              );
            })()
          )}

          <div className="notice" style={{ marginTop: "var(--space-4)" }}>
            <strong>Generated by Halo AI.</strong> Pitch emails are drafted by Claude using your locked founder voice. Always review and personalize before sending — the publisher will appreciate the touch.
          </div>

          <div style={{ marginTop: "var(--space-4)" }}>
            <Link href={`/dashboard/${id}`} className="btn btn-secondary">← Back to Dashboard</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
