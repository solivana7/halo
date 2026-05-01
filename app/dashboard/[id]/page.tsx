import { notFound } from "next/navigation";
import { getProfile, listScans } from "@/lib/storage";
import { generatePrompts } from "@/lib/prompt-templates";
import RunScanButton from "./RunScanButton";

export const dynamic = "force-dynamic";

export default async function ProfileDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const allScans = await listScans();
  const scans = allScans.filter((s) => s.profileId === id);
  const latest = scans[0];

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

  // Surface × query matrix from latest scan
  const surfaces = ["perplexity", "claude", "openai"];
  const queries = Array.from(new Set((latest?.results ?? []).map((r) => r.query)));
  const cell = (surface: string, query: string) =>
    latest?.results.find((r) => r.surface === surface && r.query === query);

  const citedCount = latest?.results.filter((r) => r.cited).length ?? 0;
  const totalCells = latest?.results.length ?? 0;

  return (
    <main>
      <h1>{profile.brand}</h1>
      <p className="subtitle">
        {profile.city} · {profile.region} · {profile.serviceIds.length} services tracked
      </p>

      <RunScanButton profileId={id} />

      {!latest ? (
        <div className="card">
          <h3>No scans yet</h3>
          <p>{prompts.length} prompts ready to run across ChatGPT, Perplexity, and Claude. Hit "Run scan" above.</p>
          <h3>Generated prompts</h3>
          <ul>
            {prompts.map((p, i) => (
              <li key={i}>
                <span className="tag">{p.intent}</span> {p.text}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="card">
            <h3>
              Latest scan: {citedCount} of {totalCells} cells cited (
              {totalCells ? Math.round((citedCount / totalCells) * 100) : 0}%)
            </h3>
            <p className="hint">Ran {new Date(latest.ranAt).toLocaleString()}</p>
          </div>

          <h2>Citation matrix</h2>
          <table>
            <thead>
              <tr>
                <th>Query</th>
                {surfaces.map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queries.map((q) => (
                <tr key={q}>
                  <td>{q}</td>
                  {surfaces.map((s) => {
                    const c = cell(s, q);
                    if (!c) return <td key={s}>—</td>;
                    if (c.error) return <td key={s} className="hint">err</td>;
                    return (
                      <td key={s} className={c.cited ? "cell-yes" : "cell-no"}>
                        {c.cited ? `✓${c.position ? ` #${c.position}` : ""}` : "✕"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Where you were cited</h2>
          {latest.results.filter((r) => r.cited).map((r, i) => (
            <div key={i} className="card">
              <span className="tag">{r.surface}</span>
              <strong>{r.query}</strong>
              {r.position && <span className="tag">Position #{r.position}</span>}
              {r.excerpt && <p>"{r.excerpt}"</p>}
              {r.brandUrlCited && <span className="tag">Site cited</span>}
              {r.competitorsMentioned.length > 0 && (
                <p className="hint">Also mentioned: {r.competitorsMentioned.join(", ")}</p>
              )}
            </div>
          ))}

          <h2>Gaps to fix</h2>
          {latest.results.filter((r) => !r.cited && !r.error).map((r, i) => (
            <div key={i} className="card">
              <span className="tag">{r.surface}</span>
              <strong>{r.query}</strong>
              {r.competitorsMentioned.length > 0 && (
                <p className="hint">Cited instead: {r.competitorsMentioned.join(", ")}</p>
              )}
            </div>
          ))}
        </>
      )}
    </main>
  );
}
