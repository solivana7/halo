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
            Who&rsquo;s <em>cited where you aren&rsquo;t.</em>
          </h1>
          <p className="subtitle">
            Two lists. <strong>Publishers</strong> = pitch them for inclusion. <strong>Competitors</strong> = your SEO landscape, no pitch.
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
              const allTargets = buildOutreachTargets(latest, profile.domain, profile.competitors ?? []);
              const publishers = allTargets.filter((t) => t.kind === "publisher").slice(0, 12);
              const competitors = allTargets.filter((t) => t.kind === "competitor").slice(0, 12);

              if (allTargets.length === 0) {
                return (
                  <div className="card">
                    <span className="card-eye">No targets</span>
                    <h3>Either fully cited or no useful citations were captured</h3>
                    <p>
                      Either every query surfaced you (clean sweep) or the AIs cited only filtered domains (Wikipedia, social, AI infrastructure). Re-scan in a week.
                    </p>
                  </div>
                );
              }

              return (
                <>
                  <div className="stat-band">
                    <div className="stat">
                      <div className="stat-num">{publishers.length}</div>
                      <div className="stat-label">Pitchable Publishers</div>
                    </div>
                    <div className="stat">
                      <div className="stat-num">{competitors.length}</div>
                      <div className="stat-label">Competitors</div>
                    </div>
                    <div className="stat">
                      <div className="stat-num">{allTargets.reduce((n, t) => n + t.hits.length, 0)}</div>
                      <div className="stat-label">Citations Mined</div>
                    </div>
                  </div>

                  {/* PITCHABLE PUBLISHERS */}
                  <h2 className="section-title" style={{ marginTop: "var(--space-4)" }}>
                    Pitchable publishers
                  </h2>
                  {publishers.length === 0 ? (
                    <div className="card">
                      <span className="card-eye">No publishers this scan</span>
                      <h3>Every cited domain looks like a competing wellness business</h3>
                      <p>
                        That means SEO competition is your near-term lever — outrank competitors on the queries you&rsquo;re missing. Check the Competitor list below for who they are.
                      </p>
                    </div>
                  ) : (
                    publishers.map((t) => (
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
                    ))
                  )}

                  {/* COMPETITORS */}
                  {competitors.length > 0 && (
                    <>
                      <h2 className="section-title" style={{ marginTop: "var(--space-5)" }}>
                        SEO competitors (no pitch)
                      </h2>
                      <p className="hint" style={{ marginBottom: "var(--space-3)" }}>
                        These are competing wellness businesses AI is citing on queries you&rsquo;re missing. You can&rsquo;t pitch them — but knowing who they are tells you who to outrank.
                      </p>

                      {competitors.map((t) => (
                        <div key={t.domain} className="card" style={{ borderLeft: "3px solid var(--mid)" }}>
                          <span className="card-eye" style={{ color: "var(--mid)" }}>
                            Competitor · {t.surfaces.map((s) => SURFACE_LABELS[s] ?? s).join(" · ")}
                          </span>
                          <h3>{t.domain}</h3>
                          <p>
                            <strong style={{ color: "var(--brown)" }}>{t.hits.length} citation{t.hits.length === 1 ? "" : "s"}</strong> across {t.topQueries.length} {t.topQueries.length === 1 ? "query" : "queries"} where {profile.brand} was not.
                            {t.reason && <span style={{ color: "var(--warm-gray)", fontStyle: "italic" }}> · {t.reason}</span>}
                          </p>

                          <div style={{ marginTop: 12 }}>
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

                          <details style={{ fontSize: 13, color: "var(--mid)", marginTop: 12 }}>
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
                        </div>
                      ))}
                    </>
                  )}
                </>
              );
            })()
          )}

          <div className="notice" style={{ marginTop: "var(--space-4)" }}>
            <strong>Generated by Halo AI.</strong> Classification is heuristic — review before sending. Domains containing &ldquo;float / spa / wellness / cryo&rdquo; etc. are flagged as competitors automatically.
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
