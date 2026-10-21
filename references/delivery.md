# Delivery evidence and pre-undraft review

Read by Phase 6. Not a phase file.

## Finished is not delivered

`ready-for-commit` means the work is finished and gated: every milestone done with a sha, the
AC matrix clean (or its gaps accepted in `state.gaps.accepted_by`), no blocking question open.
Nothing has left the worktree yet. It runs every `delivered*` check except `state.delivery`.

`delivered` and `delivered-with-gaps` mean the change landed where others can see it.
`state.delivery` must hold:

| key | value |
|---|---|
| `commit` | the pushed head sha, 7 to 40 hex characters |
| `pr` | the PR url, `https://...` |
| `checks` | `"green"`, read from the PR, never assumed |

`delivered` also needs every open question answered, blocking or not. A non-blocking question
still open is a gap: use `delivered-with-gaps` and name it in the report.

The gate accepts a recorded `ready-for-commit` being upgraded to `delivered*`, so a run can
stop at `ready-for-commit` and be upgraded later without editing history.

### Upgrade

1. `gh pr view <url> --json headRefOid,url` and `gh pr checks <url>`. Quote both.
2. Every check passed: write `state.delivery` from those outputs, then run
   `gate.py --terminal delivered` (or `delivered-with-gaps`) and quote it. Set the new state
   only on `GATE: PASS`.
3. A check pending or failing: stay `ready-for-commit` and say which check. Do not poll.

The rule exists because a run once passed the old gate as `delivered` with its code
uncommitted, no PR, no CI run and one question open.

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
