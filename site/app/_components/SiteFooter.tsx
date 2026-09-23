import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="wordmark" href="/">
          Factory<span aria-hidden="true">.</span>
        </Link>
        <p>The verification layer for AI software factories.</p>
        <a
          href="https://sellwithboost.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Load the listing site's badge directly. */}
          <img
            src="https://sellwithboost.com/badge/listing.svg"
            alt="Listed on Sell With boost"
            loading="lazy"
            style={{ height: 40, width: "auto" }}
          />
        </a>
      </div>
      <nav aria-label="Footer navigation">
        <a href="/how-it-works/">How it works</a>
        <a href="/proof/">Proof</a>
        <a href="/install/">Install</a>
        <a href="/changelog/">Changelog</a>
        <a href="https://github.com/oleg-koval/factory">GitHub source</a>
        <a href="/oleg-koval/">Oleg Koval</a>
      </nav>
      <div className="footer-meta">
        <span>MIT licensed</span>
        <span>Built for Claude Code + Codex</span>
        <span>Evidence updated 2026-09-23</span>
      </div>
    </footer>
  );
}
