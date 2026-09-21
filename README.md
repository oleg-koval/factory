# Factory

Your agent can write code. Factory makes it earn the word **delivered**.

Factory is an Agent Skill that turns a ticket, incident, or rough request into an isolated
software change with testable acceptance criteria, milestone reviews, proof receipts, and an
explicit terminal state. It runs on Claude Code and Codex.

Factory does not make an agent type faster. It changes what the agent must prove before it can
claim the work is finished.

## Why it exists

Factory is built from delivery failures that ordinary agent loops did not catch:

- A run called itself delivered with five unanswered questions and two partly met acceptance
  criteria. Factory now has an executable terminal gate and no "partly met" status.
- A test failed alone but passed inside its real file. Factory now requires the full file to fail
  before the fix, pass after it, then fail again when the fix is removed.
- An orchestrator approved its own fallback into the user's active checkout. Factory now creates
  an external worktree and only the user can accept in-place operation.
- Clean milestones broke an invariant across commits. Factory now reviews both each milestone
  and the whole branch, including callers and adversarial concurrency orderings.

The rules are not a checklist beside the workflow. The scripts enforce them.

## The run

Factory moves one phase at a time:

1. Intake: separate a reported symptom from evidence and write testable acceptance criteria.
2. Isolate: create a clean worktree and measure the existing baseline there.
3. Diagnose: reproduce the problem and name what remains unknown.
4. Plan: write the human plan and close blocking questions before code.
5. Build: make the end-to-end test fail first, implement one milestone, and review it fresh.
6. Prove: remove the fix, rerun the test, scan the full changed files, and review the branch.
7. Stop: run the executable gate and issue one honest terminal state.

Terminal states are `delivered`, `delivered-with-gaps`, `blocked`, and
`intentionally-unchanged`.

## Install

The intended public source is `oleg-koval/factory`. That repository has not been published, so
the following commands are staged and are not live yet:

```bash
# Claude Code
npx skills add oleg-koval/factory -g -a claude-code -y

# Codex
npx skills add oleg-koval/factory -g -a codex -y
```

The same command shape has been verified against this local package; see
[`docs/install-verification.md`](docs/install-verification.md).

Once installed:

```text
Claude Code: /factory consult <request>
Codex:       $factory consult <request>
```

Use `consult` to get the CTO view without writing files. Start a full run with a ticket id,
Sentry URL, or plain-language request. Use `resume <slug>` to continue a gated run.

## Inspect the machinery

- [`SKILL.md`](SKILL.md) is the compact operating contract.
- [`references/`](references/) holds one phase at a time so context stays bounded.
- [`scripts/gate.py`](scripts/gate.py) decides whether a phase or terminal claim is allowed.
- [`scripts/change-scan.sh`](scripts/change-scan.sh) expands review beyond diff hunks.
- [`tests/check.sh`](tests/check.sh) watches the gates fail as well as pass.
- [`proof/terminal-gate/`](proof/terminal-gate/) is a runnable redacted specimen showing a false
  delivery claim blocked and the corrected state passing.
- [`proof/case-studies/terminal-state-mismatch/`](proof/case-studies/terminal-state-mismatch/)
  reproduces a real gate bypass against the pre-fix commit and preserves its before/after output.
- [`proof/manifest.json`](proof/manifest.json) is the machine-readable claim-to-artifact map used
  by `python3 scripts/verify-proof.py`.
- [`docs/demo-script.md`](docs/demo-script.md) and [`scripts/demo.sh`](scripts/demo.sh) turn the
  committed gate artifacts into a deterministic three-minute guest-demo path.
- [`docs/install-verification.md`](docs/install-verification.md) records the tested local
  installation boundary for Claude Code and Codex.
- [`docs/product-brief.md`](docs/product-brief.md) states the product claim and its evidence boundary.
- [`docs/how-it-works.md`](docs/how-it-works.md) is the canonical public narrative for Factory's
  seven delivery gates and four terminal states.
- [`docs/podcast-brief.md`](docs/podcast-brief.md) positions the proof as a timely follow-up to
  Greg Isenberg's recent software-factory episode; it is staged and has not been sent.
- [`docs/essay-right-to-say-not-delivered.md`](docs/essay-right-to-say-not-delivered.md) is the
  evidence-backed source for the launch essay promised by the product brief.
- [`docs/author-profile.md`](docs/author-profile.md) stages a source-bounded personal-brand page
  from Oleg's public portfolio while keeping first-person outreach claims approval-gated.
- [`docs/seo-spec.md`](docs/seo-spec.md) and [`docs/seo-routes.json`](docs/seo-routes.json) define
  the validated search, metadata, crawl, and evidence contract for the future site.
- [`SECURITY.md`](SECURITY.md) states the skill's real permission boundary, enforced controls, and
  the private-reporting gate required before publication.
- [`CHANGELOG.md`](CHANGELOG.md) ties product rules to the failures that changed them.

Run the same gate used by CI:

```bash
zsh tests/check.sh
```

## Evidence status

The local structural suite passes on the current working tree. Public installation, adoption,
performance, and production outcomes are not claimed yet. The release plan requires a complete
redacted run, cross-provider validation, and a public commit before those claims appear.

Built by [Oleg Koval](https://olegkoval.com/).
