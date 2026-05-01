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
        setError(`Scan failed (${res.status})`);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      setError(e?.message ?? "Scan failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <button onClick={run} disabled={running}>
        {running ? "Scanning across all surfaces… this takes ~2 min" : "Run scan"}
      </button>
      {error && <p className="hint" style={{ color: "#b54a3c" }}>{error}</p>}
    </div>
  );
}
