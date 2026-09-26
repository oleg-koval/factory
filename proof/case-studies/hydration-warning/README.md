# Public Factory run: the case-study hydration warning

Evidence status: a complete Phase 0–6 Factory run was completed against the Factory website,
merged to `main`, and manually deployed on 2026-09-24. This page is a sanitized evidence digest;
it omits machine-local paths and raw session transcripts. The public browser tests, pull request,
and deployment history are linked below.

## Request and acceptance criteria

The source was a React hydration warning observed while opening Factory's existing terminal-state
case-study page in development. This was a local site defect, not a customer incident or Sentry
event. Oleg confirmed the source and these criteria before the run proceeded:

| Criterion | Required proof | Result |
|---|---|---|
| AC-1 — reproduce the baseline | On the unmodified baseline commit `7a774c4`, fresh development browser contexts at 1440×900 and 390×844 show the case-study heading and the hydration diagnostic. | Met: 2/2 |
| AC-2 — verify the fix | On the changed site, fresh desktop and mobile contexts show the page without a hydration diagnostic in development and production. Initial HTML must retain Analytics configuration and valid `TechArticle` JSON-LD. | Met: development 2/2, production 2/2; site integration 22/22 against a 21-test baseline. |

## What the run learned

The initial development-browser setup failed before navigation, so Factory did not treat that as
evidence about the page. A later bounded investigation reproduced the warning on the immutable
baseline at both widths. The same baseline in production mode did not show it.

The development response placed the Analytics script in the body before the case-study's JSON-LD;
the production response placed Analytics in the head. A document-start observer saw no browser
node move. The evidence supported a development rendering mismatch around `beforeInteractive`
scripts, not a source-order-only explanation. The exact internal `vinext` shim branch remains
unidentified and is not needed to establish the before/after behavior.

## Change and proof

The implementation moved the existing Analytics scripts into the root layout's `<head>`. It did
not remove Analytics, change the measurement configuration, or make the structured data
client-only. The browser regression keeps both viewport sizes and checks the visible heading,
hydration diagnostics, initial HTML, and an attempted Analytics `page_view` request.

The run also proved the regression test had teeth: when the fix was temporarily removed, both
after-state browser cases failed at the expected hydration assertion; after restoring the fix,
both passed. The baseline tests separately reproduce the original warning from the exact baseline
commit. CI runs these browser tests with read-only permissions and has no deploy credentials.

At the polished feature head, the site suite passed 22/22 (21 at baseline), alongside typecheck,
lint, and structural checks. The cross-branch release-policy integration passed 23/23 after adding
the manual-deployment guard. The Factory terminal gate returned:

```text
GATE: PASS  run=hydration-warning-on-case-study-20260923 terminal=delivered matrix=clean
```

PR [#15](https://github.com/oleg-koval/factory/pull/15) merged to `main` as
[`1918418`](https://github.com/oleg-koval/factory/commit/19184189bdc53211871a55deda47e643422c21d6).
All five PR checks passed. The merged release was manually deployed, then checked on the
canonical domain in fresh desktop and mobile browsers: HTTP 200, visible headings, no horizontal
overflow, and no hydration diagnostics. Later site releases include this merged fix.

## Inspect the public artifacts

- [Exact unmodified-baseline browser test](../../../site/tests/hydration.baseline.browser.test.mjs)
- [Fixed-site desktop/mobile browser regression](../../../site/tests/hydration.browser.test.mjs)
- [Read-only CI validation workflow](../../../.github/workflows/validate.yml)
- [Merged change and CI checks](https://github.com/oleg-koval/factory/pull/15)
- [Current case-study page](https://factory.olegkoval.com/case-studies/terminal-state-mismatch/)

## Evidence boundary

This is one full run on Factory's own site, not proof of general reliability, repeatability across
independent projects, user adoption, time saved, or defect-rate reduction. Browser observation of
an Analytics `page_view` request proves the browser attempted it, not that Google accepted or
reported it; one request failed in each recorded live session. The run does not claim that every
route is hydration-warning-free, and it did not isolate the exact internal `vinext` code branch.
