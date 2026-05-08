import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile, listScans } from "@/lib/storage";
import { generatePrompts } from "@/lib/prompt-templates";
import { SURFACE_LABELS, SURFACE_ENV_VARS, ALL_SURFACES, type Surface } from "@/lib/queriers";
import RunScanButton from "./RunScanButton";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";

export const dynamic = "force-dynamic";

type StatusResp = Record<Surface, boolean>;

async function getStatus(): Promise<StatusResp> {
  return {
    perplexity: Boolean(process.env.PERPLEXITY_API_KEY),
    claude: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    gemini: Boolean(process.env.GOOGLE_AI_API_KEY),
  };
}

export default async function ProfileDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const allScans = await listScans();
  const scans = allScans.filter((s) => s.profileId === id);
  const latest = scans[0];
  const status = await getStatus();
  const missingKeys = ALL_SURFACES.filter((k) => !status[k]);

  const prompts = generatePrompts({
    brand: profile.brand,
    city: profile.city,
    region: profile.region,
    adjacentCities: profile.adjacentCities,
    serviceIds: profile.serviceIds,
    focusOutcomes: profile.focusOutcomes,
    competitors: profile.competitors,
    audiences: profile.audiences,
  });

  const surfaces = ALL_SURFACES;
  const queries = Array.from(new Set((latest?.results ?? []).map((r) => r.query)));
  const cell = (surface: string, query: string) =>
    latest?.results.find((r) => r.surface === surface && r.query === query);

  const validResults = (latest?.results ?? []).filter((r) => !r.error);
  const citedCount = validResults.filter((r) => r.cited).length;
  const totalCells = validResults.length;
  const erroredCells = (latest?.results.length ?? 0) - totalCells;
  const pct = totalCells ? Math.round((citedCount / totalCells) * 100) : 0;

  return (
    <>
      <Header />
      <main id="main">
        <section className="hero" style={{ paddingBottom: "var(--space-3)" }}>
          <span className="eyebrow">{profile.city} · {profile.region}</span>
          <h1 className="display">{profile.brand}</h1>
          <p className="subtitle">
            {profile.serviceIds.length} services tracked · {prompts.length} prompts auto-generated · {scans.length} {scans.length === 1 ? "scan" : "scans"} on record
          </p>
        </section>

        <section className="container" style={{ maxWidth: 1080 }}>
          {/* Missing-key warning — surfaces the most common cause of "err" rows */}
          {missingKeys.length > 0 && (
            <div className="notice notice-error" role="alert">
              <strong>Missing AI provider {missingKeys.length === 1 ? "key" : "keys"}.</strong> Halo can't query{" "}
              {missingKeys.map((k) => SURFACE_LABELS[k]).join(", ")} until {missingKeys.length === 1 ? "this key is" : "these keys are"} set.
              <ul>
                {missingKeys.map((k) => (
                  <li key={k}>
                    <code style={{ background: "rgba(180,159,144,0.18)", padding: "1px 6px" }}>
                      {SURFACE_ENV_VARS[k]}
                    </code>
                  </li>
                ))}
              </ul>
              Set them in Railway → Variables, then redeploy.
            </div>
          )}

          <div style={{ marginBottom: "var(--space-3)", display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
            <RunScanButton profileId={id} />
            {latest && (
              <Link href={`/dashboard/${id}/outreach`} className="btn btn-secondary">
                Open Outreach →
              </Link>
            )}
            <Link href={`/dashboard/${id}/schema`} className="btn btn-secondary">
              Schema Generator →
            </Link>
          </div>

          {!latest ? (
            <>
              <div className="card">
                <span className="card-eye">Ready</span>
                <h3>{prompts.length} prompts queued</h3>
                <p>
                  We generated these from your business profile. Hit <em>Run Scan</em> above to query each one against ChatGPT, Perplexity, and Claude. First scan takes about a minute and costs roughly $0.45 in API fees.
                </p>
              </div>

              <h2 className="section-title">Your generated prompts</h2>
              <div className="card">
                <ol style={{ paddingLeft: 20, color: "var(--mid)", lineHeight: 1.9 }}>
                  {prompts.map((p, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      <span className="tag tag-orange">{p.intent.replace("_", " ")}</span>
                      <span style={{ color: "var(--brown)" }}>{p.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <>
              {/* Headline stat band */}
              <div className="stat-band">
                <div className="stat">
                  <div className="stat-num">{pct}%</div>
                  <div className="stat-label">Citation Rate</div>
                </div>
                <div className="stat">
                  <div className="stat-num">{citedCount}</div>
                  <div className="stat-label">Mentions</div>
                </div>
                <div className="stat">
                  <div className="stat-num">{totalCells}</div>
                  <div className="stat-label">Queries Run</div>
                </div>
                <div className="stat">
                  <div className="stat-num">{erroredCells}</div>
                  <div className="stat-label">Failed Calls</div>
                </div>
              </div>

              <p className="hint" style={{ marginBottom: "var(--space-3)" }}>
                Last scan {new Date(latest.ranAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "short", timeStyle: "medium" })} PT · <strong style={{ color: "var(--brown)" }}>Generated by Halo AI</strong> against third-party providers
              </p>

              {/* Citation matrix */}
              <h2 className="section-title">Citation matrix</h2>
              <div className="matrix">
                <table aria-label="Citation matrix by query and AI surface">
                  <thead>
                    <tr>
                      <th scope="col">Query</th>
                      {surfaces.map((s) => (
                        <th key={s} scope="col" style={{ textAlign: "center" }}>
                          {SURFACE_LABELS[s]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queries.map((q) => (
                      <tr key={q}>
                        <td className="query-cell">{q}</td>
                        {surfaces.map((s) => {
                          const c = cell(s, q);
                          if (!c) return <td key={s} className="surface-cell cell-missing">—</td>;
                          if (c.error) {
                            return (
                              <td key={s} className="surface-cell cell-error" title={c.error}>
                                no answer
                              </td>
                            );
                          }
                          if (c.cited) {
                            return (
                              <td key={s} className="surface-cell cell-cited">
                                ✓{c.position ? ` #${c.position}` : ""}
                              </td>
                            );
                          }
                          return <td key={s} className="surface-cell cell-missing">not cited</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Where you were cited */}
              <h2 className="section-title">Where you were cited</h2>
              {latest.results.filter((r) => r.cited).length === 0 ? (
                <div className="card">
                  <span className="card-eye">No mentions</span>
                  <h3>You weren't named in any answer this scan</h3>
                  <p>
                    Common fixes: tighten your brand-exact service names on your site, build a Google Business Profile if you don't have one, get cited on a respected third-party listicle in your category. Re-scan in a week.
                  </p>
                </div>
              ) : (
                latest.results.filter((r) => r.cited).map((r, i) => (
                  <div key={i} className="card">
                    <span className="tag tag-orange">{SURFACE_LABELS[r.surface]}</span>
                    {r.position && <span className="tag">Position #{r.position}</span>}
                    {r.brandUrlCited && <span className="tag tag-orange">Site cited</span>}
                    <h3 style={{ marginTop: 8 }}>{r.query}</h3>
                    {r.excerpt && (
                      <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--brown)", fontSize: 15 }}>
                        "{r.excerpt}"
                      </p>
                    )}
                    {r.competitorsMentioned.length > 0 && (
                      <p className="hint">Also mentioned: {r.competitorsMentioned.join(", ")}</p>
                    )}
                  </div>
                ))
              )}

              {/* Gaps */}
              <h2 className="section-title">Gaps to close</h2>
              {latest.results.filter((r) => !r.cited && !r.error).length === 0 ? (
                <div className="card">
                  <span className="card-eye">Clean sweep</span>
                  <h3>You appeared on every successful query</h3>
                  <p>Strong AI visibility this scan. Re-run weekly to track drift as the underlying models change.</p>
                </div>
              ) : (
                latest.results
                  .filter((r) => !r.cited && !r.error)
                  .map((r, i) => (
                    <div key={i} className="card">
                      <span className="tag">{SURFACE_LABELS[r.surface]}</span>
                      <h3 style={{ marginTop: 8 }}>{r.query}</h3>
                      {r.competitorsMentioned.length > 0 ? (
                        <p className="hint">
                          <strong style={{ color: "var(--brown)" }}>Cited instead:</strong>{" "}
                          {r.competitorsMentioned.join(", ")}
                        </p>
                      ) : (
                        <p className="hint">No competitor was named either — this query has soft AI coverage. Tactical opportunity.</p>
                      )}
                    </div>
                  ))
              )}

              <div className="notice" style={{ marginTop: "var(--space-3)" }}>
                <strong>Generated by Halo AI.</strong> Excerpts and citations are pulled directly from third-party AI services and shown here unedited. They are informational signals, not editorial endorsements. AI outputs change as the underlying models change — re-scan weekly.
              </div>
            </>
          )}

          <div style={{ marginTop: "var(--space-4)" }}>
            <Link href="/dashboard" className="btn btn-secondary">← All Brands</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
