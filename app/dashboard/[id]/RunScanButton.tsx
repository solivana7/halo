"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "quick" | "full";

export default function RunScanButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bgStarted, setBgStarted] = useState<{ estimatedSeconds: number } | null>(null);

  const runQuick = async () => {
    setRunning("quick");
    setError(null);
    setBgStarted(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId, maxPrompts: 8 }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || `Scan failed (${res.status}).`);
        setRunning(null);
        return;
      }
      router.refresh();
      setRunning(null);
    } catch {
      setError("Network error. The scan may still be running — refresh in a minute.");
      setRunning(null);
    }
  };

  const runFull = async () => {
    setRunning("full");
    setError(null);
    setBgStarted(null);
    try {
      const res = await fetch("/api/scan/background", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId, maxPrompts: 30 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `Scan failed to start (${res.status}).`);
        setRunning(null);
        return;
      }
      setBgStarted({ estimatedSeconds: data.estimatedSeconds ?? 300 });
      setRunning(null);
    } catch {
      setError("Network error. Could not start background scan.");
      setRunning(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={runQuick}
          disabled={running !== null}
          className="btn"
          aria-busy={running === "quick"}
        >
          {running === "quick" ? "Scanning every surface…" : "Quick Scan (~60s)"}
        </button>
        <button
          onClick={runFull}
          disabled={running !== null}
          className="btn btn-secondary"
          aria-busy={running === "full"}
        >
          {running === "full" ? "Starting…" : "Full Scan (30 prompts, background)"}
        </button>
      </div>

      {running === "quick" && (
        <p className="hint" style={{ marginTop: 12 }} aria-live="polite">
          Querying all four AI surfaces. About 60–90 seconds. Leave this page open.
        </p>
      )}

      {bgStarted && (
        <div className="notice" role="status" style={{ marginTop: 16 }}>
          <strong>Full scan started in the background.</strong> Estimated {Math.ceil(bgStarted.estimatedSeconds / 60)}–{Math.ceil(bgStarted.estimatedSeconds / 60) + 1} minutes. You can close this page; refresh later to see results.
        </div>
      )}

      {error && (
        <div className="notice notice-error" role="alert" style={{ marginTop: 16 }}>
          <strong>Scan didn&rsquo;t complete.</strong> {error}
        </div>
      )}
    </div>
  );
}
