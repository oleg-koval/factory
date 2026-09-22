import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { StructuredData } from "../_components/StructuredData";

export const metadata: Metadata = {
  title: "How Factory verifies AI-written software",
  description: "See how Factory turns a ticket or incident into isolated work, testable acceptance criteria, reviewed milestones, and an executable delivery decision.",
  alternates: { canonical: "/how-it-works/" },
};

const phases = [
  { title: "Intake", gate: "The request has a source, a classification, and acceptance criteria that can be verified later.", body: "Factory accepts a Linear issue, Sentry event, or written request. It separates reported symptoms from evidence and turns intentions into observable acceptance criteria." },
  { title: "Isolate", gate: "Isolation is explicit, consent is recorded, and the baseline comes from the real run environment.", body: "The default environment is a separate Git worktree on its own branch. Factory never grants itself permission to fall back into the active checkout." },
  { title: "Diagnose", gate: "The treatment follows evidence, uncertainty is named, and bounded failure can stop honestly.", body: "Factory reproduces the problem, records what it inspected, and stops after two identical failed attempts instead of retrying indefinitely." },
  { title: "Plan", gate: "Blocking questions are answered and the executable plan preserves approved intent.", body: "Facts are investigated. Decisions are put to the user. Code does not begin while a blocking question remains unanswered." },
  { title: "Build", gate: "The test was red, then green, then red again without the fix; the milestone is reviewed and committed.", body: "Each milestone begins with an end-to-end or integration test that fails for the intended reason. Implementation follows only after that observation." },
  { title: "Prove", gate: "Every criterion maps to proof or an explicit gap, and the whole change has been reviewed.", body: "Factory reruns named tests, scans full changed files, expands to callers and contracts, and asks an adversarial reviewer for concrete failure orderings." },
  { title: "Stop", gate: "The terminal state is permitted by the record and the exact gate output is included in the handoff.", body: "An executable gate checks the acceptance matrix, open questions, isolation, consent, receipts, budgets, gaps, and terminal-state agreement." },
];

export default function HowItWorksPage() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org", "@type": "TechArticle",
        headline: "How Factory verifies AI-written software",
        description: metadata.description,
        dateModified: "2026-09-21",
        author: { "@type": "Person", name: "Oleg Koval", url: "https://factory.olegkoval.com/oleg-koval/" },
        mainEntityOfPage: "https://factory.olegkoval.com/how-it-works/",
      }} />
      <SiteHeader />
      <main className="inner-page">
        <header className="page-hero">
          <p className="eyebrow">How Factory works</p>
          <h1>Seven gates between a request and an honest terminal state.</h1>
          <p className="page-deck">Factory does not replace the coding agent or choose product strategy. It changes the delivery contract around the work: what must be known, what must be proven, and which claim the evidence permits.</p>
        </header>

        <div className="phase-stack">
          {phases.map((phase, index) => (
            <section className="phase-row" key={phase.title}>
              <div className="phase-number">0{index + 1}</div>
              <div><p className="eyebrow">Phase {index + 1}</p><h2>{phase.title}</h2></div>
              <div className="phase-copy"><p>{phase.body}</p><aside><span>Gate</span>{phase.gate}</aside></div>
            </section>
          ))}
        </div>

        <section className="content-callout">
          <p className="eyebrow">One contract / two hosts</p>
          <h2>Claude Code invokes <code>/factory</code>. Codex invokes <code>$factory</code>.</h2>
          <p>Both hosts read the same provider-neutral skill, phase files, role configuration, state, and executable gates. Switching providers does not change what delivered means.</p>
          <div className="section-actions"><a className="button button-primary" href="/install/">Install Factory <span aria-hidden="true">↗</span></a><a className="text-link" href="/proof/">Inspect runnable proof <span aria-hidden="true">↗</span></a></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
