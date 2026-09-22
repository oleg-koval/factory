import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";

export const metadata: Metadata = {
  title: "Factory changelog — Every rule begins with a failure",
  description: "Read the failure behind each Factory rule, the regression that proves the fix, and the evidence boundary for every unreleased change.",
  alternates: { canonical: "/changelog/" },
};

const changes = [
  ["Added", "One provider-neutral skill", "Claude Code and Codex use the same contract while retaining native invocation and runners."],
  ["Added", "Runnable refusal specimen", "A redacted fixture shows false delivery blocked, honest delivery accepted, and terminal mismatch rejected."],
  ["Added", "Machine-readable proof manifest", "Every public claim maps to artifacts, expected output, and a visible evidence boundary."],
  ["Added", "Seven-route discovery contract", "Unique metadata, canonical URLs, crawl rules, structured-data boundaries, and evidence sources are validated locally."],
  ["Fixed", "Terminal-state mismatch bypass", "The gate now rejects a requested terminal that conflicts with the state already recorded by the run."],
  ["Fixed", "Ambiguous gate invocation", "Calls without exactly one phase or terminal now fail with a usage error."],
  ["Fixed", "Unsafe runner inputs", "The runner rejects path traversal, shell syntax in slugs, and non-integer session caps."],
];

export default function ChangelogPage() {
  return (
    <>
      <SiteHeader />
      <main className="inner-page">
        <header className="page-hero page-hero-short"><p className="eyebrow">Changelog / unreleased</p><h1>Every rule begins with a failure.</h1><p className="page-deck">Repository history, not release theatre. Everything here is committed local behavior; no public release is claimed yet.</p></header>
        <section className="change-release">
          <div className="release-title"><span>Unreleased</span><p>Release candidate / local</p></div>
          <div className="change-list">
            {changes.map(([kind, title, body], index) => <article key={title}><span className={`change-kind change-${kind.toLowerCase()}`}>{kind}</span><div><h2>{title}</h2><p>{body}</p></div><span className="change-index">0{index + 1}</span></article>)}
          </div>
        </section>
        <section className="content-callout"><p className="eyebrow">Most useful change</p><h2>The gate learned to distrust itself.</h2><p>A regression preserved a contradiction the original terminal check incorrectly passed. The fixed gate now names both states and exits 1.</p><a className="button button-primary" href="/proof/#case-study">Inspect before and after <span aria-hidden="true">↗</span></a></section>
      </main>
      <SiteFooter />
    </>
  );
}
