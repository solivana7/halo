import { NextResponse } from "next/server";
import { listProfiles, listScans } from "@/lib/storage";
import { runScan } from "@/lib/runner";
import { SURFACE_LABELS, ALL_SURFACES } from "@/lib/queriers";
import { sendDigest } from "@/lib/email";

// Runs every brand profile, computes diff vs prior scan, emails digest to Natasha.
// Triggered by a Railway cron service hitting this URL with `Authorization: Bearer ${CRON_SECRET}`.
// Set the cron schedule in Railway → Cron Service → Schedule (e.g. "0 13 * * 1" = Monday 6am Pacific).

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

type SurfaceStats = { ok: number; cited: number; pct: number };

function statsBySurface(results: { surface: string; cited: boolean; error?: string }[]) {
  const out: Record<string, SurfaceStats> = {};
  for (const s of ALL_SURFACES) out[s] = { ok: 0, cited: 0, pct: 0 };
  for (const r of results) {
    const bucket = out[r.surface];
    if (!bucket) continue;
    if (r.error) continue;
    bucket.ok += 1;
    if (r.cited) bucket.cited += 1;
  }
  for (const s of ALL_SURFACES) {
    out[s].pct = out[s].ok ? Math.round((out[s].cited / out[s].ok) * 100) : 0;
  }
  return out;
}

function diffSummary(now: SurfaceStats, prev?: SurfaceStats): string {
  if (!prev) return "first scan on record";
  const diff = now.pct - prev.pct;
  const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "→";
  return `${arrow} ${Math.abs(diff)}% vs last week (was ${prev.pct}%)`;
}

export async function POST(req: Request) {
  return GET(req);
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await listProfiles();
  if (profiles.length === 0) {
    return NextResponse.json({ ran: 0, message: "No profiles to scan." });
  }

  const reports: string[] = [];
  let scannedCount = 0;

  for (const profile of profiles) {
    const allScans = await listScans();
    const priorScan = allScans.filter((s) => s.profileId === profile.id)[0];

    let scan;
    try {
      scan = await runScan(profile, { maxPrompts: 12 });
      scannedCount++;
    } catch (err: any) {
      reports.push(`<h3>${profile.brand}</h3><p style="color:#b54a3c">Scan failed: ${err?.message ?? err}</p>`);
      continue;
    }

    const nowStats = statsBySurface(scan.results);
    const prevStats = priorScan ? statsBySurface(priorScan.results) : undefined;

    const rows = ALL_SURFACES.map((s) => {
      const now = nowStats[s];
      const prev = prevStats?.[s];
      return `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #eee">${SURFACE_LABELS[s]}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;color:#EC9247;font-weight:500">${now.cited}/${now.ok} (${now.pct}%)</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;color:#786455;font-size:12px">${diffSummary(now, prev)}</td>
      </tr>`;
    }).join("");

    const overallNow = scan.results.filter((r) => r.cited && !r.error).length;
    const overallTotal = scan.results.filter((r) => !r.error).length;
    const overallPct = overallTotal ? Math.round((overallNow / overallTotal) * 100) : 0;

    reports.push(`
      <div style="margin-bottom:32px;border-left:3px solid #EC9247;padding:12px 16px">
        <h3 style="font-family:Georgia,serif;font-weight:400;color:#331D01;margin:0 0 6px">${profile.brand}</h3>
        <p style="margin:0 0 12px;color:#786455;font-size:13px">${profile.city} · ${profile.region} · <strong style="color:#EC9247">${overallPct}% overall citation rate</strong></p>
        <table style="width:100%;border-collapse:collapse;font-family:-apple-system,sans-serif;font-size:13px">
          <thead><tr><th style="text-align:left;padding:6px 12px;color:#786455;font-weight:500;border-bottom:1px solid #B49F90">Surface</th><th style="text-align:right;padding:6px 12px;color:#786455;font-weight:500;border-bottom:1px solid #B49F90">Cited</th><th style="text-align:left;padding:6px 12px;color:#786455;font-weight:500;border-bottom:1px solid #B49F90">vs Last Week</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:12px 0 0;font-size:12px"><a href="https://halo.solivana.io/dashboard/${profile.id}" style="color:#EC9247">View full dashboard →</a></p>
      </div>
    `);
  }

  const html = `
    <div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:-apple-system,'Helvetica Neue',sans-serif;color:#331D01;background:#FDFAF6">
      <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#EC9247;margin:0 0 8px">Halo · Weekly Digest</p>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;margin:0 0 24px">Your AI visibility this week.</h1>
      <p style="color:#786455;font-size:14px;line-height:1.7;margin:0 0 24px">${scannedCount} brand profile${scannedCount === 1 ? "" : "s"} scanned across Perplexity, Claude, ChatGPT, and Gemini. Diff shows movement vs the previous scan.</p>
      ${reports.join("")}
      <p style="margin-top:32px;padding-top:16px;border-top:1px solid #B49F90;font-size:11px;color:#786455">Generated by Halo AI · halo.solivana.io · Sent automatically each week to operations.</p>
    </div>
  `;

  let emailResult: any = { skipped: true, reason: "RESEND_API_KEY not set" };
  if (process.env.RESEND_API_KEY) {
    try {
      emailResult = await sendDigest({
        subject: `Halo · Weekly Digest · ${new Date().toLocaleDateString()}`,
        html,
      });
    } catch (err: any) {
      emailResult = { error: err?.message ?? String(err) };
    }
  }

  return NextResponse.json({ scanned: scannedCount, email: emailResult });
}
