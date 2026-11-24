# Delivery evidence and pre-undraft review

Read by Phase 6. Not a phase file.

## Finished is not delivered

`ready-for-commit` means the work is finished and gated: every milestone done with a sha, the
AC matrix clean (or its gaps accepted in `state.gaps.accepted_by`), no blocking question open.
Nothing has left the worktree yet. It runs every `delivered*` check except `state.delivery`.

`pending-delivery` means the local work passed its gates and the exact pushed head is
on an open PR with a pending or failing required check. The gate obtains the verdict live.
Name the relevant checks, statuses and links in the report. Resume on a later handoff.

Record these fields in `state.delivery` before invoking the gate.

| key | value |
|---|---|
| `commit` | The full 40-character pushed PR head SHA |
| `pr` | The HTTPS GitHub.com PR URL, with repository and PR number |
| `open_accepted_by` | Optional. The human's explicit acceptance of an open PR as delivery for this task |

Run `gate.py <run-dir> --terminal <wanted>` through the authenticated GitHub CLI environment.
The gate reads GitHub's required checks at the recorded head and appends an observation to
`delivery-observations.jsonl`. Quote the observation and gate result. The file is an audit
record. Repeat the gate for each delivery claim, including an upgrade of an earlier run.
Existing runs should expand abbreviated SHAs and may leave their legacy `checks` field in state.

The gate accepts `ready-for-commit` to `pending-delivery` to `delivered*`, or a direct upgrade
from `ready-for-commit` to `delivered*`. Use `delivered*` for green required checks and a
live `mergedAt`, or for green required checks and an explicitly accepted open PR. Missing,
cancelled or ambiguous required checks, head mismatch and an unmerged closed PR block.
Set the requested terminal only after the gate passes. `delivered` also needs every
question answered. Unanswered non-blocking questions belong in the gaps report.

## Pre-undraft review

Review bots run on PR open and on later pushes, and each round can cost money. Role
`pre-undraft-review` catches what they would catch, before they see it.

It runs only when its binding sets `checklist` (a file of rules mined from past bot comments on
this repo) and, if `remote_match` is set, `git -C <worktree> remote get-url origin` contains it.
Otherwise log `decision | pre-undraft-review skipped | <reason>` and continue.

1. A fresh-context reviewer gets the branch diff against the base, test files included, and the
   checklist. It returns `VERDICT: PASS` or `FIX` with findings, each naming a checklist rule.
2. `FIX`: fix only the findings worth fixing, in one commit, then re-run the clean-tree check.
   Record dismissed findings and why in the report.
3. Push once. Batch later fixes into as few pushes as possible.
