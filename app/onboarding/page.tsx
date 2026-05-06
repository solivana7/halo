"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WELLNESS_SERVICES } from "@/lib/wellness-services";
import Header from "../_components/Header";
import Footer from "../_components/Footer";

export default function Onboarding() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    brand: "",
    aliases: "",
    domain: "",
    city: "",
    region: "",
    adjacentCities: "",
    serviceIds: [] as string[],
    focusOutcomes: "",
    competitors: "",
    audiences: "",
    consent: false,
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleService = (id: string) =>
    update(
      "serviceIds",
      form.serviceIds.includes(id)
        ? form.serviceIds.filter((s) => s !== id)
        : [...form.serviceIds, id]
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        brand: form.brand.trim(),
        aliases: form.aliases.split(",").map((s) => s.trim()).filter(Boolean),
        domain: form.domain.trim() || undefined,
        city: form.city.trim(),
        region: form.region.trim(),
        adjacentCities: form.adjacentCities.split(",").map((s) => s.trim()).filter(Boolean),
        serviceIds: form.serviceIds,
        focusOutcomes: form.focusOutcomes.split(",").map((s) => s.trim()).filter(Boolean),
        competitors: form.competitors.split(",").map((s) => s.trim()).filter(Boolean),
        audiences: form.audiences.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError("Couldn't save your profile. Please try again.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      if (data?.id) router.push(`/dashboard/${data.id}`);
      else {
        setError("Profile saved but we couldn't open the dashboard. Refresh and try the dashboard link.");
        setSubmitting(false);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  const ready =
    !!form.brand.trim() &&
    !!form.city.trim() &&
    !!form.region.trim() &&
    form.serviceIds.length > 0 &&
    form.consent;

  return (
    <>
      <Header />
      <main id="main">
        <section className="hero" style={{ paddingBottom: "var(--space-3)" }}>
          <span className="eyebrow">Step 1 of 1</span>
          <h1 className="display">Tell us about your <em>business.</em></h1>
          <p className="subtitle">
            Five fields. We handle the rest — generating your prompts, querying every AI surface, and surfacing where you're cited (and where you aren't).
          </p>
        </section>

        <section className="container" style={{ maxWidth: 720 }}>
          <form onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="brand">Business name<span className="req" aria-hidden="true">*</span></label>
              <input
                id="brand"
                type="text"
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
                placeholder="SoliVana Wellness"
                autoComplete="organization"
                aria-required="true"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="aliases">Brand aliases</label>
              <input
                id="aliases"
                type="text"
                value={form.aliases}
                onChange={(e) => update("aliases", e.target.value)}
                placeholder="SoliVana, SoliVana Wellness Spa"
              />
              <p className="hint">Optional. Comma-separated alternate names that should also count as a citation. Useful when AI surfaces still know your brand by an older name.</p>
            </div>

            <div className="field">
              <label htmlFor="domain">Website</label>
              <input
                id="domain"
                type="text"
                value={form.domain}
                onChange={(e) => update("domain", e.target.value)}
                placeholder="www.solivana.com"
                autoComplete="url"
                inputMode="url"
              />
              <p className="hint">Used to detect when AI surfaces cite your site directly — not just mention your name.</p>
            </div>

            <div className="field">
              <label htmlFor="city">City<span className="req" aria-hidden="true">*</span></label>
              <input
                id="city"
                type="text"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Redwood City"
                autoComplete="address-level2"
                aria-required="true"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="region">Region<span className="req" aria-hidden="true">*</span></label>
              <input
                id="region"
                type="text"
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
                placeholder="Bay Area"
                aria-required="true"
                required
              />
              <p className="hint">How locals describe your area. Examples: Bay Area · Silicon Valley · Peninsula.</p>
            </div>

            <div className="field">
              <label htmlFor="adjacent">Adjacent cities</label>
              <input
                id="adjacent"
                type="text"
                value={form.adjacentCities}
                onChange={(e) => update("adjacentCities", e.target.value)}
                placeholder="Atherton, Menlo Park, Palo Alto"
              />
              <p className="hint">Optional. Comma-separated. We'll generate location queries for each.</p>
            </div>

            <div className="field">
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={{ display: "block", fontFamily: "var(--font-hero)", fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--brown)", marginBottom: 8 }}>
                  Services offered<span className="req" aria-hidden="true">*</span>
                </legend>
                <p className="hint" style={{ marginTop: 0, marginBottom: 12 }}>Select everything you offer. We generate prompts that surface each one.</p>
                <div className="checkbox-grid" role="group" aria-label="Wellness services">
                  {WELLNESS_SERVICES.map((s) => (
                    <label key={s.id}>
                      <input
                        type="checkbox"
                        checked={form.serviceIds.includes(s.id)}
                        onChange={() => toggleService(s.id)}
                      />
                      <span>{s.brandExact}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="field">
              <label htmlFor="focus">Conditions or outcomes you specialize in</label>
              <input
                id="focus"
                type="text"
                value={form.focusOutcomes}
                onChange={(e) => update("focusOutcomes", e.target.value)}
                placeholder="burnout, Hashimoto's, perimenopause"
              />
              <p className="hint">Optional. Comma-separated. Used to generate outcome-based discovery prompts.</p>
            </div>

            <div className="field">
              <label htmlFor="competitors">Competitors to track</label>
              <input
                id="competitors"
                type="text"
                value={form.competitors}
                onChange={(e) => update("competitors", e.target.value)}
                placeholder="Remedy Place, Restore Hyper Wellness, Next Health"
              />
              <p className="hint">Optional. We'll detect when AI cites them instead of you.</p>
            </div>

            <div className="field">
              <label htmlFor="audiences">Target audiences</label>
              <input
                id="audiences"
                type="text"
                value={form.audiences}
                onChange={(e) => update("audiences", e.target.value)}
                placeholder="executives, founders, athletes"
              />
              <p className="hint">Optional. Comma-separated.</p>
            </div>

            <div className="notice">
              <strong>Privacy &amp; AI disclosure.</strong> The information you submit is stored privately on your Halo instance and used only to generate prompts and run scans against ChatGPT, Perplexity, and Claude. Halo does not sell, share, or train on your data. AI-generated outputs are clearly labeled and presented as informational signals, not recommendations.
            </div>

            <div className="field">
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 300 }}>
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--orange)", marginTop: 4 }}
                  aria-required="true"
                  required
                />
                <span style={{ color: "var(--mid)" }}>
                  I understand Halo will run my prompts against third-party AI services and store the results on this Halo instance.
                </span>
              </label>
            </div>

            {error && (
              <div className="notice notice-error" role="alert">
                <strong>Something didn't go through.</strong> {error}
              </div>
            )}

            <div className="btn-row" style={{ justifyContent: "flex-start", marginTop: "var(--space-3)" }}>
              <button type="submit" className="btn" disabled={!ready || submitting}>
                {submitting ? "Saving Profile…" : "Save & Generate Prompts"}
              </button>
            </div>

            {!ready && !submitting && (
              <p className="hint" style={{ marginTop: 12 }}>
                Fill in business name, city, region, at least one service, and confirm consent.
              </p>
            )}
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
