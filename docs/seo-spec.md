# Factory search and discovery specification

The route contract currently declares nine canonical pages. `seo-routes.json` is the source for
their titles, descriptions, structured-data types, intent, and evidence links. The live verifier
checks publication; neither local nor live route checks prove Google acceptance, indexation,
ranking, or search traffic. Browser results and limits are recorded in
[browser-acceptance.md](browser-acceptance.md).

Alternate-host history: the separately hosted Sites mirror was refreshed on 2026-09-24 and its
then-current routes passed the `noindex` check. That is a different deployment target from the
Cloudflare canonical site. Re-run `node scripts/verify-live-seo.mjs --alternate` after changing
the canonical route list; do not infer mirror freshness or `noindex` from a Cloudflare deployment.

The machine-readable route source is [`seo-routes.json`](seo-routes.json). Run:

```bash
python3 scripts/verify-seo-spec.py
```

After publishing, compare the live pages and crawl files with the same route source:

```bash
node scripts/verify-live-seo.mjs
node scripts/verify-live-seo.mjs --alternate
```

This verifies published HTTP status, title, description, canonical URL, one H1, declared
structured-data types, robots, and the exact sitemap URL set. The second command also requires
`X-Robots-Tag: noindex` on the mirror's declared routes; a Cloudflare deploy does not update that
separate host. Neither command proves indexing.

## Search promise

Factory should be found for the problem it demonstrably solves: verifying whether an AI coding
agent earned a delivery claim. It should not compete for the broad phrase “software factory” by
pretending to be another orchestration framework.

Primary intent: `AI coding agent verification`.

Supporting intents:

- software factory delivery gates
- Claude Code delivery skill
- Codex delivery skill
- acceptance criteria for coding agents
- test-first proof for AI-written software
- honest terminal states for agent workflows

Each intent gets one useful page. Do not generate near-duplicate keyword pages.

## Crawl and index contract

- Render every indexable route as meaningful HTML at first response; proof and install content
  must not depend on client-side JavaScript to exist.
- Give each route its validated title, description, canonical URL, one visible H1, and descriptive
  internal links from at least one other route.
- Publish `/robots.txt` that allows the public site and names
  `https://factory.olegkoval.com/sitemap.xml`.
- Include only canonical 200-status routes in `/sitemap.xml`; use absolute URLs and one consistent
  trailing-slash policy.
- Keep preview deployments and public alternate-host mirrors `noindex` with an HTTP
  `X-Robots-Tag`; do not rely on `robots.txt` to hide them.
- Return a useful 404 and permanent redirects for any route renamed after launch.
- Serve `proof/manifest.json` at `/proof/manifest.json` as `application/json`, link it visibly from
  `/proof/`, and generate proof cards from it rather than duplicating claim text.

## Structured data contract

Structured data must describe visible page content and use absolute canonical URLs.

- `/`: `WebSite` and `SoftwareSourceCode` after the public repository exists.
- `/proof/`: `CollectionPage` plus an `ItemList` whose entries match visible proof cases.
- `/how-it-works/` and the essay: `TechArticle` with visible author and modified date.
- `/oleg-koval/`: `ProfilePage` and `Person`, using only public links Oleg approves.

Do not add ratings, review counts, customers, organizations, prices, or FAQ markup that the page
does not visibly and truthfully support. Structured data is an entity description, not a promise
of a Google rich result.

## Share and entity contract

- Provide unique Open Graph title, description, canonical URL, and 1200×630 image for the home,
  proof, essay, and author pages.
- Keep the author spelling exactly `Oleg Koval` and link the author page from every article.
- Link the public repository, canonical skill source, proof manifest, and `olegkoval.com` with
  descriptive anchor text.
- An optional `/llms.txt` may point agents to the canonical docs and proof manifest, but it must
  not be described as a search-ranking mechanism or replace the sitemap.

## Search-engine notification

After the public Worker deploy, run `node scripts/submit-indexnow.mjs --dry-run` and inspect the
verified key and sitemap result. Then run `node scripts/submit-indexnow.mjs` once to notify
participating IndexNow engines of the exact canonical sitemap URLs. The script verifies the public
key file and checks that live sitemap URLs exactly match `seo-routes.json` before it submits.
IndexNow's successful response confirms receipt only; it does not prove crawling, indexing, or
ranking, and it does not replace submitting the sitemap in Google Search Console.

## Launch verification

Report these as separate gates:

1. Local static build completes.
2. Every route returns its intended status, title, canonical, description, H1, and internal links.
3. JSON-LD parses and matches visible claims.
4. `robots.txt`, sitemap, proof manifest, social images, and 404 respond publicly.
5. A real mobile and desktop browser can navigate the site with JavaScript disabled for core text.
6. Cloudflare custom domain and TLS are active.
7. Google Search Console accepts the sitemap. Indexation remains pending until Google reports it.
8. The IndexNow notification is received by a participating search engine; report this separately
   from indexing and ranking.

Google sources checked 2026-09-21:

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [IndexNow protocol documentation](https://www.indexnow.org/documentation), checked 2026-09-26.
