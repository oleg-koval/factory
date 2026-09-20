# Factory site copy

Evidence status: launch copy draft. Install commands, repository links, run counts, and measured
outcomes stay marked `[TK]` until their authoritative sources exist.

## Metadata

Title: Factory - Verified software delivery for Claude Code and Codex

Description: Factory turns tickets and incidents into isolated, reviewed software changes with
acceptance criteria, proof receipts, and honest terminal states.

Canonical URL: `https://factory.olegkoval.com/`

## Navigation

Factory / How it works / Proof / Install / Built by Oleg Koval

## Hero

Eyebrow: OPEN-SOURCE AGENT SKILL FOR CLAUDE CODE + CODEX

# Your agent can write code. Factory makes it earn the word delivered.

Give Factory a ticket, a Sentry issue, or a rough request. It isolates the work, turns the ask
into testable acceptance criteria, proves each milestone, and stops with receipts. When it
cannot prove the change, it says exactly why.

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

## Install

Heading: Bring your own agent. Keep the gates.

Claude Code: `[TK: public install command]`

Codex: `[TK: public install command]`

Supporting line: One delivery contract, using each host's native invocation and runner.

## Author

Heading: Built from the failures I no longer wanted to supervise twice.

I am Oleg Koval. I build software and the operating systems around the agents that build it with
me. Factory is the part that turns agent output into a claim another engineer can inspect.

Action: More from Oleg

## Closing

Your agent does not need a longer prompt. It needs a delivery contract.

Action: Watch Factory earn "delivered"
