# Phase 4: milestone loop

Sequential per milestone. Never more than two leaves at once. Before the first milestone
say: "fixer rounds max 2 per milestone".

Everything runs in `state.isolation.worktree`. Every brief uses that cwd and lists only
relative writable paths, so leaves cannot edit the user's active checkout.

Before each version 2 milestone, verify the scope lock with
`python3 <skill-dir>/scripts/scope_lock.py verify .factory/<slug>`. Defer optional ideas with
`deferred_ideas.py add`. A discovery required for an existing AC returns to Phases 2, 2b, 3.

For milestone M<n> from `agent-plan.md`:

a. **Test first**, role `e2e-tester`. Brief per `briefs.md`: the milestone block, AC text,
   test kind, allowed test paths, the repo's test command. Advance only when the report
   quotes new tests that FAIL for the right reason. A "already passes" report means the AC is
   met; record it and skip to step c with no implementation.
b. **Implement**, role `implementer`. Brief: the milestone tasks, the failing test names, the
   reuse index, human plan section 4 as a hard boundary, allowed files, and `state.baseline`.
   Advance only on quoted output showing the new tests PASS and the rest of the suite no worse
   than `state.baseline`. "Green" means "matches the baseline numbers", not "zero failures":
   without that comparison the claim cannot be checked, and a repo with standing debt makes
   every implementer's report read as a pass.
b2. **Teeth check**, role `teeth-check`, once per new test that is meant to prove a fix or a
   guarantee. Brief: the exact line or lines of the fix, the test id, and the repo's own test
   command. The leaf reverts those lines to their pre-fix form, re-runs **the whole test file the
   way the repo's own command runs it** (not the single test in isolation), quotes the output,
   then restores the lines and re-runs to confirm the restore. Append the quoted failure to
   `receipts.md`.
   Advance only if the whole file FAILS without the fix. Otherwise restore the fix and rewrite
   the test in step a.
c. **Checkpoint**, role `mechanical-leaf`: `git add` only the files the milestone block lists - never `git add .`, even in
   the worktree - commit `factory(M<n>): <goal>`, return the sha. Append a row to `receipts.md`
   and set the milestone's `sha` in `state.milestones`.
d. **Review**, role `milestone-reviewer` (fresh context, read-only). Skipped when
   `state.depth == "light"` (the whole-change review in Phase 5 still runs regardless of depth);
   on skip, go straight to step f. Brief: the milestone
   block, human plan section 4, the commit range, the test output, and - for every `INV-id` in
   the milestone block - the invariant's text from `agent-plan.md` plus the diffs of every
   earlier commit in this run that touched the same invariant. Read the first line.

   - `VERDICT: PASS` -> step f.
   - `VERDICT: FIX` -> step e.

   Ask whether each invariant holds across every shown commit; one diff cannot reveal a later
   writer that breaks an earlier read.
e. **Fix loop**, role `fixer` with the reviewer's findings, then step c (new commit
   `factory(M<n>): fix <short>`), then step d again. Increment `state.loops.fixer["M<n>"]`.
   A third `VERDICT: FIX` means stop: set `terminal: blocked`, go to Phase 6 for the report with the findings.
f. **Release checkpoint**: demonstrate the result. For `preview`, deploy with required
   authority; record target, verification, and rollback in `receipts.md`. An unattended run
   sets `state.checkpoint_pending` to the milestone ID and stops with `NEEDS-YOU` before
   publishing. Clear it after attended verification or plan revision. For `none`, record
   the reason and local demo. Set the milestone's `checkpoint` to
   `{"target":"preview","status":"verified","receipt":"<pointer>"}` or
   `{"target":"none","status":"not-applicable","reason":"<reason>","receipt":"<demo>"}`.
   The receipt value must occur in `receipts.md`. This is not terminal proof.
g. **State**: append one row per AC to `ac-matrix.md` (AC id, test id, kind, status, reason,
   owner, sha). `status` is exactly one of `met`, `unrunnable` or `failed`; there is no fourth
   value and no prose hedge. Use `unrunnable` when the test exists but cannot execute in this
   environment, and fill `reason` (what is missing, one line) and `owner` (who can run it). An
   `unrunnable` AC is not met and never counts toward the proven total.
   Set `state.milestone = n` and the milestone's `status` in `state.milestones`. Compact. Carry forward `state.json`, the next milestone block,
   and the last reviewer verdict only.

The reviewer's verdict advances state, never the implementer's report.

Do not log a bug or unmet AC as an optional idea. Before deferring a finding, check it against the
incident sample in `diagnosis.md` `## Examination`. If the sample falls inside the deferred
case, fix it in step e: deferring it silences the report instead of fixing it. Receipt it.

Receipts go to `receipts.md`, never to `state.json`. `state.json` is carried through every
compaction, so anything that grows per milestone belongs in a sibling file; `scripts/gate.py`
blocks a terminal state on a `state.json` over 4KB or holding a `receipts` key.

## Close

This phase closes once per milestone. In `driven` mode the session ends after each milestone's
commit; in `interactive` mode the next milestone starts in the same turn after the close.
`state.milestone` says where to resume either way.

1. Write `state.json`: `state.phase = "4"`, `state.milestone = <n>`; `state.next` stays `"4"`
   until the last milestone is done, then becomes `"5"`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 4` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Close per `state.mode`. `driven`: stop; say in one line which phase comes next and that
   `scripts/run.sh <slug>` resumes it. `interactive`: say the same line, then read the next phase
   file and continue; do not wait for the user.
