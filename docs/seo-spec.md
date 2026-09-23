# Factory search and discovery specification

Evidence status: eight canonical routes, metadata, structured data, robots, and sitemap are
deployed and have passed local rendering and live-browser checks as of 2026-09-23.
Google Search Console sitemap acceptance, indexation, ranking, and search traffic are not yet
verified. Browser results and limits are recorded in [browser-acceptance.md](browser-acceptance.md).

The machine-readable route source is [`seo-routes.json`](seo-routes.json). Run:

```bash
python3 scripts/verify-seo-spec.py
```

After publishing, compare the live pages and crawl files with the same route source:

```bash
node scripts/verify-live-seo.mjs
```

This verifies published HTTP status, title, description, canonical URL, one H1, declared
structured-data types, robots, and the exact sitemap URL set. It does not prove indexing.

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
- Keep preview deployments `noindex` with an HTTP `X-Robots-Tag`; do not rely on `robots.txt` to
  hide a preview.
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

## Launch verification

Report these as separate gates:

1. Local static build completes.
2. Every route returns its intended status, title, canonical, description, H1, and internal links.
3. JSON-LD parses and matches visible claims.
4. `robots.txt`, sitemap, proof manifest, social images, and 404 respond publicly.
5. A real mobile and desktop browser can navigate the site with JavaScript disabled for core text.
6. Cloudflare custom domain and TLS are active.
7. Google Search Console accepts the sitemap. Indexation remains pending until Google reports it.

Sources checked 2026-09-21:

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
