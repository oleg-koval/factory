# Phase 6: stop and ask

## 1. Write the report

`.factory/<slug>/report.md`, in this order:

1. A plain summary a reader with no project context can follow: what was wrong or missing, what
   changed, how it was proven. No identifiers.
2. The AC matrix. Every `unrunnable` AC named in the body with its reason and its owner, never in
   a footnote, and the proven count stated as a count that excludes them.
3. The commit list.
4. Every `state.open_questions` entry with its blocking flag, its `kind` (fact or decision), its
   owner, and its answer or the word "unanswered".
5. The proof receipts from `receipts.md`, with `state.baseline` quoted next to the final run so
   "green" is readable as the comparison it is.
6. Isolation: the worktree path, the branch, the base branch and base sha, and the line that the
   worktree was NOT removed, with the command to remove it:
   `git -C <repo> worktree remove <worktree>`.
7. Cost: sum of the `tokens` column in `receipts.md`, `state.budget.leaves_used`, and
   `state.budget.sessions_used`.

For `terminal: intentionally-unchanged` the report is the diagnosis and the reason no change is
needed. For `terminal: blocked` the report says which loop maximum, gate or unanswered question
stopped the run, what was tried, and what the user can decide; skip the menu below.

## 2. Run the gate

For `delivered-with-gaps`: before the gate, ask the user whether they
accept the named gaps. Record their answer verbatim, in their own words, in
`state.gaps.accepted_by`. The gate refuses `delivered-with-gaps` without it.

Pick the terminal state you believe the run has earned, then prove it:

```bash
python3 <skill-dir>/scripts/gate.py .factory/<slug> --terminal <wanted>
```

**Quote the output verbatim in your final message.** No terminal state may be set before this
command has run and been quoted.

- `GATE: PASS` (exit 0) -> set the state you asked for.
- `GATE: BLOCKED` (exit 1) -> you may NOT set it. Read the reasons, fix what is fixable (they
  name the file and the key), and run it again. A reason you cannot fix is the run's terminal
  state: unanswered blocking question or a `failed` AC means `blocked`; an `unrunnable` AC means
  `delivered-with-gaps`.

This step exists because the rules it enforces used to be prose in this file, and prose gates do
not fire. A real run set `terminal: delivered` with five open questions unanswered and two
acceptance criteria marked "partly met", because nothing ever read the files.

### What the gate checks

| check | blocks |
|---|---|
| `state.json` under 4KB, no `receipts`/`blockers`/`diagnosis` keys, no unknown keys | always |
| every `open_questions` entry is an object with `id/text/blocking/owner/answer`; a malformed entry counts as blocking AND unanswered | on `delivered*` |
| every `ac-matrix.md` row's status is `met`, `unrunnable` or `failed` | always |
| any `failed` AC | always |
| any `unrunnable` AC | `delivered` only; use `delivered-with-gaps` |
| `state.isolation` present, mode known, worktree path a real directory | on `delivered*` |
| `receipts.md` exists and is non-empty | on `delivered*` |

A blocking question still open means `blocked`, whatever the tests say: the code can be correct
against a reading of the requirement that nobody has confirmed, which is the one failure a
passing suite cannot catch. The only way past it is the question being answered, or the user
saying in their own words to ship with it open. Record their words verbatim in
`state.open_questions[].answer` and repeat them in the report. Never clear the flag yourself, and
never edit `ac-matrix.md` to get past the gate.

## 3. Ask

Ask once which follow-ups the user wants: draft PR, assign reviewers, run sandbox, create the
feature flag and its 14-day removal ticket, or none. Multiple selections are allowed.

- draft PR -> role `pr-opener`, following "Open the PR" below.
- none -> stop.
- any other choice -> record it under `state.next` and tell the user it is not yet automated in
  this version; the report and `ac-matrix.md` are the handoff.

## Open the PR

1. `git -C <worktree> status --porcelain` must print nothing. A dirty tree is reported, never
   staged: one line of why, the previous binding staged the whole tree and once staged the user's own
   unrelated files.
2. `git -C <worktree> push -u origin <branch>`.
3. Write `.factory/<slug>/pr-body.md`. It opens with `## TL;DR (for humans)` (5-8 plain lines),
   then `---`, then sections What, Why, Proof (the AC matrix summary), Flag and rollback, Gaps.
   The body describes the change only; no tool, assistant or generator is named anywhere in the
   title or body.
4. `gh pr create --draft --base <base> --title "[<TICKET>] <short title>" --body-file .factory/<slug>/pr-body.md`,
   then `gh pr edit <url> --add-assignee @me`.
5. Quote the PR url in the report.

Print the terminal state as the first line of your final message.

## Close

1. Write `state.json`: `state.phase = "6"`, `state.next = null`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 6` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Stop. Say in one line that the run is closed; `scripts/run.sh <slug>` will see `terminal`
   set and stop the loop. A fresh session per phase is the design; compaction is the fallback
   when a phase is resumed inside an old session.
