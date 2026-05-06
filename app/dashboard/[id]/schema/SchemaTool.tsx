"use client";

import { useMemo, useState } from "react";
import type { ProfileRecord } from "@/lib/storage";
import type { WellnessService } from "@/lib/wellness-services";
import {
  generateLocalBusinessSchema,
  generateServiceSchema,
  pretty,
} from "@/lib/schema";

// Solivana-specific defaults — informational, user can override
const DEFAULTS = {
  streetAddress: "1922 El Camino Real",
  postalCode: "94063",
  phone: "+16505644325",
};

export default function SchemaTool({
  profile,
  services,
}: {
  profile: ProfileRecord;
  services: WellnessService[];
}) {
  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? "");
  const [serviceUrl, setServiceUrl] = useState<string>(
    services[0] ? slugUrlFor(profile, services[0]) : ""
  );
  const [streetAddress, setStreetAddress] = useState<string>(DEFAULTS.streetAddress);
  const [postalCode, setPostalCode] = useState<string>(DEFAULTS.postalCode);
  const [phone, setPhone] = useState<string>(DEFAULTS.phone);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId);

  const localBusinessJson = useMemo(
    () =>
      pretty(
        generateLocalBusinessSchema({
          profile,
          streetAddress,
          postalCode,
          phone,
        })
      ),
    [profile, streetAddress, postalCode, phone]
  );

  const serviceJson = useMemo(
    () =>
      pretty(
        generateServiceSchema({
          profile,
          service,
          serviceUrl,
        })
      ),
    [profile, service, serviceUrl]
  );

  const onPickService = (id: string) => {
    setServiceId(id);
    const next = services.find((s) => s.id === id);
    if (next) setServiceUrl(slugUrlFor(profile, next));
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      {/* Address inputs (apply to LocalBusiness block) */}
      <div className="card">
        <span className="card-eye">Business address</span>
        <h3>Used in the LocalBusiness block</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-2)", marginTop: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="street">Street</label>
            <input id="street" type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="zip">Postal code</label>
            <input id="zip" type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="phone">Phone (E.164)</label>
            <input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      </div>

      {/* LocalBusiness output */}
      <div className="card" style={{ marginTop: "var(--space-3)" }}>
        <span className="card-eye">Step 1 · LocalBusiness JSON-LD</span>
        <h3>Paste into the homepage &lt;head&gt;</h3>
        <p>One block per business. Goes on every page; easiest in your global header or AIOSEO &rsquo;global&rsquo; schema field.</p>
        <CodeBlock value={localBusinessJson} onCopy={() => copy(localBusinessJson, "local")} copied={copiedKey === "local"} />
      </div>

      {/* Service picker + Service block */}
      <div className="card" style={{ marginTop: "var(--space-3)" }}>
        <span className="card-eye">Step 2 · Per-service JSON-LD</span>
        <h3>Pick a service. Copy the block. Paste into that service page.</h3>

        <div className="field" style={{ marginTop: 12, marginBottom: 12 }}>
          <label htmlFor="svc">Service</label>
          <select
            id="svc"
            value={serviceId}
            onChange={(e) => onPickService(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "#fff",
              border: "1px solid var(--hairline)",
              borderRadius: 0,
              fontFamily: "var(--font-body)",
              fontSize: 16,
              fontWeight: 300,
              color: "var(--brown)",
              minHeight: 48,
            }}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.brandExact}
              </option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="surl">Service page URL</label>
          <input
            id="surl"
            type="text"
            value={serviceUrl}
            onChange={(e) => setServiceUrl(e.target.value)}
            placeholder="https://www.solivana.com/float-therapy/"
          />
          <p className="hint">Default uses the brand-exact slug pattern that already exists on solivana.com.</p>
        </div>

        <CodeBlock value={serviceJson} onCopy={() => copy(serviceJson, "service")} copied={copiedKey === "service"} />
      </div>
    </div>
  );
}

function CodeBlock({
  value,
  onCopy,
  copied,
}: {
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div style={{ position: "relative", marginTop: 12 }}>
      <pre
        style={{
          background: "var(--brown)",
          color: "var(--cream)",
          padding: "var(--space-3)",
          fontSize: 12,
          lineHeight: 1.6,
          overflowX: "auto",
          borderLeft: "3px solid var(--orange)",
          fontFamily: "var(--font-jost), ui-monospace, monospace",
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {value}
      </pre>
      <div style={{ marginTop: 12 }}>
        <button onClick={onCopy} className="btn btn-secondary" aria-label="Copy JSON-LD to clipboard">
          {copied ? "Copied ✓" : "Copy JSON-LD"}
        </button>
      </div>
    </div>
  );
}

// Convert a wellness-services entry to its likely www.solivana.com slug
function slugUrlFor(profile: ProfileRecord, service: WellnessService): string {
  const domain = profile.domain ? profile.domain.replace(/^https?:\/\//, "").replace(/\/$/, "") : "www.solivana.com";
  // Map service IDs → live slugs from reference_solivana_com_urls.md
  const slugMap: Record<string, string> = {
    rest_floating: "/float-therapy/",
    fire_ice: "/infrared-sauna-cold-plunge/",
    halotherapy: "/halotherapy/",
    pemf: "/pemf-therapy/",
    emtt: "/emtt/",
    red_light: "/red-light-therapy/",
    neurovizr: "/neurovizr/",
    pressotherapy: "/pressotherapy/",
    bowenwork: "/bowenwork/",
    energy_healing: "/energy-healing/",
    vibrational_therapy: "/vibrational-therapy/",
    bioenergetics: "/bioenergetics/",
    mihealth: "/mihealth/",
    zyto: "/zyto/",
  };
  const slug = slugMap[service.id] ?? `/${service.id.replace(/_/g, "-")}/`;
  const proto = profile.domain?.startsWith("http") ? "" : "https://";
  return `${proto}${domain}${slug}`;
}
