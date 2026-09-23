import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { StructuredData } from "../_components/StructuredData";

export const metadata: Metadata = {
  title: "Install Factory for Claude Code and Codex",
  description: "Install one provider-neutral Factory skill for Claude Code or Codex, then run the same delivery contract with each host's native invocation.",
  alternates: { canonical: "/install/" },
  openGraph: { title: "Install Factory for Claude Code and Codex", description: "Install the same evidence-gated Factory skill for Claude Code or Codex.", url: "/install/", type: "website", images: [] },
  twitter: { title: "Install Factory for Claude Code and Codex", description: "Install the same evidence-gated Factory skill for Claude Code or Codex.", images: [] },
};

export default function InstallPage() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebPage", name: metadata.title, description: metadata.description, url: "https://factory.olegkoval.com/install/" },
          { "@type": "SoftwareSourceCode", name: "Factory", codeRepository: "https://github.com/oleg-koval/factory", license: "https://opensource.org/license/mit", runtimePlatform: ["Claude Code", "Codex"] },
        ],
      }} />
      <SiteHeader />
      <main className="inner-page">
        <header className="page-hero page-hero-short">
          <p className="eyebrow">Install Factory</p>
          <h1>Bring your own agent. Keep the gates.</h1>
          <p className="page-deck">One provider-neutral skill, using each host’s native invocation and runner. The canonical repository is public and the source has passed a clean installation check.</p>
        </header>

        <aside className="release-banner"><strong>Public source / verified</strong><p>A disposable repository installed from <code>oleg-koval/factory</code> on 2026-09-22. A fresh Codex session invoked the project-local skill in read-only <code>consult</code> mode on 2026-09-23. Global installation and fresh Claude Code invocation remain unproven. <a href="https://github.com/oleg-koval/factory/blob/main/docs/install-verification.md">Read the verification record ↗</a></p></aside>

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
            <h2>The public source resolves for both hosts.</h2>
            <p>A disposable Git repository installed from the public GitHub source to test package discovery, canonical installation, the Claude Code symlink, structural checks, proof verification, and the Codex skill validator.</p>
          </div>
          <ul className="check-list">
            <li><span>✓</span>The CLI discovered exactly one root skill named <code>factory</code>.</li>
            <li><span>✓</span>Claude Code and Codex resolved to the same <code>SKILL.md</code>.</li>
            <li><span>✓</span>The installed proof suite reported 3 claims, 13 artifacts, and 3 executable cases.</li>
            <li><span>✓</span>The eight-route search specification passed locally.</li>
            <li><span>✓</span>A fresh Codex session discovered <code>$factory</code> and used <code>consult</code> without writing files.</li>
            <li><span>—</span>Global installation, fresh Claude Code invocation, and a complete run remain release gates.</li>
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
