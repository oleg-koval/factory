# Factory browser acceptance — 2026-09-23

Evidence status: live-browser checks against the public Cloudflare custom domain after site
commit `619dd2859e8276d70b2e0d5d9adc0ba57d962e6c`. This is a browser and accessibility
smoke check, not proof of search indexing or a complete Factory delivery run.

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

The canonical pages, robots file, and sitemap are live. Google Search Console was not signed in
in the available browser, so sitemap acceptance and indexation remain unverified. A general
web-search query did not provide reliable indexation evidence.

After site commit `a5045e0011fd6410b1cd6625536746687036e91d`, the live SEO verifier
reported `LIVE SEO: PASS routes=8` on both the custom domain and Sites mirror. The verifier
checks the route-spec metadata, canonical links, declared JSON-LD types, robots, and exact
sitemap URL set. It does not check whether Google has accepted or indexed any URL.
