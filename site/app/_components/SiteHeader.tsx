import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Factory home">
        Factory<span aria-hidden="true">.</span>
      </Link>
      <div className="header-status">
        <span className="status-dot" aria-hidden="true" />
        Open source / local proof
      </div>
      <nav aria-label="Primary navigation">
        <a href="/how-it-works/">How</a>
        <a href="/proof/">Proof</a>
        <a href="/essays/right-to-say-not-delivered/">Essay</a>
        <a href="/install/">Install</a>
        <a href="/oleg-koval/">Built by Oleg</a>
      </nav>
      <a className="header-cta" href="/proof/">
        Inspect proof
        <span aria-hidden="true">↘</span>
      </a>
    </header>
  );
}
