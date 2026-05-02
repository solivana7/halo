"use client";

import { useState } from "react";

type Draft = { domain: string; subject: string; body: string };

export default function DraftButton({
  profileId,
  domain,
}: {
  profileId: string;
  domain: string;
}) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId, domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Draft failed (${res.status})`);
      } else {
        setDraft(data);
      }
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!draft) return;
    const text = `Subject: ${draft.subject}\n\n${draft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback handled by browser; ignore
    }
  };

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className="btn btn-secondary"
        aria-busy={loading}
      >
        {loading ? "Drafting…" : draft ? "Regenerate Pitch" : "Draft Pitch"}
      </button>

      {error && (
        <div className="notice notice-error" role="alert" style={{ marginTop: 12 }}>
          <strong>Couldn't draft.</strong> {error}
        </div>
      )}

      {draft && (
        <div
          style={{
            marginTop: 16,
            padding: "var(--space-3)",
            background: "var(--sand)",
            border: "1px solid var(--hairline)",
            borderLeft: "3px solid var(--orange)",
          }}
          aria-live="polite"
        >
          <p
            style={{
              fontFamily: "var(--font-hero)",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--orange)",
              marginBottom: 8,
            }}
          >
            Subject
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              color: "var(--brown)",
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            {draft.subject}
          </p>

          <p
            style={{
              fontFamily: "var(--font-hero)",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--orange)",
              marginBottom: 8,
            }}
          >
            Body
          </p>
          <pre
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--brown)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontWeight: 300,
              margin: 0,
            }}
          >
            {draft.body}
          </pre>

          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={copy} className="btn">
              {copied ? "Copied ✓" : "Copy Email"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
