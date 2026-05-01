"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WELLNESS_SERVICES } from "@/lib/wellness-services";

export default function Onboarding() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    domain: "",
    city: "",
    region: "",
    adjacentCities: "",
    serviceIds: [] as string[],
    focusOutcomes: "",
    competitors: "",
    audiences: "",
  });

  const update = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleService = (id: string) =>
    update(
      "serviceIds",
      form.serviceIds.includes(id) ? form.serviceIds.filter((s) => s !== id) : [...form.serviceIds, id]
    );

  const submit = async () => {
    setSubmitting(true);
    const payload = {
      brand: form.brand,
      domain: form.domain || undefined,
      city: form.city,
      region: form.region,
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
    const data = await res.json();
    if (data?.id) router.push(`/dashboard/${data.id}`);
    else setSubmitting(false);
  };

  const ready = form.brand && form.city && form.region && form.serviceIds.length > 0;

  return (
    <main>
      <h1>Tell us about your business</h1>
      <p className="subtitle">Five fields. We handle the rest.</p>

      <label>Business name *</label>
      <input type="text" value={form.brand} onChange={(e) => update("brand", e.target.value)} placeholder="SoliVana Wellness" />

      <label>Website</label>
      <input type="url" value={form.domain} onChange={(e) => update("domain", e.target.value)} placeholder="solivana.com" />
      <p className="hint">Used to detect when LLMs cite your site (not just mention your name).</p>

      <label>City *</label>
      <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Redwood City" />

      <label>Region *</label>
      <input type="text" value={form.region} onChange={(e) => update("region", e.target.value)} placeholder="Bay Area, Silicon Valley, Peninsula" />
      <p className="hint">How locals describe your area. Comma-separate if multiple apply.</p>

      <label>Adjacent cities (optional)</label>
      <input type="text" value={form.adjacentCities} onChange={(e) => update("adjacentCities", e.target.value)} placeholder="Atherton, Menlo Park, Palo Alto" />

      <label>Services offered *</label>
      <p className="hint">Pick everything you offer. We'll generate prompts that surface each one.</p>
      <div className="checkbox-grid">
        {WELLNESS_SERVICES.map((s) => (
          <label key={s.id}>
            <input
              type="checkbox"
              checked={form.serviceIds.includes(s.id)}
              onChange={() => toggleService(s.id)}
            />
            {s.brandExact}
          </label>
        ))}
      </div>

      <label>Conditions or outcomes you specialize in (optional)</label>
      <input type="text" value={form.focusOutcomes} onChange={(e) => update("focusOutcomes", e.target.value)} placeholder="Hashimoto's, burnout, long covid" />

      <label>Competitors to track (optional)</label>
      <input type="text" value={form.competitors} onChange={(e) => update("competitors", e.target.value)} placeholder="Remedy Place, Bay Area Brain Spa" />

      <label>Target audiences (optional)</label>
      <input type="text" value={form.audiences} onChange={(e) => update("audiences", e.target.value)} placeholder="executives, athletes, couples" />

      <button onClick={submit} disabled={!ready || submitting}>
        {submitting ? "Saving…" : "Save & generate prompts →"}
      </button>
    </main>
  );
}
