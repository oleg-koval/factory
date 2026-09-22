import type { Metadata } from "next";
import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { StructuredData } from "../../_components/StructuredData";

export const metadata: Metadata = {
  title: "Your software factory needs the right to say not delivered",
  description: "Why AI software factories need explicit refusal states, executable completion gates, and agents that can say exactly why work is not delivered.",
  alternates: { canonical: "/essays/right-to-say-not-delivered/" },
  openGraph: { title: "Your software factory needs the right to say not delivered", description: "Reliable agent workflows need an executable delivery contract that can reject false completion.", url: "/essays/right-to-say-not-delivered/", type: "article", images: [{ url: "/og-factory.png", width: 1200, height: 630 }] },
};

export default function EssayPage() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org", "@type": "TechArticle",
        headline: "Your software factory needs the right to say not delivered",
        description: metadata.description,
        datePublished: "2026-09-21", dateModified: "2026-09-21",
        author: { "@type": "Person", name: "Oleg Koval", url: "https://factory.olegkoval.com/oleg-koval/" },
        mainEntityOfPage: "https://factory.olegkoval.com/essays/right-to-say-not-delivered/",
      }} />
      <SiteHeader />
      <main className="article-page">
        <header className="article-hero">
          <p className="eyebrow">Essay / delivery systems</p>
          <h1>Your software factory needs the right to say “not delivered.”</h1>
          <p className="article-lede">More coding agents create more output. Reliable software factories need an executable delivery contract that can reject false completion and explain why.</p>
          <div className="article-byline"><span>By <a href="/oleg-koval/">Oleg Koval</a></span><span>21 September 2026</span><span>8 minute read</span></div>
        </header>

        <article className="article-body">
          <p className="dropcap">AI coding agents are good at producing motion. They inspect a repository, edit files, run a test, and return a confident summary. The hard problem begins when that activity becomes a claim: <em>this change is delivered.</em></p>
          <p>“Done” sounds harmless in a chat window. In a software team, it carries hidden commitments. The request was understood. Blocking decisions were answered. The change was isolated. The test failed for the intended reason before the fix, passed after it, and still caught the bug when the fix was removed. Review covered the whole change, not only the latest diff. Checks that could not run were named rather than blurred into success.</p>
          <p>More agents do not make those commitments true. They make it possible to produce unsupported completion claims faster.</p>

          <h2>A factory needs a delivery contract</h2>
          <p>A useful software factory can isolate work, build changes in parallel, collect before-and-after evidence, and send the result through review. Those capabilities improve throughput and make agent work easier to inspect.</p>
          <p>They still leave one question unanswered: what must be true before a run may call itself delivered?</p>
          <p>Factory treats that as an executable contract rather than a sentence in a prompt. A run carries testable acceptance criteria, open decisions, proof receipts, review outcomes, and a requested terminal state. The gate reads that record and can refuse the terminal claim.</p>
          <aside className="article-pullquote">A workflow describes what should happen. A gate decides whether the record proves that it happened.</aside>

          <h2>The failure that became the first gate</h2>
          <p>The failure shape behind Factory was ordinary enough to be dangerous. A run reached <code>delivered</code> while five blocking questions remained unanswered. Two acceptance criteria were marked <code>partly met</code>, a phrase that sounded encouraging but had no enforceable meaning.</p>
          <p>The prose rules already said not to do this. The run did it anyway.</p>
          <p>Factory now accepts only three acceptance-criterion results: <code>met</code>, <code>unrunnable</code>, or <code>failed</code>. An unanswered blocking question prevents delivery. An unrunnable check is not silently promoted to success; it requires a named gap and explicit acceptance before the run can use <code>delivered-with-gaps</code>.</p>
          <div className="article-proof"><span>Runnable receipt</span><pre><code>{`[false-delivery] exit=1\nGATE: BLOCKED\n5 blocking questions unanswered\n2 acceptance criteria invalid`}</code></pre><a href="/proof/">Inspect the complete proof ↗</a></div>

          <h2>“Blocked” is a product feature</h2>
          <p>A reliable agent needs more than success and failure. Factory uses four explicit terminal states:</p>
          <ul>
            <li><code>delivered</code>: every acceptance criterion was proven and the terminal gate passed.</li>
            <li><code>delivered-with-gaps</code>: named checks could not run and the user explicitly accepted those gaps.</li>
            <li><code>blocked</code>: a missing fact, unanswered decision, or exhausted bounded loop prevents correct delivery.</li>
            <li><code>intentionally-unchanged</code>: diagnosis showed that changing code was not the right treatment.</li>
          </ul>
          <p>These states prevent a common collapse of meaning. “I changed something,” “I could not verify something,” and “nothing should change” are different outcomes. Treating all three as done makes the human reconstruct the truth from a long transcript.</p>

          <h2>The gate must be allowed to fail too</h2>
          <p>An executable gate is not automatically trustworthy. It is software, and software can encode the wrong rule.</p>
          <p>While preparing Factory’s public proof, the gate exposed its own defect. It validated the terminal requested on the command line but did not compare that request with the terminal already recorded in the run state. A caller could ask it to validate <code>delivered</code> against a run recorded as <code>blocked</code>. If the other checks were clean, the old gate returned <code>PASS</code>.</p>
          <p>The <a href="/proof/#case-study">terminal-state mismatch case study</a> preserves the baseline output, the regression, and the fixed refusal. That bug is part of the product story, not an embarrassment edited out of it. A quality system earns trust by making its claims falsifiable—including claims about itself.</p>

          <h2>Proof should survive the demo</h2>
          <p>A polished video can make almost any agent workflow look reliable. The more useful standard is whether another engineer can inspect the record after the presentation ends.</p>
          <ul>
            <li>The acceptance matrix maps each requirement to evidence, a named gap, or failure.</li>
            <li>Receipts preserve the command, result, and commit outside compact carried state.</li>
            <li>The test must fail before the fix, pass after it, and fail again when the fix is removed.</li>
            <li>Milestone review and whole-change review cover different failure scopes.</li>
            <li>The terminal gate emits the exact reasons a completion claim is accepted or refused.</li>
          </ul>

          <h2>The unfair advantage is honest refusal</h2>
          <p>Model capability will keep improving. Agent orchestration will become easier to copy. Neither removes the need to decide what counts as delivered.</p>
          <p>The durable advantage is a workflow built from real failure modes and converted into executable constraints: unanswered decisions, tests without teeth, self-approved permission fallbacks, unbounded retries, oversized state, and locally clean milestones that break a branch-wide invariant.</p>
          <p>Factory is not another conveyor belt for producing code. It is the quality system beneath the conveyor belt. Its job is to make delivery claims inspectable and to refuse the ones the evidence does not support.</p>
          <p className="article-ending">Your coding agent does not need permission to sound confident. It needs the right to say exactly why the work is not delivered.</p>
        </article>

        <section className="article-next"><p className="eyebrow">Continue</p><h2>Watch the claim fail.</h2><a className="button button-primary" href="/proof/">Open the runnable proof <span aria-hidden="true">↗</span></a></section>
      </main>
      <SiteFooter />
    </>
  );
}
