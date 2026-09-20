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

The public install command will be added when the repository is published. Until then, this
working tree is a release candidate, not a public package.

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
- [`docs/product-brief.md`](docs/product-brief.md) states the product claim and its evidence boundary.

Run the same gate used by CI:

```bash
zsh tests/check.sh
```

## Evidence status

The local structural suite passes on the current working tree. Public installation, adoption,
performance, and production outcomes are not claimed yet. The release plan requires a complete
redacted run, cross-provider validation, and a public commit before those claims appear.

Built by [Oleg Koval](https://olegkoval.com/).
