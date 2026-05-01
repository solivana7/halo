import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Halo</h1>
      <p className="subtitle">AI visibility tracker for wellness brands. See where ChatGPT, Perplexity, and Claude cite your business — and where your competitors steal the spotlight.</p>

      <div className="card">
        <h3>How it works</h3>
        <ol>
          <li>Tell us your brand, city, and the services you offer.</li>
          <li>We auto-generate the right discovery prompts — no SEO research required.</li>
          <li>We query ChatGPT, Perplexity, and Claude with your prompts every week.</li>
          <li>You get a citation matrix showing where you're cited, where you aren't, and which competitors are taking your slot.</li>
        </ol>
      </div>

      <Link href="/onboarding"><button>Start tracking →</button></Link>
      &nbsp;&nbsp;
      <Link href="/dashboard"><button className="secondary">View dashboard</button></Link>
    </main>
  );
}
