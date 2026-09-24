import type { Metadata } from "next";
import { ProofExplorer } from "./_components/ProofExplorer";
import { RunMapOverview } from "./_components/RunMap";
import { SiteFooter } from "./_components/SiteFooter";
import { SiteHeader } from "./_components/SiteHeader";
import { StructuredData } from "./_components/StructuredData";

export const metadata: Metadata = {
  title: "Factory — Delivery gates for AI coding agents",
  description:
    "Factory is the open-source delivery gate for Claude Code and Codex: acceptance criteria, test-first proof, review receipts, and honest terminal states.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Factory — Delivery gates for AI coding agents",
    description: "Your agent can write code. Factory makes it earn the word delivered.",
    url: "/",
    type: "website",
    images: [{ url: "/og-factory.png", width: 1200, height: 630 }],
  },
};

const gates = [
  ["01", "Intake", "Separate the reported symptom from evidence. Write acceptance criteria that can fail."],
  ["02", "Isolate", "Create a clean branch and worktree. Measure the baseline where the work will run."],
  ["03", "Diagnose", "Reproduce the problem, name the cause, and keep the unknowns visible."],
  ["04", "Plan", "Write the human plan first. Close blocking questions before code begins."],
  ["05", "Build", "Add the end-to-end test before implementation. Review one milestone at a time."],
  ["06", "Prove", "Remove the fix and watch the test fail. Review callers and whole-change invariants."],
  ["07", "Stop", "Run the terminal gate. Report the one state the evidence actually permits."],
];

const failures = [
  {
    title: "Five unanswered questions still looked green",
    body: "A run reached delivered with five open questions and two criteria marked partly met. Factory now permits only met, unrunnable, or failed—and the terminal gate rejects unanswered blockers.",
    mark: "5 + 2",
  },
  {
    title: "The test failed alone and passed in the suite",
    body: "A concurrency test never created the real interleaving inside its own file. Factory now runs the whole test file, removes the fix, and makes the proof fail again.",
    mark: "red → green → red",
  },
  {
    title: "The gate trusted a contradictory terminal",
    body: "The old gate could validate delivered against state already recorded as blocked. The committed regression preserves the bypass and proves the current refusal.",
    mark: "blocked ≠ delivered",
  },
];

const terminalStates = [
  ["delivered", "Every acceptance criterion is proven and the terminal gate passes."],
  ["delivered-with-gaps", "Named checks could not run, and the user explicitly accepted those gaps."],
  ["blocked", "A missing fact, decision, failed criterion, or exhausted loop prevents correct delivery."],
  ["intentionally-unchanged", "Diagnosis shows that changing code is not the right treatment."],
];

