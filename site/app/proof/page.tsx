import type { Metadata } from "next";
import manifest from "../../public/proof/manifest.json";
import { ProofExplorer } from "../_components/ProofExplorer";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { StructuredData } from "../_components/StructuredData";

export const metadata: Metadata = {
  title: "Factory Proof — Watch a false delivery claim fail",
  description: "Run Factory's public fixtures and inspect the exact state, acceptance criteria, receipts, and gate output behind every verified delivery claim.",
  alternates: { canonical: "/proof/" },
  openGraph: { title: "Factory Proof — Watch a false delivery claim fail", description: "Three local claims. Thirteen artifacts. One gate allowed to say no.", url: "/proof/", type: "website", images: [{ url: "/og-factory.png", width: 1200, height: 630 }] },
};

export default function ProofPage() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org", "@type": "CollectionPage",
        name: "Factory proof", url: "https://factory.olegkoval.com/proof/",
        hasPart: { "@type": "ItemList", itemListElement: manifest.claims.map((claim, index) => ({ "@type": "ListItem", position: index + 1, name: claim.statement, url: `https://factory.olegkoval.com/proof/#${claim.id}` })) },
      }} />
      <SiteHeader />
      <main className="inner-page">
        <header className="page-hero">
          <p className="eyebrow">Proof surface / verified locally 2026-09-21</p>
          <h1>A delivery claim should survive inspection.</h1>
          <p className="page-deck">Run the same gate against an unsupported claim, a supported claim, and a contradiction the gate itself once missed.</p>
          <div className="hero-metrics"><span><b>3</b> verified-local claims</span><span><b>13</b> mapped artifacts</span><span><b>3</b> executable cases</span></div>
        </header>

        <section className="proof-page-run" id="fixtures">
          <div className="section-heading"><p className="eyebrow">The specimens</p><h2>Same gate. Three different records.</h2><p>Switch between the committed gate receipts. The core claims, artifacts, limits, and before-and-after case remain visible below without client-side JavaScript.</p></div>
          <ProofExplorer />
          <aside className="evidence-boundary"><span>Run locally</span><p><code>bash proof/terminal-gate/run.sh</code> exits 0 only when all three cases produce their expected verdict.</p></aside>
        </section>

        <section className="manifest-section" id="manifest">
          <div className="section-heading"><p className="eyebrow">Machine-readable claims</p><h2>The manifest names the proof—and its limits.</h2><p>These cards are rendered from the public manifest that maps each statement to exact repository artifacts.</p></div>
          <div className="claim-list">
            {manifest.claims.map((claim, index) => (
              <article id={claim.id} key={claim.id}>
                <div className="claim-index">0{index + 1}</div>
                <div className="claim-body"><span className="verified-chip">{claim.status}</span><h3>{claim.statement}</h3><p><strong>Boundary:</strong> {claim.limit}</p><details><summary>{claim.artifacts.length} mapped artifacts</summary><ul>{claim.artifacts.map((artifact) => <li key={artifact}><a href={`https://github.com/oleg-koval/factory/blob/main/${artifact}`}><code>{artifact}</code><span aria-hidden="true"> ↗</span></a></li>)}</ul></details></div>
              </article>
            ))}
          </div>
          <div className="section-actions"><a className="button button-outline" href="/proof/manifest.json">Open proof/manifest.json <span aria-hidden="true">↗</span></a><a className="text-link" href="/proof/terminal-gate.txt">Read exact gate output <span aria-hidden="true">↗</span></a></div>
        </section>

        <section className="case-study" id="case-study">
          <div className="section-heading"><p className="eyebrow">The gate failed too</p><h2>One contradiction. Before and after.</h2><p>The old gate trusted the requested terminal without comparing it with the recorded state. The reconstructed regression is part of the product story.</p></div>
          <div className="before-after">
            <article><span className="result-bad">Before / false pass</span><pre><code>{`state.terminal: blocked\nrequested: delivered\n\nGATE: PASS\nexit=0`}</code></pre><p>Baseline <code>e0f8277</code></p></article>
            <article><span className="result-good">After / honest refusal</span><pre><code>{`state.terminal: blocked\nrequested: delivered\n\nGATE: BLOCKED\nexit=1`}</code></pre><p>Fixed by <code>fd1cd03</code></p></article>
          </div>
          <div className="section-actions"><a className="button button-outline" href="/case-studies/terminal-state-mismatch/">Read the gate-bug case study <span aria-hidden="true">↗</span></a><a className="text-link" href="/case-studies/development-hydration-warning/">Inspect a complete Factory run <span aria-hidden="true">↗</span></a></div>
        </section>

        <aside className="release-banner"><strong>Current evidence boundary</strong><p>{manifest.boundaries.join(" ")}</p></aside>
      </main>
      <SiteFooter />
    </>
  );
}
