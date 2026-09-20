# Phase 4: milestone loop

Sequential per milestone. Never more than two leaves at once. Before the first milestone
say: "fixer rounds max 2 per milestone".

Everything in this phase runs in `state.isolation.worktree`, on the branch Phase 0b created.
Every brief's cwd is that path, and every "files you may write" path is relative to it. A leaf
given a path outside it would be editing the user's own checkout, which is what Phase 0b exists
to prevent.

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
   Advance only when the output shows the test FAILING with the fix reverted. A test that still
   passes with the fix reverted has no teeth and proves nothing: return to step a to rewrite it,
   with the fix restored first. Isolation is not a defence - a test that fails alone but passes
   in its file is a test the suite will never fail on.
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

   The extra diffs are the point of this step. A reviewer holding one milestone's diff can only
   find defects that fit inside it, and the expensive ones do not: a read taken outside a lock
   that a later milestone writes inside it, a second writer on the same counter, a keyed
   structure a later milestone lets hold two entries for one key. Ask explicitly whether each
   listed invariant still holds across every commit shown, not just within this one.
e. **Fix loop**, role `fixer` with the reviewer's findings, then step c (new commit
   `factory(M<n>): fix <short>`), then step d again. Increment `state.loops.fixer["M<n>"]`.
   A third `VERDICT: FIX` means stop: set `terminal: blocked`, go to Phase 6 for the report with the findings.
f. **State**: append one row per AC to `ac-matrix.md` (AC id, test id, kind, status, reason,
   owner, sha). `status` is exactly one of `met`, `unrunnable` or `failed`; there is no fourth
   value and no prose hedge. Use `unrunnable` when the test exists but cannot execute in this
   environment, and fill `reason` (what is missing, one line) and `owner` (who can run it). An
   `unrunnable` AC is not met and never counts toward the proven total.
   Set `state.milestone = n` and the milestone's `status` in `state.milestones`. Compact. Carry forward `state.json`, the next milestone block,
   and the last reviewer verdict only.

The reviewer's verdict advances state, never the implementer's report.

Receipts go to `receipts.md`, never to `state.json`. `state.json` is carried through every
compaction, so anything that grows per milestone belongs in a sibling file; `scripts/gate.py`
blocks a terminal state on a `state.json` over 4KB or holding a `receipts` key.

## Close

This phase closes once per milestone: the session ends after each milestone's commit, and
`state.milestone` says where to resume.

1. Write `state.json`: `state.phase = "4"`, `state.milestone = <n>`; `state.next` stays `"4"`
   until the last milestone is done, then becomes `"5"`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 4` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Stop. Say in one line which phase comes next and that `scripts/run.sh <slug>` resumes it. A
   fresh session per phase is the design; compaction is the fallback when a phase is resumed
   inside an old session.
