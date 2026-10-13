import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { StructuredData } from "../_components/StructuredData";

export const metadata: Metadata = {
  title: "Factory changelog — Every rule begins with a failure",
  description: "Read the failure behind each Factory rule, the regression that proves the fix, and the evidence boundary for every release.",
  alternates: { canonical: "/changelog/" },
  openGraph: { title: "Factory changelog — Every rule begins with a failure", description: "The public record of Factory's failure-driven rules and fixes.", url: "/changelog/", type: "website", images: [] },
  twitter: { title: "Factory changelog — Every rule begins with a failure", description: "The public record of Factory's failure-driven rules and fixes.", images: [] },
};

const changes110 = [
  ["Added", "Approved scope stays locked", "New runs seal approved plans and detect later changes outside the agreed scope."],
  ["Added", "Milestone release checkpoints", "Each milestone can require a demonstration or release receipt, with an explicit human handoff when verification is pending."],
  ["Fixed", "Deferred ideas avoid missed or duplicate issues", "Quoted titles are matched safely, and interrupted issue creation resumes from persisted handoff state."],
  ["Fixed", "Site dependency audit", "The site audit now reports its time-limited advisory policy and checks the supported dependency set."],
];

const changes100 = [
  ["Added", "One provider-neutral skill", "Claude Code and Codex use the same contract while retaining native invocation and runners."],
  ["Added", "Runnable refusal specimen", "A redacted fixture shows false delivery blocked, honest delivery accepted, and terminal mismatch rejected."],
  ["Added", "Machine-readable proof manifest", "Every public claim maps to artifacts, expected output, and a visible evidence boundary."],
  ["Added", "Nine-route discovery contract", "Unique metadata, canonical URLs, crawl rules, and evidence boundaries are checked locally and on the public site. Indexation remains unverified."],
  ["Updated", "Install verification boundary", "The public skill installs project-locally for Claude Code and Codex. On a machine with a same-name user-wide skill, Codex selected that copy; project-local selection in that collision case remains unverified."],
  ["Fixed", "Terminal-state mismatch bypass", "The gate now rejects a requested terminal that conflicts with the state already recorded by the run."],
  ["Fixed", "Ambiguous gate invocation", "Calls without exactly one phase or terminal now fail with a usage error."],
  ["Fixed", "Unsafe runner inputs", "The runner rejects path traversal, shell syntax in slugs, and non-integer session caps."],
];

export default function ChangelogPage() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org", "@type": "CollectionPage",
        name: "Factory changelog — Every rule begins with a failure",
        url: "https://factory.olegkoval.com/changelog/",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: changes110.map(([, title], index) => ({ "@type": "ListItem", position: index + 1, name: title })),
        },
      }} />
      <SiteHeader />
      <main className="inner-page">
        <header className="page-hero page-hero-short"><p className="eyebrow">Changelog / v1.1.0</p><h1>Every rule begins with a failure.</h1><p className="page-deck">Every release is tied to committed repository history and publicly inspectable evidence.</p></header>
        <section className="change-release">
          <div className="release-title"><span>v1.1.0</span><p>October 13, 2026 / public source</p></div>
          <div className="change-list">
            {changes110.map(([kind, title, body], index) => <article key={title}><span className={`change-kind change-${kind.toLowerCase()}`}>{kind}</span><div><h2>{title}</h2><p>{body}</p></div><span className="change-index">0{index + 1}</span></article>)}
          </div>
        </section>
        <section className="change-release">
          <div className="release-title"><span>v1.0.0</span><p>September 29, 2026 / first tagged release</p></div>
          <div className="change-list">
            {changes100.map(([kind, title, body], index) => <article key={title}><span className={`change-kind change-${kind.toLowerCase()}`}>{kind}</span><div><h2>{title}</h2><p>{body}</p></div><span className="change-index">{String(index + 1).padStart(2, "0")}</span></article>)}
          </div>
        </section>
        <section className="content-callout"><p className="eyebrow">Most useful change</p><h2>The gate learned to distrust itself.</h2><p>A regression preserved a contradiction the original terminal check incorrectly passed. The fixed gate now names both states and exits 1.</p><a className="button button-primary" href="/case-studies/terminal-state-mismatch/">Inspect before and after <span aria-hidden="true">↗</span></a></section>
      </main>
      <SiteFooter />
    </>
  );
}
