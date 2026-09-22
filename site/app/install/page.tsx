import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";

export const metadata: Metadata = {
  title: "Install Factory for Claude Code and Codex",
  description: "Install one provider-neutral Factory skill for Claude Code or Codex, then run the same delivery contract with each host's native invocation.",
  alternates: { canonical: "/install/" },
};

export default function InstallPage() {
  return (
    <>
      <SiteHeader />
      <main className="inner-page">
        <header className="page-hero page-hero-short">
          <p className="eyebrow">Install Factory</p>
          <h1>Bring your own agent. Keep the gates.</h1>
          <p className="page-deck">One provider-neutral skill, using each host’s native invocation and runner. The public repository is not live yet; the command shape below is staged, not an install claim.</p>
        </header>

        <aside className="release-banner"><strong>Pre-release boundary</strong><p>Local package discovery and installation passed on 2026-09-21. Installation from <code>oleg-koval/factory</code> remains unproven until the repository is public.</p></aside>

        <section className="install-grid">
          <article>
            <div className="install-heading"><span>01</span><h2>Claude Code</h2></div>
            <pre><code>npx skills add oleg-koval/factory -g -a claude-code -y</code></pre>
            <p>After installation: <code>/factory consult &lt;request&gt;</code></p>
          </article>
          <article>
            <div className="install-heading"><span>02</span><h2>Codex</h2></div>
            <pre><code>npx skills add oleg-koval/factory -g -a codex -y</code></pre>
            <p>After installation: <code>$factory consult &lt;request&gt;</code></p>
          </article>
        </section>

        <section className="verification-section">
          <div className="section-heading">
            <p className="eyebrow">What has actually been verified</p>
            <h2>The local install shape works for both hosts.</h2>
            <p>A disposable Git repository was used to test package discovery, canonical installation, the Claude Code symlink, structural checks, proof verification, and the Codex skill validator.</p>
          </div>
          <ul className="check-list">
            <li><span>✓</span>The CLI discovered exactly one root skill named <code>factory</code>.</li>
            <li><span>✓</span>Claude Code and Codex resolved to the same <code>SKILL.md</code>.</li>
            <li><span>✓</span>The installed proof suite reported 3 claims, 13 artifacts, and 3 executable cases.</li>
            <li><span>✓</span>The seven-route search specification passed locally.</li>
            <li><span>—</span>Public installation and fresh-session invocation remain release gates.</li>
          </ul>
        </section>

        <section className="content-callout">
          <p className="eyebrow">Start safely</p>
          <h2>Use <code>consult</code> for the CTO view without writing files.</h2>
          <p>Start a full run with a ticket id, Sentry URL, or plain-language request. Use <code>resume &lt;slug&gt;</code> to continue an existing gated run.</p>
          <a className="button button-primary" href="/how-it-works/">Understand the seven gates <span aria-hidden="true">↗</span></a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
