# Phase 5: proof and whole-change review

All four steps run in `state.isolation.worktree`.

A review of the diff is not a review of the change. The defects that survive Phase 4 are the
ones that do not fit inside a hunk: a cast whose type is wrong three lines above the change, a
`nodes` selection missing its pagination guard, a second writer on a counter another milestone
added, and a caller in a file the diff never lists. So this phase reviews the change from three
angles that see different things, and only one of them reads the diff.

## 1. Proof against the baseline

One `leaf-worker` runs the full suite plus every test id in `ac-matrix.md`, and returns the
per-AC result compared line by line against `state.baseline`. Any failure not in the baseline is
a named regression; the baseline's own failures are named too, so nobody reads them as this
run's doing.

Every AC must map to a passing test, or to a manual check the user performed and you recorded in
their words. An AC with no mapping at all goes back to Phase 4 as a new milestone; it is not a
footnote. An AC whose test exists but cannot run here is `unrunnable`, with `reason` and `owner`
filled in. It stays out of the proven count and gets its own report line. Do not invent a middle
verdict, and do not argue it from neighbouring unit tests: an argument is not a run.

## 2. Mechanical scan, over full files

```bash
python3 -c 'pass'  # python3 is required by the scan
bash <skill-dir>/scripts/change-scan.sh "$WORKTREE" "<state.isolation.base>"
```

Quote the whole report into `.factory/<slug>/change-scan.txt` and read every section.

- **hard rules** (TS-1 cast or `any`, TS-2 a `.js` file, TS-3 a non-null assertion, GQL-1 `nodes`
  without `pageInfo`): each hit is a **defect, not an opinion**. Fix it or state why the rule does
  not apply; the scan strips comments and strings first, so a hit is real code. TS-1/TS-3 skip
  test files by default; a repo that forbids casts/assertions in tests too sets
  `{"strict_tests": true}` in `.factory/hard-rules.json` (or `FACTORY_STRICT_TESTS=1`).
- **blast radius**: the files listed there are IN SCOPE for step 3, on top of the changed files.
  A changed export's callers are where a signature/semantic change actually breaks, and the diff
  never lists them.
- **concurrency markers**: when this section is non-empty, step 4 is MANDATORY.
- **migrations**: not undone by a feature flag. Name its rollback in the report.

## 3. Whole-change review, with the extended scope

Role `whole-change-review`, branch mode with fix enabled, against `state.isolation.base`.

The brief names the scope explicitly, and it is larger than the diff:

- the **full text** of every changed file, not the hunks;
- every file the blast-radius section listed;
- **reachability**: for a fix to specific rows, records or events, name the upstream selection
  that feeds the changed path (query, scheduler, webhook, queue) and show the target rows are
  actually selected by it. Rows the selection never reaches is a finding, however clean the code
  reads: the diff and its callers show the code, not what feeds it;
- human plan section 4 (what will not change) as a hard boundary;
- `state.baseline`, so "green" is a comparison.

Read the saved review.

An absence claim ("no casts", "none found", "clean") from any leaf counts only with the command
and its output. Re-run at least one per review before accepting the verdict it feeds: a delegated
review once reported zero casts on a diff that added twenty-three.

**Verdict rule.** Findings here should be small. Any Critical finding is a **plan failure**: quote
the finding and its proof, do not patch, and ask the user to amend the human plan (back to Phase
2, finding attached) or accept the reviewer's fix as-is. Important/Minor findings the review
already fixed: record the commits in `receipts.md`.

## 4. Adversarial invariant pass

Mandatory when the scan found concurrency markers or the change touches a migration; optional
otherwise. One read-only leaf per `INV-<n>` in `agent-plan.md`, at most two at a time, at most
four leaves total: group related invariants so each of the four briefs covers a cluster instead
of one invariant each.

Each brief quotes the invariant's full text, the full text of every file that writes the state it
covers, and this instruction:

> Do not confirm the invariant. Construct a concrete interleaving, retry, replay or partial
> failure that breaks it: name the two operations, their order, and the resulting state. If you
> cannot construct one after trying the orderings the code allows, say so and name the line that
> enforces it.

A leaf that reports "holds" with no named enforcing line has not done the pass; send it back once
with that sentence quoted. A constructed break is a Critical finding, verdict rule in step 3.

The pass exists because a passing suite proves only the orderings the tests happen to run, and
the expensive concurrency defects live in the orderings nobody wrote a test for.

## 5. Polish

Role `polish`, once, after the review is clean. Commit `factory: polish`.

Speak once, under 8 lines: AC proven count, hard-rule hits, blast-radius file count,
invariant-pass verdicts, review summary.

## Close

1. Write `state.json`: `state.phase = "5"`, `state.next = "6"`.
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 5` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Close per `state.mode`. `driven`: stop; say in one line which phase comes next and that
   `scripts/run.sh <slug>` resumes it. `interactive`: say the same line, then read the next
   phase file and continue without waiting.
