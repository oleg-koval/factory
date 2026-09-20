# Phase 5: proof and whole-change review

All four steps run in `state.isolation.worktree`.

A review of the diff is not a review of the change. The defects that survive Phase 4 are the
ones that do not fit inside a hunk: a cast whose type is wrong three lines above the change, a
`nodes` selection missing its pagination guard, a second writer on a counter another milestone
added, and a caller in a file the diff never lists. So this phase reviews the change from three
angles that see different things, and only one of them reads the diff.

## 1. Proof against the baseline

One `leaf-worker` runs the full suite plus every test id in `ac-matrix.md` and returns the
per-AC result, with the run compared line by line against `state.baseline`. Any failure not in
the baseline is a regression and is named; the baseline's own failures are named too, so nobody
later reads the difference as this run's doing.

Every AC must map to a passing test, or to a manual check the user performed and you recorded in
their words. An AC with no mapping at all goes back to Phase 4 as a new milestone for that AC; it
is not a footnote. An AC whose test exists but cannot run here is `unrunnable`, with its `reason`
and `owner` filled in. It stays out of the proven count and gets its own line in the report. Do
not invent a middle verdict for it, and do not argue it from neighbouring unit tests: an argument
is not a run.

## 2. Mechanical scan, over full files

```bash
python3 -c 'pass'  # python3 is required by the scan
bash <skill-dir>/scripts/change-scan.sh "$WORKTREE" "<state.isolation.base>"
```

Quote the whole report into `.factory/<slug>/change-scan.txt` and read every section.

- **hard rules** (TS-1 cast or `any`, TS-2 a `.js` file, GQL-1 `nodes` without `pageInfo`): each
  hit is a **defect, not an opinion**. Fix it or state in the report why the rule does not apply
  to that line. The scan strips comments and string literals before matching, so a hit is real
  code; do not argue one away without opening the file.
- **blast radius**: the files listed there are IN SCOPE for step 3, on top of the changed files.
  A changed export's callers are where a signature or semantic change actually breaks, and the
  diff never lists them.
- **concurrency markers**: when this section is non-empty, step 4 is MANDATORY.
- **migrations**: a migration is not undone by a feature flag. Name its rollback in the report.

## 3. Whole-change review, with the extended scope

Role `whole-change-review`, branch mode with fix enabled, against `state.isolation.base`.

The brief names the scope explicitly, and it is larger than the diff:

- the **full text** of every changed file, not the hunks;
- every file the blast-radius section listed;
- human plan section 4 (what will not change) as a hard boundary;
- `state.baseline`, so "green" is a comparison.

Read the saved review.

**Verdict rule.** Findings here should be small. Any Critical finding is a **plan failure**:
quote the finding and its proof, do not patch, and ask the user whether to amend the human plan
(back to Phase 2 with the finding attached) or accept the reviewer's fix as-is. Important and
Minor findings the review already fixed: record the commits in `receipts.md`.

## 4. Adversarial invariant pass

Mandatory when the scan found concurrency markers or the change touches a migration; optional
otherwise. One read-only leaf per `INV-<n>` in `agent-plan.md`, at most two at a time, and at
most four invariant leaves in the whole run: when more than four invariants exist, group the
related ones so each of the four briefs covers a cluster instead of one invariant each.

Each brief quotes the invariant's full text, the full text of every file that writes the state it
covers, and this instruction:

> Do not confirm the invariant. Construct a concrete interleaving, retry, replay or partial
> failure that breaks it: name the two operations, the order they run in, and the state that
> results. If you cannot construct one after trying the orderings the code allows, say so and
> name the mechanism that prevents it, quoting the line that enforces it.

A leaf that reports "holds" with no named enforcing line has not done the pass; send it back
once with that sentence quoted. A constructed break is a Critical finding and goes through the
verdict rule in step 3.

The pass exists because a passing suite proves the orderings the tests happen to run, and the
expensive concurrency defects are in the orderings nobody wrote a test for.

## 5. Polish

Role `polish`, once, after the review is clean. Commit `factory: polish`.

Speak once, under 8 lines: AC proven count, hard-rule hits, blast-radius file count,
invariant-pass verdicts, review summary.

## Close

1. Write `state.json`: `state.phase = "5"`, `state.next = "6"`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 5` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Stop. Say in one line which phase comes next and that `scripts/run.sh <slug>` resumes it. A
   fresh session per phase is the design; compaction is the fallback when a phase is resumed
   inside an old session.
