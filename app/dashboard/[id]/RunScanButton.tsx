"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunScanButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId, maxPrompts: 12 }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || `Scan failed (${res.status}). Check your API keys in Railway.`);
        setRunning(false);
        return;
      }
      router.refresh();
      setRunning(false);
    } catch {
      setError("Network error. The scan may still be running — refresh in a minute.");
      setRunning(false);
    }
  };

  return (
    <div>
      <button onClick={run} disabled={running} className="btn" aria-busy={running}>
        {running ? "Scanning every surface…" : "Run Scan"}
      </button>
      {running && (
        <p className="hint" style={{ marginTop: 12 }} aria-live="polite">
          Querying ChatGPT, Perplexity, and Claude. About 60–90 seconds. You can leave this page open.
        </p>
      )}
      {error && (
        <div className="notice notice-error" role="alert" style={{ marginTop: 16 }}>
          <strong>Scan didn't complete.</strong> {error}
        </div>
      )}
    </div>
  );
}
