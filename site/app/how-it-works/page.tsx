import type { Metadata } from "next";
import { CompleteRunMap } from "../_components/RunMap";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { StructuredData } from "../_components/StructuredData";

export const metadata: Metadata = {
  title: "Factory run map — A verified AI coding agent workflow",
  description:
    "Explore Factory's complete human-in-the-loop workflow: nine gated phases, fresh sessions, bounded agent loops, proof receipts, and an honest terminal state.",
  alternates: { canonical: "/how-it-works/" },
  openGraph: {
    title: "Factory run map — A verified AI coding agent workflow",
    description:
      "One ticket in, one verified draft PR out. See every phase, actor, gate, human decision, and terminal state.",
    url: "/how-it-works/",
    type: "article",
    images: [{ url: "/og-factory.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Factory run map — A verified AI coding agent workflow",
    description:
      "One ticket in, one verified draft PR out. See every phase, actor, gate, human decision, and terminal state.",
    images: ["/og-factory.png"],
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: "Factory run map — A verified AI coding agent workflow",
        description: metadata.description,
        dateModified: "2026-09-23",
        author: {
          "@type": "Person",
          name: "Oleg Koval",
          url: "https://factory.olegkoval.com/oleg-koval/",
        },
        mainEntityOfPage: "https://factory.olegkoval.com/how-it-works/",
        about: [
          "AI coding agent workflow",
          "human-in-the-loop software delivery",
          "software verification gates",
        ],
      }} />
      <SiteHeader />
      <main className="inner-page run-map-page">
        <header className="page-hero run-map-hero">
          <p className="eyebrow">Factory run map / public operating contract</p>
          <h1>The complete run—from ticket to verified draft PR.</h1>
          <p className="page-deck">
            Factory is not a swarm that runs until it feels finished. It is a bounded delivery
            system: one phase per fresh session, one executable gate after every phase, and a
            deliberate stop whenever the next decision belongs to you.
          </p>
          <div className="run-hero-command">
            <span>Run one phase</span>
            <code>scripts/run.sh &lt;slug&gt;</code>
          </div>
        </header>

        <CompleteRunMap />
      </main>
      <SiteFooter />
    </>
  );
}
