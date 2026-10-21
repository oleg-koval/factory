# Delivery evidence and pre-undraft review

Read by Phase 6. Not a phase file.

## Finished is not delivered

`ready-for-commit` means the work is finished and gated: every milestone done with a sha, the
AC matrix clean (or its gaps accepted in `state.gaps.accepted_by`), no blocking question open.
Nothing has left the worktree yet. It runs every `delivered*` check except `state.delivery`.

`pending-delivery` means the same local work is finished and gated, and the commit is pushed
with an open PR, but PR checks are pending or failing. It requires `state.delivery.commit`
and `state.delivery.pr` below, with `checks: "pending"` or `"failing"`. Record the specific check
names, statuses and links from the PR in `report.md`; do not poll.

`delivered` and `delivered-with-gaps` mean the change landed where others can see it.
`state.delivery` must hold:

| key | value |
|---|---|
| `commit` | the pushed head sha, 7 to 40 hex characters |
| `pr` | an HTTPS URL with a host and path `/<owner>/<repo>/pull/<positive-number>` |
| `checks` | `"green"`, read from the PR, never assumed |

`delivered` also needs every open question answered, blocking or not. A non-blocking question
still open is a gap: use `delivered-with-gaps` and name it in the report.

The gate accepts `ready-for-commit` -> `pending-delivery` -> `delivered*`, or a direct
`ready-for-commit` -> `delivered*` upgrade when checks are already green. Set each new state
only after its gate passes.

### Upgrade

1. After pushing and opening the PR, run `gh pr view <url> --json headRefOid,url` and
   `gh pr checks <url>`. Quote both, including check names, statuses and links.
2. Every check passed: write `state.delivery` from those outputs, then run
   `gate.py --terminal delivered` (or `delivered-with-gaps`) and quote it. Set the new state
   only on `GATE: PASS`.
3. A check pending or failing: write `state.delivery` with the pushed head sha, PR URL and
   `checks: "failing"` if any check fails, otherwise `"pending"`. Run
   `gate.py --terminal pending-delivery` and quote it; on `GATE: PASS`, set `pending-delivery`.
   Name the check and its status and link in the report and final message. Do not poll.
   Resume this upgrade on a later handoff after the checks finish or a fix is pushed.

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
