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
          <p className="page-deck">One provider-neutral skill, using each host’s native invocation and runner. Start with the verified project-local install in the repository you want Factory to work in.</p>
        </header>

        <aside className="release-banner"><strong>Public source / verified project-local install</strong><p>This exact command installed the public skill into a disposable repository for both agents. Fresh Codex and Claude Code sessions then invoked their project-local copies in non-writing <code>consult</code> mode. One complete run on the Factory codebase is documented; a full run from a clean global install remains unverified. <a href="https://factory.olegkoval.com/case-studies/development-hydration-warning/">Inspect the full run ↗</a> · <a href="https://github.com/oleg-koval/factory/blob/main/docs/install-verification.md">Read the install verification record ↗</a></p></aside>

        <section className="install-grid">
          <article>
            <div className="install-heading"><span>01</span><h2>Install for both agents</h2></div>
            <pre><code>npx --yes skills add oleg-koval/factory -a claude-code -a codex -y</code></pre>
            <p>Run this from the repository where you want to use Factory. It installs the same project-local skill for both hosts.</p>
          </article>
          <article>
            <div className="install-heading"><span>02</span><h2>Invoke in your agent</h2></div>
            <p>After installation: <code>/factory consult &lt;request&gt;</code></p>
            <p>In Codex, use <code>$factory consult &lt;request&gt;</code>. The consult path reads context and proposes a run without modifying files.</p>
          </article>
        </section>

        <section className="verification-section">
          <div className="section-heading">
            <p className="eyebrow">What has actually been verified</p>
            <h2>The public source resolves for both hosts.</h2>
            <p>A disposable Git repository installed from the public GitHub source to test package discovery, canonical project-local installation, the Claude Code symlink, structural checks, proof verification, and the Codex skill validator. Global installation is not represented as verified.</p>
          </div>
          <ul className="check-list">
            <li><span>✓</span>The CLI discovered exactly one root skill named <code>factory</code>.</li>
            <li><span>✓</span>Claude Code and Codex resolved to the same <code>SKILL.md</code>.</li>
            <li><span>✓</span>The installed proof suite reported 3 claims, 13 artifacts, and 3 executable cases.</li>
            <li><span>✓</span>The nine-route search specification passed locally.</li>
            <li><span>✓</span>A fresh Codex session discovered <code>$factory</code> and used <code>consult</code> without writing files.</li>
            <li><span>✓</span>A fresh Claude Code session used <code>/factory consult</code> from the public project-local install.</li>
            <li><span>—</span>Global installation on a clean target remains unverified.</li>
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
