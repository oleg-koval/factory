# Factory site copy

Evidence status: launch copy draft. Install commands, repository links, run counts, and measured
outcomes stay marked `[TK]` until their authoritative sources exist.

## Metadata

Title: Factory — Delivery gates for AI coding agents

Description: Factory is the open-source delivery gate for Claude Code and Codex: acceptance
criteria, test-first proof, review receipts, and honest terminal states.

Canonical URL: `https://factory.olegkoval.com/`

## Navigation

Factory / How it works / Proof / Essay / Install / Built by Oleg Koval

## Hero

Eyebrow: OPEN-SOURCE AGENT SKILL FOR CLAUDE CODE + CODEX

# Your agent can write code. Factory makes it earn the word delivered.

Give Factory a ticket, a Sentry issue, or a rough request. It isolates the work, turns the ask
into testable acceptance criteria, proves each milestone, and stops with receipts. When it
cannot prove the change, it says exactly why.

Category line: The verification layer for AI software factories.

Primary action: Watch a run

Secondary action: Inspect the skill

Proof strip: Isolated worktree / Tests fail first / Fresh-context review / Executable gates

## Interactive run

Heading: One request. Seven gates. No victory lap without proof.

Intro: Open each phase to inspect what Factory knew, what it changed, and what the next gate
required.

1. Intake - Separate the reported symptom from evidence. Write acceptance criteria that can fail.
2. Isolate - Create a clean branch and worktree. Measure the baseline where the work will run.
3. Diagnose - Reproduce the problem, name the cause, and state what remains unknown.
4. Plan - Write the human plan first. Empty the question frontier before code begins.
5. Build - Add the end-to-end test before implementation. Commit one reviewed milestone at a time.
6. Prove - Remove the fix and watch the test fail. Review the whole branch, its callers, and its invariants.
7. Stop - Run the terminal gate. Report delivered, delivered with gaps, blocked, or intentionally unchanged.

Run CTA: Inspect the acceptance-criteria matrix

## Runnable proof

Heading: Watch Factory reject a false delivery.

The redacted fixture has the same failure shape that caused the gate to be written: five
blocking questions have no answer, two acceptance criteria say `partly met`, and the requested
terminal state is still `delivered`.

Run it and Factory exits 1. It names every unanswered question, rejects both invalid statuses,
and refuses `delivered`. Run the corrected fixture and the same gate exits 0.

Primary action: Run the specimen locally

Secondary action: Compare the two states

Evidence note: This is a runnable redacted reconstruction, not the original private run or a
complete Factory delivery.

## Failure stories

Heading: Every hard rule has a body behind it.

### Five unanswered questions still looked green

A real run reached "delivered" with five open questions and two acceptance criteria described as
partly met. The prose said not to do that. Nothing enforced it. Factory now has an executable
terminal gate, and its acceptance matrix permits only `met`, `unrunnable`, or `failed`.

### The test failed alone and passed in the suite

A concurrency test appeared red when isolated but never created the interleaving inside its
real file. Factory now requires the whole test file to fail for the intended reason, then removes
the fix and runs it again before accepting the proof.

### The orchestrator approved its own exception

An earlier run fell back to editing the active checkout and recorded its own approval. Factory
now creates an external worktree by default. Only the user can accept an in-place fallback.

### The gate could validate a terminal the run did not record

While preparing the public proof, we found the gate trusted `--terminal delivered` without
comparing it with `state.terminal`. The pre-fix gate returned `PASS` against a fixture already
recorded as `blocked`. A regression test failed against the old commit; the fixed gate exits 1
and names both conflicting states.

Action: Inspect the before-and-after case study

## Comparison

Heading: Coding is one phase of delivery.

| | Ordinary coding agent | Factory |
|---|---|---|
| Starting point | Prompt | Source evidence + testable acceptance criteria |
| Workspace | Current checkout | Isolated worktree and branch |
| Tests | Run after implementation | Fail first, pass after, then lose the fix and fail again |
| Review | Diff review | Milestone review + callers + whole-change invariants |
| Failure | Retry or summarize | Bounded loops and explicit blocked state |
| Completion | Agent says done | Executable gate permits a terminal state |
| Handoff | Chat summary | AC matrix, commits, receipts, gaps, and cleanup path |

## Terminal states

Heading: "Done" is too vague to ship.

- `delivered`: every acceptance criterion was proven and the terminal gate passed.
- `delivered-with-gaps`: the change landed, but named checks could not run here; the user accepted the gaps.
- `blocked`: a bounded loop, missing fact, or unanswered decision prevents correct delivery.
- `intentionally-unchanged`: diagnosis showed that code was not the right treatment.

## Essay

Heading: Your software factory needs the right to say "not delivered"

More agents create more output. Without an executable delivery contract, they can also create
unsupported completion claims faster. The durable advantage is not another orchestration loop;
it is a quality system that can refuse shipment and show its evidence.

Action: Read the argument and inspect the proof

## Install

Heading: Bring your own agent. Keep the gates.

Claude Code: `npx skills add oleg-koval/factory -g -a claude-code -y`

Codex: `npx skills add oleg-koval/factory -g -a codex -y`

Supporting line: One delivery contract, using each host's native invocation and runner.

## Author

Heading: Built from the failures I no longer wanted to supervise twice.

Oleg Koval is a lead engineer and fractional CTO with more than ten years of experience across
fintech, e-commerce, mobility, automation, AI, and open source. His work emphasizes explicit
contracts, observable failures, and automation people can audit. Factory applies those principles
to agent delivery: it turns output into a claim another engineer can inspect.

Action: More from Oleg

## Closing

Your agent does not need a longer prompt. It needs a delivery contract.

Action: Watch Factory earn "delivered"
