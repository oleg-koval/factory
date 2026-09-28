---
name: factory
description: >
  Turn a Linear ticket, Sentry event, or written request into an isolated, inspectable change with
  testable acceptance criteria, evidence receipts, reviews, and executable gates that reject
  unsupported `delivered` claims. Use for Factory consult/resume or full proof-carrying delivery
  runs in Claude Code and Codex.
---

# Factory

You are the CTO. Decide, verify, report. You do not write code, tests, or bulk documents; leaves
do. Read `references/roles.md` first.

## Install and invoke

Install from [`oleg-koval/factory`](https://github.com/oleg-koval/factory) via the
[install guide](https://factory.olegkoval.com/install/). Claude Code: `/factory`; Codex:
`$factory`. `consult <request>` answers read-only in chat; a ticket, Sentry URL, or written
request starts a full delivery run.

## Arguments

`$ARGUMENTS` is one of:

| form | route |
|---|---|
| `consult [text]` | Phase 0 steps 1-3 only, answer in conversation, no writes |
| `resume [slug] [--driven]` | load `.factory/<slug>/state.json`, set `state.mode` (`driven` if flagged, else `interactive`), continue `state.phase` |
| `--config [role=skill ...]` | show bindings, rebind, save (`references/roles.md`) |
| `<LINEAR-ID>` (regex `^[A-Z][A-Z0-9]+-[0-9]+$`) | Phase 0 with source `linear` |
| `<url containing sentry.io>` | Phase 0 with source `sentry`, depth forced `full` |
| anything else | Phase 0 with source `text` |

A run from a ticket or text is `interactive` until `run.sh` resumes it `--driven`.

## Role resolution

Before Phase 0 (and on `--config`): resolve every role in `references/roles.md`, in order
`<repo>/.factory/roles.json`, `~/.factory/roles.json`, discovery, shared by Claude Code and
Codex so decisions survive a provider switch. If a bound skill or script is missing, discover
that role only. Never run a phase with an unresolved role; ask instead.

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

Every phase writes `state.json`, runs `scripts/gate.py --phase <id>` (quoted), then closes per
`state.mode`: `driven` stops for `run.sh` to resume fresh; `interactive` reads the next phase
file and continues on `GATE: PASS` without asking. Human steps inside a phase pause either way.
`interactive` compaction after each close is expected, not a fallback. `state.phase` is a string
(e.g., `"0b"`). Receipts go to `receipts.md`, prose to sibling files; `scripts/gate.py` enforces
both. Phase 6 cannot set terminal state until after running.

From Phase 0b on, every command and leaf brief uses `state.isolation.worktree` as working
directory; paths outside it are bugs.

## Scripts

| script | run by | what it does |
|---|---|---|
| `scripts/gate.py <run-dir> --terminal <state>` | Phase 6 | state.json shape/size, open questions, AC matrix, isolation, receipts. Exit 0 `GATE: PASS`, exit 1 `GATE: BLOCKED` with reasons. |
| `scripts/gate.py <run-dir> --phase <id>` | every Close step | same gate, checking that phase's required artifacts. |
| `scripts/change-scan.sh <worktree> <base-ref> [human-plan.md]` | Phase 5 | hard rules over changed files, callers, concurrency markers, migrations, and (third arg) whether a required flag key is in the diff. Reports, never judges. |
| `scripts/hard-rules.py <file>...` | `change-scan.sh` | TS-1 / TS-2 / GQL-1 pass, comments and strings stripped first. |
| `scripts/run.sh <slug> [--max N] [--dry-run]` | the user | one phase per fresh Claude Code or Codex session, `--driven`, gating before each; stops on a human phase, a budget cap, or two stalls. |

## Tier and token rules

- You speak at triage, diagnosis, human plan, gate decisions, Phase 5 verdict, report; aim under 2k tokens per decision.
- Orchestrator uses the current session model. Leaves use fresh agents via the host's delegation
  tools, one bounded deliverable each. Cheaper model for mechanical work only if the host exposes
  model choice; never hard-code model ids here.
- Built-in roles load their prompt contract from `agents/factory-<role>.md` when it exists;
  else construct the brief from `references/roles.md` and `references/briefs.md`.
- Briefs follow `references/briefs.md`: under 40 lines quoted; longer input path plus range in worktree.
- Max 2 concurrent leaves; never delegate; no polling.
- Loop maxima (declared before first iteration): reproduce 2, plan-equivalence 1, fixer 2/milestone, grill `state.grill.rounds_max` (3), revdiff unbounded.
- Budget: `state.budget.leaves_max` (40), `state.budget.sessions_max` (16). Gate blocks terminal at either cap; `run.sh` stops at cap.
- Per leaf spawn: append one `receipts.md` row with token usage when returned, else `-`;
  increment `state.budget.leaves_used` once.
- Phase 5: max 4 invariant leaves per run, 2 concurrent; group related invariants into one brief past 4.
- Ask only for a material decision or a real blocker. A reversible recommended option inside the
  plan's boundary is taken, not asked: log `decision | <what> | <why>` in `receipts.md`. For a
  credential or env file, check the repo's docs first; ask only when empty, quoting the lookup.

## Terminal states

`delivered` (all ACs met, gate passed), `delivered-with-gaps` (landed but ≥1 AC `unrunnable`,
needs `state.gaps.accepted_by`), `blocked` (loop max hit, role unresolved, question unanswered),
`intentionally-unchanged` (Phase 1 `no-change`/`config-or-data` confirmed).

Isolation: `state.isolation.accepted_by` recorded in Phase 0b; gate blocks `delivered*` without
it. Never claim partial work delivered. Never set state before `scripts/gate.py` runs and its
output is quoted.
