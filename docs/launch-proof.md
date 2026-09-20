# Factory launch proof plan

Evidence status: planned work. Nothing in this file proves launch completion.

## Local proof already staged

- `proof/terminal-gate/` reconstructs the historical false-completion shape with redacted text.
- Its runner proves the current gate blocks that state and passes the corrected state.
- `tests/check.sh` executes that runner, so the public specimen cannot silently stop
  discriminating between those outcomes.
- `proof/case-studies/terminal-state-mismatch/` reproduces a real bypass against the pre-fix
  commit and records the fixed output without presenting it as a full Factory run.
- This is one mechanical gate specimen, not the complete redacted run still required below.

## Public proof before promotion

- Publish one canonical repository only after current private changes are reconciled.
- Publish one provider-neutral skill and verify that the installer resolves the same canonical
  package for Claude Code and Codex.
- Replace every `[TK]` in the site copy with a verified artifact or delete the claim.
- Run the package validator and installation check from the public commit for both hosts.
- Publish one complete redacted Factory run and its terminal gate output.
- Demonstrate one failure caught by Factory that a normal happy-path test missed.
- Verify the site in a real browser at desktop and mobile widths.
- Verify title, description, canonical URL, robots, sitemap, Open Graph image, and structured data.
- Submit the sitemap to Google Search Console after deployment.

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

Each route gets its own title, description, canonical URL, Open Graph metadata, and visible
author/date when appropriate. The root links to every route with descriptive text.

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

Use a Cloudflare Worker with Static Assets and a Worker Custom Domain. The Worker is the origin,
so Cloudflare can create the DNS record and certificate for `factory.olegkoval.com` during
deployment. The current public DNS lookup returns no A, AAAA, or CNAME record for that hostname.

Deployment remains a separate gate: successful local build, source commit, remote SHA, Worker
deployment, custom-domain activation, public HTTP response, and browser acceptance are reported
independently.