export default function Home() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "https://factory.olegkoval.com/#website",
            name: "Factory",
            url: "https://factory.olegkoval.com/",
            description: "Evidence-gated delivery for Claude Code and Codex.",
            author: { "@id": "https://factory.olegkoval.com/oleg-koval/#person" },
          },
          {
            "@type": "SoftwareSourceCode",
            name: "Factory",
            codeRepository: "https://github.com/oleg-koval/factory",
            license: "https://opensource.org/license/mit",
            programmingLanguage: ["Markdown", "Python", "Shell"],
            runtimePlatform: ["Claude Code", "Codex"],
            author: {
              "@type": "Person",
              "@id": "https://factory.olegkoval.com/oleg-koval/#person",
              name: "Oleg Koval",
              url: "https://factory.olegkoval.com/oleg-koval/",
            },
          },
        ],
      }} />
      <SiteHeader />
      <main>
        <section className="hero" id="top">
          <div className="hero-studio-meta">
            <p className="eyebrow">Open-source agent skill for Claude Code + Codex</p>
            <span>Factory / run 001 / public specimen</span>
          </div>
          <div className="hero-studio-layout">
            <div className="hero-message">
              <h1>
                <span>Your agent can write code.</span>
                <span>Factory makes it earn</span>
                <span>the word delivered.</span>
              </h1>
              <div className="hero-lower">
                <p className="hero-copy">
                  Give Factory a ticket, a Sentry issue, or a rough request. It isolates the work,
                  turns the ask into testable acceptance criteria, proves each milestone, and stops
                  with receipts. When it cannot prove the change, it says exactly why.
                </p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#run-flow">Run the flow <span aria-hidden="true">↓</span></a>
                  <a className="text-link" href="/install/">Inspect the skill <span aria-hidden="true">↗</span></a>
                </div>
              </div>
            </div>
            <aside className="studio-contact-sheet" aria-label="The four parts of a Factory delivery decision">
              <div className="studio-tape">Proof edition</div>
              <div className="specimen-frame specimen-claim">
                <div className="specimen-meta"><span>01</span><strong>Claim</strong></div>
                <div className="specimen-mark" aria-hidden="true"><i /><i /><i /></div>
                <p>Agent reports done</p>
              </div>
              <div className="specimen-frame specimen-evidence">
                <div className="specimen-meta"><span>02</span><strong>Evidence</strong></div>
                <div className="specimen-mark" aria-hidden="true"><i /><i /><i /></div>
                <p>Receipts are inspected</p>
              </div>
              <div className="specimen-frame specimen-gate">
                <div className="specimen-meta"><span>03</span><strong>Gate</strong></div>
                <div className="specimen-mark" aria-hidden="true"><i /><i /><i /></div>
                <p>The record decides</p>
              </div>
              <div className="specimen-frame specimen-state">
                <div className="specimen-meta"><span>04</span><strong>State</strong></div>
                <div className="specimen-question" aria-hidden="true">?</div>
                <p>Await the gate</p>
              </div>
            </aside>
          </div>
          <dl className="proof-strip" aria-label="Factory properties">
            <div><dt>Isolated worktree</dt><dd>Consent stays explicit</dd></div>
            <div><dt>Tests fail first</dt><dd>Then lose the fix and fail again</dd></div>
            <div><dt>Fresh-context review</dt><dd>Milestones and whole branch</dd></div>
            <div><dt>Executable gates</dt><dd>Claims answer to evidence</dd></div>
          </dl>
        </section>

        <div className="process-ticker" role="region" aria-label="Factory delivery phases" tabIndex={0}>
          <span>Intake</span><span>Isolate</span><span>Diagnose</span><span>Plan</span>
          <span>Build</span><span>Prove</span><span>Stop</span>
        </div>

        <RunMapOverview />

        <section className="proof-section" id="proof">
          <div className="section-heading">
            <p className="eyebrow">Runnable proof / not a product demo</p>
            <h2>Watch Factory reject a false delivery.</h2>
            <p>
              The redacted fixture preserves the failure shape that created the gate: five open
              blocking questions, two invalid statuses, and a delivery claim the record cannot support.
            </p>
          </div>
          <ProofExplorer />
          <aside className="evidence-boundary">
            <span>Evidence boundary</span>
            <p>
              This is a runnable redacted reconstruction, not the original private run or a
              complete Phase 0–6 delivery. No adoption, speed, or defect-reduction claim is implied.
            </p>
          </aside>
          <div className="section-actions">
            <a className="button button-outline" href="/proof/">Inspect every receipt <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="gates-section" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">One request / seven gates</p>
            <h2>No victory lap without proof.</h2>
            <p>Each gate changes what the run is allowed to claim. Coding is only one phase of delivery.</p>
          </div>
          <ol className="gate-list">
            {gates.map(([number, title, body]) => (
              <li key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
          <a className="text-link section-link" href="/how-it-works/">Read the complete delivery contract <span aria-hidden="true">↗</span></a>
        </section>

        <section className="failure-section">
          <div className="section-heading">
            <p className="eyebrow">Scars turned into gates</p>
            <h2>Every hard rule has a body behind it.</h2>
            <p>These rules came from observed delivery failures, including a bypass in Factory’s own gate.</p>
          </div>
          <div className="failure-grid">
            {failures.map((failure, index) => (
              <article key={failure.title}>
                <div className="failure-mark"><span>0{index + 1}</span><code>{failure.mark}</code></div>
                <h3>{failure.title}</h3>
                <p>{failure.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="comparison-section">
          <div className="section-heading compact-heading">
            <p className="eyebrow">The difference</p>
            <h2>Coding is one phase of delivery.</h2>
          </div>
          <div className="table-wrap" role="region" aria-label="Factory comparison table" tabIndex={0}>
            <table>
              <thead><tr><th scope="col">Decision</th><th scope="col">Ordinary coding agent</th><th scope="col">Factory</th></tr></thead>
              <tbody>
                <tr><th scope="row">Starting point</th><td>Prompt</td><td>Source evidence + testable criteria</td></tr>
                <tr><th scope="row">Workspace</th><td>Current checkout</td><td>Isolated worktree and branch</td></tr>
                <tr><th scope="row">Tests</th><td>Run after implementation</td><td>Fail, pass, remove fix, fail again</td></tr>
                <tr><th scope="row">Review</th><td>Latest diff</td><td>Milestones + callers + invariants</td></tr>
                <tr><th scope="row">Failure</th><td>Retry or summarize</td><td>Bounded loops + explicit blocked state</td></tr>
                <tr><th scope="row">Completion</th><td>Agent says done</td><td>Executable gate permits a claim</td></tr>
                <tr><th scope="row">Handoff</th><td>Chat summary</td><td>Matrix, commits, receipts, gaps</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="terminal-section">
          <div className="section-heading">
            <p className="eyebrow">Four honest endings</p>
            <h2>“Done” is too vague to ship.</h2>
            <p>A delivery system becomes trustworthy when it can distinguish success, accepted gaps, a real blocker, and the decision not to change code.</p>
          </div>
          <div className="terminal-grid">
            {terminalStates.map(([state, meaning]) => (
              <article key={state}>
                <code>{state}</code>
                <p>{meaning}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="essay-promo">
          <p className="eyebrow">The argument</p>
          <blockquote>Your software factory needs the right to say “not delivered.”</blockquote>
          <p>
            More agents create more output. The durable advantage is a quality system that can
            refuse shipment and show another engineer exactly why.
          </p>
          <a className="button button-inverse" href="/essays/right-to-say-not-delivered/">Read the essay <span aria-hidden="true">↗</span></a>
        </section>

        <section className="install-promo">
          <div>
            <p className="eyebrow">For AI agents / install</p>
            <h2>Install Factory.<br />Start with consult.</h2>
            <p>
              Add the public Factory skill to Claude Code or Codex. Begin with <code>consult</code>
              for a read-only CTO view, or give Factory a request to start a full delivery run.
            </p>
          </div>
          <div className="install-preview">
            <p className="release-note"><span>Public source</span> Verified from a clean repository on 2026-09-22.</p>
            <pre><code>{`# Claude Code\nnpx skills add oleg-koval/factory -g -a claude-code -y\n/factory consult "Review this change request"\n\n# Codex\nnpx skills add oleg-koval/factory -g -a codex -y\n$factory consult "Review this change request"`}</code></pre>
            <p>Consult answers in chat and does not write files. Start a full run with a ticket, Sentry URL, or plain-language request.</p>
            <a className="text-link" href="/install/">Read the install and verification guide <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="author-promo">
          <div className="author-index">OK</div>
          <div>
            <p className="eyebrow">Built by Oleg Koval</p>
            <h2>Failures I no longer wanted to supervise twice.</h2>
            <p>
              Oleg is a lead engineer and fractional CTO with more than ten years of experience
              across fintech, e-commerce, mobility, automation, AI, and open source. Factory turns
              his operating principles—explicit contracts and observable failures—into an agent workflow.
            </p>
            <a className="text-link" href="/oleg-koval/">More from Oleg <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="closing-section">
          <p>Your agent does not need a longer prompt.</p>
          <h2>It needs a delivery contract.</h2>
          <a className="button button-primary" href="/proof/">Watch Factory earn “delivered” <span aria-hidden="true">↗</span></a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
