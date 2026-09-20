# Phase 0b: isolate

Every later phase writes code. This phase decides where. A run that edits the user's own
checkout competes with whatever else is open in it: uncommitted work in progress, a branch
someone is mid-rebase on, a `node_modules` a different branch installed, and a `git add` that
sweeps up files the user never meant to commit. None of that is visible from inside a leaf's
brief, so it has to be settled before the first leaf exists.

The default is a git worktree on its own branch, at a path outside the main checkout.

## 1. Find the repo and verify the target branch live

The target branch differs per repo and per policy, so read it rather than assume it:

```bash
REPO=$(git -C "$CWD" rev-parse --show-toplevel)
git -C "$REPO" fetch origin --prune --quiet
git -C "$REPO" branch -r | sed 's/^ *//'          # what actually exists on the remote
```

Pick the branch feature work targets in THIS repo (`staging` where it exists, `production`
where the repo has no staging). If the remote has neither, ask the user in one question. Record
the branch you picked and the remote sha you resolved it to.

## 2. Create the worktree

```bash
SLUG=<state.slug>
BRANCH=<ticket-id-lowercased>-<short-slug>          # never mentions the assistant
WT="$HOME/.factory/worktrees/$SLUG"

git -C "$REPO" worktree add -b "$BRANCH" "$WT" "origin/<target>"
git -C "$WT" rev-parse HEAD
git -C "$WT" status --porcelain                     # must be empty
```

A path under the main checkout is not isolation: the parent repo's ignore rules, editor and
watch processes all still reach it. Keep it outside.

The empty `git status` is the point of the whole phase. It means the user's permanently-dirty
paths are not in this run's tree, so no later `git add` can reach them.

## 3. Dependencies: link, never install

Never run `npm ci` or `npm install`. Link the dependency directories the main checkout already
has, so the worktree resolves imports without a network install:

```bash
for d in node_modules web/node_modules web/frontend/node_modules extensions/node_modules; do
  [ -d "$REPO/$d" ] && [ ! -e "$WT/$d" ] && ln -s "$REPO/$d" "$WT/$d"
done
ls -la "$WT"/node_modules >/dev/null && echo linked
```

Link only directories that already exist. A missing one is recorded, not created: the commands
that need it will report it, and that report is more honest than an install this run did not ask
for. Note in `state.isolation.notes` that dependencies are SHARED with the main checkout, so a
`npm` command run in either tree changes both.

## 4. Fallback

If the worktree cannot be created (not a git repo, branch already exists elsewhere, no disk
space, user says no), the fallback is `in-place`, and it needs the user's consent, not the
orchestrator's: ask whether to accept in-place operation or stop the run, and record
the user's own words in `state.isolation.accepted_by`. Why: a run once granted itself the
exemption it was supposed to ask for, because the rule and its exemption lived in the same file
the orchestrator owns.

```json
"isolation": { "mode": "in-place", "repo": "<abs path>", "branch": "<current branch>",
               "base": "<target>", "worktree": null, "reason": "<one line>",
               "accepted_by": "<user's own words>" }
```

Stop the run rather than fall back if the user picks "stop the run".

## 5. Baseline, measured in the tree the run will use

Role `mechanical-leaf`, cwd = the isolated tree: run the repo's typecheck, lint and test
commands and record each exact command with the number of failures it reports.

```json
"baseline": {
  "sha": "<worktree HEAD>",
  "at": "<iso>",
  "typecheck": { "cmd": "npx tsc --noEmit -p tsconfig.json", "failures": 138 },
  "lint": { "cmd": "npm run lint", "failures": 0 },
  "test": { "cmd": "npm test", "failures": 3, "note": "<which files, if few enough to name>" }
}
```

A repo whose suite is already red is normal. The number is the point: without it, every later
report that "the existing suite is green" is unfalsifiable, because nobody knows what green was.
A command that cannot run here is recorded as `"failures": null` with a one-line reason, never as
zero. The baseline belongs in this phase and not in Phase 0 because a baseline measured in a
different tree, with different dependencies, is not the baseline the run is judged against.

## 6. Write state

```json
"isolation": {
  "mode": "worktree",
  "repo": "<abs path to the main checkout>",
  "worktree": "<abs path to the worktree>",
  "branch": "<branch>",
  "base": "<target branch>",
  "base_sha": "<remote sha the branch was cut from>",
  "notes": "node_modules symlinked from the main checkout; no install was run"
}
```

`scripts/gate.py` refuses a terminal state when `state.isolation` is missing or its worktree
path is not a real directory.

Speak once, under 4 lines, before closing: mode, branch, base and base sha, and the three
baseline numbers.

## Close

1. Write `state.json`: `state.phase = "0b"`, `state.next = "1"` (or `"2"` when `state.depth ==
   "light"`).
2. Run `python3 <skill-dir>/scripts/gate.py .factory/<slug> --phase 0b` and quote its output.
   `GATE: BLOCKED` means fix the named file or key and run it again; you may not advance past a
   blocked gate.
3. Stop. Say in one line which phase comes next and that `scripts/run.sh <slug>` resumes it. A
   fresh session per phase is the design; compaction is the fallback when a phase is resumed
   inside an old session.

## Cleanup

Never remove the worktree automatically. It holds the run's branch and its only copy of any
work not yet pushed, and a run that tidies up after itself has thrown away the thing a human
would want to look at. Phase 6 prints the path and the removal command for the user to run when
they are done:

```bash
git -C <repo> worktree remove <worktree>            # only after the branch is pushed or merged
```
