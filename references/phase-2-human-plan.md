# Phase 2: human plan

You write this yourself. Audience: a reader with zero project context first, a developer
second. Plain language, short sentences, no identifiers in the first two sections.

Write `.factory/<slug>/human-plan.md` with exactly these sections in this order:

1. **What is wrong / what is missing**: 3 lines, plain language.
2. **Why**: the cause from `diagnosis.md`, or the product reason for a feature.
3. **What will change**: user-visible before and after; developer-visible modules, contracts,
   data.
4. **What will not change**: the blast-radius boundary. Reviewers enforce this later.
5. **Risks and trade-offs**: alternatives considered and why rejected.
6. **Release safety**: feature flag decision under the Teifi release policy (a flag is required
   unless the change is pure UI/copy or obviously correct and cheap to undo). End this section
   with a line `Flag key: <key>` or `Flag key: none`; `change-scan.sh` and `scripts/gate.py` both
   read that exact line. Also state rollback path, metrics and Sentry breadcrumbs to add.
7. **Acceptance criteria**: AC-1..n from `intake.md`, each with how it will be proven:
   `e2e | integration | unit | manual`.
8. **Milestones**: names and one-line goals only. No tasks.
9. **Open questions** (the question frontier, no cap): every open question, each with
   `blocking: yes|no`, `owner`, and `kind: fact|decision`. A `fact` is something the run can go
   find; the run's job, never the user's. A `decision` needs the user's judgment; theirs, never
   the run's. Blocking means the change cannot correctly ship until it is answered: a wrong guess
   would make the delivered behaviour wrong, not merely unconfirmed.
   Mirror them into `state.open_questions` as
   `[{ "id": "B-1", "text": "...", "blocking": true, "owner": "<person or team>", "kind": "fact", "answer": null }]`.
   Get the shape exactly right: `scripts/gate.py` reads these entries and Phase 2b empties the
   frontier before any code. A bare string instead of an object, or a missing key, counts as
   blocking AND unanswered - it does not count as absent. That is deliberate: the first version
   of this rule was prose, the questions were written as bare strings, nothing could read them,
   and a run shipped `delivered` with five open.

Gate, role `human-gate`: run the bound script as a BACKGROUND call with the plan path and
`.factory/<slug>/human-plan-review.md`. Tell the user a review window opened. When it exits:
- stdout `annotations written:` -> read the file, fold every note into the plan, say what
  changed in under 6 lines, run the gate again.
- stdout `no annotations:` -> say so explicitly, then proceed.
- non-zero exit -> quote the stderr, run once more without carry-over; a second failure is
  `terminal: blocked`, go to Phase 6 for the report.
Never infer approval from a missing file. Passes are unbounded; the human drives them.

## Close

1. Write `state.json`: `state.phase = "2"`, `state.next = "2b"`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 2` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Stop. Say in one line which phase comes next and that `scripts/run.sh <slug>` resumes it. A
   fresh session per phase is the design; compaction is the fallback when a phase is resumed
   inside an old session.
