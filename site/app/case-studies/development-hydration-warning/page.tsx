import type { Metadata } from "next";
import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { StructuredData } from "../../_components/StructuredData";

const title = "Factory run case study — Fixing a hydration warning";
const description = "A full Factory run reproduced a development hydration warning, fixed it, and proved the page clean at desktop and mobile widths in development and production.";
const url = "https://factory.olegkoval.com/case-studies/development-hydration-warning/";
const evidence = "https://github.com/oleg-koval/factory/blob/main/proof/case-studies/hydration-warning/README.md";

const baseline = [
  "Unmodified baseline · development mode",
  "1440 × 900  HTTP 200 · heading visible · hydration warning reproduced",
  "390 × 844   HTTP 200 · heading visible · hydration warning reproduced",
  "Production baseline  warning not reproduced",
].join("\n");

const verified = [
  "Fixed site · fresh browser contexts",
  "Development  1440 × 900  PASS · 390 × 844  PASS",
  "Production   1440 × 900  PASS · 390 × 844  PASS",
  "TechArticle JSON-LD and Analytics remain in initial HTML",
].join("\n");

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", images: [] },
  twitter: { title, description, images: [] },
};

export default function HydrationWarningCaseStudyPage() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org", "@type": "TechArticle",
        headline: title, description, mainEntityOfPage: url,
        datePublished: "2026-09-26", dateModified: "2026-09-26",
        author: { "@type": "Person", name: "Oleg Koval", url: "https://factory.olegkoval.com/oleg-koval/" },
        about: "A complete evidence-gated software delivery run",
      }} />
      <SiteHeader />
      <main className="article-page">
        <header className="article-hero">
          <p className="eyebrow">Case study / full Factory run 002</p>
          <h1>The same page warned in development, but not in production.</h1>
          <p className="article-lede">Factory took a hydration warning on its own case-study page from a reproduced baseline to a merged, deployed fix—without dropping Analytics or structured data.</p>
          <div className="article-byline"><span>By <a href="/oleg-koval/">Oleg Koval</a></span><span>Factory run / 23–24 September 2026</span><span>Phase 0–6 / public evidence</span></div>
        </header>

        <article className="article-body">
          <p className="dropcap">A development-only warning can look fixed when a production build stays quiet. Factory did not accept that as enough. The run first reproduced the warning on the exact unmodified baseline at desktop and mobile widths, then compared the two rendering modes before changing code.</p>

          <h2>The baseline was different by environment</h2>
          <p>Fresh development-browser contexts at 1440×900 and 390×844 both showed the visible case-study page and a React hydration diagnostic comparing the page’s <code>TechArticle</code> JSON-LD with an Analytics script. A production-mode browser on the same baseline did not show the warning.</p>
          <div className="article-proof"><span>AC-1 / exact baseline</span><pre role="region" aria-label="Baseline desktop and mobile results" tabIndex={0}><code>{baseline}</code></pre><a href="https://github.com/oleg-koval/factory/blob/main/site/tests/hydration.baseline.browser.test.mjs">Inspect the baseline browser test ↗</a></div>

          <h2>Factory kept the uncertainty visible</h2>
          <p>The investigation found that development rendering placed Analytics in the body before the JSON-LD, while production rendered Analytics in the head. A browser observer saw no node move. That narrowed the evidence to a development rendering mismatch around the scripts; the exact internal framework branch remained unknown. Factory kept that as a non-blocking open fact rather than inventing a more specific cause.</p>

          <h2>The fix kept both signals</h2>
          <p>The change moved the existing <code>beforeInteractive</code> Analytics scripts into the root layout’s <code>&lt;head&gt;</code>. It kept the same Analytics configuration and server-rendered <code>TechArticle</code> JSON-LD. The browser test was then run in fresh desktop and mobile contexts in both development and production.</p>
          <div className="article-proof"><span>AC-2 / fixed site</span><pre role="region" aria-label="Fixed-site desktop and mobile results" tabIndex={0}><code>{verified}</code></pre><a href="https://github.com/oleg-koval/factory/blob/main/site/tests/hydration.browser.test.mjs">Inspect the after-state regression ↗</a></div>

          <h2>The test had to fail without the fix</h2>
          <p>Factory temporarily removed the script-placement change. The full desktop/mobile browser file failed at the expected hydration assertion; restoring the fix returned both cases to green. This teeth check distinguishes a regression test that catches the original defect from one that merely passes on the current code.</p>
          <p>The site suite passed 22/22 tests against a 21-test baseline. Typecheck, lint, and structural checks passed. The read-only CI workflow ran the browser regression without Cloudflare deployment credentials. The full run stopped with this terminal receipt:</p>
          <div className="article-proof"><span>Phase 6 / terminal gate</span><pre role="region" aria-label="Factory terminal gate result" tabIndex={0}><code>GATE: PASS  run=hydration-warning-on-case-study-20260923 terminal=delivered matrix=clean</code></pre><a href={evidence}>Read the sanitized Phase 0–6 evidence digest ↗</a></div>

          <h2>It reached the public site</h2>
          <p><a href="https://github.com/oleg-koval/factory/pull/15">PR #15</a> merged to <code>main</code> after all five checks passed. The merged code was manually deployed, then verified on the canonical domain in desktop and mobile browsers with HTTP 200, visible headings, no horizontal overflow, and no hydration diagnostics.</p>

          <h2>What this proves—and what it does not</h2>
          <p>This is one full Factory run on Factory’s own website, with public tests, a merged pull request, and a deployment record. It is not evidence of general reliability, independent-project repeatability, user adoption, time saved, or defect-rate reduction. The Analytics test proves the browser attempted a <code>page_view</code> request, not that Google accepted or reported it; one request failed in each recorded live session. The exact internal rendering branch also remains unidentified.</p>
          <aside className="article-pullquote">A warning disappearing is a result. Reproducing the baseline and proving why the fix deserves trust is the delivery.</aside>
          <p>Inspect the <a href="/proof/">runnable gate fixtures</a>, the <a href="https://github.com/oleg-koval/factory/pull/15">merged change and checks</a>, and the <a href={evidence}>sanitized run evidence</a>.</p>
        </article>

        <section className="article-next"><p className="eyebrow">Continue</p><h2>See the whole Factory contract.</h2><a className="button button-primary" href="/how-it-works/">Explore the run map <span aria-hidden="true">↗</span></a></section>
      </main>
      <SiteFooter />
    </>
  );
}
