import type { Metadata } from "next";
import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { StructuredData } from "../../_components/StructuredData";

const title = "Factory case study — When a blocked run passed delivery";
const description = "A real Factory gate defect: a blocked run passed a delivered check. Inspect the baseline output, failing regression, fix, and exact refusal receipt.";
const url = "https://factory.olegkoval.com/case-studies/terminal-state-mismatch/";
const source = "https://github.com/oleg-koval/factory/blob/main/proof/case-studies/terminal-state-mismatch/";
const before = [
  "$ python3 <baseline-worktree>/scripts/gate.py <current-checkout>/proof/terminal-gate/mismatched-terminal --terminal delivered",
  "GATE: PASS  run=mismatched-terminal terminal=delivered matrix=clean",
  "$ echo $?",
  "0",
].join("\n");
const after = [
  "$ python3 scripts/gate.py proof/terminal-gate/mismatched-terminal --terminal delivered",
  "GATE: BLOCKED",
  "  state.terminal 'blocked' does not match requested terminal 'delivered'",
  "$ echo $?",
  "1",
  "",
  "$ zsh tests/check.sh",
  "$ echo $?",
  "0",
].join("\n");

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", images: [] },
  twitter: { title, description, images: [] },
};

export default function TerminalStateMismatchPage() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org", "@type": "TechArticle",
        headline: title, description, mainEntityOfPage: url,
        datePublished: "2026-09-23", dateModified: "2026-09-23",
        author: { "@type": "Person", name: "Oleg Koval", url: "https://factory.olegkoval.com/oleg-koval/" },
        about: "Executable delivery gates for AI coding agents",
      }} />
      <SiteHeader />
      <main className="article-page">
        <header className="article-hero">
          <p className="eyebrow">Case study / gate failure 001</p>
          <h1>A blocked run passed the delivery gate.</h1>
          <p className="article-lede">Factory&apos;s own gate once returned <code>PASS</code> for a run recorded as <code>blocked</code>. Here is the contradiction, the regression that caught it, and the refusal the gate gives now.</p>
          <div className="article-byline"><span>By <a href="/oleg-koval/">Oleg Koval</a></span><span>Reproduced 21 September 2026</span><span>Public source and receipts</span></div>
        </header>

        <article className="article-body">
          <p className="dropcap">The delivery gate is the last line between an agent&apos;s claim and a human believing it. A gate that can be persuaded to ignore the run&apos;s recorded state is worse than a missing gate: it gives a false claim the appearance of verification.</p>

          <h2>The contradiction</h2>
          <p>The fixture recorded <code>state.terminal: blocked</code>. The caller requested a check for <code>delivered</code>. The old gate checked the requested terminal but did not compare it with the state already recorded by the run. All its other delivery checks were clean, so it exited successfully.</p>
          <div className="article-proof"><span>Baseline gate / false pass</span><pre role="region" aria-label="Baseline false-pass receipt" tabIndex={0}><code>{before}</code></pre><a href={source + "before.txt"}>Read the preserved baseline receipt ↗</a></div>
          <p>This was a real defect in Factory&apos;s gate, reproduced against baseline commit <a href="https://github.com/oleg-koval/factory/tree/e0f8277804949502fda1134e75e4e6056c8478ae"><code>e0f8277</code></a>. The fixture is public, so the claim does not depend on a polished demo.</p>

          <h2>The test that made the rule executable</h2>
          <p>A regression case set the recorded terminal to <code>blocked</code>, asked the gate for <code>delivered</code>, and asserted that the result must be a refusal. Applied to the old gate, that test failed because the old gate still returned <code>PASS</code>. This is the watch-it-fail step, not merely a test added after the fix.</p>
          <p><a href={source + "regression-test.patch"}>Inspect the regression patch</a> and <a href={source + "README.md"}>reproduction commands</a>.</p>

          <h2>The fixed gate says why</h2>
          <p>The fixed gate rejects a requested terminal that disagrees with the non-null terminal in the run state. The same fixture now exits 1 and names both sides of the contradiction.</p>
          <div className="article-proof"><span>Fixed gate / honest refusal</span><pre role="region" aria-label="Fixed refusal receipt" tabIndex={0}><code>{after}</code></pre><a href={source + "after.txt"}>Read the preserved fixed receipt ↗</a></div>
          <p>The fix landed in <a href="https://github.com/oleg-koval/factory/commit/fd1cd03381451bc610e7424123132cb2f6a12aba"><code>fd1cd03</code></a>. The public <a href="/proof/">proof surface</a> also runs the current gate against three different records: unsupported delivery, supported delivery, and this terminal mismatch.</p>

          <h2>What this proves—and what it does not</h2>
          <p>This case proves that one concrete gate bypass existed, was reproduced against the old code, and is rejected by the fixed code. It was reconstructed from repository history after the change. It is <strong>not</strong> a complete Phase 0–6 Factory-orchestrated run, evidence of production adoption, or a measured improvement in delivery speed or defect rate.</p>
          <aside className="article-pullquote">The quality system needs receipts for its own mistakes, too.</aside>
          <p>That boundary is part of the argument. Factory should not claim more than its evidence supports—even when the claim is about Factory.</p>
        </article>

        <section className="article-next"><p className="eyebrow">Continue</p><h2>Try the gate yourself.</h2><a className="button button-primary" href="/proof/">Open the runnable proof <span aria-hidden="true">↗</span></a></section>
      </main>
      <SiteFooter />
    </>
  );
}
