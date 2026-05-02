import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header" role="banner">
      <Link href="/" className="brand-mark" aria-label="Halo home">
        Ha<span>lo</span>
      </Link>
      <nav className="nav-links" aria-label="Primary">
        <Link href="/onboarding">Onboarding</Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
    </header>
  );
}
