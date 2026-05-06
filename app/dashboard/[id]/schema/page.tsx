import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/storage";
import { WELLNESS_SERVICES } from "@/lib/wellness-services";
import Header from "../../../_components/Header";
import Footer from "../../../_components/Footer";
import SchemaTool from "./SchemaTool";

export const dynamic = "force-dynamic";

export default async function SchemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const myServices = WELLNESS_SERVICES.filter((s) => profile.serviceIds.includes(s.id));

  return (
    <>
      <Header />
      <main id="main">
        <section className="hero" style={{ paddingBottom: "var(--space-3)" }}>
          <span className="eyebrow">Schema · {profile.brand}</span>
          <h1 className="display">
            Make Google know <em>exactly who you are.</em>
          </h1>
          <p className="subtitle">
            Generate JSON-LD schema markup for your business + every service. Paste into the page&rsquo;s &lt;head&gt; or your SEO plugin&rsquo;s schema field. Indexes within 1–3 days. Single largest entity-recognition lever for Google, Gemini, ChatGPT, and Claude.
          </p>
        </section>

        <section className="container" style={{ maxWidth: 920 }}>
          <div className="notice">
            <strong>How to use.</strong> Pick a service below, copy the JSON-LD block, paste it into the matching page on www.solivana.com (in the AIOSEO &ldquo;Schema&rdquo; tab or directly in the page&rsquo;s head). Re-submit the URL in Google Search Console after publishing. Re-scan in Halo in 7–14 days.
          </div>

          <SchemaTool profile={profile} services={myServices} />

          <div style={{ marginTop: "var(--space-4)" }}>
            <Link href={`/dashboard/${id}`} className="btn btn-secondary">← Back to Dashboard</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
