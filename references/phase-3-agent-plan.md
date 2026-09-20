# Phase 3: agent plan

Derived from the approved `human-plan.md`. Never shown to the user unless asked.
Declare: "plan-equivalence retries max 1".

1. Role `reuse-index` over the touchpoints implied by human plan section 3. Save the returned
   index verbatim under `## Reuse index` at the end of `agent-plan.md`.
2. **Invariant register.** Before any milestone block, list under `## Invariants` in
   `agent-plan.md` every guarantee this change must hold ACROSS milestones rather than inside
   one. Look for at least: lock order and what each lock protects; idempotency keys and what
   makes a repeated delivery safe; transaction boundaries and which reads must happen inside
   one; uniqueness or shadowing rules in any keyed structure, where a second entry would be
   silently ignored; and any money, budget or counter total that more than one writer can move.
   Give each an id `INV-<n>`, one line of text, and the files it lives in. An invariant no
   milestone touches is not an invariant here: delete it.

   This register exists because the defects worth finding are the ones no single milestone's
   diff contains. A reviewer holding one milestone cannot see a read taken outside the lock that
   a later milestone writes inside it.

3. M1 is the tracer bullet: the thinnest path that runs end to end through every layer human
   plan section 3 names, behind the flag when section 6 requires one, with one e2e scenario.
   Later milestones widen it rather than add a parallel path. Write one block per milestone in
   human plan section 8:

   ```
   M<n>: <goal>
     ac: [AC-ids this milestone proves]
     invariants: [INV-ids this milestone's files touch]
     tracer: <M1: the path this milestone runs end to end, one line> | widens M1
     e2e: path: <where this repo keeps such tests>; kind: playwright-ui | api | integration;
          scenarios: [one per AC id]
     tasks:
       - <ordered task>; files: [exact paths]; done-check: <command>
     review-checklist: plan conformance; AC coverage; regressions in [named areas];
                       blast radius within human-plan section 4; each listed INV still holds
                       across every milestone that has touched it
     budget: max fixer rounds = 2
   ```

   Any milestone that changes a screen has kind `playwright-ui`. Flag, metric, and Sentry
   work from section 6 gets its own task; when a flag is required, that task lives in M1, since
   the tracer bullet is what runs behind it first.
4. Role `plan-equivalence` on the two files. `VERDICT: MISMATCH` -> fix the listed items,
   run once more. Second mismatch -> ask the user which plan is wrong.

## Close

1. Write `state.json`: `state.phase = "3"`, `state.next = "4"`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 3` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Stop. Say in one line which phase comes next and that `scripts/run.sh <slug>` resumes it. A
   fresh session per phase is the design; compaction is the fallback when a phase is resumed
   inside an old session.
