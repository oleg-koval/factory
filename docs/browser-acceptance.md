# Factory browser acceptance

Evidence status: focused browser and accessibility observations are recorded by date below. They
are not proof of search ranking or a complete Factory delivery run.

## Latest manual Worker release — 2026-09-28

The live Cloudflare Worker serves repository commit
`4d5924d5424aeab609c71a5eba6cad9785855b5b`; Wrangler reported Worker version
`684259bf-2aaa-461a-83ad-c5f5030598b0`. Site lint passed, the build and 28 rendered-page tests
passed, and Factory's structural/proof checks passed. Both GitHub validation workflows passed on
this commit, including the production-Worker browser hydration regression at desktop and mobile
widths.

After deployment, the live SEO verifier passed all nine canonical routes. A direct request to
`/install/` returned HTTP 200 and contained the five checked first-run instructions, including the
real-observation prompt and the no-invented-bug boundary. The IndexNow dry run verified the public
key and exact nine-URL sitemap; the post-deploy request returned HTTP 200 (`received`). This is
notification receipt only, not proof of crawling, indexing, or ranking. No new visual browser or
accessibility audit was run for this copy change; the focused observations below remain the most
recent such audit.

## Previous canonical-site release check — 2026-09-28

The latest manual Cloudflare deployment serves site code from repository commit
`0e2e547303a77ad02688d77bff3c3115c53e44fb`. Wrangler reported Worker version
`72adfe7f-9899-429b-bd77-4191211e4bc5` for `factory.olegkoval.com`. The local site lint and build
passed; rendered HTML tests passed 27/27; Factory's structural, proof, and nine-route SEO checks
passed. Both GitHub validation workflows passed against the deployed source commit.

After deployment, the live SEO verifier passed all nine canonical routes at the custom domain.
Direct HTTP verification of `/proof/manifest.json` confirmed the refreshed 2026-09-28 boundary:
plain `$factory` selected a same-name user-wide skill in the test, while an explicit project-path
prompt selected `.agents/skills/factory/SKILL.md`. The live `/proof/` page exposes that same
boundary; it no longer says fresh-session invocation is wholly unproven.

The IndexNow dry run confirmed the public key and exact nine-URL sitemap. The post-deploy request
returned HTTP 200 (`received`) for all nine routes. This is notification receipt only, not evidence
of crawling, indexing, or ranking. No new Search Console query or browser visual/accessibility
audit was run in this release; the Search Console status remains the separate 2026-09-28 inspection
recorded in the [launch proof](launch-proof.md), and the focused browser observations below remain
from 2026-09-26.

## Latest canonical-site check — 2026-09-26

The current Cloudflare release serves repository `main` at `6b29e48`. The live SEO verifier
passed all nine canonical routes, including title, description, canonical URL, structured data,
robots, and the exact sitemap URL set. A live browser check of the terminal-state case study
reported proof receipts at 17.6px on a 1440px desktop and 16px on a 390px mobile viewport, with
off-white text on the existing near-black surface and no horizontal page overflow. This is a
focused visual check of the receipt readability fix, not a new full-site accessibility audit.

The live IndexNow key and nine-URL sitemap passed the dry run. The post-deploy submission returned
HTTP 200 (`received`). This confirms notification receipt only; it does not prove crawling,
indexing, or ranking. At this 2026-09-26 checkpoint, Search Console access was unavailable; the
later Search Console inspection is recorded below.

At this 2026-09-26 checkpoint, the separate, noncanonical Sites mirror was stale for the ninth
route: `node scripts/verify-live-seo.mjs --alternate` reported HTTP 404 and a canonical mismatch
for `/case-studies/development-hydration-warning/`. The issue was later cleared by the successful
Sites version 16 deployment. On 2026-09-28, direct HTTP checks returned 200 for all nine canonical
routes on the mirror. The hydration-warning route returned `X-Robots-Tag: noindex, nofollow` and
its canonical link pointed to the Cloudflare custom domain. This is a route and header check, not a
new browser visual or accessibility audit.

## Reproduced and fixed

At 390 CSS pixels, the previous public build had horizontal page overflow: the home page
measured 466 pixels and the install page measured 530 pixels. The install grid and code blocks
were forcing their columns wider than the viewport.

After the fix, the browser reported `document.documentElement.scrollWidth === innerWidth` for
all eight canonical routes at both 320 and 390 CSS pixels. The same check passed for the Sites
mirror's home and install routes at 390 pixels. The desktop home page rendered at 1440 pixels
without horizontal overflow or an error overlay. The install commands were visible as wrapped
text; the underlying command strings were unchanged.

## Interaction and keyboard

- The illustrative run showed `blocked`, `intentionally-unchanged`, and `delivered` endings
  locally with reduced motion enabled. Reduced motion removed the stamp animation.
- On the public site, the flow reached `intentionally-unchanged` and the proof explorer switched
  to the committed `honest-delivery` gate result.
- On the public proof page at 390 pixels, the terminal receipt received keyboard focus.
  Two Right Arrow presses moved its horizontal scroll position from 0 to 80 pixels.
- The eight public routes rendered meaningful content; no blocking error overlay or page error
  appeared in the fresh browser checks.

## Automated accessibility scan

The live Chrome/axe 4.12.1 scan reported zero WCAG 2 A/AA violations on each of the eight
canonical routes. It could not automatically determine contrast for some elements with
pseudo-element backgrounds on the home, proof, run-map, and install pages. Those four incomplete
checks are unknown, not passes. This scan is not a full manual accessibility audit.

## Separate search gate

On 2026-09-28, GSC Wizard inspected the `sc-domain:factory.olegkoval.com` property. The sitemap
`https://factory.olegkoval.com/sitemap.xml` was already submitted, was not pending, and had 9
submitted URLs, 0 errors, and 0 warnings. Its last submitted time was
`2026-09-23T13:23:05.979Z`; its last read was `2026-09-28T04:52:31.716Z`. No new submission was
made.

Individual URL inspections for the homepage and hydration-warning case study both returned
`PASS`, `Submitted and indexed`, and a successful page fetch. Both were crawled as mobile. This
proves those two URLs' reported index status, not that all nine sitemap URLs are indexed or rank.
The sitemap API's indexed URL count was `0`, which conflicts with those two individual inspections;
preserve the signals separately rather than treating the count as proof that the inspected URLs
are unindexed. The full receipt and crawl timestamps are in the [launch proof](launch-proof.md).

On 2026-09-26, the initial live IndexNow submission returned HTTP 202 while key verification was
pending; after the public key was confirmed, the follow-up returned HTTP 200 (`received`). After
the latest manual Cloudflare release, the nine-URL sitemap dry run passed and a fresh submission
again returned HTTP 200 (`received`). These responses confirm receipt only—not crawling,
indexing, or ranking; the separate Search Console evidence above is the source for sitemap and URL
inspection status.

After site commit `a5045e0011fd6410b1cd6625536746687036e91d`, the live SEO verifier
reported `LIVE SEO: PASS routes=8` on both the custom domain and Sites mirror. The verifier
checks the route-spec metadata, canonical links, declared JSON-LD types, robots, and exact
sitemap URL set. It does not check whether Google has accepted or indexed any URL.
