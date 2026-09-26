# Factory launch proof plan

Evidence status: launch checkpoint updated 2026-09-22. The public repository, public-source install,
and Cloudflare deployment are verified; the remaining promotion gates stay open below.

## Local proof already staged

- `proof/terminal-gate/` reconstructs the historical false-completion shape with redacted text.
- Its runner proves the current gate blocks that state and passes the corrected state.
- `tests/check.sh` executes that runner, so the public specimen cannot silently stop
  discriminating between those outcomes.
- `proof/case-studies/terminal-state-mismatch/` reproduces a real bypass against the pre-fix
  commit and records the fixed output without presenting it as a full Factory run.
- `proof/case-studies/hydration-warning/` records a complete Phase 0–6 run, from the confirmed
  local warning through the merged, manually deployed fix, with public browser tests and limits.
- `proof/manifest.json` maps each local claim to its artifacts, executable output, and explicit
  limit; `scripts/verify-proof.py` rejects missing artifacts or output drift.
- The terminal-gate specimen remains a reconstruction; it is distinct from the full run documented
  in the hydration-warning case study.

## Public proof before promotion

- [x] Publish one canonical repository only after current private changes are reconciled.
- [x] Publish one provider-neutral skill and verify that the installer resolves the same canonical
  package for Claude Code and Codex.
- [x] Replace every `[TK]` in the rendered site copy with a verified artifact or delete the claim.
- [x] Run the package validator and installation check from the public source for both hosts.
- [x] Verify a fresh, project-local Codex `consult` invocation from the public skill source;
  [record](install-verification.md).
- [x] Verify a fresh, project-local Claude Code `consult` invocation from the public skill source;
  [record](install-verification.md). Global installation remains open.
- [x] Enable GitHub private vulnerability reporting and replace the response-policy `[TK]` in
  `SECURITY.md` before publishing the first supported version.
- [x] Publish one complete Factory run and its terminal gate output; see the
  [hydration-warning case study](../proof/case-studies/hydration-warning/README.md).
- [x] Demonstrate one failure caught by Factory that a normal happy-path test missed.
- [x] Verify the site in a real browser at desktop and mobile widths; see
  [browser acceptance](browser-acceptance.md).
- [x] Verify title, description, canonical URL, robots, sitemap, Open Graph image, and structured data.
- [x] Publish the host-aware `noindex` fix to the public Sites mirror and pass the alternate
  host check on all eight routes; Sites version 15 deployed 2026-09-24.
- [ ] Submit the sitemap to Google Search Console after deployment.
- [x] Submit the nine canonical sitemap routes to IndexNow on 2026-09-26; response was HTTP 202,
  accepted with key verification pending. This is not evidence of crawling or indexing.

## Search architecture

Primary intent: verified AI coding workflow.

Supporting topics:

- Claude Code software delivery skill
- Codex software delivery skill
- AI coding agent verification
- acceptance criteria for coding agents
- test-first agent workflow
- agentic software development gates
- proof-carrying software delivery

Initial public routes:

- `/` - claim, interactive run, comparison, terminal states
- `/how-it-works/` - one durable page per phase with artifact examples
- `/proof/` - demo run, AC matrix, receipts, failures caught
- `/install/` - Claude Code and Codex installation and first run
- `/changelog/` - versioned improvements and the failure behind each new rule
- `/oleg-koval/` - why Oleg built it and links to his other work
- `/essays/right-to-say-not-delivered/` - the delivery-gate argument
- `/case-studies/terminal-state-mismatch/` - a reproduced gate defect and its fix

Each route gets its own title, description, canonical URL, Open Graph metadata, and visible
author/date when appropriate. The root links to every route with descriptive text.
`docs/seo-routes.json` is the validated route and metadata source; `docs/seo-spec.md` defines the
crawl, sitemap, structured-data, and launch-verification contract.

## Greg Isenberg outcome

The pitch is earned only after the public proof exists.

Greg published a software-factory episode with Ras Mic on 2026-09-14. Do not pitch Factory as
another orchestration workflow. Position it as the executable completion and refusal layer that
the existing category still needs. The sourced angle and unsent draft live in
`docs/podcast-brief.md`.

Episode idea: **Your coding agent needs the right to say not delivered.**

Three-minute demo:

1. Start with a believable bug report.
2. Show Factory refusing to treat the report as evidence.
3. Open the human plan and the unanswered-question frontier.
4. Show the new test failing, then passing.
5. Remove the fix and show the test fail again.
6. Open the terminal gate and its receipts.

Useful angles for Greg's audience:

- Agent skills become products when their judgment is inspectable.
- The next agent market is not better prompts; it is contracts, evidence, and failure semantics.
- A one-person company can move faster only when its agents can stop honestly.
- Cross-provider skills are more durable than workflows trapped in one model vendor.

Do not send outreach, submit a guest form, or publish social posts without Oleg's explicit
approval. Stage the draft and evidence bundle first.

## Cloudflare delivery

Factory is deployed as a Cloudflare Worker with Static Assets and a Worker Custom Domain. The
Worker is the origin; Cloudflare created the DNS record and certificate for
`factory.olegkoval.com` during the initial deployment on 2026-09-22. The browser and
accessibility pass was deployed from site commit `619dd28` on 2026-09-23.

Successful local build, source commit, remote SHA, Worker deployment, custom-domain activation,
and public HTTP response are verified separately. Browser acceptance is recorded in
[browser-acceptance.md](browser-acceptance.md); Search Console acceptance remains open.
