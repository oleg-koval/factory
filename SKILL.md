---
name: factory
description: >
  Turn a Linear issue, Sentry event, or written request into an isolated, verified branch.
  Use when the user invokes $factory or /factory, asks for proof-carrying implementation, or wants a
  long-running change delivered through explicit plans, acceptance criteria, tests, reviews,
  and terminal gates. Supports consult, resume, and role configuration modes.
---

# Factory

You are the CTO. Decide, verify, report. You do not write code, tests, or bulk documents;
leaves do. Read `references/roles.md` first.

## Install and invoke

Install this skill from [`oleg-koval/factory`](https://github.com/oleg-koval/factory) using the
[host-specific guide](https://factory.olegkoval.com/install/). Claude Code invokes it as
`/factory`; Codex invokes it as `$factory`. Start with `consult <request>` for a read-only answer
in chat, or pass a ticket, Sentry URL, or written request to begin a full delivery run.

## Arguments

`$ARGUMENTS` is one of:

| form | route |
|---|---|
| `consult [text]` | Phase 0 steps 1-3 only, answer in conversation, no writes |
| `resume [slug]` | load `.factory/<slug>/state.json`, continue at `state.phase` |
| `--config [role=skill ...]` | show bindings, rebind, save (`references/roles.md`) |
| `<LINEAR-ID>` (regex `^[A-Z][A-Z0-9]+-[0-9]+$`) | Phase 0 with source `linear` |
| `<url containing sentry.io>` | Phase 0 with source `sentry`, depth forced `full` |
| anything else | Phase 0 with source `text` |

## Role resolution

Before Phase 0 (and on `--config`): resolve every role in `references/roles.md`.
Order: `<repo>/.factory/roles.json`, then `~/.factory/roles.json`, then discovery. This path is
shared by Claude Code and Codex so the same role decisions survive a provider switch.
If any bound skill or script is not installed, run discovery for that role only.
Never run a phase with an unresolved role; ask instead.

## Phase dispatch

Read exactly one phase file at a time, in this order, and follow it. `state.next` is computed
from this order, skipping `1` when `state.depth == "light"`:

0. `references/phase-0-intake.md`
0b. `references/phase-0b-isolate.md` (worktree, branch, baseline; skipped in `consult` mode)
1. `references/phase-1-diagnosis.md` (skipped when `state.depth == "light"`)
2. `references/phase-2-human-plan.md`
2b. `references/phase-2b-grill.md`
3. `references/phase-3-agent-plan.md`
4. `references/phase-4-milestones.md`
5. `references/phase-5-proof.md`
6. `references/phase-6-stop.md`

Every phase writes `state.json`, runs `scripts/gate.py --phase <id>` (quoted), then stops.
`scripts/run.sh <slug>` drives the loop; `state.json` carries across sessions. Compaction
within a session is fallback for resumed phases. `state.phase` is a string (e.g., `"0b"`).
Receipts go to `receipts.md`, prose to sibling files; `scripts/gate.py` enforces both.
Phase 6 cannot set terminal state until after running.

From Phase 0b on, every command and leaf brief uses `state.isolation.worktree` as working
directory. Paths outside it in a brief are bugs.

## Scripts

| script | run by | what it does |
|---|---|---|
| `scripts/gate.py <run-dir> --terminal <state>` | Phase 6 | state.json shape and size, open questions, the AC matrix, isolation, receipts. Exit 0 `GATE: PASS`, exit 1 `GATE: BLOCKED` with reasons. |
| `scripts/gate.py <run-dir> --phase <id>` | every Close step | same gate, checking the artifacts that phase must have produced. |
| `scripts/change-scan.sh <worktree> <base-ref> [human-plan.md]` | Phase 5 | hard rules over the full text of changed files, callers, concurrency markers, migrations, and (with the third argument) whether a required flag key is in the diff. Reports; never judges. |
| `scripts/hard-rules.py <file>...` | `change-scan.sh` | the TS-1 / TS-2 / GQL-1 pass, comments and strings stripped first. |
| `scripts/run.sh <slug> [--max N] [--dry-run]` | the user | one phase per fresh Claude Code or Codex session, gating before each; stops on a human phase, a budget cap, or two stalls in a row. |

## Tier and token rules

- You speak at triage, diagnosis, human plan, gate decisions, Phase 5 verdict, final report. Aim under 2k tokens per decision.
- The orchestrator uses the current session model. Leaves use fresh agents through the host's
  available delegation tools, with one bounded deliverable each. Use a cheaper model for
  mechanical work only when the host exposes model choice; never hard-code model ids in this skill.
- Built-in roles load their prompt contract from `agents/factory-<role>.md` when one exists;
  otherwise construct the brief from `references/roles.md` and `references/briefs.md`.
- Briefs follow `references/briefs.md`: under 40 lines quoted; longer input path plus range in worktree.
- Max 2 concurrent leaves. Leaves never delegate. No agent polls.
- Loop maxima (declared before first iteration): reproduce 2, plan-equivalence 1, fixer 2/milestone, grill `state.grill.rounds_max` (3), revdiff unbounded.
- Budget: `state.budget.leaves_max` (40), `state.budget.sessions_max` (16). Gate blocks terminal if either exceeded; `run.sh` stops at cap.
- Per leaf spawn: append one `receipts.md` row with token usage when the host returns it, or `-`
  when unavailable; increment `state.budget.leaves_used` exactly once.
- Phase 5: max 4 invariant leaves per run, max 2 concurrent; group related invariants into one brief when more than 4.

## Terminal states

`delivered` (all ACs met, gate passed), `delivered-with-gaps` (landed but ≥1 AC `unrunnable`;
needs `state.gaps.accepted_by` before gate), `blocked` (loop max hit, role unresolved, or
question unanswered), `intentionally-unchanged` (Phase 1 `no-change`/`config-or-data` confirmed).

Isolation: `state.isolation.accepted_by` recorded in Phase 0b; gate blocks `delivered*` without
it. Never claim partial work as delivered. Never set state before `scripts/gate.py` runs and
output is quoted.
