// Generates schema.org JSON-LD for a wellness business + service.
// Pattern: LocalBusiness + MedicalBusiness + Service per therapy.
// Goal: hand the user copy-paste-ready JSON-LD blocks for solivana.com pages.

import type { ProfileRecord } from "./storage";
import type { WellnessService } from "./wellness-services";

export type SchemaInput = {
  profile: ProfileRecord;
  service?: WellnessService;
  serviceUrl?: string; // e.g. https://www.solivana.com/float-therapy/
  streetAddress?: string;
  postalCode?: string;
  phone?: string;
};

export function generateLocalBusinessSchema(input: SchemaInput): object {
  const { profile, streetAddress, postalCode, phone } = input;
  const fullDomain = profile.domain
    ? profile.domain.startsWith("http")
      ? profile.domain
      : `https://${profile.domain}`
    : undefined;

  const sameAs: string[] = [];
  if (profile.aliases?.length) {
    // Aliases sometimes are external URLs (G+ etc.); only include valid URLs
    profile.aliases.forEach((a) => {
      if (a.startsWith("http")) sameAs.push(a);
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "MedicalBusiness", "HealthAndBeautyBusiness"],
    "@id": fullDomain ?? `urn:halo:${profile.id}`,
    name: profile.brand,
    alternateName: profile.aliases?.filter((a) => !a.startsWith("http")) ?? undefined,
    url: fullDomain,
    telephone: phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: streetAddress ?? undefined,
      addressLocality: profile.city,
      addressRegion: profile.region,
      postalCode: postalCode ?? undefined,
      addressCountry: "US",
    },
    areaServed: [
      profile.city,
      profile.region,
      ...(profile.adjacentCities ?? []),
    ].filter(Boolean),
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function generateServiceSchema(input: SchemaInput): object | null {
  const { profile, service, serviceUrl } = input;
  if (!service) return null;
  const fullDomain = profile.domain
    ? profile.domain.startsWith("http")
      ? profile.domain
      : `https://${profile.domain}`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.brandExact,
    name: `${service.brandExact} at ${profile.brand}`,
    alternateName: service.variants,
    url: serviceUrl,
    provider: {
      "@type": "LocalBusiness",
      "@id": fullDomain ?? `urn:halo:${profile.id}`,
      name: profile.brand,
    },
    areaServed: [
      profile.city,
      profile.region,
      ...(profile.adjacentCities ?? []),
    ].filter(Boolean),
    audience:
      profile.audiences && profile.audiences.length > 0
        ? {
            "@type": "Audience",
            audienceType: profile.audiences.join(", "),
          }
        : undefined,
    description: `${service.brandExact} at ${profile.brand} in ${profile.city}, ${profile.region}. Outcomes: ${service.outcomes.join(", ")}.`,
  };
}

export function pretty(obj: object | null): string {
  if (!obj) return "";
  // strip undefined keys recursively for clean output
  const clean = JSON.parse(JSON.stringify(obj));
  return `<script type="application/ld+json">\n${JSON.stringify(clean, null, 2)}\n</script>`;
}
