import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { StructuredData } from "../_components/StructuredData";

export const metadata: Metadata = {
  title: "Oleg Koval — Reliable agent-driven software delivery",
  description: "Oleg Koval builds verifiable agent-driven delivery systems that turn AI-generated code into evidence another engineer can inspect.",
  alternates: { canonical: "/oleg-koval/" },
  openGraph: { title: "Oleg Koval — Reliable agent-driven software delivery", description: "Explicit contracts, observable failures, and automation people can audit.", url: "/oleg-koval/", type: "profile", images: [{ url: "/og-factory.png", width: 1200, height: 630 }] },
};

export default function OlegPage() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org", "@type": "ProfilePage", name: "Oleg Koval",
        url: "https://factory.olegkoval.com/oleg-koval/",
        mainEntity: { "@type": "Person", name: "Oleg Koval", url: "https://olegkoval.com/", sameAs: ["https://github.com/oleg-koval", "https://www.linkedin.com/in/kovaloleg/", "https://olko.substack.com/"] },
      }} />
      <SiteHeader />
      <main className="inner-page">
        <header className="profile-hero">
          <div className="profile-monogram" aria-hidden="true">OK</div>
          <div><p className="eyebrow">Oleg Koval / lead engineer + fractional CTO</p><h1>I build systems that have to show their work.</h1><p className="page-deck">More than ten years shipping across fintech, e-commerce, mobility, automation, AI, and open source—with an emphasis on explicit contracts, observable failures, and automation people can audit.</p></div>
        </header>

        <section className="profile-body">
          <aside><span>Operating principle</span><blockquote>Trust the claim only when another engineer can inspect the evidence behind it.</blockquote></aside>
          <div>
            <h2>Why Factory exists</h2>
            <p>Coding agents can produce changes quickly. The harder problem is deciding whether those changes are ready to call delivered without replaying the entire conversation by hand.</p>
            <p>Factory is my answer to failures I no longer wanted to supervise twice. It requires testable acceptance criteria, isolates changes, proves tests have teeth, reviews both milestones and the whole branch, preserves receipts, and ends in one explicit terminal state.</p>
            <p>The claim is deliberately narrow: Factory makes agent delivery claims falsifiable. It does not claim that a gate can choose the right product requirements, eliminate human judgment, or prove speed and quality improvements without measured evidence.</p>
          </div>
        </section>

        <section className="work-evidence">
          <div className="section-heading"><p className="eyebrow">Proof before personality</p><h2>Start with the work.</h2><p>The author page leads back to inspectable artifacts instead of asking a biography to carry the product claim.</p></div>
          <div className="link-ledger">
            <a href="/proof/"><span>01</span><strong>Runnable terminal gate</strong><em>False completion rejected; corrected record accepted</em><b>↗</b></a>
            <a href="/case-studies/terminal-state-mismatch/"><span>02</span><strong>Gate bypass case study</strong><em>Regression, before state, and fixed refusal</em><b>↗</b></a>
            <a href="/how-it-works/"><span>03</span><strong>Delivery contract</strong><em>Seven gates shared by Claude Code and Codex</em><b>↗</b></a>
            <a href="/essays/right-to-say-not-delivered/"><span>04</span><strong>The argument</strong><em>Why a software factory needs refusal states</em><b>↗</b></a>
          </div>
        </section>

        <section className="terminal-section profile-topics">
          <div className="section-heading">
            <p className="eyebrow">Conversation brief</p>
            <h2>Three useful questions for an AI software factory.</h2>
            <p>Factory is a working answer, not a prediction. These are the conversations the public proof can support.</p>
          </div>
          <div className="terminal-grid">
            <article><code>01 / REFUSAL</code><p>What should an agent say when the code changed but the delivery claim is not earned?</p></article>
            <article><code>02 / RECEIPTS</code><p>How do acceptance criteria, test teeth, and review receipts make an AI run inspectable?</p></article>
            <article><code>03 / LEVERAGE</code><p>Why does a one-person software factory need bounded failure states more than another generation trick?</p></article>
          </div>
          <a className="text-link section-link" href="/proof/">Bring the runnable proof to the conversation <span aria-hidden="true">↗</span></a>
        </section>

        <section className="elsewhere-section"><p className="eyebrow">Elsewhere</p><div><a href="https://olegkoval.com/">Portfolio ↗</a><a href="https://github.com/oleg-koval">GitHub ↗</a><a href="https://www.linkedin.com/in/kovaloleg/">LinkedIn ↗</a><a href="https://olko.substack.com/">Writing ↗</a></div></section>
      </main>
      <SiteFooter />
    </>
  );
}
