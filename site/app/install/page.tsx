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

        <aside className="release-banner"><strong>Public source / project-local install verified</strong><p>This command installed the public skill into a disposable repository for both agents. Claude Code used its project-local copy in non-writing <code>consult</code> mode. A plain <code>$factory</code> invocation selected a same-name user-wide skill; explicitly naming the project-local path selected the correct copy. Duplicate-name behavior in the interactive skill picker remains unverified. One complete run on the Factory codebase is documented. <a href="https://factory.olegkoval.com/case-studies/development-hydration-warning/">Inspect the full run ↗</a> · <a href="https://github.com/oleg-koval/factory/blob/main/docs/install-verification.md">Read the install verification record ↗</a></p></aside>

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
            <p>If Codex also has a user-wide <code>factory</code> skill, it may choose that copy. Say: “Use <code>.agents/skills/factory/SKILL.md</code> specifically, then consult on my request. Report the path you loaded.” This workaround was tested.</p>
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
            <li><span>✓</span>A fresh, path-directed Codex consult used <code>.agents/skills/factory/SKILL.md</code>.</li>
            <li><span>!</span>Plain <code>$factory</code> selected the same-name user-wide copy; duplicate-name behavior in the interactive skill picker remains unverified.</li>
            <li><span>✓</span>A fresh Claude Code session used <code>/factory consult</code> from the public project-local install.</li>
            <li><span>—</span>Global installation on a clean target remains unverified.</li>
          </ul>
        </section>

        <section className="content-callout first-run-callout">
          <p className="eyebrow">Your first real run</p>
          <h2>Bring one bug you actually observed.</h2>
          <p>Replace the brackets with a real behavior from a codebase you own. Include where you saw it; Factory records that provenance, then tries to reproduce the behavior before proposing a fix.</p>
          <pre><code>{`Claude Code: /factory I observed [actual behavior] after [action] in [feature]. Expected [expected behavior]. Source: [ticket, Sentry event, test, log, or my own observation]. Reproduce it before changing code.

Codex: $factory I observed [actual behavior] after [action] in [feature]. Expected [expected behavior]. Source: [ticket, Sentry event, test, log, or my own observation]. Reproduce it before changing code.`}</code></pre>
          <p>If Codex might select a same-name user-wide Factory skill, start your prompt with: <code>Use .agents/skills/factory/SKILL.md specifically.</code> Then ask it to report the path it loaded.</p>
          <p>Factory records intake under <code>.factory/</code>, asks you to confirm testable acceptance criteria, then creates an external worktree and measures its baseline before code edits. If you have no real behavior to investigate, use <code>consult</code>: it reads and advises without writing files. Don’t invent a bug just to exercise the workflow.</p>
          <p>Resume an existing gated run with <code>resume &lt;slug&gt;</code>. <a href="/how-it-works/">Inspect every gate <span aria-hidden="true">↗</span></a></p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
